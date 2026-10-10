// Explicit successor preserves everything outside the new reading explanation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '32f31d1958e37a0d29cbdda22b14f80a98229bec';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', baseline + ':' + file],
    {cwd:root, encoding:'utf8', maxBuffer:32 * 1024 * 1024}));
const line = "            $slide['commonintroduction'] = \\local_groupimport\\local\\guide_discovery::action_explanation('mistakes');\n";
assert.equal(read('manage.php').split(line).length, 2);
assert.equal(read('manage.php').replace(line, ''), old('manage.php'));
const helper = 'classes/local/guide_discovery.php';
assert.equal(read(helper), old(helper).replace("'recap'], true)", "'recap', 'mistakes'], true)"));
for (const language of ['en', 'fr']) {
    const file = 'lang/' + language + '/local_groupimport.php';
    const lines = read(file).split('\n');
    const added = lines.filter(line => /^\$string\['guideaction_mistakes_/.test(line));
    assert.equal(added.length, 7);
    assert.equal(lines.filter(line => !added.includes(line)).join('\n'), old(file));
}
for (const file of ['styles.css', 'templates/easyedu_guide.mustache', 'amd/src/course_manager.js',
    'amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js']) {
    assert.equal(read(file), old(file), 'Unchanged source/asset: ' + file);
}
console.log('PASS mistakes explanation-only adapter, seven EN/FR keys, unrelated curriculum/commands/assets preserved.');
