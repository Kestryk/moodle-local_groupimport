const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '74c5b1d';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root})
    .toString().replace(/\r\n/g, '\n');
const before = '        root.classList.remove(participantFocusClass, structureFocusClass);\n';
const after = before + '        // Compact workspaces do not inherit the desktop structure-only action hiding.\n' +
    "        root.querySelectorAll('[data-easystud-move-selected-participants]').forEach(button => {\n" +
    '            button.hidden = false;\n        });\n';
const source = read('amd/src/course_manager.js');
assert.equal(old('amd/src/course_manager.js').split(before).length, 2);
assert.equal(source, old('amd/src/course_manager.js').replace(before, after), 'Only compact Move availability changes');
for (const file of ['styles.css', 'templates/manage.mustache', 'js/loading_state_bootstrap.js',
    'amd/src/motion.js', 'amd/build/motion.min.js', 'amd/src/searchable_choices.js',
    'amd/build/searchable_choices.min.js', 'ajax.php', 'classes/service/membership_transfer.php', 'manage.php']) {
    assert.equal(read(file), old(file), `${file}: complete preservation`);
}
const start = source.indexOf('    const applyMobileState = view => {');
const end = source.indexOf('\n    const applyMobileView =', start);
const block = source.slice(start, end) + '\napplyMobileState;';
let cases = 0;
for (const desktop of ['participants', 'structure', 'both']) {
    for (const view of ['participants', 'groups', 'groupings', 'invalid']) {
        for (const initiallyHidden of [false, true]) {
            const action = {hidden: initiallyHidden}, events = [], attributes = {};
            const rootNode = {easystudDesktopMode: desktop, setAttribute: (key, value) => attributes[key] = value,
                classList: {remove: (...values) => events.push({remove: values})},
                querySelectorAll: selector => {
                    assert.equal(selector, '[data-easystud-move-selected-participants]'); return [action];
                }};
            const buttons = ['participants', 'groups', 'groupings'].map(value => ({
                getAttribute: () => value, setAttribute() {}, classList: {toggle() {}},
                querySelector: () => ({textContent: value})
            }));
            const participantPanel = {}, structurePanel = {}, structureGroups = {}, structureTitle = {};
            const run = vm.runInNewContext(block, {mobileView: '', root: rootNode, participantFocusClass: 'participant',
                structureFocusClass: 'structure', buttons, participantPanel, structurePanel, structureGroups,
                structureTitle, structureTitleDefault: 'Original', clearSelectionState: node => {
                    assert.equal(node, rootNode); events.push('clear');
                }, updateSelectionActions: node => {
                    assert.equal(node, rootNode); assert.equal(action.hidden, false); events.push('actions');
                }, closeResponsiveGuide: () => events.push('existing-guide-close'), syncPagination() {},
                scheduleResponsiveUiRefresh() {}});
            run(view);
            const expected = view === 'invalid' ? 'participants' : view;
            assert.equal(attributes['data-easystud-mobile-view-active'], expected);
            assert.equal(action.hidden, false);
            assert.equal(rootNode.easystudDesktopMode, desktop, 'Desktop preference preserved');
            assert.equal(participantPanel.hidden, expected !== 'participants');
            assert.equal(structurePanel.hidden, expected === 'participants');
            assert.equal(structureGroups.hidden, expected !== 'groups');
            assert.deepEqual(events.slice(1, 3), ['clear', 'actions']);
            cases++;
        }
    }
}
console.log(`PASS ${cases} compact Move cases; desktop preference and whole unrelated styles/controllers/commands preserved.`);
