const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'df07df2f10867d45f15da9fea114b59c00151145';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const before = "        item.setAttribute('aria-disabled', disabled ? 'true' : 'false');\n";
const after = "        // Only selection is unavailable: the card's nested actions stay usable.\n" +
    "        // Native input.disabled below expresses the checkbox's actual state.\n" +
    "        item.removeAttribute('aria-disabled');\n";
const source = read('amd/src/course_manager.js');
assert.equal(source, old('amd/src/course_manager.js').replace(before, after));
for (const file of ['styles.css', 'templates/manage.mustache', 'amd/src/motion.js', 'amd/build/motion.min.js',
    'amd/src/searchable_choices.js', 'amd/build/searchable_choices.min.js', 'amd/src/member_selection.js',
    'js/loading_state_bootstrap.js', 'ajax.php', 'lib.php', 'settings.php', 'manage.php',
    'classes/service/membership_transfer.php', 'tools/playwright/student-fold-member-selection.spec.js']) {
    assert.equal(read(file), old(file), `${file}: complete preservation`);
}
const start = source.indexOf('const updateSelectionAvailability = root => {');
const end = source.indexOf('\nconst updateParticipantEmptyState =', start);
const block = source.slice(start, end) + '\nupdateSelectionAvailability;';
let cases = 0;
for (const active of ['', 'participant', 'group', 'grouping', 'member']) {
    for (const type of ['participant', 'group', 'grouping', 'member']) {
        for (const selected of [false, true]) {
            const attributes = new Map([['aria-disabled', 'true']]);
            const input = {disabled: true};
            let paint = null;
            const item = {getAttribute: name => {assert.equal(name, 'data-selectable-type');return type;},
                removeAttribute: name => attributes.delete(name),
                classList: {contains: name => {assert.equal(name, 'is-selected');return selected;},
                    toggle: (name, value) => {assert.equal(name, 'is-selection-disabled');paint = value;}}};
            const node = {querySelectorAll: selector => {
                assert.equal(selector, '[data-selectable-type]');return [item];}};
            const run = vm.runInNewContext(block, {getActiveSelectionType: target => {
                assert.equal(target, node);return active;}, selectedClass: 'is-selected',
                disabledSelectionClass: 'is-selection-disabled',
                areSelectionTypesCompatible: (first, second) => !first || first === second,
                getSelectionInput: target => {assert.equal(target, item);return input;}});
            run(node);
            const unavailable = !!active && active !== type && !selected;
            assert.equal(paint, unavailable);assert.equal(input.disabled, unavailable);
            assert.equal(attributes.has('aria-disabled'), false, 'No ancestor disables unrelated nested actions');
            cases++;
        }
    }
}
console.log(`PASS ${cases} native-selection availability states; all previous selection/fold/commands/Motion preserved.`);
