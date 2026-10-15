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
 * On-demand group cards of the flat catalogs (SM-RENDU step 3b).
 *
 * Builds, from the compact state, the same template context manage.php builds for the
 * Participants and Structure group catalogs (local_groupimport_build_group_catalog_template_data),
 * and renders local_groupimport/sm/group_card synchronously.
 *
 * @module     local_groupimport/local/sm/groups
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Mustache from 'core/mustache';
import Loader from 'core/local/templates/loader';
import {countLabel} from './index';
import {normalise, filterEntryIds, elementSearchText} from './filter_engine';

const templateName = 'local_groupimport/sm/group_card';

/**
 * Member rows a page or tree card renders at first: the folded card shows two rows, the
 * others are added when the card unfolds (lever 2).
 */
export const LEAN_MEMBER_ROWS = 2;

/**
 * Load the group card template once and attach it to the participant model.
 *
 * @param {Object} model Participant model (shared on-demand model).
 * @param {Object} strings Group card labels from manage.php.
 * @returns {Promise<Object>} The model.
 */
export const attachGroupCatalogs = (model, strings) => Loader.getTemplate(templateName).then(source => {
    Mustache.parse(source);
    model.groupSource = source;
    model.groupStrings = strings || {};
    model.selectedGroups = new Map();
    // Member rows selected in catalog cards: 'groupid:userid' => catalog key.
    model.selectedMembers = new Map();
    model.catalogs = {
        participants: {filteredIds: [], pageCards: new Map(), detached: new Map()},
        structure: {filteredIds: [], pageCards: new Map(), detached: new Map()},
    };
    refreshGroupIndex(model);
    return model;
});

/**
 * Rebuild the group search texts after the state changed (called with refreshModel).
 *
 * Same text as manage.php: name, grouping names (group order), member names and e-mails,
 * then the catalog's grouping names (grouping order), lowercased.
 *
 * @param {Object} model Participant model.
 */
export const refreshGroupIndex = model => {
    if (!model.catalogs) {
        return;
    }
    const raw = model.raw;
    const catalogGroupingNames = new Map();
    raw.groupings.forEach(grouping => (grouping.groupids || []).forEach(groupid => {
        if (!catalogGroupingNames.has(groupid)) {
            catalogGroupingNames.set(groupid, []);
        }
        catalogGroupingNames.get(groupid).push(grouping.name);
    }));
    model.groupCatalogNames = catalogGroupingNames;
    model.groupTreeSearch = new Map();
    model.groupSearch = new Map(raw.groups.map(group => {
        const parts = [group.name];
        (group.groupingids || []).forEach(groupingid => {
            const grouping = model.groupings.get(groupingid);
            if (grouping) {
                parts.push(grouping.name);
            }
        });
        (group.memberids || []).forEach(userid => {
            const user = model.byId.get(userid);
            if (user) {
                parts.push(user.fullname, user.email || '');
            }
        });
        const text = normalise(parts.join(' ').trim());
        model.groupTreeSearch.set(group.id, text);
        return [group.id, normalise((text + ' ' + (catalogGroupingNames.get(group.id) || []).join(' ')).trim())];
    }));
    // Catalog filter entries (filter_engine): catalog search text and grouping ids, in state order.
    model.groupEntries = raw.groups.map(group => ({
        id: group.id,
        text: model.groupSearch.get(group.id),
        groupingids: (group.groupingids || []).map(String),
    }));
    Object.values(model.catalogs).forEach(catalog => catalog.detached.clear());
};

/**
 * Search text of a grouping section, as manage.php builds it: its name and the tree search
 * text of each of its groups.
 *
 * @param {Object} model Participant model.
 * @param {Object} grouping State grouping.
 * @returns {String}
 */
export const groupingSearchText = (model, grouping) => {
    const parts = [grouping.name];
    (grouping.groupids || []).forEach(groupid => {
        if (model.groups.has(groupid)) {
            parts.push(model.groupTreeSearch.get(groupid) || '');
        }
    });
    return normalise(parts.join(' ').trim());
};

/**
 * Template context of one group card, as manage.php builds it.
 *
 * @param {Object} model Participant model.
 * @param {Object} group State group.
 * @param {Object} variant {structureemail, treecard, withingrouping, memberlimit}.
 * @returns {Object}
 */
export const buildGroupCardContext = (model, group, variant) => {
    const strings = model.groupStrings;
    const memberids = group.memberids || [];
    const groupingids = group.groupingids || [];
    const members = memberids.filter(userid => model.byId.has(userid)).map(userid => {
        const user = model.byId.get(userid);
        return {
            groupid: group.id,
            userid,
            fullname: user.fullname,
            email: user.email || '',
            removeuserlabel: (strings.removeuserfromgroup || '').replace('__name__', user.fullname),
            selectableid: group.id + ':' + userid,
        };
    });
    return {
        id: group.id,
        name: group.name,
        rawname: group.rawname,
        // Heavy fields stay out of the state; the caller copies them from the rendered group tree.
        description: '',
        rawdescription: '',
        idnumber: group.idnumber || '',
        enrolmentkey: group.enrolmentkey ? '1' : '0',
        picture: group.pictureurl || '',
        hidepicture: group.hidepicture ? '1' : '0',
        nativeurl: (strings.groupnativeurl || '') + '&id=' + group.id,
        membercountlabel: countLabel(strings.memberscount, memberids.length),
        sesskey: strings.sesskey || '',
        renameurl: strings.renameurl || '',
        renameaction: 'renamegroup',
        renameidname: 'groupid',
        renamelabel: strings.renamelabel || '',
        savelabel: strings.savelabel || '',
        cancellabel: strings.cancellabel || '',
        addemailstolabel: strings.addemailstolabel || '',
        pasteemailsplaceholder: strings.pasteemailsplaceholder || '',
        addemailsbutton: strings.addemailsbutton || '',
        withingrouping: !!variant.withingrouping,
        groupingidscsv: groupingids.join(','),
        hasnogrouping: groupingids.length === 0,
        // Catalog cards list their groupings in grouping order, tree cards in group order.
        groupingtags: (variant.treecard ? groupingids.filter(groupingid => model.groupings.has(groupingid))
            .map(groupingid => model.groupings.get(groupingid).name) :
            (model.groupCatalogNames.get(group.id) || [])).map(label => ({label})),
        removefromgroupinglabel: strings.removefromgroupinglabel || '',
        members: variant.memberlimit ? members.slice(0, variant.memberlimit) : members,
        hasmembers: memberids.length > 0,
        nomemberslabel: strings.nomemberslabel || '',
        nomembershelplabel: strings.nomembershelplabel || '',
        // R10-05: member "Select all" from three members (the total, not the rendered rows).
        canselectallmembers: members.length > 2,
        selectallmemberslabel: strings.selectallmembers || '',
        deselectallmemberslabel: strings.deselectallmembers || '',
        selectallmembersoflabel: (strings.selectallmembersof || '').replace('__name__', group.name),
        selectallmembersoftemplate: strings.selectallmembersof || '',
        deselectallmembersoftemplate: strings.deselectallmembersof || '',
        searchtext: (variant.treecard ? model.groupTreeSearch : model.groupSearch).get(group.id) || '',
        selectionmodelabel: (model.strings || {}).selectionmodelabel || '',
        structureemail: !!variant.structureemail,
        treecard: !!variant.treecard,
    };
};

/**
 * Note on a freshly rendered card whose member rows are not all rendered how many it has
 * (see renderMissingMemberRows). Complete cards are counted from their rows.
 *
 * @param {Object} model Participant model.
 * @param {HTMLElement} card Group card.
 * @param {Number} memberlimit Member rows rendered, 0 for all.
 */
const markMemberRows = (model, card, memberlimit) => {
    const group = model.groups.get(Number(card.getAttribute('data-easystud-group-id')));
    const total = group ? (group.memberids || []).filter(userid => model.byId.has(userid)).length : 0;
    if (memberlimit && total > memberlimit) {
        card.setAttribute('data-easystud-member-total', total);
        card.setAttribute('data-easystud-sm-members-partial', '1');
    }
};

/**
 * Render the member rows a lean card does not have yet, at the end of its member list.
 *
 * @param {Object} model Participant model.
 * @param {HTMLElement} card Group card rendered with LEAN_MEMBER_ROWS rows.
 * @returns {HTMLElement[]} New member rows.
 */
export const renderMissingMemberRows = (model, card) => {
    card.removeAttribute('data-easystud-sm-members-partial');
    card.removeAttribute('data-easystud-member-total');
    const group = model.groups.get(Number(card.getAttribute('data-easystud-group-id')));
    const list = card.querySelector('[data-easystud-group-members]');
    if (!group || !list) {
        return [];
    }
    const variant = {
        structureemail: card.getAttribute('data-easystud-sm-catalog') === 'structure',
        treecard: !card.hasAttribute('data-easystud-sm-catalog'),
        withingrouping: !!card.querySelector('[data-easystud-remove-from-grouping]'),
    };
    const holder = document.createElement('div');
    holder.innerHTML = Mustache.render(model.groupSource, buildGroupCardContext(model, group, variant));
    const known = new Set(Array.from(list.querySelectorAll('[data-easystud-member-id]'))
        .map(row => row.getAttribute('data-easystud-member-id')));
    const rows = Array.from(holder.querySelectorAll('[data-easystud-group-members] [data-easystud-member-id]'))
        .filter(row => !known.has(row.getAttribute('data-easystud-member-id')));
    const fragment = document.createDocumentFragment();
    rows.forEach(row => fragment.appendChild(row));
    const empty = list.querySelector(':scope > .local-groupimport-easystud-tree__empty');
    list.insertBefore(fragment, empty);
    return rows;
};

/**
 * Group card markup.
 *
 * @param {Object} model Participant model.
 * @param {Number} groupid Group id.
 * @param {String} key Catalog key: participants or structure.
 * @param {Number} memberlimit Member rows to render, 0 for all.
 * @returns {String}
 */
export const renderGroupCardHtml = (model, groupid, key, memberlimit = 0) => {
    const group = model.groups.get(groupid);
    return group ? Mustache.render(model.groupSource,
        buildGroupCardContext(model, group, {structureemail: key === 'structure', memberlimit})) : '';
};

/**
 * A detached card for a group selected on another page of a catalog.
 *
 * @param {Object} model Participant model.
 * @param {Number} groupid Group id.
 * @param {String} key Catalog key.
 * @returns {HTMLElement|null}
 */
export const getDetachedGroupCard = (model, groupid, key) => {
    const detached = model.catalogs[key].detached;
    if (!detached.has(groupid)) {
        const holder = document.createElement('div');
        holder.innerHTML = renderGroupCardHtml(model, groupid, key);
        const card = holder.firstElementChild;
        if (card) {
            card.setAttribute('data-easystud-sm-catalog', key);
        }
        detached.set(groupid, card);
    }
    return detached.get(groupid) || null;
};

/**
 * Group ids of a catalog matching its filters (legacy syncCatalogFilters + applyCatalogSearch).
 *
 * @param {Object} model Participant model.
 * @param {Object} filters {groupings: String[] (ids or __none__), onlyungrouped: Boolean, query: String}
 * @returns {Number[]} Ids in state order.
 */
export const filterGroupIds = (model, filters) => filterEntryIds(model.groupEntries, filters);

/**
 * Search text of a tree group card: from the state, or from the card while the state does not
 * know the group yet (a card created before the state refresh).
 *
 * @param {Object|null} model Participant model, null while the state loads.
 * @param {HTMLElement} card Group card.
 * @returns {String}
 */
export const treeGroupSearchText = (model, card) => {
    const text = model && model.groupTreeSearch ?
        model.groupTreeSearch.get(Number(card.getAttribute('data-easystud-group-id'))) : undefined;
    return text === undefined ? elementSearchText(card) : text;
};

/**
 * Sort like the legacy sortListItems(): optional member count, then name with localeCompare.
 *
 * @param {Object} model Participant model.
 * @param {Number[]} ids Group ids.
 * @param {String} mode alpha, filled or empty.
 * @returns {Number[]}
 */
export const sortGroupIds = (model, ids, mode) => {
    const keyed = ids.map(id => {
        const group = model.groups.get(id) || {};
        return {
            id,
            name: normalise(group.name),
            count: (group.memberids || []).filter(userid => model.byId.has(userid)).length,
        };
    });
    keyed.sort((left, right) => {
        if ((mode === 'filled' || mode === 'empty') && left.count !== right.count) {
            return mode === 'filled' ? right.count - left.count : left.count - right.count;
        }
        return left.name.localeCompare(right.name);
    });
    return keyed.map(item => item.id);
};

/**
 * Replace the group cards of a catalog list by the given page.
 *
 * @param {Object} model Participant model.
 * @param {HTMLElement} list Catalog list.
 * @param {String} key Catalog key.
 * @param {Number[]} pageIds Ids of the page, in display order.
 * @returns {HTMLElement[]} Rendered cards.
 */
export const renderGroupPage = (model, list, key, pageIds) => {
    list.querySelectorAll(':scope > [data-easystud-group-id], :scope > [data-easystud-sm-loading]').forEach(node => node.remove());
    const holder = document.createElement('div');
    holder.innerHTML = pageIds.map(id => renderGroupCardHtml(model, id, key, LEAN_MEMBER_ROWS)).join('');
    const cards = Array.from(holder.children);
    cards.forEach(card => {
        card.setAttribute('data-easystud-sm-catalog', key);
        markMemberRows(model, card, LEAN_MEMBER_ROWS);
    });
    const top = list.querySelector(':scope > [data-easystud-pagination="top"]');
    const fragment = document.createDocumentFragment();
    cards.forEach(card => fragment.appendChild(card));
    list.insertBefore(fragment, top ? top.nextSibling : list.firstChild);
    return cards;
};

/**
 * Group ids of a tree section, in the legacy order: the grouping's groups, or the groups
 * without grouping.
 *
 * @param {Object} model Participant model.
 * @param {String} key Grouping id, or 'ungrouped'.
 * @returns {Number[]}
 */
export const getTreeSectionGroupIds = (model, key) => {
    if (key === 'ungrouped') {
        return model.raw.groups.filter(group => !(group.groupingids || []).length).map(group => group.id);
    }
    const grouping = model.groupings.get(Number(key));
    return grouping ? (grouping.groupids || []).filter(groupid => model.groups.has(groupid)) : [];
};

/**
 * Replace the group cards of a tree section container.
 *
 * @param {Object} model Participant model.
 * @param {HTMLElement} container Section children container.
 * @param {String} key Grouping id, or 'ungrouped'.
 * @returns {HTMLElement[]} Rendered cards.
 */
export const renderTreeSection = (model, container, key) => {
    container.querySelectorAll(':scope > [data-easystud-group-id], :scope > .local-groupimport-easystud-tree__empty' +
        ':not([data-easystud-container-filter-empty])').forEach(node => node.remove());
    const variant = {treecard: true, withingrouping: key !== 'ungrouped', memberlimit: LEAN_MEMBER_ROWS};
    const holder = document.createElement('div');
    holder.innerHTML = getTreeSectionGroupIds(model, key).map(groupid =>
        Mustache.render(model.groupSource, buildGroupCardContext(model, model.groups.get(groupid), variant))).join('');
    const cards = Array.from(holder.children);
    cards.forEach(card => markMemberRows(model, card, LEAN_MEMBER_ROWS));
    const fragment = document.createDocumentFragment();
    cards.forEach(card => fragment.appendChild(card));
    container.insertBefore(fragment, container.firstChild);
    return cards;
};
