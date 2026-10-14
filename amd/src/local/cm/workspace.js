// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * EasyStud course manager: workspace refresh (filters and searches, pagination, tree sections,
 * selection actions, mobile action bar, participant density, course state reload).
 *
 * @module     local_groupimport/local/cm/workspace
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import * as Guide from '../../easyedu_guide';
import Log from 'core/log';
import {fetchState} from '../sm/store';
import {refreshModel, applyParticipantFilters, sortParticipantIds, renderParticipantPage} from '../sm/participants';
import {getTreeSectionGroupIds, renderTreeSection, groupingSearchText} from '../sm/groups';
import {
    compactClass, structureFocusClass, participantFocusClass, isResponsiveWorkspace, requestGuideHighlightRefresh,
    normalise, getLabels,
} from './shared';
import {getOnDemandModel, getOnDemandParticipants} from './state';
import {schedulePanelActionOverflow} from './layout';
import {syncResponsiveDragAvailability} from './drag_support';
import {
    getGroupsWithGroupingMembership, scheduleGroupGroupingOverflow, syncParticipantTagOverflow,
    scheduleParticipantTagOverflow, syncGroupingChildrenState, syncUngroupedState, collapseAllGroupings,
    syncCardSelection, getOnDemandList,
} from './cards';
import {
    getSelectedItems, setItemSelected, clearSelectionState, getActiveSelectionType, updateSelectionAvailability,
} from './selection';
import {
    emitGuidedCompletion, emitPracticeCompletion, emitMemberPathCompletion, getActivityGuideRoot,
    verifyActivityGrouping,
} from './guide_hooks';
import {
    syncAllGroupMembersCollapsible, syncGroupMembersInContainer, getContainerGroups, syncGroupingGroupsCollapsible,
    syncAllGroupingGroupsCollapsible, applyGroupMemberSearchToGroup, updateGroupingBadge, updateStructureSummary,
    updateStructureEmptyState, animateTreeChildren,
} from './group_cards';
import {
    getStructureGroupingSearchQuery, syncResponsiveResetButtons, matchesSearchText, syncContainerGroupEmptyState,
    getSelectedFilterValues, updateParticipantEmptyState, syncFilteredEmptyStates,
} from './filters';
import {
    getPaginationConfigs, getPagination, isItemFilteredOut, sortListItems, updateResultSelectionControl,
    syncPaginationSelectionControls, updatePaginationMetaControls, syncSinglePageResultSelection,
} from './pagination';
import {
    applyOnDemandCatalogFilters, rememberGroupCardStates, restoreGroupCardStates, renderOnDemandCatalogPage,
    decorateOnDemandGroupCards,
} from './render';

export const expandGroupingSection = grouping => {
    if (!grouping) {
        return;
    }
    ensureTreeSection(grouping.closest('.local-groupimport-easystud'), grouping);
    const root = grouping.closest('.local-groupimport-easystud');
    const toggle = grouping.querySelector('[data-easystud-collapse-toggle]');
    const children = grouping.querySelector('.local-groupimport-easystud-tree__children');
    if (!toggle || !children) {
        return;
    }
    const icon = toggle.querySelector('.fa');
    if (toggle.getAttribute('aria-expanded') === 'true') {
        grouping.classList.add('is-expanded');
        children.hidden = false;
        if (root) {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        window.requestAnimationFrame(() => {
            syncGroupingGroupsCollapsible(grouping);
            syncGroupMembersInContainer(children);
        });
        if (icon) {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        }
        return;
    }
    toggle.setAttribute('aria-expanded', 'true');
    grouping.classList.add('is-expanded');
    if (icon) {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
    }
    animateTreeChildren(children, true);
    if (root) {
        emitGuidedCompletion(root, 2, 'grouping');
        requestGuideHighlightRefresh(root);
    }
};

const syncSelectedGroupingExpansion = root => {
    const selectedGroupings = getSelectedItems(root, 'grouping');
    if (selectedGroupings.length === 1) {
        expandGroupingSection(selectedGroupings[0]);
        return;
    }
    if (selectedGroupings.length > 1) {
        collapseAllGroupings(root);
    }
};

export const getGroupsInGrouping = grouping => {
    if (!grouping) {
        return [];
    }
    ensureTreeSection(grouping.closest('.local-groupimport-easystud'), grouping);
    return Array.from(grouping.querySelectorAll(
        ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]'
    ));
};

export const selectGroupingGroups = (root, groupings) => {
    const groups = [];
    const seen = new Set();
    groupings.forEach(grouping => {
        expandGroupingSection(grouping);
        getGroupsInGrouping(grouping).forEach(group => {
            const groupid = group.getAttribute('data-easystud-group-id') || '';
            if (!groupid || seen.has(groupid)) {
                return;
            }
            seen.add(groupid);
            groups.push(group);
        });
    });
    clearSelectionState(root);
    groupings.forEach(expandGroupingSection);
    groups.forEach(group => setItemSelected(group, true));
    updateSelectionActions(root);
};

export const syncCatalogFilters = (root, options = {}) => {
    // SM-RENDU: both catalogs filter the state in applyCatalogSearch.
    applyCatalogSearch(root, options);
    applyStructureSearch(root, options);
    syncResponsiveResetButtons(root);
};

export const applyCatalogSearch = (root, options = {}) => {
    // Both catalogs filter the state; their lists hold no card until it has loaded.
    if (getOnDemandModel(root)) {
        applyOnDemandCatalogFilters(root);
    }
    syncFilteredEmptyStates(root);
    if (options.pagination !== false) {
        syncPagination(root);
    }
    if (options.responsive !== false) {
        scheduleResponsiveUiRefresh(root);
    }
};

export const applyStructureSearch = (root, options = {}) => {
    const groupingQuery = getStructureGroupingSearchQuery(root);
    const occupancy = root.querySelector('[data-easystud-grouping-occupancy][aria-pressed="true"]');
    const occupancyValue = occupancy ? occupancy.getAttribute('data-easystud-grouping-occupancy') : 'all';

    const model = getOnDemandModel(root);
    root.querySelectorAll('[data-easystud-tree] [data-easystud-grouping-id]').forEach(grouping => {
        const state = model ?
            model.groupings.get(Number(grouping.getAttribute('data-easystud-grouping-id'))) : null;
        if (state) {
            // On demand, the section only knows its header: search text and occupancy come from the state.
            grouping.setAttribute('data-search-text', groupingSearchText(model, state));
        }
        const hasGroups = state ? getTreeSectionGroupIds(model, String(state.id)).length > 0 :
            getGroupsInGrouping(grouping).length > 0;
        const matchesOccupancy = occupancyValue === 'all' ||
            (occupancyValue === 'filled' && hasGroups) || (occupancyValue === 'empty' && !hasGroups);
        const filterhidden = !matchesSearchText(grouping, groupingQuery) || !matchesOccupancy;
        grouping.setAttribute('data-easystud-grouping-filter-hidden', filterhidden ? '1' : '0');
        grouping.hidden = filterhidden;
    });
    syncFilteredEmptyStates(root);
    if (options.pagination !== false) {
        syncPagination(root);
    }
    if (options.responsive !== false) {
        scheduleResponsiveUiRefresh(root);
    }
};

export const applyContainerGroupSearch = (root, options = {}) => {
    if (getOnDemandModel(root)) {
        root.querySelectorAll('[data-easystud-container-group-search]').forEach(search => {
            if (normalise(search.value)) {
                ensureTreeSection(root, search.closest('.local-groupimport-easystud-tree__section'));
            }
        });
    }
    root.querySelectorAll('[data-easystud-container-group-list]').forEach(list => {
        const key = list.getAttribute('data-easystud-container-group-list') || '';
        const section = list.closest('.local-groupimport-easystud-tree__section');
        const search = section ? section.querySelector('[data-easystud-container-group-search="' + key + '"]') : null;
        const query = normalise(search ? search.value : '');
        let visibleCount = 0;

        getContainerGroups(list).forEach(group => {
            const hidden = !matchesSearchText(group, query);
            group.hidden = hidden;
            group.setAttribute('data-easystud-container-search-hidden', hidden ? '1' : '0');
            if (!hidden) {
                visibleCount++;
            }
        });

        syncContainerGroupEmptyState(root, list, query, visibleCount);
        if (section && section.hasAttribute('data-easystud-grouping-id')) {
            const toggle = section.querySelector('[data-easystud-grouping-groups-toggle]');
            if (query && toggle) {
                toggle.setAttribute('aria-expanded', 'true');
            }
            window.requestAnimationFrame(() => syncGroupingGroupsCollapsible(section));
        }
    });
    scheduleResponsiveUiRefresh(root, options);
};

export const applyGroupMemberSearch = (root, options = {}) => {
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => applyGroupMemberSearchToGroup(root, group));
    scheduleResponsiveUiRefresh(root, options);
};

export const scheduleResponsiveUiRefresh = (root, options = {}) => {
    if (!root) {
        return;
    }
    if (root.easystudResponsiveRefreshFrame) {
        window.cancelAnimationFrame(root.easystudResponsiveRefreshFrame);
    }

    const refresh = () => {
        syncParticipantDensity(root, {animate: false});
        syncResponsiveDragAvailability(root);
        if (options.pagination !== false) {
            syncPagination(root);
        }
        syncAllGroupMembersCollapsible(root);
        syncAllGroupingGroupsCollapsible(root);
        scheduleGroupGroupingOverflow(root);
        scheduleParticipantTagOverflow(root);
        schedulePanelActionOverflow(root);
        if (options.guide !== false) {
            requestGuideHighlightRefresh(root);
        }
    };

    root.easystudResponsiveRefreshFrame = window.requestAnimationFrame(() => {
        root.easystudResponsiveRefreshFrame = null;
        refresh();
    });
};

export const syncStructurePlaceholders = root => {
    const labels = getLabels(root);
    syncUngroupedState(root, labels);
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => {
        syncGroupingChildrenState(section, labels);
    });
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    syncFilteredEmptyStates(root);
    syncPagination(root);
};

export const syncPagination = root => {
    if (!root.classList.contains(structureFocusClass)) {
        root.querySelectorAll('[data-easystud-tree] .local-groupimport-easystud-tree__groupings > [data-easystud-pagination]')
            .forEach(pagination => pagination.remove());
    }
    getPaginationConfigs(root).forEach(config => {
        const list = config.list;
        if (!list) {
            return;
        }

        const ondemand = !!getOnDemandList(root, list);
        let items;
        let pages;
        let page;
        if (ondemand) {
            // SM-RENDU: only the current page exists; filters and sort run on the state.
            const pageWindow = list.matches('[data-easystud-participant-list]') ?
                renderOnDemandParticipantPage(root, list, config) : renderOnDemandCatalogPage(root, list, config);
            items = {length: pageWindow.total};
            pages = pageWindow.pages;
            page = pageWindow.page;
        } else {
            Array.from(list.querySelectorAll('[data-easystud-page-hidden="1"]')).forEach(item => {
                item.removeAttribute('data-easystud-page-hidden');
                if (!isItemFilteredOut(item)) {
                    item.hidden = false;
                }
            });

            sortListItems(list, config);
            items = Array.from(list.children).filter(item => item.matches(config.selector) && !item.hidden);
            pages = Math.ceil(items.length / config.limit);
            page = parseInt(list.getAttribute('data-easystud-page') || '0', 10);
            if (Number.isNaN(page) || page < 0) {
                page = 0;
            }
            page = Math.min(page, Math.max(pages - 1, 0));
            list.setAttribute('data-easystud-page', page);
        }

        if (pages <= 1) {
            syncSinglePageResultSelection(root, list, config, pages, items);
            return;
        }

        if (!ondemand) {
            const start = page * config.limit;
            const end = start + config.limit;
            items.forEach((item, index) => {
                const hidden = index < start || index >= end;
                item.hidden = hidden;
                if (hidden) {
                    item.setAttribute('data-easystud-page-hidden', '1');
                }
            });
        }

        ['top', 'bottom'].forEach(position => {
            const controls = getPagination(list, config.inside, position);
            controls.classList.remove('is-placeholder');
            controls.removeAttribute('aria-hidden');
            const label = controls.querySelector('[data-easystud-page-label]');
            const first = controls.querySelector('[data-easystud-page-first]');
            const prev = controls.querySelector('[data-easystud-page-prev]');
            const next = controls.querySelector('[data-easystud-page-next]');
            const last = controls.querySelector('[data-easystud-page-last]');
            const select = controls.querySelector('[data-easystud-select-results]');
            updatePaginationMetaControls(root, list, controls, items.length, position);
            [label, first, prev, next, last].forEach(control => {
                if (control) {
                    control.hidden = false;
                    control.removeAttribute('aria-hidden');
                }
            });
            if (label) {
                label.textContent = (page + 1) + ' / ' + pages;
            }
            [first, last].forEach(edge => {
                if (edge) {
                    edge.hidden = pages <= 2;
                }
            });
            if (first) {
                first.disabled = page === 0;
            }
            if (prev) {
                prev.disabled = page === 0;
            }
            if (next) {
                next.disabled = page >= pages - 1;
            }
            if (last) {
                last.disabled = page >= pages - 1;
            }
            if (select) {
                if (position !== 'top') {
                    select.hidden = true;
                } else {
                    updateResultSelectionControl(root, list, config, select);
                }
            }
        });
    });
    scheduleGroupGroupingOverflow(root);
};

// Apply participant filters.
export const applyFilters = (root, options = {}) => {
    const searchControl = root.querySelector('[data-easystud-search]');
    const roleControl = root.querySelector('[data-easystud-role-filter]');
    const groupControl = root.querySelector('[data-easystud-group-filter]');
    const groupingControl = root.querySelector('[data-easystud-grouping-filter]');
    const query = normalise(searchControl ? searchControl.value : '');
    const selectedroles = getSelectedFilterValues(roleControl).map(normalise);
    const selectedgroups = getSelectedFilterValues(groupControl);
    const selectedgroupings = (root.classList.contains(participantFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'participants') ?
        getSelectedFilterValues(groupingControl) : [];

    const model = getOnDemandModel(root);
    if (model) {
        // SM-RENDU: the state is refreshed from the server after each action (scheduleOnDemandStateRefresh).
        applyParticipantFilters(model, {
            query,
            roles: selectedroles,
            groups: selectedgroups,
            groupings: selectedgroupings,
        });
    }
    if (options.pagination !== false) {
        syncPagination(root);
    }
    updateParticipantEmptyState(root);
    syncResponsiveResetButtons(root);
    if (options.responsive !== false) {
        scheduleResponsiveUiRefresh(root);
    }
};

const getEnabledActionButton = (root, selector) => {
    return Array.from(root.querySelectorAll(selector)).find(button => {
        return !button.disabled && !button.hidden && button.offsetParent !== null;
    }) || Array.from(root.querySelectorAll(selector)).find(button => !button.disabled && !button.hidden) || null;
};

export const getMobileActionButton = (root, selector) => {
    return Array.from(root.querySelectorAll(selector)).find(button => {
        return !button.disabled && !button.hidden && button.getAttribute('aria-hidden') !== 'true';
    }) || null;
};

const getButtonText = button => {
    const text = button ? (button.textContent || '').replace(/\s+/g, ' ').trim() : '';
    return text || '';
};

const getButtonIcon = button => {
    const icon = button ? button.querySelector('.fa') : null;
    return icon ? Array.from(icon.classList).filter(classname => classname.indexOf('fa-') === 0).join(' ') : '';
};

export const ensureMobileActionBar = root => {
    let bar = root.querySelector('[data-easystud-mobile-actions]');
    if (bar) {
        return bar;
    }

    bar = document.createElement('div');
    bar.className = 'local-groupimport-easystud-mobile-actions';
    bar.setAttribute('data-easystud-mobile-actions', '1');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-live', 'polite');
    bar.hidden = true;
    bar.innerHTML =
        '<div class="local-groupimport-easystud-mobile-actions__summary" data-easystud-mobile-actions-summary></div>' +
        '<div class="local-groupimport-easystud-mobile-actions__buttons" data-easystud-mobile-actions-buttons></div>';
    root.appendChild(bar);
    return bar;
};

const guideBottomObstructionProperty = '--easyedu-guide-bottom-obstruction';

const syncGuideBottomObstruction = root => {
    const documentRoot = document.documentElement;
    const bar = root.querySelector('[data-easystud-mobile-actions]');
    if (!isResponsiveWorkspace() || !bar || bar.hidden || !bar.getClientRects().length) {
        documentRoot.style.removeProperty(guideBottomObstructionProperty);
        return;
    }

    const rect = bar.getBoundingClientRect();
    const clearance = Math.max(0, Math.ceil(window.innerHeight - rect.top + 8));
    documentRoot.style.setProperty(guideBottomObstructionProperty, clearance + 'px');
};

export const scheduleGuideBottomObstruction = root => {
    if (root.easystudGuideBottomObstructionFrame) {
        window.cancelAnimationFrame(root.easystudGuideBottomObstructionFrame);
    }
    root.easystudGuideBottomObstructionFrame = window.requestAnimationFrame(() => {
        root.easystudGuideBottomObstructionFrame = null;
        syncGuideBottomObstruction(root);
    });
};

const renderMobileActionBar = (root, counts, activetype) => {
    const bar = ensureMobileActionBar(root);
    const summary = bar.querySelector('[data-easystud-mobile-actions-summary]');
    const buttons = bar.querySelector('[data-easystud-mobile-actions-buttons]');
    const total = counts.participant + counts.member + counts.group + counts.grouping;

    if (!buttons || !summary || !total) {
        bar.removeAttribute('data-easystud-mobile-actions-type');
        bar.hidden = true;
        return;
    }

    const actionSelectors = [];
    if (activetype === 'participant') {
        actionSelectors.push(
            '[data-easystud-message-selected-participants]',
            '[data-easystud-open-selected-user]',
            '[data-easystud-move-selected-participants]'
        );
    } else if (activetype === 'member') {
        actionSelectors.push(
            '[data-easystud-move-selected-members]',
            '[data-easystud-delete-selected-members]',
            '[data-easystud-message-selected-participants]'
        );
    } else if (activetype === 'group') {
        actionSelectors.push(
            '[data-easystud-move-selected-groups]',
            '[data-easystud-remove-selected-groups-from-groupings]',
            '[data-easystud-delete-selected-groups]'
        );
    } else if (activetype === 'grouping') {
        actionSelectors.push('[data-easystud-delete-selected-groupings]');
    }
    actionSelectors.push('[data-easystud-clear-all-selection]');

    const actions = actionSelectors.map(selector => {
        const button = getMobileActionButton(root, selector);
        return button ? {selector, button} : null;
    }).filter(Boolean);

    if (!actions.length) {
        bar.removeAttribute('data-easystud-mobile-actions-type');
        bar.hidden = true;
        return;
    }

    const labels = getLabels(root);
    const template = labels.selectioncounttemplate || '';
    summary.textContent = template.replace('__count__', String(total));
    bar.setAttribute('data-easystud-mobile-actions-type', activetype || '');
    // Selection/density updates may rerender while a Guide cue or keyboard
    // focus points at a proxy. Retain its identity for the same native action.
    const existingActions = new Map(Array.from(buttons.children).map(button => [
        button.getAttribute('data-easystud-mobile-action-trigger'), button,
    ]));
    const retainedActions = new Set();
    actions.forEach(action => {
        const button = existingActions.get(action.selector) || document.createElement('button');
        retainedActions.add(button);
        button.replaceChildren();
        const source = action.button;
        const isdanger = source.classList.contains('btn-outline-danger') || source.classList.contains('btn-danger');
        const isprimary = source.classList.contains('btn-primary') || source.classList.contains('btn-outline-primary');
        button.type = 'button';
        button.className = 'btn btn-sm foundation-selection-action foundation-selection-action--tray ' +
            (isdanger ? 'btn-outline-danger' : (isprimary ? 'btn-primary' : 'btn-outline-secondary'));
        button.setAttribute('data-easystud-mobile-action-trigger', action.selector);
        const icon = getButtonIcon(source);
        if (icon) {
            const iconNode = document.createElement('span');
            iconNode.className = 'fa ' + icon;
            iconNode.setAttribute('aria-hidden', 'true');
            button.appendChild(iconNode);
        }
        const textNode = document.createElement('span');
        textNode.textContent = getButtonText(source);
        button.appendChild(textNode);
        buttons.appendChild(button);
    });
    Array.from(buttons.children).forEach(button => {
        if (!retainedActions.has(button)) {
            button.remove();
        }
    });
    bar.hidden = false;
};

export const updateSelectionActions = root => {
    const selectedUsers = getSelectedItems(root, 'participant');
    const selectedGroups = getSelectedItems(root, 'group');
    const selectedGroupings = getSelectedItems(root, 'grouping');
    const selectedMembers = getSelectedItems(root, 'member');
    const hasSelection = selectedUsers.length || selectedGroups.length || selectedGroupings.length || selectedMembers.length;
    const activetype = getActiveSelectionType(root);
    const labels = getLabels(root);
    const willSingleParticipantSelected = selectedUsers.length === 1 && !isResponsiveWorkspace();
    const previousExpandedParticipant = root.easystudExpandedParticipant || null;
    const nextExpandedParticipant = willSingleParticipantSelected ? selectedUsers[0] : null;
    const participantToResize = nextExpandedParticipant || previousExpandedParticipant;

    root.classList.toggle('local-groupimport-easystud--has-selection', !!hasSelection);
    const updateParticipantDensity = () => {
        root.classList.toggle('local-groupimport-easystud--single-participant-selected', willSingleParticipantSelected);
        if (previousExpandedParticipant && previousExpandedParticipant !== nextExpandedParticipant) {
            previousExpandedParticipant.classList.remove('is-density-expanded');
        }
        if (nextExpandedParticipant) {
            nextExpandedParticipant.classList.add('is-density-expanded');
        }
        if (participantToResize) {
            // Tag wrapping affects the card's natural height, so resolve it before Motion.resize measures the target.
            syncParticipantTagOverflow(participantToResize);
        }
    };
    if (participantToResize && previousExpandedParticipant !== nextExpandedParticipant &&
            root.classList.contains(compactClass)) {
        Motion.resize(participantToResize, updateParticipantDensity, {
            duration: Motion.timing.normal,
            onComplete: () => requestGuideHighlightRefresh(root),
        });
    } else {
        updateParticipantDensity();
    }
    root.easystudExpandedParticipant = nextExpandedParticipant;
    syncParticipantDensity(root);
    ['participant', 'member', 'group', 'grouping'].forEach(type => {
        root.classList.toggle('local-groupimport-easystud--selecting-' + type, activetype === type);
    });
    if (activetype) {
        root.setAttribute('data-easystud-selection-type', activetype);
    } else {
        root.removeAttribute('data-easystud-selection-type');
    }

    root.querySelectorAll('[data-easystud-clear-all-selection]').forEach(button => {
        button.hidden = !hasSelection;
        const frame = button.closest('[data-easystud-clear-selection-frame]');
        if (frame) {
            frame.hidden = !hasSelection;
            const count = frame.querySelector('[data-easystud-clear-selection-count]');
            if (count) {
                const template = labels.selectioncounttemplate || '';
                count.textContent = template.replace('__count__', String(
                    selectedUsers.length + selectedMembers.length + selectedGroups.length + selectedGroupings.length
                ));
            }
        }
    });

    const detailsButton = root.querySelector('[data-easystud-open-selected-user]');
    if (detailsButton) {
        detailsButton.disabled = selectedUsers.length !== 1;
    }

    const futureRemoveButton = root.querySelector('[data-easystud-remove-selected-users]');
    if (futureRemoveButton) {
        futureRemoveButton.disabled = true;
    }

    root.querySelectorAll('[data-easystud-delete-selected-groups]').forEach(button => {
        button.disabled = selectedGroups.length === 0;
    });

    root.querySelectorAll('[data-easystud-delete-selected-groupings]').forEach(button => {
        button.disabled = selectedGroupings.length === 0;
    });

    root.querySelectorAll('[data-easystud-delete-selected-members]').forEach(button => {
        button.disabled = selectedMembers.length === 0;
    });

    root.querySelectorAll('[data-easystud-move-selected-members]').forEach(button => {
        button.disabled = selectedMembers.length === 0;
    });

    const moveParticipantsButton = root.querySelector('[data-easystud-move-selected-participants]');
    if (moveParticipantsButton) {
        moveParticipantsButton.disabled = selectedUsers.length === 0;
    }

    root.querySelectorAll('[data-easystud-message-selected-participants]').forEach(button => {
        button.disabled = selectedUsers.length === 0 && selectedMembers.length === 0;
    });

    root.querySelectorAll('[data-easystud-move-selected-groups]').forEach(button => {
        button.disabled = selectedGroups.length === 0;
    });
    root.querySelectorAll('[data-easystud-remove-selected-groups-from-groupings]').forEach(button => {
        button.disabled = getGroupsWithGroupingMembership(root, selectedGroups).length === 0;
    });

    renderMobileActionBar(root, {
        participant: selectedUsers.length,
        member: selectedMembers.length,
        group: selectedGroups.length,
        grouping: selectedGroupings.length,
    }, activetype);
    scheduleGuideBottomObstruction(root);

    updateSelectionAvailability(root);
    syncSelectedGroupingExpansion(root);
    syncPaginationSelectionControls(root);
    // Completion may synchronously highlight the next action. Publish only
    // after native enablement and the responsive action tray are ready.
    if (selectedUsers.length) {
        emitPracticeCompletion(root, 'select-participant');
    }
    if (selectedMembers.length) {
        emitMemberPathCompletion(root, 'select-source-member');
    }
};

// Bind optional tools that should not take permanent screen space.
/**
 * Keep compact membership visibility independent from the desktop card density.
 *
 * Participant membership and optional profile slots opt in. Roles, name/email
 * and Grouping cards stay visible. Existing Motion measures the
 * card around the mutation; manual whole-list changes retain Motion.swap.
 *
 * @param {HTMLElement} root The management workspace.
 * @param {Object} options Disclosure options.
 */
export const syncParticipantDensity = (root, {animate = true} = {}) => {
    const state = root.easystudParticipantDensity;
    if (!state) {
        return;
    }
    const responsive = isResponsiveWorkspace();
    const breakpointChanged = state.responsive !== responsive;
    if (breakpointChanged) {
        if (responsive) {
            state.desktopCompact = root.classList.contains(compactClass);
            root.classList.remove(compactClass);
        } else {
            root.classList.toggle(compactClass, state.desktopCompact);
        }
        state.responsive = responsive;
    }
    const selected = getSelectedItems(root, 'participant');
    const expanded = responsive && state.mobileCompact && selected.length === 1 ? selected[0] : null;
    const cards = Array.from(root.querySelectorAll('[data-easystud-participant-list] [data-easystud-user]'));
    cards.forEach(card => {
        const hidden = responsive && state.mobileCompact && card !== expanded;
        const rows = Array.from(card.querySelectorAll(
            '[data-easystud-participant-memberships], [data-easystud-participant-profile]'
        ));
        if (!rows.some(row => row.hidden !== hidden)) {
            return;
        }
        const apply = () => {
            rows.forEach(row => {
                row.hidden = hidden;
            });
            syncParticipantTagOverflow(card);
        };
        if (animate && !breakpointChanged && responsive) {
            Motion.resize(card, apply, {
                duration: Motion.timing.normal,
                onComplete: () => requestGuideHighlightRefresh(root),
            });
        } else {
            apply();
        }
    });
    state.expandedParticipant = expanded;
    state.updateToggle();
    if (breakpointChanged) {
        // Re-resolve the unchanged desktop automatic density after crossing back.
        updateSelectionActions(root);
    }
};

/**
 * Render the group cards of a tree section (a grouping or the groups without grouping)
 * from the state, when it opens. Unchanged sections are kept as they are.
 *
 * @param {HTMLElement|null} root EasyStud root.
 * @param {HTMLElement|null} section Tree section.
 */
export const ensureTreeSection = (root, section) => {
    const model = getOnDemandModel(root);
    if (!model || !section) {
        return;
    }
    const container = section.querySelector('.local-groupimport-easystud-tree__children');
    const key = section.classList.contains('local-groupimport-easystud-tree__section--ungrouped') ? 'ungrouped' :
        (section.getAttribute('data-easystud-grouping-id') || '');
    if (!container || !key || container.easystudSmRenderedKey === model.revision) {
        return;
    }
    container.easystudSmRenderedKey = model.revision;
    const memory = rememberGroupCardStates(container);
    const cards = renderTreeSection(model, container, key);
    decorateOnDemandGroupCards(root, cards);
    restoreGroupCardStates(root, cards, memory);
    const labels = getLabels(root);
    if (key === 'ungrouped') {
        syncUngroupedState(root, labels);
    } else {
        syncGroupingChildrenState(section, labels);
        updateGroupingBadge(section);
    }
    const search = section.querySelector('[data-easystud-container-group-search]');
    if (search && normalise(search.value)) {
        applyContainerGroupSearch(root, {pagination: false});
    }
};

/**
 * Render the current page of the on-demand participant list.
 *
 * Unchanged pages (same ids, same state revision) are kept as they are, so a refresh
 * does not reset focus, hover or open menus.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} list Participant list.
 * @param {Object} config Pagination config (page size).
 * @returns {{total: Number, pages: Number, page: Number}}
 */
const renderOnDemandParticipantPage = (root, list, config) => {
    const model = getOnDemandModel(root);
    const ordered = sortParticipantIds(model, model.filteredIds, list.getAttribute('data-easystud-sort') || 'alpha');
    const pages = Math.ceil(ordered.length / config.limit);
    let page = parseInt(list.getAttribute('data-easystud-page') || '0', 10);
    if (Number.isNaN(page) || page < 0) {
        page = 0;
    }
    page = Math.min(page, Math.max(pages - 1, 0));
    list.setAttribute('data-easystud-page', page);

    const pageIds = ordered.slice(page * config.limit, (page + 1) * config.limit);
    const key = model.revision + '|' + pageIds.join(',');
    if (list.easystudSmRenderedKey !== key) {
        model.pageCards = new Map(renderParticipantPage(model, list, pageIds).map(card =>
            [Number(card.getAttribute('data-user-id')), syncCardSelection(model, card)]));
        list.easystudSmRenderedKey = key;
        updateSelectionAvailability(root);
        syncResponsiveDragAvailability(root);
        scheduleParticipantTagOverflow(root);
        syncParticipantDensity(root, {animate: false});
    }
    return {total: ordered.length, pages, page};
};

let onDemandRefreshTimer = null;

/**
 * SM-RENDU: reload the course state after a successful action (step 3a).
 *
 * The server state becomes the source of truth for memberships, groups and groupings,
 * instead of the group tree rendered in the page. Several actions in a row (moving ten
 * groups sends ten requests) give one reload. The id selection is kept for the ids that
 * still exist.
 *
 * @param {HTMLElement|null} root EasyStud root.
 */
export const scheduleOnDemandStateRefresh = root => {
    if (!root || !getOnDemandModel(root)) {
        return;
    }
    window.clearTimeout(onDemandRefreshTimer);
    onDemandRefreshTimer = window.setTimeout(() => {
        const {model, courseId} = getOnDemandParticipants();
        fetchState(courseId).then(raw => {
            if (getOnDemandModel(root) !== model) {
                return null;
            }
            const userids = new Set(raw.users.map(user => user.id));
            model.selected.forEach(userid => {
                if (!userids.has(userid)) {
                    model.selected.delete(userid);
                }
            });
            const memberkeys = new Set(raw.groups.reduce((all, group) =>
                all.concat((group.memberids || []).map(userid => group.id + ':' + userid)), []));
            model.selectedMembers.forEach((key, memberkey) => {
                if (!memberkeys.has(memberkey)) {
                    model.selectedMembers.delete(memberkey);
                }
            });
            const groupids = new Set(raw.groups.map(group => group.id));
            model.selectedGroups.forEach((key, groupid) => {
                if (!groupids.has(groupid)) {
                    model.selectedGroups.delete(groupid);
                }
            });
            model.raw = raw;
            if (root.easystudSm) {
                root.easystudSm.raw = raw;
            }
            refreshModel(model);
            applyFilters(root);
            syncCatalogFilters(root);
            root.querySelectorAll('[data-easystud-tree] .local-groupimport-easystud-tree__section').forEach(section => {
                const children = section.querySelector('.local-groupimport-easystud-tree__children');
                if (children && children.easystudSmRenderedKey !== undefined && !children.hidden) {
                    ensureTreeSection(root, section);
                    if (section.hasAttribute('data-easystud-guide-activity-destination')) {
                        verifyActivityGrouping(root, section,
                            Guide.getPathContextToken(getActivityGuideRoot(root), 'prepare-activity-grouping'));
                    }
                }
                if (section.hasAttribute('data-easystud-grouping-id')) {
                    updateGroupingBadge(section);
                }
            });
            updateSelectionActions(root);
            root.setAttribute('data-easystud-sm-version', raw.meta.version);
            return raw;
        }).catch(error => Log.error(error));
    }, 250);
};
