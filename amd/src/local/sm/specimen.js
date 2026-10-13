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
 * Specimen cards for the Guide (card anatomy, demos): the real card templates of Student
 * Management, rendered from example data, without any page behaviour.
 *
 * Usage (labels come from manage.php, stored on the EasyStud root at start-up):
 *     renderParticipantSpecimen(root, {fullname: 'Alex Dupont', roles: ['Étudiant'], groups: ['TD 1']})
 *     renderGroupSpecimen(root, {name: 'TD 1', members: ['Alex Dupont', 'Sam Martin'], groupings: ['Projet']})
 * Both return a Promise of a detached card element. In the specimen, every data-easystud-*
 * attribute (and the ids the page uses: data-user-id, data-selectable-id, data-group-ids…) is
 * renamed data-specimen-*, so the page's delegated handlers and queries never treat it as a real
 * card, while data-specimen-* keeps stable hooks for anatomy markers. Ids, labels' for, names and
 * draggable are removed; the card is inert and hidden from assistive technologies by default.
 *
 * @module     local_groupimport/local/sm/specimen
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {createParticipantModel, renderCardHtml} from './participants';
import {attachGroupCatalogs, buildGroupCardContext} from './groups';
import Mustache from 'core/mustache';

// Attributes the page reads to find, select or act on a real card.
const renamed = ['data-user-id', 'data-selectable-id', 'data-group-ids', 'data-grouping-ids', 'data-member-key',
    'data-user-email', 'data-user-detail', 'data-user-copy-fields', 'data-search-text', 'data-role-text'];
const removed = ['id', 'for', 'name', 'draggable', 'tabindex'];

/**
 * Initials as the server computes them for a card without picture.
 *
 * @param {String} fullname Full name.
 * @returns {String}
 */
const initialsOf = fullname => String(fullname || '').trim().split(/\s+/u).slice(0, 2)
    .map(part => part.charAt(0).toUpperCase()).join('');

/**
 * Card labels stored by course_manager at start-up, or labels given directly.
 *
 * @param {HTMLElement|Object} source EasyStud root, or {cards, groups} labels.
 * @returns {{cards: Object, groups: Object}}
 */
const labelsOf = source => {
    const labels = (source && source.easystudCardStrings) || source || {};
    // The specimen never posts anything: no session key, no rename target.
    return {cards: labels.cards || {}, groups: Object.assign({}, labels.groups || {}, {sesskey: '', renameurl: ''})};
};

/**
 * A course state holding the example people, groups and groupings.
 *
 * @param {Object[]} people [{fullname, email, roles, groups}]
 * @param {Object[]} groups [{name, members, groupings}]
 * @returns {Object}
 */
const exampleState = (people, groups) => {
    const roleNames = [];
    const groupNames = [];
    const groupingNames = [];
    const idOf = (list, name) => {
        if (!list.includes(name)) {
            list.push(name);
        }
        return list.indexOf(name) + 1;
    };
    groups.forEach(group => {
        idOf(groupNames, group.name);
        (group.members || []).forEach(fullname => {
            if (!people.some(person => person.fullname === fullname)) {
                people.push({fullname});
            }
        });
    });
    const users = people.map((person, index) => ({
        id: index + 1,
        fullname: person.fullname,
        email: person.email || '',
        roleids: (person.roles || []).map(name => idOf(roleNames, name)),
        groupids: (person.groups || []).map(name => idOf(groupNames, name)),
        initials: initialsOf(person.fullname),
    }));
    const memberIds = name => users.filter(user => people[user.id - 1].groups &&
        people[user.id - 1].groups.includes(name)).map(user => user.id);
    const groupItems = groupNames.map((name, index) => {
        const example = groups.find(group => group.name === name) || {};
        const members = example.members ?
            example.members.map(fullname => users.find(user => user.fullname === fullname).id) : memberIds(name);
        return {
            id: index + 1,
            name,
            rawname: name,
            idnumber: '',
            memberids: members,
            groupingids: (example.groupings || []).map(grouping => idOf(groupingNames, grouping)),
            hasdescription: !!example.description,
            enrolmentkey: false,
            pictureurl: '',
            hidepicture: false,
        };
    });
    // A member listed by a group example belongs to that group on the participant side too.
    groupItems.forEach(group => group.memberids.forEach(userid => {
        const user = users[userid - 1];
        if (!user.groupids.includes(group.id)) {
            user.groupids.push(group.id);
        }
    }));
    return {
        users,
        groups: groupItems,
        groupings: groupingNames.map((name, index) => ({
            id: index + 1,
            name,
            groupids: groupItems.filter(group => group.groupingids.includes(index + 1)).map(group => group.id),
        })),
        roles: roleNames.map((name, index) => ({id: index + 1, name})),
        meta: {courseid: 0, version: 0, identifierfields: [], display: {}},
    };
};

/**
 * Turn rendered card markup into an inert specimen element.
 *
 * @param {String} html Card markup.
 * @param {String} type participant or group.
 * @param {Object} options {inert: true}
 * @returns {HTMLElement}
 */
const neutralise = (html, type, options) => {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    const card = holder.firstElementChild;
    if (!card) {
        return null;
    }
    [card, ...card.querySelectorAll('*')].forEach(node => {
        Array.from(node.attributes).forEach(({name, value}) => {
            if (name.startsWith('data-easystud-') || renamed.includes(name)) {
                node.setAttribute('data-specimen-' + name.replace(/^data-(easystud-)?/, ''), value);
                node.removeAttribute(name);
            } else if (removed.includes(name)) {
                node.removeAttribute(name);
            }
        });
    });
    card.setAttribute('data-specimen-card', type);
    if (options.inert !== false) {
        card.setAttribute('inert', '');
        card.setAttribute('aria-hidden', 'true');
    }
    return card;
};

/**
 * A participant card specimen.
 *
 * @param {HTMLElement|Object} source EasyStud root (labels stored at start-up) or {cards, groups} labels.
 * @param {Object} example {fullname, email, roles: [], groups: [], groupings: []}
 * @param {Object} options {inert: true}
 * @returns {Promise<HTMLElement>}
 */
export const renderParticipantSpecimen = (source, example, options = {}) => {
    const labels = labelsOf(source);
    const groups = (example.groups || []).map(name => ({name, groupings: example.groupings || []}));
    const state = exampleState([Object.assign({}, example)], groups);
    return createParticipantModel(state, labels.cards)
        .then(model => attachGroupCatalogs(model, labels.groups))
        .then(model => neutralise(renderCardHtml(model, 1), 'participant', options));
};

/**
 * A group card specimen, as in a catalog or (variant.treecard) in the groupings tree.
 *
 * @param {HTMLElement|Object} source EasyStud root (labels stored at start-up) or {cards, groups} labels.
 * @param {Object} example {name, members: [full names], groupings: [], description: false}
 * @param {Object} variant {treecard, withingrouping, structureemail}
 * @param {Object} options {inert: true}
 * @returns {Promise<HTMLElement>}
 */
export const renderGroupSpecimen = (source, example, variant = {}, options = {}) => {
    const labels = labelsOf(source);
    const state = exampleState([], [example]);
    return createParticipantModel(state, labels.cards)
        .then(model => attachGroupCatalogs(model, labels.groups))
        .then(model => neutralise(Mustache.render(model.groupSource,
            buildGroupCardContext(model, model.groups.get(1), variant)), 'group', options));
};
