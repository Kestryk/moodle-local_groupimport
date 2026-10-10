// Existing explanation reused; no new copy, controller, style or curriculum.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '2166d7760fc58da9b5c57fe7b1bbbb16702f85fb';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', baseline + ':' + file],
    {cwd:root, encoding:'utf8', maxBuffer:32 * 1024 * 1024}));
const marker = "        } else if (!empty($step['visualshortcuts'])) {\n";
const line = "            $slide['commonintroduction'] = \\local_groupimport\\local\\guide_discovery::action_explanation('method');\n";
assert.equal(old('manage.php').split(marker).length, 2);
assert.equal(read('manage.php'), old('manage.php').replace(marker, marker + line));
for (const file of ['ajax.php', 'classes/local/guide_discovery.php', 'lang/en/local_groupimport.php',
    'lang/fr/local_groupimport.php', 'styles.css', 'templates/easyedu_guide.mustache',
    'amd/src/course_manager.js', 'amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js']) {
    assert.equal(read(file), old(file), 'Preserved: ' + file);
}
console.log('PASS single shortcuts explanation adapter; all copy, commands, progression and assets preserved.');
