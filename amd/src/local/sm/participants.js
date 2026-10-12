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
 * On-demand participant cards (SM-RENDU step 2b).
 *
 * Builds, from the compact state, the same template context manage.php builds for the
 * legacy page, and renders local_groupimport/sm/participant_card synchronously (the
 * template source is loaded once), so legacy callers that expect a card right after a
 * page change keep working.
 *
 * Participants selected on another page have no card in the document: a detached copy
 * (same template) stands in for them, so code reading data-user-* attributes of the
 * selection still works.
 *
 * @module     local_groupimport/local/sm/participants
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Mustache from 'core/mustache';
import Loader from 'core/local/templates/loader';
import {buildParticipantIndex, filterParticipantIds, normalise} from './index';
import {refreshGroupIndex} from './groups';

const templateName = 'local_groupimport/sm/participant_card';
const tokenClass = 'local-groupimport-easystud-token';

/**
 * Escape text for an HTML attribute or text node.
 *
 * @param {String} value Value.
 * @returns {String}
 */
const escapeHtml = value => String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/**
 * Same structure as local_groupimport_build_meta_tags_template_data() in manage.php.
 *
 * @param {String} label Group label.
 * @param {String[]} items Token labels.
 * @param {String} cls Token classes.
 * @param {String} empty Empty token label.
 * @param {String} showless Show less label.
 * @returns {Object}
 */
const buildMetaTags = (label, items, cls, empty, showless) => {
    const visiblemax = 3;
    const tokens = items.length ? items.map((item, index) => ({
        label: item,
        'class': cls,
        hidden: index >= visiblemax,
        extra: index >= visiblemax,
    })) : [{label: empty, 'class': cls + ' ' + tokenClass + '--empty', hidden: false}];
    return {label, tokens, hasmore: items.length > visiblemax, showless};
};

/**
 * Moodle's initials avatar (core_renderer::render_user_picture, identical in 4.5 and 5.1).
 *
 * @param {Object} user State user.
 * @returns {String}
 */
const buildAvatar = user => {
    if (user.avatarhtml) {
        return user.avatarhtml;
    }
    const name = escapeHtml(user.avatarname || user.fullname);
    return '<span class="userinitials size-100" title="' + name + '" aria-label="' + name + '" role="img">' +
        escapeHtml(user.initials || '') + '</span>';
};

/**
 * Create the participant list model attached to the store.
 *
 * @param {Object} raw Compact state.
 * @param {Object} strings Card labels from manage.php.
 * @returns {Promise<Object>} Model.
 */
export const createParticipantModel = (raw, strings) => Loader.getTemplate(templateName).then(source => {
    const model = {
        raw,
        strings: strings || {},
        source,
        index: null,
        byId: new Map(),
        groups: new Map(),
        groupings: new Map(),
        roles: new Map(),
        filteredIds: raw.users.map(user => user.id),
        selected: new Set(),
        detached: new Map(),
        pageCards: new Map(),
    };
    Mustache.parse(source);
    refreshModel(model);
    return model;
});

/**
 * Rebuild lookups and the search index after the state changed.
 *
 * @param {Object} model Participant model.
 */
export const refreshModel = model => {
    const raw = model.raw;
    model.byId = new Map(raw.users.map(user => [user.id, user]));
    model.groups = new Map(raw.groups.map(group => [group.id, group]));
    model.groupings = new Map(raw.groupings.map(grouping => [grouping.id, grouping]));
    model.roles = new Map(raw.roles.map(role => [role.id, role.name]));
    model.index = buildParticipantIndex(raw);
    model.indexById = new Map(model.index.map(entry => [entry.id, entry]));
    model.detached.clear();
    refreshGroupIndex(model);
    // Lets the lists skip re-rendering an unchanged page.
    model.revision = (model.revision || 0) + 1;
};

/**
 * Template context of one card, as manage.php builds it for the legacy page.
 *
 * @param {Object} model Participant model.
 * @param {Object} user State user.
 * @returns {Object}
 */
export const buildCardContext = (model, user) => {
    const strings = model.strings;
    const meta = model.raw.meta;
    const entry = model.indexById.get(user.id);
    const roles = (user.roleids || []).map(roleid => model.roles.get(roleid) || '');
    const groups = (user.groupids || []).map(groupid => (model.groups.get(groupid) || {}).name || '');
    const groupingids = entry ? entry.groupingids.map(Number) : [];
    const groupings = groupingids.map(groupingid => (model.groupings.get(groupingid) || {}).name || '');
    const display = user.display || {};
    const primary = meta.display && meta.display.primary;
    const copyfields = (meta.identifierfields || []).map(field => ({
        key: field.key,
        label: field.label,
        value: (user.identifiers || {})[field.key] || '',
    }));

    return {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        selectionmodelabel: strings.selectionmodelabel || '',
        profileimage: buildAvatar(user),
        primarybadge: primary && display[primary.key] ? {
            label: primary.label,
            value: display[primary.key],
            style: '--local-groupimport-participant-badge-bg: ' + primary.bgcolor +
                '; --local-groupimport-participant-badge-color: ' + primary.textcolor + ';',
        } : null,
        usercopyfieldsjson: JSON.stringify(copyfields),
        searchtext: entry ? entry.text : '',
        roletext: normalise(roles.join('|')),
        groupidscsv: (user.groupids || []).join(','),
        groupingidscsv: groupingids.join(','),
        rolesmeta: buildMetaTags(strings.roleslabel || '', roles, tokenClass + ' ' + tokenClass + '--role',
            strings.norole || '', strings.showless || ''),
        groupsmeta: buildMetaTags(strings.groupslabel || '', groups, tokenClass + ' ' + tokenClass + '--group',
            strings.nogroup || '', strings.showless || ''),
        groupingsmeta: buildMetaTags(strings.groupingslabel || '', groupings, tokenClass + ' ' + tokenClass + '--grouping',
            strings.nogrouping || '', strings.showless || ''),
        customfieldsmeta: ((meta.display && meta.display.details) || []).filter(field => display[field.key])
            .map(field => buildMetaTags(field.label, [display[field.key]],
                tokenClass + ' ' + tokenClass + '--custom-info', '', strings.showless || '')),
        viewdetailslabel: strings.viewdetailslabel || '',
        // Light detail payload for the participant modal; heavy fields come from get_details.
        userdetailjson: JSON.stringify({
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            profileimage: buildAvatar(user),
            profileurl: M.cfg.wwwroot + '/user/profile.php?id=' + user.id + '&course=' + meta.courseid,
            username: (user.identifiers || {}).username || '',
            idnumber: (user.identifiers || {}).idnumber || '',
            roles,
            groups,
            groupids: user.groupids || [],
            groupings,
            groupingids,
            copyfields,
            detailsdeferred: true,
        }),
    };
};

/**
 * Card markup for one participant.
 *
 * @param {Object} model Participant model.
 * @param {Number} userid User id.
 * @returns {String}
 */
export const renderCardHtml = (model, userid) => {
    const user = model.byId.get(userid);
    return user ? Mustache.render(model.source, buildCardContext(model, user)) : '';
};

/**
 * A detached card for a participant who is not on the current page.
 *
 * @param {Object} model Participant model.
 * @param {Number} userid User id.
 * @returns {HTMLElement|null}
 */
export const getDetachedCard = (model, userid) => {
    if (!model.detached.has(userid)) {
        const holder = document.createElement('div');
        holder.innerHTML = renderCardHtml(model, userid);
        model.detached.set(userid, holder.firstElementChild);
    }
    return model.detached.get(userid) || null;
};

/**
 * Filter the participants (same semantics as the legacy applyFilters).
 *
 * @param {Object} model Participant model.
 * @param {Object} filters {query, roles, groups, groupings}.
 * @returns {Number[]}
 */
export const applyParticipantFilters = (model, filters) => {
    model.filteredIds = filterParticipantIds(model.index, filters);
    return model.filteredIds;
};

/**
 * Sort ids like the legacy sortListItems(): optional group count, then name with localeCompare.
 *
 * @param {Object} model Participant model.
 * @param {Number[]} ids Ids in state order.
 * @param {String} mode alpha, filled or empty.
 * @returns {Number[]}
 */
export const sortParticipantIds = (model, ids, mode) => {
    const keyed = ids.map(id => {
        const user = model.byId.get(id) || {};
        return {id, name: normalise(user.fullname), count: (user.groupids || []).length};
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
 * Replace the participant cards of the list by the given page.
 *
 * Pagination navs, empty states and other managed children are kept in place.
 *
 * @param {Object} model Participant model.
 * @param {HTMLElement} list Participant list.
 * @param {Number[]} pageIds Ids of the page, in display order.
 * @returns {HTMLElement[]} Rendered cards.
 */
export const renderParticipantPage = (model, list, pageIds) => {
    list.querySelectorAll(':scope > [data-easystud-user], :scope > [data-easystud-sm-loading]').forEach(node => node.remove());
    const holder = document.createElement('div');
    holder.innerHTML = pageIds.map(id => renderCardHtml(model, id)).join('');
    const cards = Array.from(holder.children);
    const top = list.querySelector(':scope > [data-easystud-pagination="top"]');
    const anchor = top ? top.nextSibling : list.firstChild;
    const fragment = document.createDocumentFragment();
    cards.forEach(card => fragment.appendChild(card));
    list.insertBefore(fragment, anchor);
    return cards;
};
