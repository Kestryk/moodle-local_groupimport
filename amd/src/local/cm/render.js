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
 * EasyStud course manager: on-demand rendering of the group catalogs (SM-RENDU).
 *
 * @module     local_groupimport/local/cm/render
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {filterGroupIds, sortGroupIds, renderGroupPage} from '../sm/groups';
import {structureFocusClass, participantFocusClass} from './shared';
import {getOnDemandModel} from './state';
import {syncResponsiveDragAvailability} from './drag_support';
import {
    normaliseGroupGroupingTags, scheduleGroupGroupingOverflow, getGroupMemberCount, catalogKeyOf,
    syncGroupCardSelection,
} from './cards';
import {updateSelectionAvailability} from './selection';
import {
    withBatchedMemberHeights, ensureNestedGroupActionMenus, applyGroupMemberSearchToGroup,
    normaliseMemberRemoveLabels, setCountBadgeState, ensureDuplicateButtons, ensureAdvancedSettingsButtons,
    ensureInlinePanelCancelButtons, syncGroupMembersCollapsible,
} from './group_cards';
import {getInputQuery, getStructureGroupSearchQuery} from './filters';
import {animateListArrival, listPageChanged, resetListPage} from './transitions';

/**
 * Filter both group catalogs from their controls (grouping filter, "only ungrouped", search).
 *
 * @param {HTMLElement} root EasyStud root.
 */
export const applyOnDemandCatalogFilters = root => {
    const model = getOnDemandModel(root);
    ['participants', 'structure'].forEach(key => {
        const filter = root.querySelector('[data-easystud-catalog-grouping-filter="' + key + '"]');
        const toggle = root.querySelector('[data-easystud-catalog-show-ungrouped="' + key + '"]');
        let query = getStructureGroupSearchQuery(root);
        if (key === 'participants') {
            query = root.classList.contains(participantFocusClass) ?
                getInputQuery(root, '[data-easystud-catalog-search="participants"]') : '';
        }
        model.catalogs[key].filteredIds = filterGroupIds(model, {
            groupings: filter ? Array.from(filter.selectedOptions).map(option => option.value).filter(Boolean) : [],
            onlyungrouped: toggle ? toggle.checked : false,
            query,
        });
    });
};

/**
 * Remember the state a user gives to the group cards of a list, before the list is redrawn:
 * unfolded members and open member searches.
 *
 * The legacy page keeps every card, so this state survives an action or a page change; the
 * on-demand lists redraw their cards and restore it from this memory.
 *
 * @param {HTMLElement} container List or tree section holding group cards.
 * @returns {Object} {unfolded: Set, searches: Map}, keyed by group id (string).
 */
export const rememberGroupCardStates = container => {
    const memory = container.easystudSmCardStates || {unfolded: new Set(), searches: new Map(), limits: new Map()};
    container.querySelectorAll(':scope > [data-easystud-group-id], :scope > * > [data-easystud-group-id]').forEach(card => {
        const groupid = card.getAttribute('data-easystud-group-id');
        memory.limits.set(groupid, card.easystudMemberLimit || 8);
        const toggle = card.querySelector('[data-easystud-group-members-toggle]');
        if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
            memory.unfolded.add(groupid);
        } else {
            memory.unfolded.delete(groupid);
        }
        const panel = card.querySelector(':scope > [data-easystud-group-member-search-panel]');
        const input = panel ? panel.querySelector('[data-easystud-group-member-search]') : null;
        if (panel && !panel.hidden && panel.classList.contains('is-open')) {
            memory.searches.set(groupid, input ? input.value : '');
        } else {
            memory.searches.delete(groupid);
        }
    });
    container.easystudSmCardStates = memory;
    return memory;
};

/**
 * Give redrawn (and decorated) group cards back their remembered state, without motion.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement[]} cards New group cards.
 * @param {Object} memory From rememberGroupCardStates.
 */
export const restoreGroupCardStates = (root, cards, memory) => withBatchedMemberHeights(() => {
    cards.forEach(card => {
        const groupid = card.getAttribute('data-easystud-group-id');
        card.easystudMemberLimit = memory.limits.get(groupid) || 8;
        card.easystudMemberQuery = memory.searches.get(groupid) || '';
        const unfolded = memory.unfolded.has(groupid);
        const searching = memory.searches.has(groupid);
        if (!unfolded && !searching) {
            syncGroupMembersCollapsible(card);
            return;
        }
        const toggle = card.querySelector('[data-easystud-group-members-toggle]');
        if (toggle && unfolded) {
            toggle.setAttribute('aria-expanded', 'true');
        }
        const panel = card.querySelector(':scope > [data-easystud-group-member-search-panel]');
        if (panel && searching) {
            const input = panel.querySelector('[data-easystud-group-member-search]');
            if (input) {
                input.value = memory.searches.get(groupid);
            }
            panel.hidden = false;
            panel.classList.add('is-open');
            const searchtoggle = card.querySelector('[data-easystud-group-member-search-toggle]');
            if (searchtoggle) {
                searchtoggle.classList.add('is-active');
            }
        }
        applyGroupMemberSearchToGroup(root, card);
    });
});

/**
 * Whether a group catalog is on screen, mirroring the stylesheet: the participants catalog
 * in the participant focus, the structure catalog in the structure focus or the mobile
 * Groups view.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {String} key Catalog key.
 * @returns {Boolean}
 */
const isCatalogShown = (root, key) => {
    if (key === 'participants') {
        return root.classList.contains(participantFocusClass);
    }
    return root.classList.contains(structureFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'groups';
};

/**
 * Render the current page of an on-demand group catalog.
 *
 * A hidden catalog keeps no cards: it renders when its view opens, since every view switch
 * runs the pagination again.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} list Catalog list.
 * @param {Object} config Pagination config (page size).
 * @returns {{total: Number, pages: Number, page: Number}}
 */
export const renderOnDemandCatalogPage = (root, list, config) => {
    const model = getOnDemandModel(root);
    const key = catalogKeyOf(list);
    const catalog = model.catalogs[key];
    const ordered = sortGroupIds(model, catalog.filteredIds, list.getAttribute('data-easystud-sort') || 'alpha');
    const pages = Math.ceil(ordered.length / config.limit);
    let page = parseInt(list.getAttribute('data-easystud-page') || '0', 10);
    if (Number.isNaN(page) || page < 0) {
        page = 0;
    }
    page = Math.min(page, Math.max(pages - 1, 0));
    list.setAttribute('data-easystud-page', page);

    if (!isCatalogShown(root, key)) {
        if (list.easystudSmRenderedKey !== null) {
            rememberGroupCardStates(list);
            renderGroupPage(model, list, key, []);
            catalog.pageCards = new Map();
            list.easystudSmRenderedKey = null;
            resetListPage(list);
        }
        return {total: ordered.length, pages, page};
    }
    const pageIds = ordered.slice(page * config.limit, (page + 1) * config.limit);
    const renderkey = model.revision + '|' + pageIds.join(',');
    if (list.easystudSmRenderedKey !== renderkey) {
        const memory = rememberGroupCardStates(list);
        const arrived = listPageChanged(list, pageIds);
        const cards = renderGroupPage(model, list, key, pageIds);
        catalog.pageCards = new Map(cards.map(card =>
            [Number(card.getAttribute('data-easystud-group-id')), syncGroupCardSelection(model, card)]));
        list.easystudSmRenderedKey = renderkey;
        decorateOnDemandGroupCards(root, cards);
        restoreGroupCardStates(root, cards, memory);
        if (arrived) {
            animateListArrival(cards);
        }
    }
    return {total: ordered.length, pages, page};
};

/**
 * Give freshly rendered catalog cards what the legacy page adds at start-up.
 *
 * Heavy advanced-settings attributes are copied from the group tree, which still renders
 * every group until step 3c.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement[]} cards New group cards.
 */
export const decorateOnDemandGroupCards = (root, cards) => {
    // Same order as the start-up bindings, so the cards end up with the same markup.
    cards.forEach(card => {
        const groupid = card.getAttribute('data-easystud-group-id');
        const source = root.querySelector('[data-easystud-tree] [data-easystud-group-id="' + groupid + '"]');
        if (source) {
            ['data-easystud-advanced-description', 'data-easystud-advanced-raw-description'].forEach(name => {
                card.setAttribute(name, source.getAttribute(name) || '');
            });
        }
    });
    ensureInlinePanelCancelButtons(root);
    ensureDuplicateButtons(root);
    ensureAdvancedSettingsButtons(root);
    cards.forEach(card => card.querySelectorAll('.local-groupimport-easystud-group__groupings--inline')
        .forEach(container => normaliseGroupGroupingTags(root, container)));
    ensureNestedGroupActionMenus(root, cards);
    if (root.easystudObserveCardHeaders) {
        root.easystudObserveCardHeaders(cards);
    }
    withBatchedMemberHeights(() => cards.forEach(card => {
        applyGroupMemberSearchToGroup(root, card);
        setCountBadgeState(card.querySelector('.local-groupimport-easystud-group__header .badge'),
            getGroupMemberCount(card), 'members');
        card.querySelectorAll('[data-easystud-hover-help][title]').forEach(node => {
            node.setAttribute('data-easystud-native-title', node.getAttribute('title') || '');
            node.removeAttribute('title');
        });
    }));
    normaliseMemberRemoveLabels(root);
    syncResponsiveDragAvailability(root);
    updateSelectionAvailability(root);
    scheduleGroupGroupingOverflow(root);
};
