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
 * EasyStud course manager: list bindings (pagination, filters, catalog filters, tree).
 *
 * @module     local_groupimport/local/cm/list_controls
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import * as Guide from '../../easyedu_guide';
import {closeChoicesWithin} from '../../searchable_choices';
import {isResponsiveWorkspace, requestGuideHighlightRefresh} from './shared';
import {scheduleCompleteListAlignment, animateCompleteListAlignment} from './layout';
import {collapseAllGroupings, setInlinePanelOpen, getPaginationTotal, getOnDemandList} from './cards';
import {setItemSelected, clearSelection, getActiveSelectionType} from './selection';
import {
    emitGuidedCompletion, getActivityGuideRoot, emitTryActionsSelection, emitActivityGroupingEntry,
    verifyActivityGrouping,
} from './guide_hooks';
import {syncGroupingGroupsCollapsible, animateTreeChildren} from './group_cards';
import {
    syncResponsiveResetButtons, emitFilterPathCompletion, syncRoleFilterState, updateRoleFilterMode,
    bindSearchableFilters, refreshFilterChoice, resetFilters, hasActiveListFilters,
} from './filters';
import {getPaginationConfigs, getSelectableResultItems} from './pagination';
import {
    syncCatalogFilters, applyCatalogSearch, applyStructureSearch, applyContainerGroupSearch,
    scheduleResponsiveUiRefresh, syncPagination, applyFilters, updateSelectionActions, ensureTreeSection,
} from './workspace';

const getListFromPagination = pagination => {
    if (!pagination) {
        return null;
    }
    const parent = pagination.parentElement;
    if (parent && (
        parent.matches('[data-easystud-participant-list]') ||
        parent.classList.contains('local-groupimport-easystud-participant-groups__list') ||
        parent.classList.contains('local-groupimport-easystud-structure-groups__list') ||
        parent.classList.contains('local-groupimport-easystud-tree__groupings')
    )) {
        return parent;
    }
    return pagination.getAttribute('data-easystud-pagination') === 'top' ?
        pagination.nextElementSibling : pagination.previousElementSibling;
};

const getConfigFromPagination = (root, pagination) => {
    const list = getListFromPagination(pagination);
    if (!list) {
        return null;
    }
    return getPaginationConfigs(root).find(config => config.list === list) || null;
};

export const bindPagination = root => {
    const setSortDropdownStackOpen = (dropdown, open) => {
        if (!dropdown) {
            return;
        }
        dropdown.classList.toggle('is-open', open);
        const pagination = dropdown.closest('[data-easystud-pagination]');
        const list = getListFromPagination(pagination);
        if (pagination) {
            pagination.classList.toggle('is-sort-menu-open', open);
        }
        if (list) {
            list.classList.toggle('is-sort-menu-open', open);
        }
        const card = dropdown.closest('[data-easystud-group-id], [data-easystud-grouping-id], [data-easystud-user]');
        if (card) {
            card.classList.toggle('is-sort-menu-open', open);
        }
    };

    const closeSortDropdowns = except => {
        root.querySelectorAll('[data-easystud-list-sort-dropdown]').forEach(dropdown => {
            if (dropdown === except) {
                return;
            }
            const toggle = dropdown.querySelector('[data-easystud-list-sort-toggle]');
            const menu = dropdown.querySelector('[data-easystud-list-sort-menu]');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
            if (menu && !menu.hidden) {
                // The raised stacking stays until the menu has left, so the fade is never clipped.
                Motion.hideMenu(menu, {anchor: toggle, onDone: completed => {
                    if (completed && menu.hidden) {
                        setSortDropdownStackOpen(dropdown, false);
                    }
                }});
                return;
            }
            setSortDropdownStackOpen(dropdown, false);
        });
    };

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-list-sort-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        event.preventDefault();
        const dropdown = toggle.closest('[data-easystud-list-sort-dropdown]');
        const menu = dropdown ? dropdown.querySelector('[data-easystud-list-sort-menu]') : null;
        if (!menu) {
            return;
        }
        const open = menu.hidden || Motion.isMenuClosing(menu);
        closeSortDropdowns(dropdown);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            setSortDropdownStackOpen(dropdown, true);
            Motion.showMenu(menu, {anchor: toggle});
        } else {
            Motion.hideMenu(menu, {anchor: toggle, onDone: completed => {
                if (completed && menu.hidden) {
                    setSortDropdownStackOpen(dropdown, false);
                }
            }});
        }
    });

    root.addEventListener('click', event => {
        const option = event.target.closest('[data-easystud-list-sort-option]');
        if (!option || !root.contains(option)) {
            return;
        }
        event.preventDefault();
        const pagination = option.closest('[data-easystud-pagination]');
        const list = getListFromPagination(pagination);
        if (!list) {
            return;
        }
        closeSortDropdowns();
        Motion.swap(list, () => {
            list.setAttribute('data-easystud-sort', option.getAttribute('data-easystud-list-sort-option') || 'alpha');
            list.setAttribute('data-easystud-page', '0');
            syncPagination(root);
        }, {
            exitDuration: Motion.timing.fast,
            enterDuration: Motion.timing.normal,
            exitDistance: '0px',
            distance: '0px',
            resize: false,
            swapOpacity: 0.55,
        }).then(() => requestGuideHighlightRefresh(root));
    });

    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-page-first], [data-easystud-page-prev], [data-easystud-page-next], [data-easystud-page-last], [data-easystud-select-results]');
        if (!button || !root.contains(button)) {
            return;
        }
        event.preventDefault();
        if (button.hidden || button.disabled || button.getAttribute('aria-hidden') === 'true') {
            return;
        }
        const pagination = button.closest('[data-easystud-pagination]');
        const list = getListFromPagination(pagination);
        if (!list) {
            return;
        }
        const config = getConfigFromPagination(root, pagination);
        if (!config) {
            return;
        }
        if (button.matches('[data-easystud-select-results]')) {
            const ondemand = getOnDemandList(root, list);
            // On demand, select ids directly instead of building a card per result.
            const items = ondemand ? [] : getSelectableResultItems(list, config);
            let type = items[0] ? items[0].getAttribute('data-selectable-type') : '';
            if (ondemand) {
                type = ondemand.ids.length ? ondemand.type : '';
            }
            const active = getActiveSelectionType(root);
            if (!type || (active && active !== type)) {
                return;
            }
            const deselect = button.getAttribute('data-easystud-deselect-results') === '1';
            if (deselect && hasActiveListFilters(root, list)) {
                // A prior unfiltered Select all may leave selected entities
                // outside the current result set. Deselect results establishes
                // a clean filtered scope before the next Select results action.
                clearSelection(root, type);
            } else if (ondemand) {
                ondemand.select(ondemand.ids, !deselect);
            } else {
                items.forEach(item => setItemSelected(item, !deselect));
            }
            if (deselect && type === 'grouping') {
                collapseAllGroupings(root);
            }
            updateSelectionActions(root);
            requestGuideHighlightRefresh(root);
            if (type === 'participant') {
                emitFilterPathCompletion(root, deselect ? 'clear-selection' : 'select-results');
                if (!deselect) {
                    emitTryActionsSelection(root);
                }
            }
            return;
        }
        const current = parseInt(list.getAttribute('data-easystud-page') || '0', 10) || 0;
        let nextpage = current;
        if (button.matches('[data-easystud-page-first]')) {
            nextpage = 0;
        } else if (button.matches('[data-easystud-page-last]')) {
            nextpage = Math.max(Math.ceil(getPaginationTotal(root, list, config) / config.limit) - 1, 0);
        } else {
            nextpage = current + (button.matches('[data-easystud-page-next]') ? 1 : -1);
        }
        const total = getPaginationTotal(root, list, config);
        const maxpage = Math.max(Math.ceil(total / config.limit) - 1, 0);
        nextpage = Math.max(0, Math.min(nextpage, maxpage));
        const fromBottom = pagination.getAttribute('data-easystud-pagination') === 'bottom';
        Motion.swap(list, () => {
            list.setAttribute('data-easystud-page', nextpage);
            syncPagination(root);
            scheduleResponsiveUiRefresh(root, {pagination: false});
        }, {
            exitDuration: Motion.timing.fast,
            enterDuration: Motion.timing.normal,
            exitDistance: '0px',
            distance: '0px',
            resize: false,
            swapOpacity: 0.55,
        }).then(completed => {
            if (!completed) {
                return;
            }
            requestGuideHighlightRefresh(root);
            if (!fromBottom) {
                return;
            }
            const topPagination = config.inside ?
                list.querySelector(':scope > [data-easystud-pagination="top"]') :
                list.previousElementSibling;
            const scrollTarget = topPagination && topPagination.matches('[data-easystud-pagination]') ?
                topPagination : list;
            Motion.scroll(scrollTarget, {block: 'start', inline: 'nearest'});
        });
    });

    document.addEventListener('click', event => {
        if (root.contains(event.target) && event.target.closest('[data-easystud-list-sort-dropdown]')) {
            return;
        }
        closeSortDropdowns();
    });
};

export const bindFilters = root => {
    bindSearchableFilters(root);
    const roleSelect = root.querySelector('[data-easystud-role-filter]');
    const groupSelect = root.querySelector('[data-easystud-group-filter]');
    const groupingSelect = root.querySelector('[data-easystud-grouping-filter]');
    const searchControl = root.querySelector('[data-easystud-search]');
    const resetButton = root.querySelector('[data-easystud-reset-filters]');
    const roleButtons = Array.from(root.querySelectorAll('[data-easystud-role-choice]'));

    if (searchControl) {
        searchControl.addEventListener('input', () => {
            applyFilters(root);
            emitFilterPathCompletion(root, 'apply-filter');
            emitGuidedCompletion(root, 2);
        });
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            syncRoleFilterState(root);
            applyFilters(root);
            emitFilterPathCompletion(root, 'apply-filter');
            emitGuidedCompletion(root, 2);
        });
    }

    if (groupSelect) {
        groupSelect.addEventListener('change', () => {
            applyFilters(root);
            emitFilterPathCompletion(root, 'apply-filter');
            emitGuidedCompletion(root, 2);
        });
    }

    if (groupingSelect) {
        groupingSelect.addEventListener('change', () => {
            applyFilters(root);
            emitFilterPathCompletion(root, 'apply-filter');
            emitGuidedCompletion(root, 2);
        });
    }

    roleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!roleSelect) {
                return;
            }
            const value = button.getAttribute('data-easystud-role-choice') || '';
            Array.from(roleSelect.options).forEach(option => {
                if (option.value === value) {
                    option.selected = !option.selected;
                }
            });
            syncRoleFilterState(root);
            applyFilters(root);
            refreshFilterChoice(roleSelect);
            updateRoleFilterMode(root);
            emitFilterPathCompletion(root, 'apply-filter');
            emitGuidedCompletion(root, 2);
        });
    });

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            resetFilters(root);
            if (roleSelect) {
                syncRoleFilterState(root);
            }
            applyFilters(root);
            updateRoleFilterMode(root);
            requestGuideHighlightRefresh(root);
            closeResponsiveAdvancedFilters(root, 'participants');
        });
    }

    const refreshRoleMode = () => updateRoleFilterMode(root);
    window.addEventListener('resize', refreshRoleMode);
    window.requestAnimationFrame(refreshRoleMode);
    syncRoleFilterState(root);
};

// Bind collapsible tree sections.
export const bindTree = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-collapse-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        const section = toggle.closest('.local-groupimport-easystud-tree__section');
        const children = section ? section.querySelector('.local-groupimport-easystud-tree__children') : null;
        if (!children) {
            return;
        }
        const expanded = toggle.getAttribute('aria-expanded') !== 'false';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        section.classList.toggle('is-expanded', !expanded);
        const isUngrouped = section.classList.contains('local-groupimport-easystud-tree__section--ungrouped');
        const activityToken = Guide.getPathContextToken(getActivityGuideRoot(root), 'prepare-activity-grouping');
        if (!expanded) {
            ensureTreeSection(root, section);
        }
        animateTreeChildren(children, !expanded, isUngrouped ? {prepare: false, syncAfter: false} : {
            onComplete: () => {
                if (!expanded) {
                    emitActivityGroupingEntry(root, section.getAttribute('data-easystud-grouping-id'), activityToken);
                    verifyActivityGrouping(root, section, activityToken);
                }
            },
        });
        if (isUngrouped) {
            const panel = section.querySelector('[data-easystud-container-search-panel="ungrouped"]');
            const input = panel ? panel.querySelector('[data-easystud-container-group-search="ungrouped"]') : null;
            setInlinePanelOpen(panel, !expanded).then(completed => {
                if (completed && !expanded && input) {
                    input.focus({preventScroll: true});
                }
            });
            if (expanded && input) {
                input.value = '';
                applyContainerGroupSearch(root);
            }
        }
        if (!expanded) {
            window.requestAnimationFrame(() => syncGroupingGroupsCollapsible(section));
        } else {
            const groupingGroupsToggle = section.querySelector('[data-easystud-grouping-groups-toggle]');
            if (groupingGroupsToggle) {
                groupingGroupsToggle.hidden = true;
            }
        }
        const icon = toggle.querySelector('.fa');
        if (icon) {
            icon.classList.toggle('fa-chevron-right', expanded);
            icon.classList.toggle('fa-chevron-down', !expanded);
        }
    });
};

export const bindCatalogFilters = root => {
    root.querySelectorAll('[data-easystud-catalog-grouping-filter], [data-easystud-catalog-show-ungrouped]').forEach(control => {
        control.addEventListener('change', () => syncCatalogFilters(root));
    });
    root.querySelectorAll('[data-easystud-structure-group-search], [data-easystud-catalog-search]').forEach(search => {
        search.addEventListener('input', () => applyCatalogSearch(root));
    });
    root.querySelectorAll('[data-easystud-structure-grouping-search]').forEach(search => {
        search.addEventListener('input', () => applyStructureSearch(root));
    });
    root.querySelectorAll('[data-easystud-grouping-occupancy]').forEach(button => {
        button.addEventListener('click', () => {
            root.querySelectorAll('[data-easystud-grouping-occupancy]').forEach(option => {
                const active = option === button;
                option.classList.toggle('is-active', active);
                option.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            applyStructureSearch(root);
            syncResponsiveResetButtons(root);
            closeResponsiveAdvancedFilters(root, 'structure-groupings');
        });
    });
    const resetGroupingFilters = root.querySelector('[data-easystud-reset-grouping-filters]');
    if (resetGroupingFilters) {
        resetGroupingFilters.addEventListener('click', () => {
            const all = root.querySelector('[data-easystud-grouping-occupancy="all"]');
            root.querySelectorAll('[data-easystud-grouping-occupancy]').forEach(option => {
                const active = option === all;
                option.classList.toggle('is-active', active);
                option.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            const search = root.querySelector('[data-easystud-structure-grouping-search]');
            if (search) {
                search.value = '';
            }
            applyStructureSearch(root);
            syncResponsiveResetButtons(root);
        });
    }
    root.querySelectorAll('[data-easystud-reset-catalog-filters]').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-easystud-reset-catalog-filters');
            const select = root.querySelector('[data-easystud-catalog-grouping-filter="' + key + '"]');
            const toggle = root.querySelector('[data-easystud-catalog-show-ungrouped="' + key + '"]');
            if (select && select.tagName === 'SELECT') {
                Array.from(select.options).forEach(option => {
                    option.selected = false;
                });
                refreshFilterChoice(select);
            }
            if (toggle) {
                toggle.checked = false;
            }
            const search = root.querySelector('[data-easystud-catalog-search="' + key + '"]');
            if (search) {
                search.value = '';
            }
            if (key === 'structure') {
                const structureSearch = root.querySelector('[data-easystud-structure-group-search]');
                if (structureSearch) {
                    structureSearch.value = '';
                }
                const groupingSearch = root.querySelector('[data-easystud-structure-grouping-search]');
                if (groupingSearch) {
                    groupingSearch.value = '';
                }
            }
            syncCatalogFilters(root);
            closeResponsiveAdvancedFilters(root, key === 'structure' ? 'structure-groups' : 'participant-groups');
        });
    });
    syncCatalogFilters(root);
};

const closeResponsiveAdvancedFilters = (root, key) => {
    if (!isResponsiveWorkspace()) {
        return;
    }
    const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="' + key + '"]');
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.click();
    }
};

export const bindAdvancedFilters = root => {
    const getAdvancedFilterStateClass = key =>
        'local-groupimport-easystud--' + key + '-filters-expanded';

    const setAdvancedFilterAccessibility = (panel, expanded) => {
        panel.inert = !expanded;
        panel.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    };

    const toggleAdvancedFilters = key => {
        const panel = root.querySelector('[data-easystud-advanced-filters="' + key + '"]');
        const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="' + key + '"]');
        const more = root.querySelector('[data-easystud-advanced-filters-more="' + key + '"]');
        if (!panel || !toggle) {
            return;
        }

        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const nextexpanded = !expanded;
        toggle.setAttribute('aria-expanded', nextexpanded ? 'true' : 'false');
        toggle.classList.toggle('is-expanded', nextexpanded);
        if (more) {
            more.classList.toggle('is-expanded', nextexpanded);
        }
        if (nextexpanded) {
            setAdvancedFilterAccessibility(panel, true);
            panel.hidden = false;
            root.classList.add(getAdvancedFilterStateClass(key));
            Motion.expand(panel, {
                prepare: () => {
                    panel.classList.remove('is-collapsed');
                    panel.classList.add('is-expanded');
                },
                onComplete: () => {
                    scheduleCompleteListAlignment(root);
                    requestGuideHighlightRefresh(root);
                    if (key === 'participants') {
                        emitFilterPathCompletion(root, 'open-filters');
                    }
                },
            });
        } else {
            closeChoicesWithin(panel);
            setAdvancedFilterAccessibility(panel, false);
            Motion.collapse(panel, {
                hideOnComplete: false,
                onComplete: () => {
                    root.classList.remove(getAdvancedFilterStateClass(key));
                    panel.classList.remove('is-expanded');
                    panel.classList.add('is-collapsed');
                    scheduleCompleteListAlignment(root);
                    requestGuideHighlightRefresh(root);
                },
            });
        }
        window.requestAnimationFrame(() => {
            scheduleCompleteListAlignment(root);
            requestGuideHighlightRefresh(root);
        });
    };

    const pointerHandledControls = new WeakSet();
    const pointerHandledById = new Map();
    const activateAdvancedFilters = control => {
        const key = control.getAttribute('data-easystud-advanced-filters-toggle') ||
            control.getAttribute('data-easystud-advanced-filters-more');
        const panel = root.querySelector('[data-easystud-advanced-filters="' + key + '"]');
        if (!panel || control.offsetParent === null) {
            return false;
        }
        toggleAdvancedFilters(key);
        emitGuidedCompletion(root, 2);
        // Disclosure changes only its own panel. Its completion callbacks
        // already refresh alignment and Guide targets; unrelated card/tag
        // scans force synchronous layout and block compact Motion frames.
        animateCompleteListAlignment(root);
        scheduleCompleteListAlignment(root);
        return true;
    };

    root.addEventListener('pointerdown', event => {
        const control = event.target.closest('[data-easystud-advanced-filters-toggle], ' +
            '[data-easystud-advanced-filters-more]');
        if (!control || !root.contains(control) || control.getAttribute('aria-expanded') !== 'true') {
            return;
        }
        const key = control.getAttribute('data-easystud-advanced-filters-toggle') ||
            control.getAttribute('data-easystud-advanced-filters-more');
        const panel = root.querySelector('[data-easystud-advanced-filters="' + key + '"]');
        if (panel && control.offsetParent !== null) {
            // Close nested overlays before focus leaves them. Their focusout
            // lifecycle may otherwise move the parent before pointerup and
            // consume the click. Complete that pointer activation here.
            if (closeChoicesWithin(panel) > 0) {
                event.preventDefault();
                if (activateAdvancedFilters(control)) {
                    pointerHandledControls.add(control);
                    pointerHandledById.set(event.pointerId, control);
                }
            }
        }
    });

    // Closing a nested choice moves this control before pointerup. Cleanup
    // must also observe releases outside the workspace; otherwise its stale
    // suppression marker consumes the next genuine click on the control.
    document.addEventListener('pointerup', event => {
        const control = pointerHandledById.get(event.pointerId);
        if (control) {
            window.setTimeout(() => {
                pointerHandledControls.delete(control);
                pointerHandledById.delete(event.pointerId);
            }, 0);
        }
    }, true);

    document.addEventListener('pointercancel', event => {
        const control = pointerHandledById.get(event.pointerId);
        if (control) {
            pointerHandledControls.delete(control);
            pointerHandledById.delete(event.pointerId);
        }
    }, true);

    root.addEventListener('click', event => {
        const control = event.target.closest('[data-easystud-advanced-filters-toggle], [data-easystud-advanced-filters-more]');
        if (!control || !root.contains(control)) {
            return;
        }
        event.preventDefault();
        if (pointerHandledControls.has(control)) {
            pointerHandledControls.delete(control);
            return;
        }
        activateAdvancedFilters(control);
    });

    root.querySelectorAll('[data-easystud-advanced-filters]').forEach(panel => {
        const key = panel.getAttribute('data-easystud-advanced-filters');
        const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="' + key + '"]');
        const expanded = !!(toggle && toggle.getAttribute('aria-expanded') === 'true');
        panel.hidden = false;
        panel.classList.toggle('is-expanded', expanded);
        panel.classList.toggle('is-collapsed', !expanded);
        root.classList.toggle(getAdvancedFilterStateClass(key), expanded);
        setAdvancedFilterAccessibility(panel, expanded);
    });
};
