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
import {normalise} from './index';

const templateName = 'local_groupimport/sm/group_card';

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
 * @param {Object} variant {structureemail, treecard, withingrouping}.
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
        membercountlabel: (strings.memberscount || '').replace('__count__', String(memberids.length)),
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
        members,
        hasmembers: memberids.length > 0,
        nomemberslabel: strings.nomemberslabel || '',
        searchtext: (variant.treecard ? model.groupTreeSearch : model.groupSearch).get(group.id) || '',
        selectionmodelabel: (model.strings || {}).selectionmodelabel || '',
        structureemail: !!variant.structureemail,
        treecard: !!variant.treecard,
    };
};

/**
 * Group card markup.
 *
 * @param {Object} model Participant model.
 * @param {Number} groupid Group id.
 * @param {String} key Catalog key: participants or structure.
 * @returns {String}
 */
export const renderGroupCardHtml = (model, groupid, key) => {
    const group = model.groups.get(groupid);
    return group ?
        Mustache.render(model.groupSource, buildGroupCardContext(model, group, {structureemail: key === 'structure'})) : '';
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
export const filterGroupIds = (model, filters) => {
    const selected = filters.groupings || [];
    return model.raw.groups.filter(group => {
        const groupingids = (group.groupingids || []).map(String);
        const hasnogrouping = groupingids.length === 0;
        const matchesgrouping = !selected.length || selected.some(value => value === '__none__' ?
            hasnogrouping : groupingids.indexOf(value) !== -1);
        if (!matchesgrouping || (filters.onlyungrouped && !hasnogrouping)) {
            return false;
        }
        return !filters.query || (model.groupSearch.get(group.id) || '').indexOf(filters.query) !== -1;
    }).map(group => group.id);
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
    holder.innerHTML = pageIds.map(id => renderGroupCardHtml(model, id, key)).join('');
    const cards = Array.from(holder.children);
    cards.forEach(card => card.setAttribute('data-easystud-sm-catalog', key));
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
    const variant = {treecard: true, withingrouping: key !== 'ungrouped'};
    const holder = document.createElement('div');
    holder.innerHTML = getTreeSectionGroupIds(model, key).map(groupid =>
        Mustache.render(model.groupSource, buildGroupCardContext(model, model.groups.get(groupid), variant))).join('');
    const cards = Array.from(holder.children);
    const fragment = document.createDocumentFragment();
    cards.forEach(card => fragment.appendChild(card));
    container.insertBefore(fragment, container.firstChild);
    return cards;
};
