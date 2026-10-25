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
 * EasyStud course manager: list pagination controls, sorting and result selection.
 *
 * @module     local_groupimport/local/cm/pagination
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {countLabel} from '../sm/index';
import {
    selectedClass, compactClass, structureFocusClass, participantFocusClass, normalise, getLabels, escapeHtml,
    isResponsiveWorkspace,
} from './shared';
import {getGroupMemberCount, getOnDemandList} from './cards';
import {hasActiveListFilters} from './filters';
import {getOnDemandModel} from './state';

// K16-48: one kind of selection at a time. While participants, groups, groupings or members are
// selected, the "Select all" of the other lists is disabled.
const selectionKinds = {'[data-easystud-user]': 'participant', '[data-easystud-group-id]': 'group',
    '[data-easystud-grouping-id]': 'grouping'};
const hasOtherSelection = (root, kind) => {
    const model = getOnDemandModel(root);
    const marked = selector => root.querySelectorAll(selector + '.' + selectedClass).length;
    const counts = {
        participant: Math.max(model ? model.selected.size : 0, marked('[data-easystud-user]')),
        group: Math.max(model ? model.selectedGroups.size : 0, marked('[data-easystud-group-id]')),
        member: Math.max(model ? model.selectedMembers.size : 0, marked('[data-easystud-member-id]')),
        grouping: marked('[data-easystud-grouping-id]'),
    };
    return Object.keys(counts).some(other => other !== kind && counts[other] > 0);
};

export const getPaginationConfigs = root => {
    const participantLimit = root.classList.contains(compactClass) ? 20 : 15;
    return [
        {
            list: root.querySelector('[data-easystud-participant-list]'),
            selector: '[data-easystud-user]',
            limit: participantLimit,
            inside: true,
        },
        {
            list: root.querySelector('.local-groupimport-easystud-participant-groups__list'),
            selector: '[data-easystud-group-id]',
            limit: 10,
            inside: true,
        },
        {
            list: root.querySelector('.local-groupimport-easystud-structure-groups__list'),
            selector: '[data-easystud-group-id]',
            limit: 10,
            inside: true,
        },
        {
            list: (root.classList.contains(structureFocusClass) ||
                (isResponsiveWorkspace() && root.getAttribute('data-easystud-mobile-view-active') === 'groupings')) ?
                root.querySelector('[data-easystud-tree] .local-groupimport-easystud-tree__groupings') : null,
            selector: '[data-easystud-grouping-id]',
            limit: 10,
            inside: true,
        },
    ];
};

// Accessible names of the pagination landmark and of its glyph-only buttons (the glyphs stay the visible text).
const paginationNavLabel = (labels, position) => {
    const label = position === 'top' ? labels.paginationnavtop : labels.paginationnavbottom;
    return label || '';
};

const pageButton = (attribute, label, glyph) => '<button type="button" class="btn btn-sm btn-outline-secondary" ' +
    'data-easystud-' + attribute + '="1" aria-label="' + escapeHtml(label || '') + '">' + glyph + '</button>';

export const getPagination = (list, inside, position) => {
    const root = list.closest('.local-groupimport-easystud');
    const labels = root ? getLabels(root) : {};
    // The consumer owns the block geometry; this marker lets its bottom
    // pagination remain at the end of that block without viewport positioning.
    list.classList.add('is-easystud-paginated');
    const selector = '[data-easystud-pagination="' + position + '"]';
    const resolvePaginationNeighbour = () => {
        if (inside) {
            return list.querySelector(':scope > ' + selector);
        }
        if (position === 'top') {
            return list.previousElementSibling;
        }
        return list.nextElementSibling;
    };
    let pagination = resolvePaginationNeighbour();
    if (!pagination || !pagination.matches('[data-easystud-pagination]')) {
        pagination = document.createElement('nav');
        pagination.className = 'local-groupimport-easystud-pagination local-groupimport-easystud-pagination--' + position;
        pagination.setAttribute('data-easystud-pagination', position);
        pagination.setAttribute('aria-label', paginationNavLabel(labels, position));
        pagination.innerHTML =
            '<span class="local-groupimport-easystud-pagination__selection">' +
                '<button type="button" class="btn btn-sm btn-outline-secondary local-groupimport-easystud-pagination__select" ' +
                    'data-easystud-select-results="1">' +
                    '<span data-easystud-select-results-label>' +
                        escapeHtml(labels.selectresults || '') +
                    '</span>' +
                '</button>' +
                '<span class="local-groupimport-easystud-pagination__count" data-easystud-list-count></span>' +
            '</span>' +
            '<span class="local-groupimport-easystud-pagination__controls">' +
                pageButton('page-first', labels.paginationfirstpage, '&laquo;') +
                pageButton('page-prev', labels.paginationpreviouspage, '&lsaquo;') +
                '<span data-easystud-page-label></span>' +
                pageButton('page-next', labels.paginationnextpage, '&rsaquo;') +
                pageButton('page-last', labels.paginationlastpage, '&raquo;') +
            '</span>' +
            '<span class="local-groupimport-easystud-pagination__tools">' +
                '<label class="local-groupimport-easystud-pagination__sort">' +
                    '<span>' + escapeHtml(labels.sortitems || '') + '</span>' +
                    '<span class="local-groupimport-easystud-dropdown" data-easystud-list-sort-dropdown>' +
                        '<button type="button" class="local-groupimport-easystud-dropdown__button" ' +
                            'data-easystud-list-sort-toggle aria-expanded="false">' +
                            '<span data-easystud-list-sort-label>' + escapeHtml(labels.sortalpha || '') + '</span>' +
                            '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
                        '</button>' +
                        '<span class="local-groupimport-easystud-dropdown__menu" data-easystud-list-sort-menu hidden>' +
                            '<button type="button" data-easystud-list-sort-option="alpha">' +
                                escapeHtml(labels.sortalpha || '') + '</button>' +
                            '<button type="button" data-easystud-list-sort-option="alpha-desc">' +
                                escapeHtml(labels.sortalphadesc || '') + '</button>' +
                            '<button type="button" data-easystud-list-sort-option="filled">' +
                                escapeHtml(labels.sortfilledfirst || '') + '</button>' +
                            '<button type="button" data-easystud-list-sort-option="empty">' +
                                escapeHtml(labels.sortemptyfirst || '') + '</button>' +
                        '</span>' +
                    '</span>' +
                '</label>' +
            '</span>' +
            '<span class="local-groupimport-easystud-pagination__spacer" aria-hidden="true"></span>';
        if (inside) {
            if (position === 'top') {
                list.insertBefore(pagination, list.firstChild);
            } else {
                list.appendChild(pagination);
            }
        } else {
            list.insertAdjacentElement(position === 'top' ? 'beforebegin' : 'afterend', pagination);
        }
    }
    if (inside && position === 'bottom') {
        // Reusing an existing navigation must restore the same invariant as
        // creating it: late lifecycle children stay above the bottom pager.
        list.appendChild(pagination);
    }
    if (list.matches('[data-easystud-participant-list]')) {
        pagination.setAttribute('data-easystud-guide-result-scope', 'participants');
    }
    return pagination;
};

export const isItemFilteredOut = item => item.hasAttribute('data-easystud-filter-hidden') ||
    item.getAttribute('data-easystud-catalog-filter-hidden') === '1' ||
    item.getAttribute('data-easystud-catalog-search-hidden') === '1' ||
    item.getAttribute('data-easystud-structure-search-hidden') === '1' ||
    item.getAttribute('data-easystud-grouping-filter-hidden') === '1';

export const getSelectableResultItems = (list, config) => {
    const root = list.closest('.local-groupimport-easystud');
    const ondemand = getOnDemandList(root, list);
    if (ondemand) {
        // All filtered results across pages; off-page ones are detached cards.
        return ondemand.ids.map(ondemand.card).filter(Boolean);
    }
    return Array.from(list.children).filter(item => {
        if (!item.matches(config.selector) || isItemFilteredOut(item)) {
            return false;
        }
        return !item.hidden || item.getAttribute('data-easystud-page-hidden') === '1';
    });
};

const getSortableItemName = item => {
    const name = item.querySelector(
        '.local-groupimport-easystud-user__name, ' +
        '.local-groupimport-easystud-group__name, ' +
        '.local-groupimport-easystud-grouping__name'
    );
    return normalise(name ? name.textContent : item.textContent);
};

const getSortableItemCount = item => {
    const type = item.getAttribute('data-selectable-type') || '';
    if (type === 'participant') {
        return (item.getAttribute('data-group-ids') || '').split(',').filter(Boolean).length;
    }
    if (type === 'group') {
        return getGroupMemberCount(item);
    }
    if (type === 'grouping') {
        return item.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    }
    return 0;
};

const getSortModeLabels = (root, list) => {
    const labels = getLabels(root);
    if (list && list.matches('[data-easystud-participant-list]')) {
        return {
            alpha: labels.sortalpha || '',
            'alpha-desc': labels.sortalphadesc || '',
            filled: labels.sortparticipantswithgroups || '',
            empty: labels.sortparticipantswithoutgroups || '',
        };
    }
    return {
        alpha: labels.sortalpha || '',
        'alpha-desc': labels.sortalphadesc || '',
        filled: labels.sortfilledfirst || '',
        empty: labels.sortemptyfirst || '',
    };
};

export const sortListItems = (list, config) => {
    if (!list || !config) {
        return;
    }
    const mode = list.getAttribute('data-easystud-sort') || 'alpha';
    const topPagination = list.querySelector(':scope > [data-easystud-pagination="top"]');
    const bottomPagination = list.querySelector(':scope > [data-easystud-pagination="bottom"]');
    const items = Array.from(list.children).filter(item => item.matches(config.selector));
    items.sort((left, right) => {
        const leftName = getSortableItemName(left);
        const rightName = getSortableItemName(right);
        if (mode === 'filled' || mode === 'empty') {
            const leftCount = getSortableItemCount(left);
            const rightCount = getSortableItemCount(right);
            if (leftCount !== rightCount) {
                return mode === 'filled' ? rightCount - leftCount : leftCount - rightCount;
            }
        }
        return mode === 'alpha-desc' ? rightName.localeCompare(leftName) : leftName.localeCompare(rightName);
    });
    const anchor = bottomPagination && bottomPagination.parentElement === list ? bottomPagination : null;
    items.forEach(item => list.insertBefore(item, anchor));
    if (topPagination && topPagination.parentElement === list) {
        list.insertBefore(topPagination, list.firstChild);
    }
};

export const updateResultSelectionControl = (root, list, config, select) => {
    if (!select) {
        return;
    }
    const labels = getLabels(root);
    const ondemand = getOnDemandList(root, list);
    // On demand, count from the state rather than building a card per result.
    const items = ondemand ? ondemand.ids : getSelectableResultItems(list, config);
    const filtered = hasActiveListFilters(root, list);
    const show = items.length > 0;
    const label = select.querySelector('[data-easystud-select-results-label]') || select;
    // Keep the same intrinsic toolbar slot when a list has no results. The Kit
    // hides the empty toolbar's side lanes; disabled controls cannot be invoked.
    select.hidden = false;
    const kind = selectionKinds[config.selector];
    const blocked = !!kind && hasOtherSelection(root, kind);
    select.disabled = blocked || !show;
    select.setAttribute('aria-disabled', blocked || !show ? 'true' : 'false');
    if (!show) {
        select.removeAttribute('data-easystud-deselect-results');
        label.textContent = filtered ?
            (labels.selectresults || '') :
            (labels.selectall || '');
        return;
    }
    const allselected = ondemand ? items.every(ondemand.isSelected) :
        items.every(item => item.classList.contains(selectedClass));
    select.setAttribute('data-easystud-deselect-results', allselected ? '1' : '0');
    const resolvePageSelectionLabel = () => {
        if (allselected) {
            if (filtered) {
                return labels.deselectresults || '';
            }
            return labels.deselectall || '';
        }
        if (filtered) {
            return labels.selectresults || '';
        }
        return labels.selectall || '';
    };
    label.textContent = resolvePageSelectionLabel();
};

// A selection only changes the select/deselect wording. Rebuilding every paginated list here delays card motion.
export const syncPaginationSelectionControls = root => {
    getPaginationConfigs(root).forEach(config => {
        const list = config.list;
        if (!list) {
            return;
        }
        const paginations = config.inside ?
            Array.from(list.querySelectorAll(':scope > [data-easystud-pagination="top"]')) :
            [list.previousElementSibling].filter(node => node && node.matches('[data-easystud-pagination="top"]'));
        paginations.forEach(pagination => {
            updateResultSelectionControl(root, list, config,
                pagination.querySelector('[data-easystud-select-results]'));
        });
    });
};

export const updatePaginationMetaControls = (root, list, pagination, total, position) => {
    const count = pagination.querySelector('[data-easystud-list-count]');
    const sortDropdown = pagination.querySelector('[data-easystud-list-sort-dropdown]');
    const sortLabel = pagination.querySelector('[data-easystud-list-sort-label]');
    const tools = pagination.querySelector('.local-groupimport-easystud-pagination__tools');
    const visible = position === 'top';
    pagination.classList.toggle('is-empty', total === 0);
    const selection = pagination.querySelector('.local-groupimport-easystud-pagination__selection');
    [selection, tools].filter(Boolean).forEach(lane => {
        lane.inert = total === 0;
    });
    const isFullView = !root.classList.contains(participantFocusClass) && !root.classList.contains(structureFocusClass);
    const showCount = visible && !isFullView;
    if (tools) {
        tools.hidden = !visible;
    }
    if (count) {
        const labels = getLabels(root);
        count.textContent = countLabel(labels.listeditemscounttemplate, total);
        count.hidden = !showCount;
        if (showCount) {
            window.requestAnimationFrame(() => {
                if (pagination.scrollWidth > pagination.clientWidth + 1) {
                    count.hidden = true;
                }
            });
        }
    }
    if (sortDropdown) {
        const mode = list.getAttribute('data-easystud-sort') || 'alpha';
        const modeLabels = getSortModeLabels(root, list);
        sortDropdown.setAttribute('data-easystud-list-sort-value', mode);
        if (sortLabel) {
            sortLabel.textContent = modeLabels[mode] || modeLabels.alpha;
        }
        sortDropdown.querySelectorAll('[data-easystud-list-sort-option]').forEach(option => {
            const optionMode = option.getAttribute('data-easystud-list-sort-option') || 'alpha';
            const active = optionMode === mode;
            option.textContent = modeLabels[optionMode] || option.textContent;
            option.classList.toggle('is-active', active);
            option.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }
};

export const syncSinglePageResultSelection = (root, list, config, pages, items) => {
    const paginations = config.inside ? Array.from(list.querySelectorAll(':scope > [data-easystud-pagination]')) :
        [list.previousElementSibling, list.nextElementSibling].filter(node => node && node.matches('[data-easystud-pagination]'));
    if (pages > 1) {
        return;
    }

    paginations.forEach(pagination => {
        if (pagination.getAttribute('data-easystud-pagination') !== 'top') {
            pagination.remove();
        }
    });

    const controls = getPagination(list, config.inside, 'top');
    controls.classList.add('is-placeholder');
    controls.querySelectorAll(
        '[data-easystud-page-first], [data-easystud-page-prev], [data-easystud-page-next], ' +
        '[data-easystud-page-last], [data-easystud-page-label]')
        .forEach(control => {
            control.hidden = false;
            control.setAttribute('aria-hidden', 'true');
            if ('disabled' in control) {
                control.disabled = true;
            }
        });
    const label = controls.querySelector('[data-easystud-page-label]');
    if (label) {
        label.textContent = '1 / 1';
    }
    const select = controls.querySelector('[data-easystud-select-results]');
    updateResultSelectionControl(root, list, config, select);
    updatePaginationMetaControls(root, list, controls, items.length, 'top');
};
