// ci-reusable: bounded T041 adapter, not a visual or whole-modal accessibility proof.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '3d9dfe239153fbbfba005e2366b027a031f2e545';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}).replace(/\r\n/g, '\n');
const source = read('amd/src/course_manager.js');
const start = source.indexOf('// Card dialogs reuse their native Close/Cancel');
const end = source.indexOf('// Normalise text for filtering.', start);
assert.ok(start > 0 && end > start);
const helper = source.slice(start, end);
let restored = source.slice(0, start) + source.slice(end);
restored = restored.replace('    const focusModal = bindCardModalKeyboard(modal, closeModal);\n    focusModal();\n', '')
    .replace('        showEasyStudModal(modal);\n        focusModal();', '        showEasyStudModal(modal);')
    .replace('    const focusModal = bindCardModalKeyboard(modal, closeParticipantModal);\n', '');
assert.equal(restored, old('amd/src/course_manager.js'), 'Complete unrelated controller, commands and Motion preserved');
for (const file of ['styles.css', 'templates/manage.mustache', 'amd/src/motion.js',
    'amd/build/motion.min.js', 'amd/src/easyedu_guide.js', 'manage.php', 'ajax.php', 'settings.php']) {
    assert.equal(read(file), old(file), file + ' unchanged by T041');
}
const context = vm.createContext({});
vm.runInContext(helper + '\nthis.bind = bindCardModalKeyboard;', context);
const handlers = {}, focusCalls = [], close = {disabled: false, focus: options => focusCalls.push(options)};
let closing = false, cancels = 0;
const modal = {hidden: false, classList: {contains: () => closing},
    querySelector: () => close, addEventListener: (name, listener) => {handlers[name] = listener;}};
const focus = context.bind(modal, () => {cancels++;});
focus(); assert.equal(focusCalls.length, 1); assert.equal(focusCalls[0].preventScroll, true);
const key = (key, defaultPrevented = false) => {
    const event = {key, defaultPrevented, prevented: false, stopped: false,
        preventDefault() {this.prevented = true;}, stopPropagation() {this.stopped = true;}};
    handlers.keydown(event); return event;
};
assert.equal(key('Enter').prevented, false); assert.equal(cancels, 0);
assert.equal(key('Escape', true).stopped, false); assert.equal(cancels, 0);
modal.hidden = true; key('Escape'); assert.equal(cancels, 0);
modal.hidden = false; closing = true; key('Escape'); assert.equal(cancels, 0);
closing = false; const escaped = key('Escape');
assert.equal(escaped.prevented, true); assert.equal(escaped.stopped, true); assert.equal(cancels, 1);
close.disabled = true; focus(); assert.equal(focusCalls.length, 1);
assert.ok(read('amd/build/course_manager.min.js').includes('bindCardModalKeyboard'));
const map = JSON.parse(read('amd/build/course_manager.min.js.map'));
assert.deepEqual(map.sources, ['../src/course_manager.js']);
const terser = require(path.join(process.argv[2], 'terser'));
const namedSource = source.replace("import * as Motion from './motion';", '')
    .replace("import * as Guide from './easyedu_guide';", '')
    .replace("import {enhanceSelect, enhanceMultipleSelect, closeChoicesWithin} from './searchable_choices';",
        'const {enhanceSelect, enhanceMultipleSelect, closeChoicesWithin} = Choices;')
    .replace("import {snapshotMemberPairs} from './member_selection';",
        'const {snapshotMemberPairs} = MemberSelection;')
    .replace('export const init =', 'const init =');
const wrapped = 'define("local_groupimport/course_manager", ["local_groupimport/motion", "local_groupimport/searchable_choices", ' +
    '"local_groupimport/member_selection", "local_groupimport/easyedu_guide"], function(Motion, Choices, MemberSelection, Guide) {\n' +
    namedSource + '\nreturn {init: init};\n});';
terser.minify({'../src/course_manager.js': wrapped}, {compress: true, mangle: false,
    sourceMap: {filename: 'course_manager.min.js', url: 'course_manager.min.js.map'}}).then(result => {
    assert.equal(read('amd/build/course_manager.min.js'), result.code + '\n', 'Exact current source-generated AMD');
    assert.equal(read('amd/build/course_manager.min.js.map'), result.map + '\n', 'Exact current generated source map');
    console.log('PASS exact source/build/map reconstruction; no embedded sourcesContent assumed.');
}).catch(error => {console.error(error); process.exitCode = 1;});
console.log('PASS T041 exact full-controller preservation, scoped native focus/Escape and generated AMD source identity.');
