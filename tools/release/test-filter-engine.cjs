/* eslint-env node */
// V2 n°10 / n°6: the filter engine (amd/src/local/sm/filter_engine.js) and the participant index
// (amd/src/local/sm/index.js), run in Node on a synthetic course state.
// Usage: node tools/release/test-filter-engine.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
// Both modules as one script: drop the import lines and the export keywords.
const source = ['amd/src/local/sm/filter_engine.js', 'amd/src/local/sm/index.js'].map(read).join('\n')
    .replace(/^import .*;$/gm, '').replace(/^export (const )/gm, '$1');
const context = {};
vm.runInNewContext(source + '\nthis.api = {normalise, matchesText, splitTokens, createMatcher, filterEntryIds,' +
    ' createIdentifierIndex, matchIdentifierPhrases, matchesOccupancy, buildParticipantIndex, filterParticipantIds};', context);
const api = context.api;

// Two roles share the display name "Enseignant": a custom role renamed in the course, held by a student.
const state = {
    meta: {display: {}},
    roles: [{id: 3, name: 'Enseignant'}, {id: 5, name: 'Étudiant'}, {id: 34, name: 'Enseignant'}],
    groups: [{id: 10, name: 'Groupe A', groupingids: [100]}, {id: 11, name: 'Groupe B', groupingids: []}],
    groupings: [{id: 100, name: 'Groupement 1', groupids: [10]}],
    users: [
        {id: 1, fullname: 'Ada Lovelace', email: 'ada@example.com', roleids: [3], groupids: [10]},
        {id: 22, fullname: 'Test20 Etudiant', email: 'test20@example.com', roleids: [5, 34], groupids: [11]},
        {id: 23, fullname: 'Zoé Martin', email: 'zoe@example.com', roleids: [5], groupids: []},
    ],
};
const index = api.buildParticipantIndex(state);
const ids = filters => Array.from(api.filterParticipantIds(index, filters));

// Role filter (n°6): role ids, never names.
assert.deepEqual(ids({roles: ['3']}), [1], 'the editing teacher role only');
assert.deepEqual(ids({roles: [3]}), [1], 'numeric role ids too');
assert.deepEqual(ids({roles: ['34']}), [22], 'the renamed custom role only');
assert.deepEqual(ids({roles: ['5']}), [22, 23]);
assert.deepEqual(ids({roles: ['3', '5']}), [1, 22, 23], 'OR within the role filter');
assert.deepEqual(ids({roles: ['enseignant']}), [], 'a role name is not a role filter value');

// Text: lowercase only, accents and spaces kept as typed (unchanged behaviour).
assert.deepEqual(ids({query: 'ZOÉ'}), [23]);
assert.deepEqual(ids({query: 'zoe'}), [23], 'zoe@example.com');
assert.deepEqual(ids({query: 'etudiant'}), [22], 'the name, not the role "Étudiant"');
assert.deepEqual(ids({query: 'étudiant'}), [22, 23], 'role names stay in the search text');
assert.deepEqual(ids({query: 'groupement 1'}), [1]);
assert.deepEqual(ids({query: 'ada  lovelace'}), [], 'spaces are not collapsed');

// Groups, groupings, "no grouping" and AND across filters.
assert.deepEqual(ids({groups: ['10', '11']}), [1, 22]);
assert.deepEqual(ids({groupings: ['100']}), [1]);
assert.deepEqual(ids({groupings: ['__none__']}), [22, 23]);
assert.deepEqual(ids({groupings: ['__none__', '100']}), [1, 22, 23]);
assert.deepEqual(ids({roles: ['5'], groupings: ['__none__'], query: 'zo'}), [23]);
assert.deepEqual(ids({roles: ['3'], query: 'test20'}), []);

// Group catalog entries: onlyungrouped and grouping predicates.
const groups = [{id: 10, text: 'groupe a', groupingids: ['100']}, {id: 11, text: 'groupe b', groupingids: []}];
assert.deepEqual(Array.from(api.filterEntryIds(groups, {onlyungrouped: true})), [11]);
assert.deepEqual(Array.from(api.filterEntryIds(groups, {groupings: ['100'], query: 'GROUPE'})), [10]);
assert.deepEqual(Array.from(api.filterEntryIds(groups, {groupings: ['100'], onlyungrouped: true})), []);
assert.equal(api.matchesOccupancy('filled', false), false);
assert.equal(api.matchesOccupancy('empty', false), true);
assert.equal(api.matchesOccupancy('all', false), true);

// Identifiers: ambiguous keys dropped, multi-word names first.
const registry = api.createIdentifierIndex();
registry.add('Ada', 'Ada Lovelace', '1');
registry.add('Ada Lovelace', 'Ada Lovelace', '1');
registry.add('Martin', 'Zoé Martin', '23');
registry.add('martin', 'Paul Martin', '24');
assert.deepEqual(Array.from(registry.known.keys()), ['ada', 'ada lovelace']);
const parsed = api.matchIdentifierPhrases('Ada Lovelace zzz\nADA', registry.known, /[\r\n,;|]+/u);
assert.deepEqual(Array.from(parsed.recognised, item => item.key), ['ada lovelace', 'ada']);
assert.deepEqual(Array.from(parsed.unresolved), ['zzz']);
assert.deepEqual(Array.from(api.splitTokens(' A, b;;C ', /[\s,;|]+/u)), ['a', 'b', 'c']);

process.stdout.write('Filter engine: all checks passed.\n');
