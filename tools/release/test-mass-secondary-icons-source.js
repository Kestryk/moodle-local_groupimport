const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), kit = path.resolve(process.argv[2]), base = 'dd7fb86';
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const old = f => cp.execFileSync('git', ['show', `${base}:${f}`], {cwd: root, encoding: 'utf8', maxBuffer: 3000000}).replace(/\r\n/g, '\n');
for (const adapter of ['scss/easyedu/adapters/_moodle-file-deposit.scss', 'scss/easyedu/_foundation-classes.scss']) {
    assert.equal(read(adapter), fs.readFileSync(path.join(kit, adapter), 'utf8').replace(/\r\n/g, '\n'));
}
assert.equal(read('index.php').replace('local-groupimport-import-fields__icon easyedu-icon-tile easyedu-icon-tile--compact',
    'local-groupimport-import-fields__icon easyedu-icon-tile')
    .replace('easyedu-information__header easyedu-information__header--compact-icon', 'easyedu-information__header'),
old('index.php'), 'Identification classes only');
assert.equal(read('classes/form/import_form.php').replace('easyedu-file-deposit--moodle easyedu-file-deposit--compact-icon',
    'easyedu-file-deposit--moodle'), old('classes/form/import_form.php'), 'Deposit class only; native picker preserved');
const normalize = css => css.replace(/\.easyedu-ui \.easyedu-file-deposit--moodle\.easyedu-file-deposit--compact-icon[^{}]*\{[^{}]*\}/g, '')
    .replace(/\.easyedu-ui \.easyedu-information__header--compact-icon\s*\{[^{}]*\}/g, '')
    .replace(/\s+/g, ' ').trim();
assert.equal(normalize(read('styles.css')), normalize(old('styles.css')), 'Entire unrelated CSS unchanged');
for (const f of ['amd/src/course_manager.js', 'amd/src/motion.js', 'amd/src/searchable_choices.js',
    'amd/build/course_manager.min.js', 'amd/build/motion.min.js', 'amd/build/searchable_choices.min.js',
    'templates/manage.mustache', 'settings.php', 'ajax.php', 'manage.php']) assert.equal(read(f), old(f), f + ' unchanged');
console.log('PASS canonical compact deposit adapter; class-only PHP; all other CSS, commands and Motion unchanged');
