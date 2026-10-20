'use strict';
// Bounded regressions: recap ownership, shared finished layout and Assignment wrapping.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const simple = read('templates/guide_simplecreate.mustache');
assert.equal((simple.match(/data-guide-recap hidden/g) || []).length, 1);
assert.equal((simple.match(/<li data-guide-phase=/g) || []).length, 4);
for (const key of ['phase1', 'phase2', 'phase3', 'phase4', 'recaptitle']) {
    assert(simple.includes('{{' + key + '}}'), 'Reuse localized narration: ' + key);
}
const engine = read('amd/src/easyedu_guide.js');
assert(engine.includes("['simplecreate', 'midrop', 'mipreview'].includes(kind) ? scene.querySelector('[data-guide-recap]')"));
assert(engine.includes("classList.toggle('easyedu-guide-scene__header--single', kind !== 'membership' || state === 'finished')"));
assert(engine.includes("comparison.hidden = state === 'finished'"));
const scss = read('scss/easyedu/components/_guide-specimen.scss');
assert(scss.includes('&__activity .easyedu-information__description { white-space: normal; overflow-wrap: anywhere; }'));
const mi = read('templates/guide_mass_import_scene.mustache');
const recap = mi.slice(mi.indexOf('<section class="easyedu-guide-scene__recap'));
assert(recap.includes('{{text}}'));
assert(!/viewfile|viewsubmit|viewsummary|viewstatuses|viewexcluded|viewcorrected|viewunchanged|<input|<img|<table|<svg/.test(recap));
assert(!recap.includes('easyedu-guide-mi-recap__view'));
assert(recap.includes('<ol class="easyedu-guide-scene__steps">'));
// Only the Mass Import recap loses visuals: its animated stage and Student Management renderings stay present.
assert(mi.includes('data-guide-mi-table-wrap') && mi.includes('data-guide-mi-ghost'));
assert(simple.includes('data-guide-simplecreate-result="group"') && simple.includes('data-guide-simplecreate-result="grouping"'));
assert(read('templates/easyedu_guide.mustache').includes('data-guide-filters-recap'));
console.log(JSON.stringify({test: 'guide-k20-14-17', passed: true, runtimeAccess: false}));
