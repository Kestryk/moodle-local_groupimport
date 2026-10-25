'use strict';

// T037 static contract: one Guide composition surface before native N2 proof.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2] || path.join(root, '../easyedu-ui-kit-phase0-mass-admin-20260927'));
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const sourceScss = read(path.join(root, 'scss/easyedu/components/_guide-discovery.scss'));
const kitScss = read(path.join(kit, 'scss/easyedu/components/_guide-discovery.scss'));
const compiled = read(path.join(root, 'styles/student-management.css'));
const template = read(path.join(root, 'templates/easyedu_guide.mustache'));
const discovery = read(path.join(root, 'classes/local/guide_discovery.php'));
const english = read(path.join(root, 'lang/en/local_groupimport.php'));
const french = read(path.join(root, 'lang/fr/local_groupimport.php'));

assert.equal(sourceScss, kitScss, 'Guide SCSS is mirrored exactly from the pinned Kit checkout');
for (const needle of [
    '--easyedu-guide-reading-measure: 38rem',
    '&--lesson-reading',
    '@container (min-width: 52rem)',
    '&__caption--safe-example',
    '&__lane-label',
    'color: var(--easyedu-text);',
]) {
    assert.ok(sourceScss.includes(needle), 'Missing shared Guide reading recipe: ' + needle);
}
// PEN-K17/K17-35 intentionally replaces the historical two-column intermediate lane.
assert.ok(!sourceScss.includes('@container (min-width: 36rem)'), 'No obsolete two-column reading breakpoint');
assert.ok(sourceScss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'),
    'Accepted wide reading lane has three equal columns');
assert.ok(sourceScss.includes('border-inline-start: 1px solid var(--easyedu-card-border);')
    && sourceScss.includes('border-block-start: 1px solid var(--easyedu-card-border);'),
    'Accepted wide and stacked reading lanes retain their one-pixel separators');
assert.ok(compiled.includes('.easyedu-guide-scene__caption--safe-example'), 'Generated CSS contains the safe-example caption');
assert.ok(template.includes('easyedu-guide-introduction{{#lessonreading}} easyedu-guide-introduction--lesson-reading{{/lessonreading}}'),
    'Template keeps the lesson-reading opt-in explicit');
assert.ok(template.includes('easyedu-guide-scene__caption--safe-example'), 'Template marks only the simulation caption as safe');
assert.ok(template.includes('{{sourcecaption}}') && template.includes('{{destinationcaption}}'),
    'Scene lanes receive localized source and destination labels');
assert.equal((template.match(/easyedu-guide-scene__lane-label/g) || []).length, 2,
    'Exactly the current source and destination illustration lanes are labelled');
assert.ok(discovery.includes("'lessonreading' => true"), 'Compatible card/action lessons opt into reading columns');
assert.ok(discovery.includes("'sourcecaption'"), 'Discovery data supplies a source lane label');
assert.ok(english.includes("$string['discovery_sourcecaption'] = 'Source group';"), 'English source lane text is localized');
assert.ok(french.includes("$string['discovery_sourcecaption'] = 'Groupe source';"), 'French source lane text is localized');
console.log(JSON.stringify({surface: 'T037-guide-reading-composition', level: 0, passed: true, checks: 17}));
