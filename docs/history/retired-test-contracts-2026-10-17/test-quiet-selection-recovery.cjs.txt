// SM-52 candidate: one shared public opt-in, no existing skin/controller drift.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = '97f449dd99b46189002466466b06fba1c3b88aba';
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root})
    .toString().replace(/\r\n/g, '\n');
const css = read('styles.css');
const start = css.indexOf('.easyedu-ui .foundation-selection-action.easyedu-selection-recovery-action {');
const end = css.indexOf('.easyedu-ui .easyedu-filter-reset {', start);
assert(start >= 0 && end > start);
const block = css.slice(start, end);
assert.equal(css.slice(0, start) + css.slice(end), old('styles.css'), 'All unrelated CSS identical');
for (const needle of ['min-height: 1.9rem;', 'column-gap: 0.35rem;',
    'background: transparent;', 'border-color: transparent;',
    ':focus-visible', 'var(--easyedu-focus-ring)', 'var(--easyedu-motion-normal)',
    'background: var(--easyedu-surface-soft);', 'opacity: 0.62;']) assert(block.includes(needle), needle);
assert(!block.includes('!important'));
const markup = read('templates/manage.mustache');
assert.equal(markup.split(' easyedu-selection-recovery-action').length, 2);
assert.equal(markup.replace(' easyedu-selection-recovery-action', ''), old('templates/manage.mustache'));
for (const file of ['amd/src/course_manager.js', 'amd/build/course_manager.min.js',
    'amd/build/motion.min.js', 'scss/components/_layout.scss', 'scss/responsive/_mobile.scss']) {
    assert.equal(read(file), old(file), `${file} unchanged`);
}
console.log('PASS quiet opt-in skin, complete unrelated CSS/template and controller/Motion preservation; native/human pending.');
