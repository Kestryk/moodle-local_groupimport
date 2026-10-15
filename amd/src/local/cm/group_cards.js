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
 * EasyStud course manager: group cards (members collapse and heights, member search,
 * card menus, e-mail panels, badges, group and grouping elements built in the browser).
 *
 * @module     local_groupimport/local/cm/group_cards
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {countLabel} from '../sm/index';
import {getTreeSectionGroupIds, renderMissingMemberRows} from '../sm/groups';
import {matchesText, elementSearchText} from '../sm/filter_engine';
import {isResponsiveWorkspace, requestGuideHighlightRefresh, normalise, getLabels, escapeHtml} from './shared';
import {getOnDemandModel, getOnDemandParticipants} from './state';
import {isResponsiveDragSuppressed} from './drag_support';
import {
    renderGroupGroupingTags, setAdvancedAttributes, getGroupMemberCount, syncGroupSelectAll, groupSelectAllRowHtml,
    syncGroupCardSelection,
} from './cards';
import {updateSelectionAvailability} from './selection';

/**
 * SM-RENDU lever 2: give a lean group card all its member rows, before it unfolds, searches
 * its members or opens its settings. Legacy cards and complete cards are left as they are.
 *
 * @param {HTMLElement|null} group Group card.
 */
export const ensureFullGroupMembers = group => {
    const model = getOnDemandModel();
    if (!model || !group || !group.hasAttribute('data-easystud-sm-members-partial')) {
        return;
    }
    const rows = renderMissingMemberRows(model, group);
    if (!rows.length) {
        return;
    }
    const root = getOnDemandParticipants().root;
    rows.forEach(row => row.querySelectorAll('[data-easystud-hover-help][title]').forEach(node => {
        node.setAttribute('data-easystud-native-title', node.getAttribute('title') || '');
        node.removeAttribute('title');
    }));
    normaliseMemberRemoveLabels(root);
    if (group.hasAttribute('data-easystud-sm-catalog')) {
        syncGroupCardSelection(model, group);
    }
    updateSelectionAvailability(root);
};

// Member lists waiting for their heights while a batch of cards is synchronised (see withBatchedMemberHeights).
let membersHeightBatch = null;

/**
 * Collapsed and expanded heights of a member list, from its first two visible rows.
 *
 * @param {HTMLElement} list Member list.
 * @param {HTMLElement[]} members Visible member rows.
 * @returns {{collapsed: Number, expanded: Number}|null} Null when the first row has no height.
 */
const measureGroupMembers = (list, members) => {
    const firstmember = members[0];
    const secondmember = members[1];
    const firstheight = firstmember ? firstmember.offsetTop + firstmember.offsetHeight : 0;
    if (!firstheight) {
        return null;
    }
    const partialheight = secondmember && secondmember.offsetHeight ?
        secondmember.offsetTop + (secondmember.offsetHeight * 0.58) : 0;
    const collapsed = Math.ceil(Math.max(partialheight, firstheight + 8));
    return {collapsed, expanded: Math.ceil(list.scrollHeight + 2)};
};

const applyGroupMembersHeight = (list, heights) => {
    if (!heights) {
        list.style.removeProperty('--local-groupimport-members-collapsed-height');
        list.style.removeProperty('--local-groupimport-members-expanded-height');
        return;
    }
    list.style.setProperty('--local-groupimport-members-collapsed-height', Math.max(heights.collapsed, 0) + 'px');
    list.style.setProperty('--local-groupimport-members-expanded-height',
        Math.max(heights.expanded, heights.collapsed) + 'px');
};

/**
 * Synchronise many group cards with one layout: the member heights are measured once all
 * the cards are written, instead of once per card (seconds when a catalog or a section opens
 * on a large page). The values are the same, since nothing written after the measurement in
 * syncGroupMembersCollapsible moves the member rows.
 *
 * @param {Function} callback Synchronises the cards.
 */
export const withBatchedMemberHeights = callback => {
    if (membersHeightBatch) {
        callback();
        return;
    }
    membersHeightBatch = [];
    try {
        callback();
    } finally {
        const batch = membersHeightBatch;
        membersHeightBatch = null;
        const measured = batch.map(([list, members]) => [list, measureGroupMembers(list, members)]);
        measured.forEach(([list, heights]) => applyGroupMembersHeight(list, heights));
    }
};

const syncGroupMembersHeight = (list, members, visibleCount, cancollapse) => {
    if (!list) {
        return;
    }
    if (cancollapse && membersHeightBatch) {
        membersHeightBatch.push([list, members]);
        return;
    }
    if (!cancollapse) {
        list.style.removeProperty('--local-groupimport-members-collapsed-height');
        list.style.removeProperty('--local-groupimport-members-expanded-height');
        return;
    }

    applyGroupMembersHeight(list, measureGroupMembers(list, members));
};

const memberFocusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
].join(', ');

const memberCollapsedTabindexAttribute = 'data-easystud-member-collapsed-tabindex';

/**
 * Keeps the visually clipped members out of the keyboard sequence.
 *
 * The `inert` state is the primary containment. The saved tabindex fallback
 * keeps the disclosure usable in browsers which do not enforce inert yet.
 *
 * @param {HTMLElement} member The group member item.
 * @param {boolean} collapsed Whether the member is visually clipped.
 * @returns {void}
 */
const syncCollapsedMemberFocus = (member, collapsed) => {
    member.toggleAttribute('inert', collapsed);
    if (collapsed) {
        member.querySelectorAll(memberFocusableSelector).forEach(control => {
            if (!control.hasAttribute(memberCollapsedTabindexAttribute)) {
                control.setAttribute(
                    memberCollapsedTabindexAttribute,
                    control.hasAttribute('tabindex') ? control.getAttribute('tabindex') : ''
                );
            }
            control.setAttribute('tabindex', '-1');
        });
        return;
    }

    member.querySelectorAll('[' + memberCollapsedTabindexAttribute + ']').forEach(control => {
        const tabindex = control.getAttribute(memberCollapsedTabindexAttribute);
        if (tabindex === '') {
            control.removeAttribute('tabindex');
        } else {
            control.setAttribute('tabindex', tabindex);
        }
        control.removeAttribute(memberCollapsedTabindexAttribute);
    });
};

export const syncGroupMembersCollapsible = group => {
    if (!group) {
        return;
    }
    const list = group.querySelector('[data-easystud-group-members]');
    const toggle = group.querySelector('[data-easystud-group-members-toggle]');
    const more = group.querySelector('[data-easystud-group-members-more]');
    if (!list || !toggle) {
        return;
    }

    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    if (expanded) {
        ensureFullGroupMembers(group);
    }
    const allmembers = Array.from(list.querySelectorAll('[data-easystud-member-id]'));
    const members = allmembers.filter(member => !member.hidden);
    const visibleCount = 2;
    const cancollapse = members.length > 1;

    allmembers.forEach(member => {
        member.classList.remove('local-groupimport-easystud-member--extra', 'is-collapsed');
    });

    const collapsedmembers = [];
    members.forEach((member, index) => {
        const isextra = cancollapse && index >= visibleCount;
        const iscollapsed = isextra && !expanded;
        member.classList.toggle('local-groupimport-easystud-member--extra', isextra);
        member.classList.toggle('is-collapsed', iscollapsed);
        if (iscollapsed) {
            collapsedmembers.push(member);
        }
    });

    if (collapsedmembers.some(member => member.contains(document.activeElement))) {
        toggle.focus({preventScroll: true});
    }
    allmembers.forEach(member => syncCollapsedMemberFocus(member, collapsedmembers.includes(member)));

    list.classList.toggle('has-extra-members', cancollapse);
    list.classList.toggle('is-expanded', expanded);
    syncGroupMembersHeight(list, members, visibleCount, cancollapse);
    group.classList.toggle('has-collapsible-members', cancollapse);
    toggle.hidden = !cancollapse;
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.classList.toggle('is-expanded', expanded);
    if (more) {
        more.hidden = !cancollapse || expanded;
    }
    syncGroupSelectAll(group);
};

export const syncAllGroupMembersCollapsible = root => {
    withBatchedMemberHeights(() => root.querySelectorAll('[data-easystud-group-id]').forEach(syncGroupMembersCollapsible));
};

export const syncGroupMembersInContainer = container => {
    if (!container) {
        return;
    }
    withBatchedMemberHeights(() => container.querySelectorAll('[data-easystud-group-id]').forEach(syncGroupMembersCollapsible));
};

export const getContainerGroups = list => {
    if (!list) {
        return [];
    }
    return Array.from(list.querySelectorAll(':scope > [data-easystud-group-id]'));
};

const getVisibleContainerGroups = list => getContainerGroups(list).filter(group => !group.hidden);

const syncGroupingGroupsHeight = (list, groups, visibleCount, cancollapse) => {
    if (!list) {
        return;
    }
    if (!cancollapse) {
        list.style.removeProperty('--local-groupimport-grouping-groups-collapsed-height');
        list.style.removeProperty('--local-groupimport-grouping-groups-expanded-height');
        list.style.maxHeight = '';
        return;
    }

    const lastvisible = groups[Math.min(visibleCount, groups.length) - 1];
    const collapsedheight = lastvisible ? Math.ceil(lastvisible.offsetTop + lastvisible.offsetHeight + 8) : 0;
    const expandedheight = Math.ceil(list.scrollHeight + 2);
    list.style.setProperty('--local-groupimport-grouping-groups-collapsed-height', Math.max(collapsedheight, 0) + 'px');
    list.style.setProperty('--local-groupimport-grouping-groups-expanded-height', Math.max(expandedheight, collapsedheight) + 'px');
    if (!list.classList.contains('is-tree-animating')) {
        list.style.maxHeight = list.classList.contains('is-expanded') ?
            Math.max(expandedheight, collapsedheight) + 'px' : Math.max(collapsedheight, 0) + 'px';
    }
};

export const syncGroupingGroupsCollapsible = grouping => {
    if (!grouping || !grouping.hasAttribute('data-easystud-grouping-id')) {
        return;
    }
    const list = grouping.querySelector('[data-easystud-container-group-list]');
    const toggle = grouping.querySelector('[data-easystud-grouping-groups-toggle]');
    if (!list || !toggle || list.hidden) {
        return;
    }

    const groups = getVisibleContainerGroups(list);

    getContainerGroups(list).forEach(group => {
        group.classList.remove('local-groupimport-easystud-group--extra', 'is-collapsed');
    });

    list.classList.remove('has-extra-groups');
    list.classList.add('is-expanded');
    syncGroupingGroupsHeight(list, groups, groups.length, false);
    grouping.classList.remove('has-collapsible-groups');
    toggle.hidden = true;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.remove('is-expanded');
};

export const syncAllGroupingGroupsCollapsible = root => {
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(syncGroupingGroupsCollapsible);
};

export const scheduleGroupingResizeForGroup = group => {
    const grouping = group ? group.closest('[data-easystud-grouping-id]') : null;
    if (!grouping) {
        return;
    }
    requestGuideHighlightRefresh(grouping.closest('#local-groupimport-easystud'));
    window.requestAnimationFrame(() => syncGroupingGroupsCollapsible(grouping));
};

export const ensureGroupMemberSearchControls = (root, group) => {
    if (!group || group.querySelector('[data-easystud-group-member-search-toggle]')) {
        return;
    }
    const labels = getLabels(root);
    const groupid = group.getAttribute('data-easystud-group-id') || '';
    const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
    const members = group.querySelector(':scope > [data-easystud-group-members]');
    if (!groupid || !header || !members) {
        return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn btn-link p-0 local-groupimport-easystud-group__member-search-button';
    toggle.setAttribute('data-easystud-group-member-search-toggle', groupid);
    toggle.setAttribute('aria-label', labels.searchparticipantslabel || '');
    toggle.setAttribute('data-easystud-hover-help', labels.searchparticipantslabel || '');
    toggle.innerHTML = '<span class="fa fa-search" aria-hidden="true"></span>';

    const mail = header.querySelector(':scope > .local-groupimport-easystud-group__mail-button');
    const rename = header.querySelector(':scope > .local-groupimport-easystud-rename');
    header.insertBefore(toggle, mail || rename || null);

    const panel = document.createElement('div');
    panel.className = 'local-groupimport-easystud-container-search local-groupimport-easystud-group__member-search';
    panel.setAttribute('data-easystud-group-member-search-panel', groupid);
    panel.hidden = true;
    panel.innerHTML =
        '<div class="local-groupimport-easystud-container-search__row">' +
            '<label class="local-groupimport-easystud__search-field local-groupimport-easystud-container-search__field ' +
                'easyedu-search-field" aria-label="' +
                escapeHtml(labels.searchparticipantslabel || '') + '">' +
                '<span class="fa fa-search" aria-hidden="true"></span>' +
                '<input type="search" class="form-control" placeholder="' + escapeHtml(labels.searchparticipants || '') +
                    '" data-easystud-group-member-search="' + escapeHtml(groupid) + '">' +
            '</label>' +
            '<button type="button" class="easyedu-button easyedu-button--secondary" data-easystud-group-member-search-cancel="' +
                escapeHtml(groupid) + '">' + escapeHtml(labels.cancel || '') + '</button>' +
        '</div>';
    group.insertBefore(panel, members);
};

export const normaliseCardMenuButton = (button, root) => {
    if (!button) {
        return;
    }
    button.classList.add('local-groupimport-easystud-card-menu');
    button.setAttribute('data-easystud-card-menu', '1');
    button.setAttribute('aria-haspopup', 'menu');
    if (!button.getAttribute('aria-expanded')) {
        button.setAttribute('aria-expanded', 'false');
    }
    if (!button.getAttribute('aria-label')) {
        button.setAttribute('aria-label',
            root.getAttribute('data-easystud-mobile-card-actions') || getLabels(root).mobilecardactions || '');
    }
    const icon = button.querySelector(':scope > .local-groupimport-easystud-card-menu__icon.fa-bars');
    if (!icon || button.children.length !== 1) {
        button.innerHTML =
            '<span class="fa fa-bars local-groupimport-easystud-card-menu__icon" aria-hidden="true"></span>';
    }
};

export const ensureNestedGroupActionMenus = (root, cards = null) => {
    const actionSelector = [
        ':scope > .local-groupimport-easystud-group__mail-button',
        ':scope > .local-groupimport-easystud-group__member-search-button',
        ':scope > .local-groupimport-easystud-group__duplicate-button',
        ':scope > .local-groupimport-easystud-group__settings-button',
        ':scope > .local-groupimport-easystud-group__unlink-button',
        ':scope > .local-groupimport-easystud-container-search__toggle',
        ':scope > .local-groupimport-easystud-grouping__search-button',
        ':scope > .local-groupimport-easystud-grouping__duplicate-button',
        ':scope > .local-groupimport-easystud-grouping__settings-button',
        ':scope > .local-groupimport-easystud-rename > .local-groupimport-easystud-rename__toggle',
    ].join(', ');

    // Three phases, so the browser lays the page out once for all cards instead of once per
    // card (seconds on a large course): reset every card, measure them all, then move the
    // actions of the cards which do not fit (usually few) into their menu.
    // Cards rendered on demand pass themselves: re-measuring the whole page would also re-measure opened sections.
    const entries = [];
    (cards || root.querySelectorAll('[data-easystud-group-id], [data-easystud-grouping-id]')).forEach(group => {
        const header = group.querySelector(
            ':scope > .local-groupimport-easystud-group__header, :scope > .local-groupimport-easystud-grouping__header'
        );
        if (!header) {
            return;
        }

        let menu = header.querySelector(':scope > [data-easystud-group-actions-menu]');
        let toggle = header.querySelector(':scope > [data-easystud-group-actions-toggle]');
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'local-groupimport-easystud-group__actions-menu';
            menu.setAttribute('data-easystud-group-actions-menu', '1');
            menu.hidden = true;
            header.appendChild(menu);
        }
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'btn btn-link p-0 local-groupimport-easystud-group__actions-toggle ' +
                'local-groupimport-easystud-card-menu';
            toggle.setAttribute('data-easystud-group-actions-toggle', '1');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', getLabels(root).moreactions || '');
            header.appendChild(toggle);
        }
        normaliseCardMenuButton(toggle, root);

        const actions = Array.from(header.querySelectorAll(actionSelector));
        actions.forEach(button => button.classList.remove('is-easystud-card-action-overflow'));
        toggle.hidden = true;
        menu.hidden = true;
        menu.innerHTML = '';
        entries.push({group, header, menu, toggle, actions});
    });

    const responsive = isResponsiveWorkspace();
    const outsideCard = (cardBounds, button) => {
        if (button.hidden || button.offsetParent === null) {
            return false;
        }
        const bounds = button.getBoundingClientRect();
        return bounds.left < cardBounds.left - 1 || bounds.right > cardBounds.right + 1;
    };
    // Reads only.
    entries.forEach(entry => {
        const {group, header, actions} = entry;
        entry.visible = !!header.offsetParent && actions.length > 0;
        if (!entry.visible) {
            return;
        }
        entry.cardBounds = group.getBoundingClientRect();
        entry.overflowed = responsive ? actions.filter(button => !button.hidden) :
            actions.filter(button => outsideCard(entry.cardBounds, button));
        entry.fits = !entry.overflowed.length && header.scrollWidth <= header.clientWidth + 1;
    });

    entries.filter(entry => entry.visible).forEach(entry => {
        const {header, menu, toggle, actions, cardBounds} = entry;
        if (entry.fits) {
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }
        const isOutsideCard = button => outsideCard(cardBounds, button);
        const overflowed = entry.overflowed;

        toggle.hidden = false;
        for (let index = actions.length - 1;
            index >= 0 && (header.scrollWidth > header.clientWidth + 1 || actions.some(isOutsideCard));
            index--) {
            const button = actions[index];
            if (!button.hidden && !overflowed.includes(button)) {
                overflowed.unshift(button);
            }
            button.classList.add('is-easystud-card-action-overflow');
        }
        overflowed.forEach(source => {
            source.classList.add('is-easystud-card-action-overflow');
            const clone = source.cloneNode(true);
            const label = source.getAttribute('aria-label') || source.getAttribute('data-easystud-hover-help') ||
                source.getAttribute('title') || '';
            clone.removeAttribute('id');
            clone.classList.remove('is-easystud-card-action-overflow');
            clone.classList.add('local-groupimport-easystud-group__actions-menu-item');
            clone.removeAttribute('data-easystud-hover-help');
            clone.removeAttribute('title');
            if (label) {
                const labelNode = document.createElement('span');
                labelNode.className = 'local-groupimport-easystud-group__actions-menu-label';
                labelNode.textContent = label;
                clone.appendChild(labelNode);
            }
            clone.addEventListener('click', event => {
                event.preventDefault();
                Motion.hideMenu(menu, {anchor: toggle});
                toggle.setAttribute('aria-expanded', 'false');
                source.click();
            });
            menu.appendChild(clone);
        });
        toggle.hidden = menu.children.length === 0;
    });
};

const syncGroupMemberSearchEmptyState = (root, group, query, visibleCount) => {
    const labels = getLabels(root);
    const list = group ? group.querySelector(':scope > [data-easystud-group-members]') : null;
    if (!list) {
        return;
    }
    let empty = list.querySelector(':scope > [data-easystud-member-filter-empty]');
    if (!empty) {
        empty = document.createElement('li');
        empty.className = 'local-groupimport-easystud-tree__empty local-groupimport-easystud-tree__empty--filtered';
        empty.setAttribute('data-easystud-member-filter-empty', '1');
        empty.textContent = labels.noresultsfiltered || '';
        list.appendChild(empty);
    }
    empty.hidden = !query || visibleCount > 0;
};

/**
 * Search text of a group member row: the row itself plus the participant's search text from the
 * state index (the row is rendered: its own text stays the DOM's).
 *
 * @param {Object|null} model On-demand participant model, or null while the state loads.
 * @param {HTMLElement} member Member row.
 * @returns {String}
 */
const memberSearchText = (model, member) => {
    const userid = member.getAttribute('data-easystud-member-id') || '';
    const entry = model ? model.indexById.get(Number(userid)) : null;
    return elementSearchText(member) + ' ' + (entry ? entry.text : '');
};

/**
 * Apply the member search of one group card (rows, empty state, collapsible list).
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} group Group card.
 */
export const applyGroupMemberSearchToGroup = (root, group) => {
    ensureGroupMemberSearchControls(root, group);
    const groupid = group.getAttribute('data-easystud-group-id') || '';
    const input = group.querySelector(':scope > [data-easystud-group-member-search-panel="' + groupid + '"] ' +
        '[data-easystud-group-member-search="' + groupid + '"]');
    const query = normalise(input ? input.value : '');
    if (query) {
        ensureFullGroupMembers(group);
    }
    const members = Array.from(group.querySelectorAll(':scope > [data-easystud-group-members] [data-easystud-member-id]'));
    const model = getOnDemandModel(root);
    let visibleCount = 0;

    members.forEach(member => {
        // The participant search text is only needed while a query is typed. On demand it comes from the
        // state index: looking up participant cards would build a detached card for every member.
        const hidden = !!query && !matchesText(memberSearchText(model, member), query);
        member.hidden = hidden;
        member.setAttribute('data-easystud-member-search-hidden', hidden ? '1' : '0');
        if (!hidden) {
            visibleCount++;
        }
    });

    if (query) {
        const toggle = group.querySelector('[data-easystud-group-members-toggle]');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
        }
    }
    syncGroupMemberSearchEmptyState(root, group, query, visibleCount);
    syncGroupMembersCollapsible(group);
    scheduleGroupingResizeForGroup(group);
};

// Create a member row in a group.
export const createMemberItem = (groupid, userid, fullname, removelabel, selectionlabel) => {
    const item = document.createElement('li');
    item.className = 'local-groupimport-easystud-member easyedu-related-person-row';
    item.setAttribute('data-easystud-member-id', userid);
    item.setAttribute('data-member-key', groupid + '-' + userid);
    item.setAttribute('data-selectable-type', 'member');
    item.setAttribute('data-selectable-id', groupid + '-' + userid);
    item.setAttribute('data-search-text', normalise(fullname || ''));

    const selector = document.createElement('label');
    selector.className = 'local-groupimport-easystud-selector local-groupimport-easystud-selector--member ' +
        'easyedu-related-person-row__selector';
    selector.setAttribute('aria-label', selectionlabel || '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('data-easystud-selector-input', '1');
    selector.appendChild(checkbox);

    const ui = document.createElement('span');
    ui.className = 'local-groupimport-easystud-selector__ui';
    ui.setAttribute('aria-hidden', 'true');
    selector.appendChild(ui);

    item.appendChild(selector);

    const name = document.createElement('span');
    name.className = 'local-groupimport-easystud-member__name easyedu-related-person-row__name';
    name.textContent = fullname;
    item.appendChild(name);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-link p-0 local-groupimport-easystud-member__remove ' +
        'easyedu-related-person-row__remove';
    remove.setAttribute('data-easystud-remove-member', '1');
    remove.setAttribute('data-group-id', groupid);
    remove.setAttribute('data-user-id', userid);
    remove.setAttribute('aria-label', removelabel || fullname);
    remove.setAttribute('data-easystud-hover-help', removelabel || fullname);
    remove.innerHTML = '<span aria-hidden="true">&minus;</span>';
    item.appendChild(remove);

    return item;
};

export const normaliseMemberRemoveLabels = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-member-id]').forEach(member => {
        const button = member.querySelector('[data-easystud-remove-member]');
        const name = member.querySelector('.local-groupimport-easystud-member__name');
        if (!button || !name) {
            return;
        }

        const current = button.getAttribute('aria-label') || '';
        if (current && current.indexOf('{}') === -1 && current.indexOf('{name}') === -1) {
            return;
        }

        const label = (labels.removeuser || '').replace('{name}', name.textContent.trim());
        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
        button.setAttribute('data-easystud-hover-help', label);
    });
};

export const updateGroupingBadge = section => {
    if (!section) {
        return;
    }
    const badge = section.querySelector('.local-groupimport-easystud-tree__toggle .badge');
    if (!badge) {
        return;
    }
    const root = section.closest('.local-groupimport-easystud');
    const model = getOnDemandModel(root);
    const groupingid = section.getAttribute('data-easystud-grouping-id');
    if (!model) {
        // Keep the server count until the state has loaded: closed sections have no cards.
        return;
    }
    // A closed section has no cards: count from the state (a grouping created in the page
    // since the last state reload counts its cards).
    const count = groupingid && model.groupings.has(Number(groupingid)) ?
        getTreeSectionGroupIds(model, groupingid).length :
        section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    badge.textContent = countLabel(badge.getAttribute('data-count-template') || '__count__', count);
    section.setAttribute('data-easystud-advanced-count', badge.textContent);
    setCountBadgeState(badge, count, 'grouping');
};

export const setCountBadgeState = (badge, count, type) => {
    if (!badge) {
        return;
    }
    badge.classList.toggle('local-groupimport-easystud-count-badge', true);
    badge.classList.toggle('local-groupimport-easystud-count-badge--empty', count === 0);
    badge.classList.toggle('local-groupimport-easystud-count-badge--filled', count > 0);
    badge.classList.toggle('local-groupimport-easystud-count-badge--members', type === 'members');
    badge.classList.toggle('local-groupimport-easystud-count-badge--grouping', type === 'grouping');
};

export const syncGroupMembersState = (group, labels) => {
    const list = group ? group.querySelector('[data-easystud-group-members]') : null;
    const badge = group ? group.querySelector('.local-groupimport-easystud-group__header .badge') : null;
    if (!list || !badge) {
        return;
    }

    const members = list.querySelectorAll('[data-easystud-member-id]');
    list.querySelectorAll(':scope > .text-muted, :scope > .local-groupimport-easystud-tree__empty').forEach(item => item.remove());
    if (!members.length) {
        const empty = document.createElement('li');
        empty.className = 'local-groupimport-easystud-tree__empty';
        empty.textContent = labels.nogroupmembers || '';
        list.appendChild(empty);
    }

    badge.textContent = countLabel(labels.memberscounttemplate, members.length);
    group.setAttribute('data-easystud-advanced-count', badge.textContent);
    setCountBadgeState(badge, members.length, 'members');
    syncGroupMembersCollapsible(group);
    scheduleGroupingResizeForGroup(group);
};

export const syncAllCountBadges = root => {
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
        const badge = group.querySelector('.local-groupimport-easystud-group__header .badge');
        setCountBadgeState(badge, getGroupMemberCount(group), 'members');
    });
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(updateGroupingBadge);
};

export const updateStructureSummary = root => {
    const model = getOnDemandModel(root);
    if (!model || !model.raw) {
        return;
    }
    const counts = {
        groupings: model.raw.groupings.length,
        groups: model.raw.groups.length,
    };
    root.querySelectorAll('[data-easystud-structure-count]').forEach(counter => {
        const kind = counter.getAttribute('data-easystud-structure-count');
        counter.textContent = countLabel(counter.getAttribute('data-count-template'), counts[kind]);
    });
};

export const updateStructureEmptyState = root => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return;
    }

    const state = tree.querySelector('.local-groupimport-easystud__empty-state--structure');
    if (!state) {
        return;
    }

    const hasgroups = root.querySelectorAll('[data-easystud-group-id]').length > 0;
    const hasgroupings = root.querySelectorAll('[data-easystud-grouping-id]').length > 0;
    state.hidden = hasgroups || hasgroupings;
};

export const createGroupElement = (root, groupdata) => {
    const labels = getLabels(root);
    const group = document.createElement('div');
    group.className = 'local-groupimport-easystud-group';
    group.setAttribute('data-easystud-group-id', groupdata.id);
    group.setAttribute('data-easystud-user-drop', groupdata.id);
    group.setAttribute('data-selectable-type', 'group');
    group.setAttribute('data-selectable-id', groupdata.id);
    group.setAttribute('data-grouping-ids', groupdata.groupingidscsv || '');
    group.setAttribute('data-has-no-grouping', groupdata.groupingidscsv ? '0' : '1');
    group.setAttribute('data-search-text', normalise(groupdata.searchtext || groupdata.name || ''));
    group.setAttribute('draggable', isResponsiveDragSuppressed() ? 'false' : 'true');
    setAdvancedAttributes(group, groupdata, 'group');

    group.innerHTML =
        '<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--group" aria-label="' + escapeHtml(labels.selectionmode || '') + '">' +
            '<input type="checkbox" data-easystud-selector-input="1">' +
            '<span class="local-groupimport-easystud-selector__ui" aria-hidden="true"></span>' +
        '</label>' +
        '<div class="local-groupimport-easystud-group__header">' +
            '<span class="local-groupimport-easystud-group__name"></span>' +
            '<span class="local-groupimport-easystud-group__groupings local-groupimport-easystud-group__groupings--inline" hidden></span>' +
            '<span class="badge bg-light text-dark"></span>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__mail-button" data-easystud-toggle-group-email="' + escapeHtml(groupdata.id) + '" aria-label="' + escapeHtml(labels.addemailstogroup || '') + '" data-easystud-hover-help="' + escapeHtml(labels.addemailstogroup || '') + '">' +
                '<span class="fa fa-at" aria-hidden="true"></span>' +
            '</button>' +
            '<form method="post" action="" class="local-groupimport-easystud-rename" data-easystud-rename-form="1">' +
                '<input type="hidden" name="sesskey" value="' + escapeHtml(M.cfg.sesskey) + '">' +
                '<input type="hidden" name="action" value="renamegroup">' +
                '<input type="hidden" name="groupid" value="' + escapeHtml(groupdata.id) + '">' +
                '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-rename__toggle" data-easystud-rename-toggle="1" aria-label="' + escapeHtml(labels.rename || '') + '" data-easystud-hover-help="' + escapeHtml(labels.rename || '') + '">' +
                    '<span class="fa fa-pen" aria-hidden="true"></span>' +
                '</button>' +
                '<div class="local-groupimport-easystud-rename__edit" hidden>' +
                    '<input type="text" name="name" class="form-control form-control-sm" aria-label="' + escapeHtml(labels.rename || '') + '">' +
                    '<button type="submit" class="btn btn-sm btn-outline-secondary">' +
                        escapeHtml(labels.save || '') + '</button>' +
                    '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-rename-cancel="1">' + escapeHtml(labels.cancel || '') + '</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
        '<ul class="local-groupimport-easystud-group__members" data-easystud-group-members="' +
            escapeHtml(groupdata.id) + '"></ul>' +
        '<span class="local-groupimport-easystud-group__members-more" data-easystud-group-members-more="1" hidden>...</span>' +
        '<button type="button" class="local-groupimport-easystud-group__members-toggle" data-easystud-group-members-toggle="1" hidden>' +
            '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
        '</button>' +
        groupSelectAllRowHtml(groupdata.id, labels) +
        '<div class="local-groupimport-easystud-group-email" data-easystud-group-email-panel="' +
            escapeHtml(groupdata.id) + '" hidden>' +
            '<textarea class="form-control form-control-sm" rows="3" placeholder="' + escapeHtml(labels.pasteemailsplaceholder || '') + '" data-easystud-group-email-box="' + escapeHtml(groupdata.id) + '"></textarea>' +
            '<div class="local-groupimport-easystud-inline-actions">' +
                '<button type="button" class="btn btn-sm btn-primary" data-easystud-add-group-emails="' +
                    escapeHtml(groupdata.id) + '">' +
                    '<span class="fa fa-plus" aria-hidden="true"></span><span>' + escapeHtml(labels.addemails || '') + '</span>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-cancel-group-email="1">' + escapeHtml(labels.cancel || '') + '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-group-email__result" data-easystud-group-email-result="' + escapeHtml(groupdata.id) + '" aria-live="polite"></div>' +
        '</div>';

    const name = group.querySelector('.local-groupimport-easystud-group__name');
    const input = group.querySelector('input[name="name"]');
    if (name) {
        name.textContent = groupdata.name || '';
    }
    if (input) {
        input.value = groupdata.rawname || groupdata.name || '';
    }
    const groupingcontainer = group.querySelector('.local-groupimport-easystud-group__groupings--inline');
    const groupingnames = Array.isArray(groupdata.groupingtags) ?
        groupdata.groupingtags.map(tag => tag.label || '').filter(Boolean) : [];
    renderGroupGroupingTags(groupingcontainer, groupingnames);
    if (Array.isArray(groupdata.members) && groupdata.members.length) {
        const list = group.querySelector('[data-easystud-group-members]');
        if (list) {
            groupdata.members.forEach(member => {
                const userid = String(member.userid || member.id || '');
                const fullname = member.fullname || '';
                if (!userid || list.querySelector('[data-easystud-member-id="' + userid + '"]')) {
                    return;
                }
                const removelabel = (labels.removeuser || '').replace('{name}', fullname);
                list.appendChild(createMemberItem(groupdata.id, userid, fullname, removelabel, labels.selectionmode || ''));
            });
        }
    }
    syncGroupMembersState(group, labels);
    ensureGroupMemberSearchControls(root, group);
    return group;
};

export const createParticipantCatalogGroupElement = (root, groupdata) => {
    const group = createGroupElement(root, groupdata);
    group.classList.add('local-groupimport-easystud-group--catalog');
    const name = group.querySelector('.local-groupimport-easystud-group__name');
    if (name && !group.querySelector('.local-groupimport-easystud-group__groupings--inline')) {
        const inline = document.createElement('span');
        inline.className = 'local-groupimport-easystud-group__groupings local-groupimport-easystud-group__groupings--inline';
        inline.hidden = true;
        name.insertAdjacentElement('afterend', inline);
    }
    return group;
};

export const createGroupingElement = (root, groupingdata) => {
    const labels = getLabels(root);
    const section = document.createElement('div');
    section.className = 'local-groupimport-easystud-tree__section';
    section.setAttribute('data-easystud-grouping-id', groupingdata.id);
    section.setAttribute('data-easystud-grouping-drop', groupingdata.id);
    section.setAttribute('data-selectable-type', 'grouping');
    section.setAttribute('data-selectable-id', groupingdata.id);
    section.setAttribute('data-search-text', normalise(groupingdata.searchtext || groupingdata.name || ''));
    setAdvancedAttributes(section, groupingdata, 'grouping');

    section.innerHTML =
        '<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--section" aria-label="' + escapeHtml(labels.selectionmode || '') + '">' +
            '<input type="checkbox" data-easystud-selector-input="1">' +
            '<span class="local-groupimport-easystud-selector__ui" aria-hidden="true"></span>' +
        '</label>' +
        '<div class="local-groupimport-easystud-grouping__header">' +
            '<button type="button" class="local-groupimport-easystud-tree__toggle" data-easystud-collapse-toggle="1" aria-expanded="false">' +
                '<span class="fa fa-chevron-right" aria-hidden="true"></span>' +
                '<span class="local-groupimport-easystud-grouping__name"></span>' +
                '<span class="badge bg-secondary text-white" data-count-template="' + escapeHtml(labels.groupscounttemplate || '__count__') + '"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__mail-button" data-easystud-toggle-grouping-groups="' + escapeHtml(groupingdata.id) + '" aria-label="' + escapeHtml(labels.addgroupstogrouping || '') + '" data-easystud-hover-help="' + escapeHtml(labels.addgroupstogrouping || '') + '">' +
                '<span class="fa fa-layer-group" aria-hidden="true"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-container-search__toggle" data-easystud-container-search-toggle="' + escapeHtml(groupingdata.id) + '" aria-label="' + escapeHtml(labels.searchgroupslabel || '') + '" data-easystud-hover-help="' + escapeHtml(labels.searchgroupslabel || '') + '">' +
                '<span class="fa fa-search" aria-hidden="true"></span>' +
            '</button>' +
            '<form method="post" action="" class="local-groupimport-easystud-rename" data-easystud-rename-form="1">' +
                '<input type="hidden" name="sesskey" value="' + escapeHtml(M.cfg.sesskey) + '">' +
                '<input type="hidden" name="action" value="renamegrouping">' +
                '<input type="hidden" name="groupingid" value="' + escapeHtml(groupingdata.id) + '">' +
                '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-rename__toggle" data-easystud-rename-toggle="1" aria-label="' + escapeHtml(labels.rename || '') + '" data-easystud-hover-help="' + escapeHtml(labels.rename || '') + '">' +
                    '<span class="fa fa-pen" aria-hidden="true"></span>' +
                '</button>' +
                '<div class="local-groupimport-easystud-rename__edit" hidden>' +
                    '<input type="text" name="name" class="form-control form-control-sm" aria-label="' + escapeHtml(labels.rename || '') + '">' +
                    '<button type="submit" class="btn btn-sm btn-outline-secondary">' +
                        escapeHtml(labels.save || '') + '</button>' +
                    '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-rename-cancel="1">' + escapeHtml(labels.cancel || '') + '</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
        '<div class="local-groupimport-easystud-container-search" data-easystud-container-search-panel="' + escapeHtml(groupingdata.id) + '" hidden>' +
            '<div class="local-groupimport-easystud-container-search__row">' +
                '<label class="local-groupimport-easystud__search-field local-groupimport-easystud-container-search__field" aria-label="' + escapeHtml(labels.searchgroupslabel || '') + '">' +
                    '<span class="fa fa-search" aria-hidden="true"></span>' +
                    '<input type="search" class="form-control" placeholder="' + escapeHtml(labels.searchgroupsplaceholder || '') + '" data-easystud-container-group-search="' + escapeHtml(groupingdata.id) + '">' +
                '</label>' +
                '<button type="button" class="easyedu-button easyedu-button--secondary" data-easystud-container-search-cancel="' + escapeHtml(groupingdata.id) + '">' + escapeHtml(labels.cancel || '') + '</button>' +
            '</div>' +
        '</div>' +
        '<div class="local-groupimport-easystud-group-email" data-easystud-grouping-groups-panel="' + escapeHtml(groupingdata.id) + '" hidden>' +
            '<textarea class="form-control form-control-sm" rows="3" placeholder="' + escapeHtml(labels.pastegroupsplaceholder || '') + '" data-easystud-grouping-groups-box="' + escapeHtml(groupingdata.id) + '"></textarea>' +
            '<div class="local-groupimport-easystud-inline-actions">' +
                '<button type="button" class="btn btn-sm btn-outline-primary" data-easystud-add-grouping-groups="' + escapeHtml(groupingdata.id) + '">' +
                    '<span class="fa fa-plus" aria-hidden="true"></span><span>' + escapeHtml(labels.addgroups || '') + '</span>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-cancel-grouping-groups="1">' + escapeHtml(labels.cancel || '') + '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-group-email__result" data-easystud-grouping-groups-result="' + escapeHtml(groupingdata.id) + '" aria-live="polite"></div>' +
        '</div>' +
        '<div class="local-groupimport-easystud-tree__children local-groupimport-easystud-grouping__groups" data-easystud-container-group-list="' + escapeHtml(groupingdata.id) + '" hidden><div class="local-groupimport-easystud-tree__empty">' +
            escapeHtml(labels.nogroupsingrouping || '') + '</div></div>' +
        '<button type="button" class="local-groupimport-easystud-group__members-toggle local-groupimport-easystud-grouping__groups-toggle" data-easystud-grouping-groups-toggle="' + escapeHtml(groupingdata.id) + '" hidden>' +
            '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
        '</button>';

    const name = section.querySelector('.local-groupimport-easystud-grouping__name');
    const input = section.querySelector('input[name="name"]');
    if (name) {
        name.textContent = groupingdata.name || '';
    }
    if (input) {
        input.value = groupingdata.rawname || groupingdata.name || '';
    }
    updateGroupingBadge(section);
    return section;
};

export const createIconActionButton = (className, actionAttribute, actionValue, label, icon) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-link p-0 ' + className;
    button.setAttribute(actionAttribute, actionValue);
    button.setAttribute('aria-label', label || '');
    button.setAttribute('data-easystud-hover-help', label || '');
    button.innerHTML = '<span class="fa ' + escapeHtml(icon) + '" aria-hidden="true"></span>';
    return button;
};

export const ensureDuplicateButtons = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
        const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-duplicate-group]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__duplicate-button',
            'data-easystud-duplicate-group',
            group.getAttribute('data-easystud-group-id') || '',
            labels.duplicate || '',
            'fa-copy'
        );
        header.insertBefore(button, rename);
    });

    root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
        const header = grouping.querySelector(':scope > .local-groupimport-easystud-grouping__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-duplicate-grouping]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__duplicate-button local-groupimport-easystud-grouping__duplicate-button',
            'data-easystud-duplicate-grouping',
            grouping.getAttribute('data-easystud-grouping-id') || '',
            labels.duplicate || '',
            'fa-copy'
        );
        header.insertBefore(button, rename);
    });
};

export const ensureAdvancedSettingsButtons = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-group-id][data-easystud-advanced-type="group"]').forEach(group => {
        const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-open-advanced-settings]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__settings-button',
            'data-easystud-open-advanced-settings',
            group.getAttribute('data-easystud-group-id') || '',
            labels.advancedsettings || '',
            'fa-cog'
        );
        button.setAttribute('data-easystud-advanced-target', 'group');
        header.insertBefore(button, rename);
    });

    root.querySelectorAll('[data-easystud-grouping-id][data-easystud-advanced-type="grouping"]').forEach(grouping => {
        const header = grouping.querySelector(':scope > .local-groupimport-easystud-grouping__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-open-advanced-settings]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__settings-button local-groupimport-easystud-grouping__settings-button',
            'data-easystud-open-advanced-settings',
            grouping.getAttribute('data-easystud-grouping-id') || '',
            labels.advancedsettings || '',
            'fa-cog'
        );
        button.setAttribute('data-easystud-advanced-target', 'grouping');
        header.insertBefore(button, rename);
    });
};

export const animateTreeChildren = (children, expand, options = {}) => {
    if (!children) {
        return;
    }
    const root = children.closest('#local-groupimport-easystud');
    requestGuideHighlightRefresh(root);

    children.classList.add('is-tree-animating');
    const complete = () => {
        if (expand && options.syncAfter !== false) {
            if (children.classList.contains('local-groupimport-easystud-grouping__groups')) {
                window.requestAnimationFrame(() => {
                    syncGroupingGroupsCollapsible(children.closest('[data-easystud-grouping-id]'));
                    syncGroupMembersInContainer(children);
                });
            }
        }
        children.classList.remove('is-tree-animating');
        requestGuideHighlightRefresh(root);
        options.onComplete?.();
    };

    if (options.animate === false) {
        children.hidden = !expand;
        complete();
        return Promise.resolve(true);
    }

    if (expand) {
        Motion.expand(children, {
            duration: Motion.timing.slow,
            prepare: () => {
                if (options.prepare === false) {
                    return;
                }
                syncGroupMembersInContainer(children);
                if (children.classList.contains('local-groupimport-easystud-tree__children')) {
                    syncGroupingGroupsCollapsible(children.closest('[data-easystud-grouping-id]'));
                }
            },
            onComplete: complete,
        });
    } else {
        Motion.collapse(children, {duration: Motion.timing.slow, onComplete: complete});
    }
};

export const ensureGroupEmailPanel = (group, groupid, labels) => {
    if (!group || !groupid) {
        return null;
    }

    let panel = group.querySelector('[data-easystud-group-email-panel="' + groupid + '"]');
    if (panel) {
        return panel;
    }

    panel = document.createElement('div');
    panel.className = 'local-groupimport-easystud-group-email';
    panel.setAttribute('data-easystud-group-email-panel', groupid);
    panel.hidden = true;
    panel.innerHTML =
        '<textarea class="form-control form-control-sm" rows="3" placeholder="' +
            escapeHtml(labels.pasteemailsplaceholder || '') + '" data-easystud-group-email-box="' +
                escapeHtml(groupid) + '"></textarea>' +
        '<div class="local-groupimport-easystud-inline-actions">' +
            '<button type="button" class="btn btn-sm btn-primary" data-easystud-add-group-emails="' + escapeHtml(groupid) + '">' +
                '<span class="fa fa-plus" aria-hidden="true"></span><span>' + escapeHtml(labels.addemails || '') + '</span>' +
            '</button>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-cancel-group-email="1">' +
                escapeHtml(labels.cancel || '') +
            '</button>' +
        '</div>' +
        '<div class="local-groupimport-easystud-group-email__result" data-easystud-group-email-result="' +
            escapeHtml(groupid) + '" aria-live="polite"></div>';
    group.appendChild(panel);
    return panel;
};

export const ensureInlinePanelCancelButtons = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-group-email-panel]').forEach(panel => {
        if (panel.querySelector('[data-easystud-cancel-group-email]')) {
            return;
        }
        const add = panel.querySelector('[data-easystud-add-group-emails]');
        if (!add) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'local-groupimport-easystud-inline-actions';
        add.parentNode.insertBefore(wrapper, add);
        wrapper.appendChild(add);
        add.classList.remove('mt-2');
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-sm btn-outline-secondary';
        cancel.setAttribute('data-easystud-cancel-group-email', '1');
        cancel.textContent = labels.cancel || '';
        wrapper.appendChild(cancel);
    });

    root.querySelectorAll('[data-easystud-grouping-groups-panel]').forEach(panel => {
        if (panel.querySelector('[data-easystud-cancel-grouping-groups]')) {
            return;
        }
        const add = panel.querySelector('[data-easystud-add-grouping-groups]');
        if (!add) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'local-groupimport-easystud-inline-actions';
        add.parentNode.insertBefore(wrapper, add);
        wrapper.appendChild(add);
        add.classList.remove('mt-2');
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-sm btn-outline-secondary';
        cancel.setAttribute('data-easystud-cancel-grouping-groups', '1');
        cancel.textContent = labels.cancel || '';
        wrapper.appendChild(cancel);
    });
};
