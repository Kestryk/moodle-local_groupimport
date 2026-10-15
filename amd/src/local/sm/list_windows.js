// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.
/**
 * K16-01 bounded list policy. Counts and selections always use the full state.
 * @module local_groupimport/local/sm/list_windows
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {matchesText, normalise} from './filter_engine';

export const listPolicy = {
    members: {initial: 8, step: 10, search: 21, ceiling: 50},
    groups: {initial: 3, step: 3, search: 7, ceiling: 12},
    tags: {initial: 6, ceiling: 30},
};

/**
 * Members matching a search, including off-window rows.
 * @param {Object} model Complete course model.
 * @param {Number|String} groupid Group id.
 * @param {String} query Normalised search.
 * @returns {Number[]} Matching ids.
 */
export const matchingMemberIds = (model, groupid, query = '') => {
    const group = model.groups.get(Number(groupid));
    return (group ? group.memberids || [] : []).filter(id => model.byId.has(id) &&
        matchesText((model.indexById.get(id) || {}).text || normalise(model.byId.get(id).fullname), query));
};

/**
 * Clamp a disclosure budget, keeping the real result count separate.
 * @param {String} kind members or groups.
 * @param {Number} total Real result count.
 * @param {Number} requested Requested row budget.
 * @returns {Object} Bounded window.
 */
export const listWindow = (kind, total, requested) => {
    const policy = listPolicy[kind];
    const limit = Math.min(Math.max(policy.initial, Number(requested) || policy.initial), policy.ceiling);
    const shown = Math.min(total, limit);
    return {limit, shown, total, remaining: Math.max(0, total - shown),
        more: shown < total && limit < policy.ceiling, all: total > policy.ceiling && shown >= policy.ceiling};
};
