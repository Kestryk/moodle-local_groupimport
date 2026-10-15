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
 * EasyStud course manager: filter controls, search queries and empty states.
 *
 * @module     local_groupimport/local/cm/filters
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {enhanceMultipleSelect} from '../../searchable_choices';
import {matchesText, elementSearchText} from '../sm/filter_engine';
import {countLabel} from '../sm/index';
import {structureFocusClass, filterChoiceControllers, normalise, getLabels} from './shared';
import {getOnDemandModel} from './state';
import {getOnDemandList} from './cards';
import {emitNativePathCompletion} from './guide_hooks';
import {getContainerGroups} from './group_cards';

export const getInputQuery = (root, selector) => {
    const search = root.querySelector(selector);
    return normalise(search ? search.value : '');
};

export const getStructureGroupSearchQuery = root => {
    return (root.classList.contains(structureFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'groups') ?
        getInputQuery(root, '[data-easystud-structure-group-search]') : '';
};

export const getStructureGroupingSearchQuery = root => {
    return (root.classList.contains(structureFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'groupings') ?
        getInputQuery(root, '[data-easystud-structure-grouping-search]') : '';
};

export const syncResponsiveResetButtons = root => {
    const participantActive = !!(
        getInputQuery(root, '[data-easystud-search]') ||
        getSelectedFilterValues(root.querySelector('[data-easystud-role-filter]')).length ||
        getSelectedFilterValues(root.querySelector('[data-easystud-group-filter]')).length ||
        getSelectedFilterValues(root.querySelector('[data-easystud-grouping-filter]')).length
    );
    root.querySelectorAll('[data-easystud-reset-filters]').forEach(button => {
        button.classList.toggle('is-active', participantActive);
        button.disabled = !participantActive;
    });

    ['participants', 'structure'].forEach(key => {
        const searchSelector = key === 'structure' ? '[data-easystud-structure-group-search]' :
            '[data-easystud-catalog-search="participants"]';
        const toggle = root.querySelector('[data-easystud-catalog-show-ungrouped="' + key + '"]');
        const active = !!(
            getInputQuery(root, searchSelector) ||
            getSelectedFilterValues(root.querySelector('[data-easystud-catalog-grouping-filter="' + key + '"]')).length ||
            (toggle && toggle.checked)
        );
        root.querySelectorAll('[data-easystud-reset-catalog-filters="' + key + '"]').forEach(button => {
            button.classList.toggle('is-active', active);
            button.disabled = !active;
        });
    });
    const groupingOccupancy = root.querySelector('[data-easystud-grouping-occupancy][aria-pressed="true"]');
    const groupingFiltersActive = !!(
        getInputQuery(root, '[data-easystud-structure-grouping-search]') ||
        (groupingOccupancy && groupingOccupancy.getAttribute('data-easystud-grouping-occupancy') !== 'all')
    );
    root.querySelectorAll('[data-easystud-reset-grouping-filters]').forEach(button => {
        button.classList.toggle('is-active', groupingFiltersActive);
        button.disabled = !groupingFiltersActive;
    });
    syncAdvancedFilterToggles(root);
};

const advancedFilterSelects = '[data-easystud-role-filter], [data-easystud-group-filter], ' +
    '[data-easystud-grouping-filter], [data-easystud-catalog-grouping-filter]';

/**
 * Number of active advanced filters inside one "More filters" panel.
 *
 * @param {HTMLElement} panel Advanced filters panel.
 * @returns {Number}
 */
export const countActiveAdvancedFilters = panel => {
    if (!panel) {
        return 0;
    }
    let count = Array.from(panel.querySelectorAll(advancedFilterSelects))
        .filter(select => getSelectedFilterValues(select).length > 0).length;
    count += Array.from(panel.querySelectorAll('[data-easystud-catalog-show-ungrouped]'))
        .filter(input => input.checked).length;
    const occupancy = panel.querySelector('[data-easystud-grouping-occupancy][aria-pressed="true"]');
    if (occupancy && occupancy.getAttribute('data-easystud-grouping-occupancy') !== 'all') {
        count++;
    }
    return count;
};

/**
 * D2 (16/10/2026): the "More filters" text button reads "Fewer filters" when its
 * panel is open, and then carries the number of active advanced filters in its capsule.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} toggle Advanced filters toggle.
 */
export const syncAdvancedFilterToggle = (root, toggle) => {
    if (!toggle) {
        return;
    }
    const key = toggle.getAttribute('data-easystud-advanced-filters-toggle') || '';
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const label = toggle.querySelector('[data-easystud-more-label]');
    if (label) {
        const text = label.getAttribute(expanded ? 'data-easystud-less-label' : 'data-easystud-more-label') || '';
        if (text && label.textContent !== text) {
            label.textContent = text;
        }
    }
    const count = expanded ? countActiveAdvancedFilters(root.querySelector('[data-easystud-advanced-filters="' + key + '"]')) : 0;
    const pill = toggle.querySelector('[data-easystud-advanced-filters-count]');
    if (pill) {
        pill.textContent = count ? String(count) : '';
        pill.hidden = !count;
    }
    const description = toggle.querySelector('[data-easystud-advanced-filters-count-text]');
    if (description) {
        description.textContent = count ? countLabel(getLabels(root).activefilterscount || '', count) : '';
    }
};

export const syncAdvancedFilterToggles = root => {
    root.querySelectorAll('[data-easystud-advanced-filters-toggle]').forEach(toggle => syncAdvancedFilterToggle(root, toggle));
};

/**
 * Whether a card the state does not describe matches a normalised query (filter engine).
 *
 * @param {HTMLElement} element Card.
 * @param {String} query Normalised query.
 * @returns {Boolean}
 */
export const matchesSearchText = (element, query) => !query || matchesText(elementSearchText(element), query);

const placeManagedStateBeforeBottomPagination = (list, state) => {
    const bottomPagination = list.querySelector(':scope > [data-easystud-pagination="bottom"]');
    list.insertBefore(state, bottomPagination || null);
};

export const syncContainerGroupEmptyState = (root, list, query, visibleCount) => {
    if (!list) {
        return;
    }
    const labels = getLabels(root);
    const groups = getContainerGroups(list);
    const naturalEmpty = Array.from(list.querySelectorAll(':scope > .local-groupimport-easystud-tree__empty'))
        .filter(item => !item.hasAttribute('data-easystud-container-filter-empty'));
    let filteredEmpty = list.querySelector(':scope > [data-easystud-container-filter-empty]');

    naturalEmpty.forEach(item => {
        item.hidden = groups.length > 0;
    });

    if (!filteredEmpty) {
        filteredEmpty = document.createElement('div');
        filteredEmpty.className = 'local-groupimport-easystud-tree__empty local-groupimport-easystud-tree__empty--filtered';
        filteredEmpty.setAttribute('data-easystud-container-filter-empty', '1');
        filteredEmpty.textContent = labels.noresultsfiltered || '';
    }
    placeManagedStateBeforeBottomPagination(list, filteredEmpty);
    filteredEmpty.hidden = !query || visibleCount > 0 || groups.length === 0;
};

// Completion uses the same result authority as native Select results, not DOM visibility alone.
export const emitFilterPathCompletion = (root, step) => {
    const list = root.querySelector('[data-easystud-participant-list]');
    if (!list) {
        return;
    }
    const model = getOnDemandModel(root);
    // No result (and no selected participant) while the course state loads.
    const items = model ? model.filteredIds : [];
    const filtered = hasActiveListFilters(root, list);
    const panel = root.querySelector('[data-easystud-advanced-filters="participants"]');
    // Compare id sets: building a card per result is far too slow on large courses.
    const allResultsSelected = !!model &&
        items.every(userid => model.selected.has(userid)) && model.selected.size === items.length;
    const completed = {
        'open-filters': !!panel && !panel.hidden && panel.classList.contains('is-expanded') &&
            panel.getAttribute('aria-hidden') !== 'true' && !panel.inert,
        'apply-filter': filtered && items.length > 0,
        'select-results': filtered && items.length > 0 && allResultsSelected,
        'clear-selection': !model || model.selected.size === 0,
    };
    if (completed[step]) {
        emitNativePathCompletion(root, 'verify-with-filters', step);
    }
};

export const getSelectedFilterValues = control => {
    if (!control) {
        return [];
    }

    if (control.tagName === 'SELECT' && control.multiple) {
        return Array.from(control.selectedOptions).map(option => option.value).filter(Boolean);
    }

    const value = control.value || '';
    return value ? [value] : [];
};

export const syncRoleFilterState = root => {
    const select = root.querySelector('[data-easystud-role-filter]');
    const buttons = Array.from(root.querySelectorAll('[data-easystud-role-choice]'));
    if (!select || !buttons.length) {
        return;
    }

    const selectedvalues = Array.from(select.selectedOptions).map(option => option.value);
    buttons.forEach(button => {
        const active = selectedvalues.indexOf(button.getAttribute('data-easystud-role-choice') || '') !== -1;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.classList.toggle('active', active);
        button.classList.toggle('btn-primary', active);
        button.classList.toggle('btn-outline-secondary', !active);
    });
};

export const updateRoleFilterMode = root => {
    const wrap = root.querySelector('[data-easystud-role-toggle-wrap]');
    const toggle = root.querySelector('[data-easystud-role-toggle]');
    const select = root.querySelector('[data-easystud-role-filter]');
    if (!wrap || !toggle || !select) {
        return;
    }

    toggle.hidden = false;
    select.hidden = true;

    // Keep quick role chips for a short catalogue; dense catalogues reuse Kit search.
    const roleChoiceCount = Array.from(select.options).filter(option => option.value && !option.disabled).length;
    const shouldFallback = window.innerWidth < 768 || roleChoiceCount > 6;
    toggle.hidden = shouldFallback;
    const choice = filterChoiceControllers.get(select);
    if (choice) {
        select.hidden = true;
        choice.host.hidden = !shouldFallback;
        if (!shouldFallback) {
            choice.close();
        }
    } else {
        select.hidden = !shouldFallback;
    }
};

// Product hooks/values remain native; shared Kit owns choice markup and paint.
export const bindSearchableFilters = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-role-filter], [data-easystud-group-filter], ' +
        '[data-easystud-grouping-filter], [data-easystud-catalog-grouping-filter]').forEach(select => {
        const role = select.matches('[data-easystud-role-filter]');
        const groups = select.matches('[data-easystud-group-filter]');
        const choice = enhanceMultipleSelect(select, {
            label: role ? labels.roles : groups ? labels.groups : labels.groupings,
            search: labels.searchfilteroptions,
            empty: labels.nofilteroptions,
            none: labels.filterany,
            count: labels.filterselectioncount,
            clear: labels.clearfilterselection,
        }, {motion: Motion});
        choice.host.classList.add('easyedu-searchable-choice--compact');
        filterChoiceControllers.set(select, choice);
        if (role) {
            choice.host.hidden = true;
        }
    });
};

export const refreshFilterChoice = select => {
    const choice = select && filterChoiceControllers.get(select);
    if (choice) {
        choice.refresh();
    }
};

export const resetFilters = root => {
    const searchControl = root.querySelector('[data-easystud-search]');
    const roleControl = root.querySelector('[data-easystud-role-filter]');
    const groupControl = root.querySelector('[data-easystud-group-filter]');
    const groupingControl = root.querySelector('[data-easystud-grouping-filter]');
    const roleButtons = Array.from(root.querySelectorAll('[data-easystud-role-choice]'));

    if (searchControl) {
        searchControl.value = '';
    }

    if (roleControl && roleControl.tagName === 'SELECT') {
        Array.from(roleControl.options).forEach(option => {
            option.selected = false;
        });
    }

    if (groupControl && groupControl.tagName === 'SELECT') {
        Array.from(groupControl.options).forEach(option => {
            option.selected = false;
        });
    }

    if (groupingControl && groupingControl.tagName === 'SELECT') {
        Array.from(groupingControl.options).forEach(option => {
            option.selected = false;
        });
    }

    roleButtons.forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.classList.remove('active', 'btn-primary');
        button.classList.add('btn-outline-secondary');
    });
    [roleControl, groupControl, groupingControl].forEach(refreshFilterChoice);
};

export const hasActiveListFilters = (root, list) => {
    if (!root || !list) {
        return false;
    }
    const hasValue = control => !!control && !!(control.value || '').trim();
    const hasSelected = control => getSelectedFilterValues(control).length > 0;

    if (list.matches('[data-easystud-participant-list]')) {
        return hasValue(root.querySelector('[data-easystud-search]')) ||
            hasSelected(root.querySelector('[data-easystud-role-filter]')) ||
            hasSelected(root.querySelector('[data-easystud-group-filter]')) ||
            hasSelected(root.querySelector('[data-easystud-grouping-filter]'));
    }

    if (list.matches('.local-groupimport-easystud-participant-groups__list')) {
        return hasValue(root.querySelector('[data-easystud-catalog-search="participants"]')) ||
            hasSelected(root.querySelector('[data-easystud-catalog-grouping-filter="participants"]')) ||
            !!(root.querySelector('[data-easystud-catalog-show-ungrouped="participants"]') || {}).checked;
    }

    if (list.matches('.local-groupimport-easystud-structure-groups__list')) {
        return hasValue(root.querySelector('[data-easystud-catalog-search="structure"]')) ||
            hasValue(root.querySelector('[data-easystud-structure-group-search]')) ||
            hasSelected(root.querySelector('[data-easystud-catalog-grouping-filter="structure"]')) ||
            !!(root.querySelector('[data-easystud-catalog-show-ungrouped="structure"]') || {}).checked;
    }

    if (list.matches('.local-groupimport-easystud-tree__groupings')) {
        return hasValue(root.querySelector('[data-easystud-structure-grouping-search]'));
    }

    return false;
};

/**
 * Whether the course state is still loading: the lists then only hold their skeletons and
 * must not say that there is nothing (the empty states would show next to the skeletons).
 *
 * @param {HTMLElement} root EasyStud root.
 * @returns {Boolean}
 */
const isCourseStateLoading = root => !getOnDemandModel(root);

export const updateParticipantEmptyState = root => {
    const list = root.querySelector('[data-easystud-participant-list]');
    if (!list || isCourseStateLoading(root)) {
        return;
    }

    const model = getOnDemandModel(root);
    // Totals come from the state: only the current page has cards.
    const users = model.raw.users;
    const visibleUsers = model.filteredIds;
    let state = list.querySelector('[data-easystud-empty-state="participants"]');

    if (!state) {
        state = document.createElement('div');
        state.className = 'local-groupimport-easystud__empty-state';
        state.setAttribute('data-easystud-empty-state', 'participants');
        state.hidden = true;
        state.innerHTML = '<span class="fa fa-users" aria-hidden="true"></span><p class="mb-0"></p>';
    }

    placeManagedStateBeforeBottomPagination(list, state);

    const labels = getLabels(root);
    const message = users.length ?
        (labels.noparticipantsfiltered || '') :
        (list.getAttribute('data-empty-filtered-label') || labels.noparticipantsstate || '');
    const messageNode = state.querySelector('p');
    if (messageNode) {
        messageNode.textContent = message;
    }
    state.hidden = visibleUsers.length > 0;
};

const syncManagedEmptyState = (root, list, selector, key) => {
    if (!list || isCourseStateLoading(root)) {
        return;
    }
    const labels = getLabels(root);
    let state = list.querySelector(':scope > [data-easystud-managed-empty="' + key + '"]');
    const ondemand = getOnDemandList(root, list);
    // On demand, the counts come from the state: only the current page has cards.
    const items = ondemand ? getOnDemandModel(root).raw.groups : Array.from(list.children).filter(item => item.matches(selector));
    const visible = ondemand ? ondemand.ids.length > 0 : items.some(item =>
        (!item.hidden || item.getAttribute('data-easystud-page-hidden') === '1'));
    if (!state) {
        state = document.createElement('div');
        state.className = 'local-groupimport-easystud-tree__empty local-groupimport-easystud-tree__empty--filtered';
        state.setAttribute('data-easystud-managed-empty', key);
    }
    placeManagedStateBeforeBottomPagination(list, state);
    if (items.length === 0 && (key === 'participant-groups' || key === 'structure-groups')) {
        state.textContent = labels.nogroupsincourse || '';
    } else if (key === 'structure-groupings' && items.length === 0) {
        state.textContent = labels.nogroupingsincourse || labels.nogroupingsavailable || '';
    } else {
        state.textContent = labels.noresultsfiltered || '';
    }
    state.hidden = visible;
};

export const syncFilteredEmptyStates = root => {
    syncManagedEmptyState(root, root.querySelector('.local-groupimport-easystud-participant-groups__list'),
        '[data-easystud-group-id]', 'participant-groups');
    syncManagedEmptyState(root, root.querySelector('.local-groupimport-easystud-structure-groups__list'),
        '[data-easystud-group-id]', 'structure-groups');
    syncManagedEmptyState(root, root.querySelector('[data-easystud-tree] .local-groupimport-easystud-tree__groupings'),
        '[data-easystud-grouping-id]', 'structure-groupings');
};
