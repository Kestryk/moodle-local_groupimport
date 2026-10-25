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
 * EasyStud course manager: owner of the on-demand course state (SM-RENDU).
 *
 * The state is set once it has loaded (startOnDemandState in course_manager); every other
 * module reads it through getOnDemandModel() or getOnDemandParticipants().
 *
 * @module     local_groupimport/local/cm/state
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * SM-RENDU on-demand participant list, set once the state is loaded: {root, model, courseId}.
 *
 * It stays null while the state loads (or when it failed to load): the participant list and
 * both group catalogs then hold no card.
 */
let onDemandParticipants = null;

export const getOnDemandModel = root => (onDemandParticipants && (!root || root === onDemandParticipants.root)) ?
    onDemandParticipants.model : null;

/**
 * The on-demand state once loaded ({root, model, courseId}), or null.
 *
 * @returns {Object|null}
 */
export const getOnDemandParticipants = () => onDemandParticipants;

/**
 * Record the loaded on-demand state (only startOnDemandState sets it).
 *
 * @param {Object} value {root, model, courseId}.
 */
export const setOnDemandParticipants = value => {
    onDemandParticipants = value;
};
