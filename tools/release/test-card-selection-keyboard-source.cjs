const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '3889045790230405454269fa6b2977ddc865898c';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const markup = '<input type="checkbox" data-easystud-selector-input="1" tabindex="-1">';
const replacement = '<input type="checkbox" data-easystud-selector-input="1">';
assert.equal(old('templates/manage.mustache').split(markup).length - 1, 10);
assert.ok(read('templates/manage.mustache') === old('templates/manage.mustache').split(markup).join(replacement),
    'Only ten real checkbox tabindex exclusions removed; all markup/styles preserved');
const expected = old('amd/src/course_manager.js').replace('    checkbox.tabIndex = -1;\n', '')
    .split(markup).join(replacement);
assert.ok(read('amd/src/course_manager.js') === expected,
    'Only three dynamic checkbox tabindex exclusions removed; all handlers/Guide/Motion preserved');
for (const file of ['styles.css', 'scss/responsive/_mobile.scss', 'scss/easyedu/components/_forms.scss',
    'amd/src/motion.js', 'amd/build/motion.min.js', 'templates/easyedu_navigation.mustache']) {
    assert.ok(read(file) === old(file), `${file}: complete identity`);
}
console.log('PASS ten static/three dynamic native checkbox exclusions removed; complete other source/CSS/Motion preserved.');
