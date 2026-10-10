// Candidate is additive and inactive; the native24 presentation remains untouched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '20391c7e939140d35c9795a6280cb4e4a4ffbf7b';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', baseline+':'+file],
    {cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}));
const file = 'classes/local/guide_discovery.php';
const source = read(file);
const start = source.indexOf('    /** Inactive curriculum successor;');
const end = source.indexOf('    /** Six native milestones;', start);
assert.ok(start > 0 && end > start);
assert.equal(source.slice(0,start)+source.slice(end),old(file));
for (const file of ['manage.php','ajax.php','lang/en/local_groupimport.php',
    'lang/fr/local_groupimport.php','styles.css','templates/easyedu_guide.mustache',
    'amd/src/course_manager.js','amd/src/easyedu_guide.js','amd/build/easyedu_guide.min.js']) {
    assert.equal(read(file),old(file),'Inactive candidate preserves '+file);
}
console.log('PASS additive candidate only; current reading contract, native24, commands and assets unchanged.');
