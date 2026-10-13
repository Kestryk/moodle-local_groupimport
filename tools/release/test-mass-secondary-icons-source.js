const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), kit = path.resolve(process.argv[2]);
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
for (const adapter of [
    'scss/easyedu/_tokens.scss',
    'scss/easyedu/components/_panels.scss',
    'scss/easyedu/components/_typography.scss',
    'scss/easyedu/adapters/_moodle-file-deposit.scss',
    'scss/easyedu/_foundation-classes.scss'
]) {
    assert.equal(read(adapter), fs.readFileSync(path.join(kit, adapter), 'utf8').replace(/\r\n/g, '\n'));
}
const markup = read('index.php'), form = read('classes/form/import_form.php');
assert.match(markup, /local-groupimport-import-fields__icon easyedu-icon-tile easyedu-icon-tile--small/);
assert.match(markup, /easyedu-information__header easyedu-information__header--small-icon/);
assert.match(form, /easyedu-file-deposit--moodle easyedu-file-deposit--small-icon/);
assert.match(form, /'maxfiles'\s*=>\s*1/);
assert.match(read('amd/src/csv_import.js'), /easyedu-file-deposit__remove/);
assert.match(read('amd/src/csv_import.js'), /waitForTransition\(grid, 'grid-template-columns'\)/);
console.log('PASS canonical small secondary hierarchy; class-only PHP and native picker/controller contracts preserved');
