// Bounded consumer adoption: only the existing canonical focus opt-in is added.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const sass = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const baseline = 'e2c0fee0fa8a361e7436f90d668660449ab55a28';
const normalize = value => value.replace(/\r\n/g, '\n');
const old = file => normalize(execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
const current = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const exact = (actual, expected, label) => {
    const digest = value => createHash('sha256').update(value).digest('hex');
    if (actual !== expected) {
        let offset = 0;
        while (offset < Math.min(actual.length, expected.length) && actual[offset] === expected[offset]) offset += 1;
        console.error(JSON.stringify({label, offset, actualLength: actual.length, expectedLength: expected.length,
            actualSample: actual.slice(Math.max(0, offset - 100), offset + 180),
            expectedSample: expected.slice(Math.max(0, offset - 100), offset + 180)}));
    }
    assert.equal(digest(actual), digest(expected), label);
};
const buttons = current('scss/easyedu/components/_buttons.scss');
const start = buttons.indexOf('// Explicit field-peer density.');
const end = buttons.indexOf('@mixin close-button', start);
assert.ok(start > 0 && end > start);
assert.equal(buttons.slice(0, start) + buttons.slice(end), old('scss/easyedu/components/_buttons.scss'));
const kitButtons = normalize(fs.readFileSync(path.join(process.argv[3], 'scss/easyedu/components/_buttons.scss'), 'utf8'));
assert.equal(buttons.slice(start, end), kitButtons.slice(kitButtons.indexOf('// Explicit field-peer density.'), kitButtons.indexOf('@mixin close-button')));
const classLine = '  .easyedu-ui .easyedu-filter-reset.easyedu-filter-reset--field-peer { @include buttons.filter-reset-field-peer; }\n';
assert.equal(current('scss/easyedu/_foundation-classes.scss').replace(classLine, ''), old('scss/easyedu/_foundation-classes.scss'));
const template = current('templates/manage.mustache');
assert.equal((template.match(/ easyedu-filter-reset--field-peer/g) || []).length, 4);
assert.equal(template.replace(/ easyedu-filter-reset--field-peer/g, ''), old('templates/manage.mustache'));
for (const file of ['amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/build/course_manager.min.js.map', 'manage.php']) assert.equal(current(file), old(file), file + ' unchanged');
let warnings = 0;
const css = normalize(sass.compile(path.join(root, 'scss/easystud.scss'), {logger: {warn: () => {warnings += 1;}}}).css);
let added = 0;
let restored = css.replace(/@media \(max-width: 52rem\), \(pointer: coarse\) \{\n  \.easyedu-ui \.easyedu-filter-reset\.easyedu-filter-reset--field-peer \{[^{}]*\}\n\}\n*/g, block => {assert.match(block, /min-height: var\(--easyedu-touch-target-min\)/); added++; return '';});
restored = restored.replace(/\.easyedu-ui \.easyedu-filter-reset\.easyedu-filter-reset--field-peer \{[^{}]*\}\n*/g, block => {
    assert.match(block, /box-sizing: border-box;/);
    assert.match(block, /min-height: 2\.375rem;/);
    assert.ok(!/\b(?:padding|margin|font|transition|animation|position|display|gap)\s*:/.test(block));
    added++; return '';
});
assert.equal(added, 2);
exact(restored.trimEnd(), old('styles.css').trimEnd(), 'All unrelated emitted consumer CSS retained');
exact(current('styles.css').trimEnd(), css.trimEnd(), 'Generated CSS matches the current source');
console.log('PASS exactly two shared density rules/four public Reset opt-ins; complete unrelated CSS, controller, commands and Motion unchanged.');
console.log(JSON.stringify({compiler: sass.info.split('\n')[0], existingCompilerWarnings: warnings}));
