// Complete generated CSS preservation against the immutable diagnostic base.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'de2cfae86a54a91c3998a51cceeec94d475b139e';
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const old = f => execFileSync('git', ['show', `${baseline}:${f}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const css = old('styles.css');
assert.equal(css.split('max-width: 1em;').length - 1, 5);
assert.equal(read('styles.css'), css.replaceAll('max-width: 1em;', 'max-width: 100%;'));
for (const f of ['templates/manage.mustache', 'classes/form/import_form.php', 'index.php',
    'amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/src/motion.js',
    'amd/build/motion.min.js', 'scss/responsive/_mobile.scss']) {
    assert.equal(read(f), old(f), `${f} must remain unchanged`);
}
console.log('PASS exact five shared intrinsic-width declarations; complete unrelated CSS/markup/controllers/Motion preserved.');
