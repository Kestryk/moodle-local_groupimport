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
 * The one EasyStud filter engine (V2 n°10).
 *
 * Every search and filter of the page matches through this module: the participant list,
 * the two group catalogs, the groupings tree and its section searches, the member search of
 * a group card and the identifier paths (paste preview, CSV). It owns:
 * - the text normalisation;
 * - the query matching and the token splitting;
 * - the role, group, grouping and "no grouping" predicates;
 * - how filters combine: all filters must match (AND), any value of one filter may (OR).
 *
 * Pure functions on plain data: no DOM, no import. Callers build the entries from the
 * on-demand state (local/sm/index, local/sm/groups) and only read the DOM where the state
 * has no entry yet (a group card created before the state refresh).
 *
 * @module     local_groupimport/local/sm/filter_engine
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Filter value of the grouping filters meaning "groups without grouping" / "participants
 * without grouping".
 */
export const NO_GROUPING = '__none__';

/**
 * Search text normalisation, the same for the texts and the queries: lowercase, accents folded
 * ("etudiant" finds "Étudiant", "helene" finds "Hélène"). Spaces are kept.
 *
 * @param {*} value Value.
 * @returns {String}
 */
export const normalise = value => (value || '').toString().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Whether a normalised text contains a normalised query; an empty query matches everything.
 *
 * @param {String} text Normalised search text.
 * @param {String} query Normalised query.
 * @returns {Boolean}
 */
export const matchesText = (text, query) => !query || (text || '').indexOf(query) !== -1;

/**
 * Search text of an element the state does not describe: its data-search-text, else its text.
 *
 * @param {HTMLElement} element Card or row.
 * @returns {String}
 */
export const elementSearchText = element =>
    normalise(element.getAttribute('data-search-text') || element.textContent);

/**
 * Normalised, non-empty tokens of a typed or pasted value.
 *
 * @param {String} value Value.
 * @param {RegExp} separator Token separator.
 * @returns {String[]}
 */
export const splitTokens = (value, separator) => (value || '').split(separator).map(normalise).filter(Boolean);

/**
 * Whether one of the selected ids is among the ids of an entry; no selection matches everything.
 *
 * @param {String[]} selected Selected ids (strings).
 * @param {String[]} ids Ids of the entry (strings).
 * @returns {Boolean}
 */
export const matchesAnyId = (selected, ids) => !selected.length || selected.some(id => ids.indexOf(id) !== -1);

/**
 * Grouping predicate: one of the selected groupings, NO_GROUPING standing for "no grouping at all".
 *
 * @param {String[]} selected Selected grouping ids (strings) or NO_GROUPING.
 * @param {String[]} groupingids Grouping ids of the entry (strings).
 * @returns {Boolean}
 */
export const matchesGroupings = (selected, groupingids) => !selected.length || selected.some(value =>
    value === NO_GROUPING ? groupingids.length === 0 : groupingids.indexOf(value) !== -1);

/**
 * Occupancy predicate of the groupings tree.
 *
 * @param {String} occupancy all, filled or empty.
 * @param {Boolean} hasContent Whether the grouping has groups.
 * @returns {Boolean}
 */
export const matchesOccupancy = (occupancy, hasContent) =>
    !occupancy || occupancy === 'all' || (occupancy === 'filled' && hasContent) || (occupancy === 'empty' && !hasContent);

/**
 * Normalise filters once: the query is lowercased, the ids become strings.
 *
 * @param {Object} filters {query, roles, groups, groupings, onlyungrouped}; roles are role ids.
 * @returns {Object}
 */
const prepareFilters = filters => ({
    query: normalise(filters.query),
    roles: (filters.roles || []).map(String),
    groups: (filters.groups || []).map(String),
    groupings: (filters.groupings || []).map(String),
    onlyungrouped: !!filters.onlyungrouped,
});

/**
 * Build the predicate of a set of filters. An entry has a normalised text and string id lists
 * (roleids, groupids, groupingids); a filter whose ids the entry does not carry is not given.
 *
 * Combination: every given filter must match (AND); within one filter, any selected value
 * may (OR).
 *
 * @param {Object} filters {query, roles, groups, groupings, onlyungrouped}.
 * @returns {Function} entry => Boolean
 */
export const createMatcher = filters => {
    const {query, roles, groups, groupings, onlyungrouped} = prepareFilters(filters);
    return entry => matchesGroupings(groupings, entry.groupingids || []) &&
        (!onlyungrouped || !(entry.groupingids || []).length) &&
        matchesAnyId(roles, entry.roleids || []) &&
        matchesAnyId(groups, entry.groupids || []) &&
        matchesText(entry.text, query);
};

/**
 * Ids of the entries matching the filters, in entry order.
 *
 * @param {Object[]} entries Entries {id, text, roleids?, groupids?, groupingids?}.
 * @param {Object} filters See createMatcher().
 * @returns {Number[]}
 */
export const filterEntryIds = (entries, filters) => {
    const matches = createMatcher(filters);
    const ids = [];
    entries.forEach(entry => {
        if (matches(entry)) {
            ids.push(entry.id);
        }
    });
    return ids;
};

/**
 * Identifier registry for the paste and CSV paths: one normalised key per identifier; a key
 * claimed by two owners (two participants with the same last name...) is dropped, as ambiguous.
 *
 * @returns {Object} {known: Map key => display label, owners: Map key => owner, add(value, display, owner)}
 */
export const createIdentifierIndex = () => {
    const known = new Map();
    const pending = new Map();
    const conflicts = new Set();
    const add = (value, display, owner) => {
        const key = normalise(value);
        if (!key || conflicts.has(key)) {
            return;
        }
        if (pending.has(key) && pending.get(key) !== owner) {
            pending.delete(key);
            known.delete(key);
            conflicts.add(key);
            return;
        }
        pending.set(key, owner);
        known.set(key, display || value);
    };
    // A conflicting key leaves both maps: owners only hold unambiguous keys.
    return {known, add, owners: pending};
};

/**
 * Recognise known identifiers in a pasted text: each phrase as a whole, else the longest run of
 * words that forms a known key (multi-word names first).
 *
 * @param {String} text Pasted text.
 * @param {Map} knownIdentifiers Normalised key => label.
 * @param {RegExp} separator Phrase separator.
 * @returns {Object} {recognised: [{key, label}], unresolved: String[]}
 */
export const matchIdentifierPhrases = (text, knownIdentifiers, separator) => {
    const recognised = [];
    const unresolved = [];
    const seen = new Set();
    const phrases = (text || '').split(separator).map(part => part.trim()).filter(Boolean);
    const knownKeys = Array.from(knownIdentifiers.keys()).sort((left, right) => {
        const leftWords = left.split(/\s+/u).length;
        const rightWords = right.split(/\s+/u).length;
        if (leftWords !== rightWords) {
            return rightWords - leftWords;
        }
        return right.length - left.length;
    });

    const addRecognised = key => {
        if (!seen.has(key)) {
            recognised.push({key: key, label: knownIdentifiers.get(key)});
            seen.add(key);
        }
    };

    phrases.forEach(phrase => {
        const exact = normalise(phrase);
        if (knownIdentifiers.has(exact)) {
            addRecognised(exact);
            return;
        }

        const words = splitTokens(phrase, /\s+/u);
        for (let index = 0; index < words.length;) {
            let matched = '';
            for (const key of knownKeys) {
                const keyWords = key.split(/\s+/u);
                if (keyWords.length > words.length - index) {
                    continue;
                }
                const candidate = words.slice(index, index + keyWords.length).join(' ');
                if (candidate === key) {
                    matched = key;
                    break;
                }
            }
            if (matched) {
                addRecognised(matched);
                index += matched.split(/\s+/u).length;
            } else {
                unresolved.push(words[index]);
                index++;
            }
        }
    });

    return {recognised, unresolved};
};
