// R10-17: execute actual bounded picker/submission helpers, no Moodle writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = '80c14a3eb5471932ee5b11fe4e65bbbe285cb39d';
const old = file => execFileSync('git', ['show', baseline + ':' + file], {cwd: root,
    encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}).replace(/\r\n/g, '\n');
const source = read('amd/src/csv_import.js');
const first = source.indexOf('// A draft item ID is allocated');
const last = source.indexOf('const deleteSelectedFile', first);
assert.ok(first > 0 && last > first);
let reconstructed = source.slice(0, first) + source.slice(last);
reconstructed = reconstructed.replace('    clearImportFileRequirement(deposit);\n', '');
reconstructed = reconstructed.replace('    initImportFileRequirement(root);\n', '');
assert.ok(reconstructed === old('amd/src/csv_import.js'), 'All pre-existing upload/Motion/preview/history code preserved');
for (const file of ['index.php', 'ajax.php', 'styles.css', 'amd/src/course_manager.js',
    'amd/src/easyedu_guide.js', 'amd/src/motion.js', 'templates/manage.mustache', 'settings.php', 'version.php']) {
    assert.ok(read(file) === old(file), file + ' unchanged');
}
const api = vm.runInNewContext(source.slice(first, last) +
    '\n({isImportFileReady, clearImportFileRequirement, initImportFileRequirement});');
let cases = 0;
for (const filename of [null, '', '   ', 'mixed.csv']) for (const uploading of [false, true]) {
    const notice = {hidden: true, scrollIntoView() { this.scrolled = true; }};
    const picker = {invalid: false, focus() { this.focused = true; },
        setAttribute() { this.invalid = true; }, removeAttribute() { this.invalid = false; }};
    const listeners = [];
    const form = {dataset: {}, querySelector: () => notice,
        addEventListener(type, handler, capture) { listeners.push({type, handler, capture}); }};
    const deposit = {closest: () => form, querySelector(selector) {
        if (selector === '.filepicker-filename a') return filename === null ? null : {textContent: filename};
        if (selector === '.dndupload-inprogress') return uploading ? {} : null;
        return picker;
    }};
    const rootNode = {querySelector: () => deposit};
    api.initImportFileRequirement(rootNode); api.initImportFileRequirement(rootNode);
    assert.equal(listeners.length, 1, 'Idempotent binder');
    assert.equal(listeners[0].type, 'submit'); assert.equal(listeners[0].capture, true);
    const event = {preventDefault() { this.prevented = true; },
        stopImmediatePropagation() { this.stopped = true; }};
    listeners[0].handler(event);
    const ready = Boolean(filename && filename.trim() && !uploading);
    assert.equal(api.isImportFileReady(deposit), ready);
    assert.equal(!!event.prevented, !ready); assert.equal(!!event.stopped, !ready);
    assert.equal(notice.hidden, ready); assert.equal(!!notice.scrolled, !ready);
    assert.equal(picker.invalid, !ready); assert.equal(!!picker.focused, !ready);
    cases++;
}
const notice = {hidden: false};
const button = {removeAttribute(name) { assert.equal(name, 'aria-invalid'); this.cleared = true; }};
const deposit = {closest: () => ({querySelector: () => notice}), querySelector(selector) {
    if (selector === '.filepicker-filename a') return {textContent: 'accepted.xlsx'};
    if (selector === '.dndupload-inprogress') return null;
    return button;
}};
api.clearImportFileRequirement(deposit);
assert.equal(notice.hidden, true); assert.equal(button.cleared, true);
api.initImportFileRequirement({querySelector: () => null});
let builtExports;
vm.runInNewContext(read('amd/build/csv_import.min.js'), {
    define(name, deps, factory) {
        assert.equal(name, 'local_groupimport/csv_import');
        assert.deepEqual(Array.from(deps), ['exports', './motion']);
        builtExports = {}; factory(builtExports, {});
    }, document: {getElementById: () => null}, window: {},
});
assert.equal(typeof builtExports.init, 'function'); builtExports.init('absent-root');
assert.match(read('classes/form/import_form.php'), /easyedu-notice easyedu-notice--warning/);
assert.match(read('classes/form/import_form.php'), /data-local-groupimport-file-required/);
for (const locale of ['en', 'fr']) assert.match(read('lang/' + locale + '/local_groupimport.php'), /\['importfilerequired'\]/);
console.log(JSON.stringify({status: 'PASS', guardedPickerStates: cases, nativeCallbackRecovery: true,
    idempotentCapture: true, generatedAmdExecuted: true, unrelatedSourcePreserved: true,
    browserProof: false, actualUploadOrImportProof: false}, null, 2));
