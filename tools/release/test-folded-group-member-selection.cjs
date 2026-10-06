const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'd8ab821';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const source = read('amd/src/course_manager.js');
const helperStart = source.indexOf('/**\n * Clear member selection for the folded Group,');
const bindingStart = source.indexOf('const bindGroupMemberToggles = root => {', helperStart);
const helper = source.slice(helperStart, bindingStart);
const call = '            if (expanded) {\n                clearFoldedGroupMemberSelection(root, group);\n            }\n';
assert.equal(source.split(call).length, 2);
assert.equal(source.replace(helper, '').replace(call, ''), old('amd/src/course_manager.js'),
    'Entire original controller/Motion remains identical outside the explicit selection addition');
for (const file of ['styles.css', 'templates/manage.mustache', 'amd/src/motion.js', 'amd/build/motion.min.js',
    'amd/src/searchable_choices.js', 'amd/build/searchable_choices.min.js', 'amd/src/member_selection.js',
    'js/loading_state_bootstrap.js', 'ajax.php', 'lib.php', 'settings.php', 'manage.php',
    'classes/service/membership_transfer.php']) {
    assert.equal(read(file), old(file), `${file}: complete preservation`);
}
const selectedClass = 'is-selected';
const classes = initial => {
    const values = new Set(initial);
    return {contains: value => values.has(value), add: value => values.add(value), remove: value => values.delete(value),
        toggle: (value, enabled) => enabled ? values.add(value) : values.delete(value)};
};
const group = id => ({getAttribute: name => { assert.equal(name, 'data-easystud-group-id'); return id; }});
const member = (owner, selected, userid) => {
    const input = {checked: selected};
    return {owner, userid, input, classList: classes(selected ? [selectedClass] : []),
        querySelector: () => input, closest: selector => {
            assert.equal(selector, '[data-easystud-group-id]'); return owner;
        }};
};
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const actualSelection = extract('const getSelectionInput =', 'const clearSelectionForType =');
let cases = 0;
for (const copies of [1, 2, 4]) {
    for (const selectedCount of [0, 1, 3]) {
        for (const otherSelected of [false, true]) {
            const owner = group('7'), other = group('17'), records = [];
            const members = [];
            for (let index = 0; index < copies; index++) {
                for (let user = 0; user < 4; user++) members.push(member(group('7'), user < selectedCount, user));
            }
            const preserved = member(other, otherSelected, 0); // Same user, different membership.
            members.push(preserved, member(null, true, 99));
            const run = vm.runInNewContext(actualSelection + helper + '\nclearFoldedGroupMemberSelection;', {
                selectedClass, getSelectedItems: (node, type) => {
                    assert.equal(node, members); assert.equal(type, 'member');
                    return node.filter(item => item.classList.contains(selectedClass));
                }, updateSelectionActions: node => {
                    assert.equal(node, members); assert.equal(node.filter(item => item.owner &&
                        item.owner.getAttribute('data-easystud-group-id') === '7' && item.input.checked).length, 0);
                    records.push('reconcile');
                }
            });
            run(members, owner);
            members.filter(item => item.owner && item.owner.getAttribute('data-easystud-group-id') === '7')
                .forEach(item => {assert.equal(item.input.checked, false); assert.equal(item.classList.contains(selectedClass), false);});
            assert.equal(preserved.input.checked, otherSelected);
            assert.equal(members.at(-1).input.checked, true, 'Orphan member is not another Group');
            assert.equal(records.length, selectedCount ? 1 : 0);
            run(members, owner); assert.equal(records.length, selectedCount ? 1 : 0, 'Idempotent reconciliation');
            run(members, group('')); assert.equal(records.length, selectedCount ? 1 : 0, 'No missing-id broad clear');
            cases++;
        }
    }
}
// Execute the actual event binding through opening, folding and reopening.
const binding = extract('const bindGroupMemberToggles =', 'const bindTagToggles =') + '\nbindGroupMemberToggles;';
const handlers = [], attrs = new Map(), tokens = new Map(), events = [];
let expanded = false;
const owner = group('7');
const list = {classList: classes([]), setAttribute: (key, value) => tokens.set(key, value),
    getAttribute: key => tokens.get(key), removeAttribute: key => tokens.delete(key)};
owner.closest = () => null; owner.querySelector = () => list;
const toggle = {closest: () => owner, getAttribute: () => expanded ? 'true' : 'false',
    setAttribute: (key, value) => { assert.equal(key, 'aria-expanded'); expanded = value === 'true'; }};
const node = {addEventListener: (type, handler) => handlers.push(handler), contains: () => true};
const context = {groupMemberMotionToken: 0, Motion: {timing: {normal: 360}, resize: (target, mutate, options) => {
    assert.equal(target, list); assert.equal(list.classList.contains('is-easyedu-disclosing'), true);
    assert.equal(options.duration, 360); events.push('resize'); mutate(); options.onComplete(); return Promise.resolve(true);
}}, clearFoldedGroupMemberSelection: (rootNode, target) => {
    assert.equal(rootNode, node); assert.equal(target, owner); assert.equal(expanded, false); events.push('clear');
}, syncGroupMembersCollapsible: () => events.push('sync'), scheduleGroupingResizeForGroup() {},
requestGuideHighlightRefresh() {}, syncAllGroupMembersCollapsible() {}, syncAllGroupingGroupsCollapsible() {}};
vm.runInNewContext(binding, context)(node);
(async() => {
    const click = {target: {closest: selector => selector === '[data-easystud-group-members-toggle]' ? toggle : null}};
    for (const next of [true, false, true]) {
        handlers[0](click); await Promise.resolve();
        assert.equal(expanded, next); assert.equal(list.classList.contains('is-easyedu-disclosing'), false);
        assert.equal(tokens.size, 0);
    }
    assert.deepEqual(events, ['resize', 'sync', 'resize', 'clear', 'sync', 'resize', 'sync']);
    console.log(`PASS ${cases} scoped selection cases + 3 actual disclosure directions; unrelated source/CSS/Motion preserved.`);
})().catch(error => {console.error(error); process.exitCode = 1;});
