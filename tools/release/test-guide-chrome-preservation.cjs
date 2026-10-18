const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2]);
const norm = text => text.replace(/\r\n/g, '\n');
const read = (repo, file) => norm(fs.readFileSync(path.join(repo, file), 'utf8'));
const before = (repo, pin, file) => norm(execFileSync('git', ['show', pin + ':' + file], {cwd: repo, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));

for (const file of ['guide/amd/src/easyedu_guide.js', 'guide/templates/easyedu_guide.mustache', 'scss/easyedu/components/_guide.scss']) {
    assert.equal(read(kit, file), before(kit, '51b4711', file), 'Complete canonical controller/template/legacy Guide unchanged: ' + file);
}
for (const file of ['amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js', 'amd/src/course_manager.js',
    'amd/src/motion.js', 'classes/local/guide_discovery.php']) {
    assert.equal(read(root, file), before(root, 'bb8f4f2', file), 'Complete consumer commands/Motion/curriculum unchanged: ' + file);
}
// K17-62/69 (Penpot K17-62-69-PRODUCT-VIEWS-2026-10-18) intentionally replaces the Display
// preferences trigger (icon-only Kit recipe) and the footer markup (390px one-line layout) in
// templates/easyedu_guide.mustache, so that file is no longer pinned to the bb8f4f2 baseline here.
// The footer/step-count CSS carve-out below already allowed the matching style delta.
assert.equal(read(root, 'scss/easyedu/components/_guide-discovery.scss'), read(kit, 'scss/easyedu/components/_guide-discovery.scss'), 'Canonical stylesheet parity');

const prefix = '.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery ';
const selectors = [
    '.easyedu-guide-modal__progress-label', '.easyedu-guide-modal__step-count', '.easyedu-guide-modal__footer',
    '.easyedu-guide-modal__title-wrap > div > p', '.easyedu-guide-modal__footer-actions', '.easyedu-guide-modal__footer-actions .btn'
];
const strip = css => {
    for (const selector of selectors) {
        const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // The compiler emits both supported consumer aliases in each rule.
        // Do not strip just one alias, or a shared header/footer selector list.
        const pair = escape(prefix + selector) + ',\\s*' +
            escape('.path-local-groupimport .easyedu-guide.easyedu-guide--discovery ' + selector);
        css = css.replace(new RegExp(pair + '\\s*\\{[^{}]*\\}', 'g'), '');
    }
    return css.replace(/\s+/g, ' ').trim();
};
const actual = strip(read(root, 'styles.css')), expected = strip(before(root, 'bb8f4f2', 'styles.css'));
if (actual !== expected) {
    let offset = 0; while (offset < Math.min(actual.length, expected.length) && actual[offset] === expected[offset]) offset++;
    throw Error('Unrelated CSS delta at ' + offset + '\nActual: ' + actual.slice(Math.max(0, offset - 100), offset + 160) +
        '\nExpected: ' + expected.slice(Math.max(0, offset - 100), offset + 160));
}
assert.match(read(kit, 'scss/easyedu/components/_guide-discovery.scss'), /height: 0\.25rem;/);
console.log('PASS complete unrelated CSS, controllers, templates, curriculum, legacy Guide and Motion; scoped canonical parity.');
