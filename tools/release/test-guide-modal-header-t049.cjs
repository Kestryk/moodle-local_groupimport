'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const kitRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const normalizeMarkup = value => value.replace(/\s+/g, ' ').trim();

const headerContract = normalizeMarkup([
    '{{#guideeyebrow}}<p class="easyedu-guide-modal__eyebrow">{{guideeyebrow}}</p>{{/guideeyebrow}}',
    '{{#guidemodaltitle}}<h2>{{guidemodaltitle}}</h2>{{/guidemodaltitle}}',
    '{{^guidemodaltitle}}<h2>{{guidetitle}}</h2>{{/guidemodaltitle}}',
    '{{^guideeyebrow}}<p>{{guidesubtitle}}</p>{{/guideeyebrow}}',
].join('\n'));

// C-G3 (390): the product template renders a short title ("Guide EasyStud") beside the
// contextual one, swapped by CSS on phones. The Kit mirror keeps the plain h2 until it is resynchronised.
const phoneTitleContract = headerContract.replace(
    '{{#guidemodaltitle}}<h2>{{guidemodaltitle}}</h2>{{/guidemodaltitle}}',
    '{{#guidemodaltitle}}<h2>{{#guideeyebrow}}<span class="easyedu-guide-modal__title-full">{{/guideeyebrow}}' +
    '{{guidemodaltitle}}{{#guideeyebrow}}</span><span class="easyedu-guide-modal__title-short">' +
    '{{guideeyebrow}}</span>{{/guideeyebrow}}</h2>{{/guidemodaltitle}}');
assert.notEqual(phoneTitleContract, headerContract, 'phone title contract differs from the plain contract');
for (const [file, contract] of [
    ['easyedu-guide-kit/templates/easyedu_guide.mustache', headerContract],
    ['templates/easyedu_guide.mustache', phoneTitleContract],
]) {
    assert.ok(normalizeMarkup(read(file)).includes(contract), file + ': shared optional header contract');
}

const productTemplate = read('templates/easyedu_guide.mustache');
assert.ok(productTemplate.includes('guidehoverlabel'), 'EasyStud launcher copy remains product-owned.');
assert.ok(productTemplate.includes('{{#guidemodaltitle}}<h2>{{#guideeyebrow}}<span class="easyedu-guide-modal__title-full">'),
    'EasyStud can render a contextual title instead of the complete dialog label.');

const php = read('manage.php');
assert.ok(php.includes("'guideeyebrow' => get_string('guideeyebrow', 'local_groupimport')"),
    'EasyStud supplies the shared eyebrow value.');
assert.ok(php.includes("'guidemodaltitle' => get_string('easystudmanager', 'local_groupimport')"),
    'EasyStud supplies a contextual visible title.');

for (const locale of ['en', 'fr']) {
    assert.ok(read('lang/' + locale + '/local_groupimport.php').includes(
        "$string['guideeyebrow'] = 'Guide EasyStud';"),
    locale + ': Guide eyebrow is localized.');
}

for (const file of [
    'scss/easyedu/components/_guide.scss',
    'scss/easyedu/components/_guide-discovery.scss',
]) {
    const scss = read(file);
    assert.ok(scss.includes('.easyedu-guide-modal__eyebrow'), file + ': eyebrow selector');
    assert.ok(scss.includes('@include typography.type-eyebrow'), file + ': canonical eyebrow role');
}
assert.ok(read('scss/easyedu/components/_guide.scss').includes('@include typography.type-modal-title;'),
    'Guide header title uses the canonical modal-title role.');
assert.ok(read('scss/easyedu/components/_guide-discovery.scss').includes(
    'p:not(.easyedu-guide-modal__eyebrow) { display: none; }'),
    'Compact discovery keeps the eyebrow while retaining legacy subtitle behavior.');

if (kitRoot) {
    const kitTemplate = fs.readFileSync(path.join(kitRoot, 'guide/templates/easyedu_guide.mustache'), 'utf8')
        .replace(/\r\n/g, '\n');
    assert.ok(normalizeMarkup(kitTemplate).includes(headerContract), 'Canonical Kit template matches the contract.');
    for (const file of [
        'scss/easyedu/components/_guide.scss',
        'scss/easyedu/components/_guide-discovery.scss',
    ]) {
        const kitScss = fs.readFileSync(path.join(kitRoot, file), 'utf8').replace(/\r\n/g, '\n');
        assert.equal(read(file), kitScss, file + ': embedded shared SCSS matches Kit.');
    }
}

console.log(JSON.stringify({
    surface: 'T049-guide-modal-header',
    level: 'N1',
    passed: true,
    checks: 14,
    sharedTemplate: true,
    productLauncherPreserved: true,
    nativePreview: false,
}));
