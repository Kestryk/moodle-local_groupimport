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
 * EasyStud course manager: participant and group identifier recognition (paste previews).
 *
 * @module     local_groupimport/local/cm/identifiers
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {splitTokens, createIdentifierIndex, matchIdentifierPhrases} from '../sm/filter_engine';
import {getOnDemandModel} from './state';

const getKnownUserIdentifiers = root => {
    const {known, add: addIdentifier} = createIdentifierIndex();

    const model = getOnDemandModel(root);
    // Read every participant from the state: only one page has cards. None is known while it loads.
    const records = model ? model.raw.users.map(user => ({
        name: user.fullname,
        userid: String(user.id),
        email: user.email,
        copyfields: Object.keys(user.identifiers || {}).map(key => ({key, value: user.identifiers[key]})),
    })) : [];
    records.forEach(record => {
        const display = record.name.trim();
        const userid = record.userid || display;
        [record.userid, record.email].filter(Boolean).forEach(value => {
            addIdentifier(value, display || value, userid);
        });
        record.copyfields.forEach(field => {
            if (field.value) {
                addIdentifier(field.value, display || field.value, userid);
            }
        });
        display.split(/\s+/u).filter(Boolean).forEach(part => addIdentifier(part, display, userid));
    });
    return known;
};

/**
 * Known participant identifiers, read when first needed and again after a state reload.
 *
 * On demand, the participants arrive with the state, after the bindings that need them.
 *
 * @param {HTMLElement} root EasyStud root.
 * @returns {Function} Returns the identifier Map.
 */
export const lazyKnownUserIdentifiers = root => {
    let known = null;
    let revision = null;
    return () => {
        const model = getOnDemandModel(root);
        const current = model ? model.revision : 0;
        if (!known || revision !== current) {
            known = getKnownUserIdentifiers(root);
            revision = current;
        }
        return known;
    };
};

export const renderIdentifierPreview = (box, results, knownIdentifiers, separator = /[\s,;|]+/u) => {
    if (!box || !results) {
        return;
    }
    const tokens = splitTokens(box.value, separator);
    results.innerHTML = '';
    tokens.forEach(identifier => {
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-token ' +
            (knownIdentifiers.has(identifier) ? 'local-groupimport-easystud-token--valid' : 'local-groupimport-easystud-token--invalid');
        badge.textContent = knownIdentifiers.get(identifier) || identifier;
        results.appendChild(badge);
    });
};

export const renderSmartIdentifierPreview = (box, results, knownIdentifiers, separator = /[\r\n,;|]+/u) => {
    if (!box || !results) {
        return;
    }
    const parsed = matchIdentifierPhrases(box.value, knownIdentifiers, separator);
    results.innerHTML = '';
    parsed.recognised.forEach(match => {
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--valid';
        badge.textContent = match.label || match.key;
        results.appendChild(badge);
    });
    parsed.unresolved.forEach(identifier => {
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--invalid';
        badge.textContent = identifier;
        results.appendChild(badge);
    });
};

export const getKnownGroupIdentifiers = root => {
    const {known, add: addIdentifier} = createIdentifierIndex();

    const model = getOnDemandModel(root);
    // On demand, every group comes from the state: the tree only renders opened sections.
    const records = model ? model.raw.groups.map(group => ({id: String(group.id), name: group.name.trim()})) :
        Array.from(root.querySelectorAll('[data-easystud-group-id]')).map(group => {
            const nameNode = group.querySelector('.local-groupimport-easystud-group__name');
            return {id: group.getAttribute('data-easystud-group-id') || '', name: nameNode ? nameNode.textContent.trim() : ''};
        });
    records.forEach(({id, name}) => {
        addIdentifier(id, name || id, id);
        addIdentifier(name, name, id);
    });
    return known;
};
