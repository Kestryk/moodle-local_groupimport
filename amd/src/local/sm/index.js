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
 * Reproduces exactly the legacy participant filter (course_manager applyFilters with the
 * data-search-text, data-role-text, data-group-ids and data-grouping-ids attributes built
 * in manage.php), so both renderers return the same participants for the same filters.
 *
 * @module     local_groupimport/local/sm/index
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Same normalisation as course_manager.js.
 *
 * @param {*} value Value.
 * @returns {String}
 */
/**
 * Fill a count template: '__count__' (or '{$a}') stands for the count, and a template made by
 * local_groupimport_count_template() carries its singular form first, before a '|'. The
 * page language decides the form (CLDR rules: in French 0 and 1 are singular).
 *
 * @param {String} template Count template.
 * @param {Number} count Count.
 * @returns {String}
 */
export const countLabel = (template, count) => {
    const forms = String(template || '').split('|');
    let singular = count === 1;
    try {
        singular = new Intl.PluralRules(document.documentElement.lang || undefined).select(count) === 'one';
    } catch (error) {
        // Unknown language tag: keep the English rule.
    }
    const form = forms.length > 1 && singular ? forms[0] : forms[forms.length - 1];
    return form.replace('__count__', String(count)).replace('{$a}', String(count));
};

export const normalise = value => (value || '').toString().toLowerCase();

/**
 * Build one index entry per participant, in state order.
 *
 * @param {Object} state Raw compact state.
 * @returns {Object[]} Entries {id, text, roles, groupids, groupingids}.
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
            roles: roles.map(normalise),
            groupids: (user.groupids || []).map(String),
            groupingids: groupingIds.map(String),
        };
    });
};

/**
 * Participant ids matching the filters, in state order.
 *
 * @param {Object[]} index Entries from buildParticipantIndex().
 * @param {Object} filters {query, roles, groups, groupings}; groupings may contain '__none__'.
 * @returns {Number[]}
 */
export const filterParticipantIds = (index, filters) => {
    const query = normalise(filters.query);
    const roles = (filters.roles || []).map(normalise);
    const groups = (filters.groups || []).map(String);
    const groupings = (filters.groupings || []).map(String);

    return index.filter(entry => {
        if (query && entry.text.indexOf(query) === -1) {
            return false;
        }
        if (roles.length && !roles.some(role => entry.roles.indexOf(role) !== -1)) {
            return false;
        }
        if (groups.length && !groups.some(groupid => entry.groupids.indexOf(groupid) !== -1)) {
            return false;
        }
        if (groupings.length && !groupings.some(groupingid => groupingid === '__none__' ?
                entry.groupingids.length === 0 : entry.groupingids.indexOf(groupingid) !== -1)) {
            return false;
        }
        return true;
    }).map(entry => entry.id);
};
