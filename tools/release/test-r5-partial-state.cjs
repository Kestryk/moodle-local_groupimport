// Perf R5 contract: after an action, the on-demand page updates its course state from the group
// structure returned by ajax.php, and reloads the whole state whenever that is not provably exact.
// Source-only: the production functions are evaluated in a sandbox (no runtime, browser or database).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
let checks = 0;
const check = (ok, message) => {
    checks++;
    assert.ok(ok, message);
};

// 1. stateFromStructures, the production function.
const workspace = read('amd/src/local/cm/workspace.js');
const start = workspace.indexOf('export const stateFromStructures =');
const end = workspace.indexOf('\n};', start) + 3;
check(start > 0 && end > start, 'stateFromStructures exported by workspace');
const stateFromStructures = vm.runInNewContext(workspace.slice(start, end).replace('export const ', 'const ') +
    ';stateFromStructures', {});

const raw = {
    meta: {version: 7, counts: {users: 3, groups: 2, groupings: 1, memberships: 2}, display: {x: 1}},
    roles: [{id: 5}],
    users: [{id: 1, fullname: 'A', groupids: [10]}, {id: 2, fullname: 'B', groupids: [11]}, {id: 3, fullname: 'C', groupids: []}],
    groups: [{id: 10, memberids: [1]}, {id: 11, memberids: [2]}],
    groupings: [{id: 50, groupids: [10]}],
};
const structure = (previousversion, version, groups, extra = {}) => Object.assign({
    previousversion, version, usercount: 3, memberships: groups.reduce((n, g) => n + g.memberids.length, 0),
    groups, groupings: [{id: 50, groupids: [10, 11]}],
}, extra);
// User 3 joins groups 11 and 10 (server order: ascending group id), user 2 untouched.
const after = [{id: 11, memberids: [2, 3]}, {id: 10, memberids: [1, 3]}];

const next = stateFromStructures(raw, [structure(7, 8, after)]);
check(next !== null, 'a structure following the held version is applied');
check(next.meta.version === 8 && next.meta.counts.memberships === 4 && next.meta.counts.users === 3, 'meta follows');
check(next.meta.display === raw.meta.display && next.roles === raw.roles, 'participant data and settings kept');
check(JSON.stringify(next.users[2].groupids) === '[10,11]', 'group ids derived in ascending group id order');
check(next.users[0] === raw.users[0] && next.users[1] === raw.users[1], 'unchanged participants keep their object');
check(next.groups[0].id === 11 && next.groupings[0].groupids.length === 2, 'groups and groupings replaced');
check(raw.meta.version === 7 && raw.users[2].groupids.length === 0, 'held state not mutated');

// Two batches, answered in any order, chained from the held version.
const chained = stateFromStructures(raw, [structure(9, 10, after), structure(7, 9, raw.groups)]);
check(chained !== null && chained.meta.version === 10, 'consecutive structures applied in version order');
// An action without change keeps the version.
check(stateFromStructures(raw, [structure(7, 7, raw.groups)]) !== null, 'no-op action accepted');

// Every doubt reloads the whole state.
check(stateFromStructures(raw, [structure(8, 9, after)]) === null, 'change made in between (version gap): reload');
check(stateFromStructures(raw, [structure(7, 8, after), structure(7, 9, after)]) === null,
    'concurrent requests from the same version: reload');
check(stateFromStructures(raw, [structure(7, 8, after, {usercount: 4})]) === null, 'participant count changed: reload');
check(stateFromStructures(raw, [structure(7, 8, after, {groupings: null})]) === null, 'incomplete structure: reload');
check(stateFromStructures(raw, [structure(7, 'x', after)]) === null, 'invalid version: reload');
check(stateFromStructures(raw, []) === null && stateFromStructures(null, [structure(7, 8, after)]) === null,
    'nothing to apply: reload');

// 2. Wiring: actions ask for the structure only in on-demand mode and pass it on; anything else reloads.
const actions = read('amd/src/local/cm/actions.js');
check((actions.match(/if \(isOnDemandStateActive\(root\)\) \{/g) || []).length === 2, 'both posts ask only in on-demand mode');
check((actions.match(/scheduleOnDemandStateRefresh\(root, result\.structure \|\| null\)/g) || []).length === 2,
    'both posts hand the structure (or nothing) to the refresh');
check(/pendingFullRefresh = true;/.test(workspace) && /fetchState\(courseId\)\.then/.test(workspace),
    'a response without structure reloads the whole state');
check(/catch \(error\) \{\n\s+\/\/ Safety net/.test(workspace), 'an exception while applying falls back to the reload');

// 3. Moves: one batched request per server batch, never one request per group, only through bulk_batches.
['actions.js', 'drag_drop.js', 'move_modal.js', 'quick_actions.js', 'context_menu.js']
    .forEach(file => {
        const source = read('amd/src/local/cm/' + file);
        check(!/Promise\.all\([^;]*?action: 'movegroup'/s.test(source), file + ': no request per group');
    });
check(/postActionInBatches\(root, groups, batch => \(\{\n\s+courseid: courseId,\n\s+action: 'movegroup',\n\s+groupids: batch\.map\(idOf\)/
    .test(actions), 'grouped movegroup only through postActionInBatches');
const batches = read('amd/src/local/cm/bulk_batches.js');
// bulk_batches is a pure module (no import): evaluate it whole and take its production merge.
const merge = vm.runInNewContext(batches.replace(/^export const /gm, 'const ') + ';mergeResponses', {});
const merged = merge([{results: [{groupid: 1}]}, {results: [{groupid: 2}], message: 'm'}]);
check(merged.results.length === 2 && merged.message === 'm', 'batched move results merged across batches');

// 4. Server: bounded, one transaction, same capability and data as get_state.
const ajax = read('ajax.php');
check(/bulk_action::validate_size\(count\(\$groupids\)\);/.test(ajax) &&
    /bulk_action::run\(count\(\$groupids\), static function \(\) use \(\$groupids, \$movegroup\)/.test(ajax),
    'grouped movegroup bounded and transactional');
check(/\$versionbefore = \$withstructure \? state_version::get\(\(int\)\$course->id\) : 0;/.test(ajax) &&
    ajax.indexOf('$versionbefore =') < ajax.indexOf("if ($action === 'userdetails')"), 'version read before the action');
check(ajax.indexOf("require_capability('moodle/course:managegroups', $context);") < ajax.indexOf('$withstructure ='),
    'structure only after the capability check');
const state = read('classes/service/course_state.php');
check(/\$groupitems = self::group_items\(\$course, \$context, \$groups, \$memberships, \$groupingmemberships\);/.test(state) &&
    /'groups' => self::group_items\(\$course, \$context, \$groups, \$memberships, \$groupingmemberships\),/.test(state),
    'build() and structure() share the group items');
check(/state_version::flush\(\);/.test(state.slice(state.indexOf('public static function structure('))), 'final version');

console.log(JSON.stringify({status: 'PASS', checks, runtimeAccess: false}));
