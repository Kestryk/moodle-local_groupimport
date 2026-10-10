// Paint-only successor: do not weaken earlier, independently pinned gates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '5f1315909756eba9d7c479ec47ff6ab3054da30a';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', `${baseline}:${file}`],
    {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline],
    {cwd: root, encoding: 'utf8'}).trim().split('\n');
const protectedFiles = tracked.filter(file => /^(amd\/|lang\/)/.test(file) || /\.php$/.test(file));
for (const file of protectedFiles) assert.equal(read(file), old(file), file);
const before = '<header class="easyedu-guide-modal__header">';
const after = '<header class="easyedu-guide-modal__header{{#discoverypresentation}} easyedu-dialog-header-palette--primary{{/discoverypresentation}}">';
for (const file of ['templates/easyedu_guide.mustache', 'easyedu-guide-kit/templates/easyedu_guide.mustache']) {
    assert.equal(read(file).split(after).length, 2, `${file}: exact single opt-in`);
    assert.equal(read(file).replace(after, before), old(file), `${file}: all other markup preserved`);
}
const paint = '.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery .easyedu-guide-modal__header.easyedu-dialog-header-palette--primary,\n' +
    '.path-local-groupimport .easyedu-guide.easyedu-guide--discovery .easyedu-guide-modal__header.easyedu-dialog-header-palette--primary {\n' +
    '  background: var(--easyedu-dialog-palette-primary-header, var(--easyedu-dialog-palette-base, var(--easyedu-modal-header-bg)));\n}\n';
assert.equal(read('styles.css').split(paint).length, 2, 'one canonical paint block');
assert.equal(read('styles.css').replace(paint, ''), old('styles.css'), 'all other compiled CSS preserved');
console.log(JSON.stringify({baseline, protectedFiles: protectedFiles.length,
    templates: 2, cssAddedLines: 4, pass: true, nativeProof: false}));
