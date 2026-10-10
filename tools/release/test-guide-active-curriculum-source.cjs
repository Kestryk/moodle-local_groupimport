// Activation is exactly two product-adapter lines. All native commands remain.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'fd4674124366aa366e487b424562fc16e0b66961';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', baseline+':'+file],
    {cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}));
const source = read('manage.php');
const selection = '    $slides = \\local_groupimport\\local\\guide_discovery::modern_curriculum($slides);\n';
assert.equal(source.split(selection).length, 2);
assert.equal(source.replace(selection, '').replace(
    'return \\local_groupimport\\local\\guide_discovery::modern_reading_contract() + [',
    'return \\local_groupimport\\local\\guide_discovery::reading_contract() + ['), old('manage.php'));
for (const file of ['classes/local/guide_discovery.php','ajax.php',
    'lang/en/local_groupimport.php','lang/fr/local_groupimport.php','styles.css',
    'templates/easyedu_guide.mustache','amd/src/course_manager.js',
    'amd/src/easyedu_guide.js','amd/build/easyedu_guide.min.js',
    'docs/testing/guide-historical-presentation-archive-2026-10-10.json']) {
    assert.equal(read(file),old(file),'Preserved '+file);
}
console.log('PASS exact template/reading activation; all commands, paths, translations, assets and historical archive unchanged.');
