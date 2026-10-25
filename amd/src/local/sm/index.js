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
 * Participant search index built from the compact state (SM-RENDU).
 *
 * One entry per participant: the search text manage.php used to build, and the role, group
 * and grouping ids the filters match. Matching itself lives in local/sm/filter_engine.
 *
 * @module     local_groupimport/local/sm/index
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {normalise, filterEntryIds} from './filter_engine';
import {countLabel} from '../count_label';

// Single shared definition (X9): kept re-exported here since most of the course manager
// imports it from this module.
export {countLabel};

/**
 * Build one index entry per participant, in state order.
 *
 * @param {Object} state Raw compact state.
 * @returns {Object[]} Entries {id, text, roleids, groupids, groupingids}; ids are strings.
 */
export const buildParticipantIndex = state => {
    const roleNames = new Map(state.roles.map(role => [role.id, role.name]));
    const groups = new Map(state.groups.map(group => [group.id, group]));
    const groupingNames = new Map(state.groupings.map(grouping => [grouping.id, grouping.name]));
    const display = state.meta.display || {};
    const detailFields = display.details || [];
    const primary = display.primary || null;

    return state.users.map(user => {
        const roles = (user.roleids || []).map(roleid => roleNames.get(roleid) || '');
        const groupNames = [];
        const groupingIds = [];
        (user.groupids || []).forEach(groupid => {
            const group = groups.get(groupid);
            groupNames.push(group ? group.name : '');
            (group ? group.groupingids : []).forEach(groupingid => {
                if (groupingNames.has(groupingid) && groupingIds.indexOf(groupingid) === -1) {
                    groupingIds.push(groupingid);
                }
            });
        });

        // Legacy order: detail fields (label, value), then the primary badge (label, value).
        const values = user.display || {};
        const custom = [];
        detailFields.forEach(field => {
            if (values[field.key]) {
                custom.push(field.label, values[field.key]);
            }
        });
        if (primary && values[primary.key]) {
            custom.push(primary.label, values[primary.key]);
        }

        return {
            id: user.id,
            text: normalise(user.fullname + ' ' + user.email + ' ' + roles.join(' ') + ' ' + groupNames.join(' ') + ' ' +
                groupingIds.map(groupingid => groupingNames.get(groupingid)).join(' ') + ' ' + custom.join(' ')),
            // V2 n°6: the role filter matches the course role ids of the state, never role names
            // (two roles can share a name, and names are translated).
            roleids: (user.roleids || []).map(String),
            groupids: (user.groupids || []).map(String),
            groupingids: groupingIds.map(String),
        };
    });
};

/**
 * Participant ids matching the filters, in state order.
 *
 * @param {Object[]} index Entries from buildParticipantIndex().
 * @param {Object} filters {query, roles, groups, groupings}: role, group and grouping ids;
 *     groupings may contain '__none__' (filter_engine NO_GROUPING).
 * @returns {Number[]}
 */
export const filterParticipantIds = (index, filters) => filterEntryIds(index, filters);
