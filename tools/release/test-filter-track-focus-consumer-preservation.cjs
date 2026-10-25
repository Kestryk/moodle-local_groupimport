// Keep the live focus and ordered non-geometry contract after I9 retired styles.css.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), sass = require(process.argv[2]);
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
assert.equal((read('templates/manage.mustache').match(/ easyedu-filter-toggle--track-focus/g) || []).length, 2);
const forms = read('scss/easyedu/components/_forms.scss');
assert.match(forms, /input:focus-visible:not\(:disabled\) \+ span::before/);
const result = require('./lib/scss-optin-preservation.cjs')(root, sass, 'forms.filter-toggle-track-focus',
    '.easyedu-filter-toggle--track-focus');
assert.equal(result.added.length, 3);
for (const row of result.added) {
    assert.ok(row.declarations.every(([prop]) => /^(box-shadow|outline(?:-color|-offset|-style|-width)?|border-color)$/.test(prop)),
        'The opt-in may paint focus only, never change geometry, typography or Motion');
}
const ring = result.added.find(row => row.selector.includes('input:focus-visible:not(:disabled) + span::before') && !row.parents.length);
assert.ok(ring && ring.declarations.some(([prop, value]) => prop === 'box-shadow' && value.includes('--easyedu-focus')));
const forced = result.added.find(row => row.parents.some(([name, value]) => name === 'media' && value === '(forced-colors: active)'));
assert.ok(forced && forced.declarations.some(([prop, value]) => prop === 'outline-color' && value === 'Highlight'));
console.log(JSON.stringify({passed: true, preservedRules: result.preserved, publicLabels: 2, focusRules: 3,
    geometryAndMotionUnchanged: true, disabledExcluded: true, forcedColours: true}));