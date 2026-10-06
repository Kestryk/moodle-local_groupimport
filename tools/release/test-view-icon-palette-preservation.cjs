const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '6a6c65b76a96b5cd99da538b8beb0a54012a6c6f';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const before = 'easyedu-workspace-view-switcher" role="group" aria-label="{{selectionmodelabel}}"';
const after = 'easyedu-workspace-view-switcher easyedu-workspace-view-switcher--tiled" role="group" aria-label="{{selectionmodelabel}}"';
assert.equal(read('templates/manage.mustache'), old('templates/manage.mustache').replace(before, after));
const css = read('styles.css');
let blocks = 0;
const withoutPaint = css.replace(/\.easyedu-ui \.easyedu-workspace-view-switcher--tiled[^{}]*\{[^{}]*\}\n(?:\n)?/g, block => {
    assert.ok(!/\b(?:width|height|padding|margin|font-size|transform|transition|position|display)\s*:/.test(block));
    blocks++;
    return '';
});
assert.equal(blocks, 4, 'Exactly rest / hover-focus / pressed / disabled shared paint rules');
assert.ok(withoutPaint === old('styles.css'), 'Complete unrelated compiled CSS identity');
for (const file of ['amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/build/course_manager.min.js.map',
    'amd/src/motion.js', 'amd/build/motion.min.js', 'amd/src/searchable_choices.js', 'amd/build/searchable_choices.min.js',
    'lib.php', 'manage.php', 'index.php', 'settings.php', 'ajax.php', 'js/admin_settings_loading.js',
    'scss/components/_layout.scss', 'scss/responsive/_desktop.scss', 'scss/responsive/_mobile.scss']) {
    assert.equal(read(file), old(file), `${file}: complete preservation`);
}
assert.equal(read('scss/easyedu/_workspace-control-classes.scss'),
    fs.readFileSync(path.resolve(process.argv[2], 'scss/easyedu/_workspace-control-classes.scss'), 'utf8').replace(/\r\n/g, '\n'),
    'Canonical Kit module identity');
console.log('PASS shared module identity, one class-only adapter, four paint rules and complete unrelated CSS/controllers/Motion.');
