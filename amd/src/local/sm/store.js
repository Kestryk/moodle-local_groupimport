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
 * Student Management state store for on-demand rendering (SM-RENDU).
 *
 * The initial document snapshot (or local_groupimport_get_state fallback) is kept in a
 * core/reactive instance, so later steps can render from it and apply server deltas
 * through mutations. The raw payload is also kept for the search index, which must not
 * read thousands of entries through the reactive proxies.
 *
 * @module     local_groupimport/local/sm/store
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Ajax from 'core/ajax';
import {Reactive} from 'core/reactive';

const eventName = 'local_groupimport/sm:stateChanged';

/**
 * Dispatch state changes on the store target only (no bubbling to other instances).
 *
 * @param {Object} detail Change detail.
 * @param {EventTarget} target Store target.
 */
const eventDispatch = (detail, target) => {
    target.dispatchEvent(new CustomEvent(eventName, {bubbles: false, detail}));
};

/**
 * Mutations available to components. Deltas from server actions arrive at step 4.
 */
const mutations = {
    /**
     * Replace the participant filters (all values are already normalised by the caller).
     *
     * @param {Object} stateManager Moodle state manager.
     * @param {Object} filters {query, roles, groups, groupings}
     */
    setParticipantFilters(stateManager, filters) {
        stateManager.setReadOnly(false);
        const ui = stateManager.state.ui;
        ui.query = filters.query || '';
        ui.roles = [...(filters.roles || [])];
        ui.groups = [...(filters.groups || [])];
        ui.groupings = [...(filters.groupings || [])];
        stateManager.setReadOnly(true);
    },
};

/**
 * Fetch the compact course state.
 *
 * @param {Number} courseId Course id.
 * @returns {Promise<Object>} Parsed state.
 */
export const fetchState = courseId => Ajax.call([{
    methodname: 'local_groupimport_get_state',
    args: {courseid: courseId},
}])[0].then(response => JSON.parse(response.state));

/**
 * Fetch heavy fields of a few entities.
 *
 * @param {Number} courseId Course id.
 * @param {String} type user, group or grouping.
 * @param {Number[]} ids Entity ids (at most 200).
 * @returns {Promise<Object[]>} Items in request order.
 */
export const fetchDetails = (courseId, type, ids) => Ajax.call([{
    methodname: 'local_groupimport_get_details',
    args: {courseid: courseId, type, ids},
}])[0].then(response => JSON.parse(response.items));

/**
 * Consume the current document's authenticated snapshot once, never a stored cache.
 *
 * A missing, malformed or foreign-course seed leaves the ordinary AJAX path intact.
 *
 * @param {HTMLElement} root Store root.
 * @param {Number} courseId Course id.
 * @returns {Object|null} Initial state, or null to fetch it normally.
 */
const takeInitialState = (root, courseId) => {
    const element = root.ownerDocument.getElementById('easystud-initial-state');
    if (!element) {
        return null;
    }
    const content = element.textContent;
    element.remove();
    try {
        const raw = JSON.parse(content);
        if (raw?.meta?.schema !== 1 || Number(raw.meta.courseid) !== Number(courseId) ||
                !['users', 'groups', 'groupings', 'roles'].every(key => Array.isArray(raw[key]))) {
            return null;
        }
        return raw;
    } catch (error) {
        return null;
    }
};

/**
 * Create the store and load the state.
 *
 * @param {HTMLElement} root EasyStud root element, used as the private event target.
 * @param {Number} courseId Course id.
 * @returns {Promise<{reactive: Reactive, raw: Object, loadMs: Number}>}
 */
export const createStore = (root, courseId) => {
    const started = window.performance.now();
    const reactive = new Reactive({
        name: 'local_groupimport_sm_' + courseId,
        eventName,
        eventDispatch,
        target: root,
        mutations,
    });
    const initial = takeInitialState(root, courseId);
    return (initial ? Promise.resolve(initial) : fetchState(courseId)).then(raw => {
        reactive.setInitialState({
            meta: raw.meta,
            roles: raw.roles,
            users: raw.users,
            groups: raw.groups,
            groupings: raw.groupings,
            ui: {query: '', roles: [], groups: [], groupings: []},
        });
        return {reactive, raw, loadMs: Math.round(window.performance.now() - started)};
    });
};
