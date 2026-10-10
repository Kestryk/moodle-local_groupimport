// Bounded presentation successor: no Moodle session, database, or course command.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const normalize = value => value.replace(/\r\n/g, '\n');
const baseline = 'd33ca442ce44b254b7f1e2cb0929d25803b26e1f';
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', baseline + ':' + file],
    {cwd:root, encoding:'utf8', maxBuffer:32 * 1024 * 1024}));
const prior = "                    ['key' => 'Space', 'label' => $templatedata['tutorialvisualkeyboardspace']],\n" +
    "                    ['key' => 'Shift', 'label' => $templatedata['tutorialvisualselect']],";
const successor = "                    ['key' => get_string('tutorialkeyboardkeyspace', 'local_groupimport'),\n" +
    "                        'label' => $templatedata['tutorialvisualkeyboardspace']],\n" +
    "                    ['key' => get_string('tutorialkeyboardkeyshift', 'local_groupimport'),\n" +
    "                        'label' => get_string('tutorialvisualkeyboardrange', 'local_groupimport')],";
assert.equal(old('manage.php').split(prior).length, 2);
assert.equal(read('manage.php'), old('manage.php').replace(prior, successor),
    'All other presentation, targets, commands and progress adapters preserved');
const allowed = new Set(['tutorialkeyboardcontent', 'tutorialvisualkeyboardspace', 'tutorialvisualkeyboardrange']);
const strip = text => text.split('\n').filter(line => {
    const match = line.match(/^\$string\['([^']+)'\]/);
    return !match || !allowed.has(match[1]);
}).join('\n');
for (const language of ['en', 'fr']) {
    const file = 'lang/' + language + '/local_groupimport.php';
    assert.equal(strip(read(file)), strip(old(file)), 'Unrelated translated copy preserved');
    for (const key of allowed) assert.equal(read(file).split("$string['" + key + "']").length, 2);
}
for (const file of ['styles.css', 'templates/easyedu_guide.mustache', 'amd/src/course_manager.js',
    'amd/build/course_manager.min.js', 'amd/build/easyedu_guide.min.js', 'classes/local/guide_discovery.php']) {
    assert.equal(read(file), old(file), 'No style/controller/curriculum change: ' + file);
}
console.log('PASS bounded EN/FR selection copy and localized keycaps; complete unrelated source/assets retained.');
