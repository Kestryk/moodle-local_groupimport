// Bounded consumer adoption: only the existing canonical focus opt-in is added.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const sass = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const baseline = '2df6a01a7b267d1c22cf87f5d2340b0b001273c5';
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
const forms = current('scss/easyedu/components/_forms.scss');
const start = forms.indexOf('// Opt-in keyboard focus for a borderless catalogue switch.');
const end = forms.indexOf('// Catalogue controls stay adjacent', start);
assert.ok(start >= 0 && end > start);
assert.equal(forms.slice(0, start) + forms.slice(end), old('scss/easyedu/components/_forms.scss'));
const classLine = '  .easyedu-ui .easyedu-filter-toggle.easyedu-filter-toggle--track-focus { @include forms.filter-toggle-track-focus; }\n';
assert.equal(current('scss/easyedu/_foundation-classes.scss').replace(classLine, ''), old('scss/easyedu/_foundation-classes.scss'));
const template = current('templates/manage.mustache');
assert.equal((template.match(/ easyedu-filter-toggle--track-focus/g) || []).length, 2);
assert.equal(template.replace(/ easyedu-filter-toggle--track-focus/g, ''), old('templates/manage.mustache'));
for (const file of ['amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/build/course_manager.min.js.map', 'manage.php']) assert.equal(current(file), old(file), file + ' unchanged');
let warnings = 0;
const css = normalize(sass.compile(path.join(root, 'scss/easystud.scss'), {logger: {warn: () => {warnings += 1;}}}).css);
let added = 0;
let restored = css.replace(/@media \(forced-colors: active\) \{\n  \.easyedu-ui \.easyedu-filter-toggle\.easyedu-filter-toggle--track-focus[^{}]*\{[^{}]*\}\n\}\n*/g, () => {added += 1; return '';});
restored = restored.replace(/\.easyedu-ui \.easyedu-filter-toggle\.easyedu-filter-toggle--track-focus[^{}]*\{[^{}]*\}\n*/g, block => {
    assert.ok(!/\b(?:width|height|padding|margin|font|transition|animation|position|display|gap)\s*:/.test(block));
    added += 1; return '';
});
assert.equal(added, 3);
exact(restored.trimEnd(), old('styles.css').trimEnd(), 'All unrelated emitted consumer CSS retained');
exact(current('styles.css').trimEnd(), css.trimEnd(), 'Generated CSS matches the current source');
console.log('PASS exactly three shared focus rules/two public label opt-ins; complete unrelated CSS, controller, commands and Motion unchanged.');
console.log(JSON.stringify({compiler: sass.info.split('\n')[0], existingCompilerWarnings: warnings}));
