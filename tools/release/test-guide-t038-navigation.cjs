#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const kit = path.resolve(root, '..', 'easyedu-ui-kit-phase0-mass-admin-20260927');
const checks = [];

const read = file => fs.readFileSync(file, 'utf8');
const normalize = value => value.replace(/\r\n/g, '\n');
const assert = (condition, label) => {
    checks.push({label, passed: Boolean(condition)});
    if (!condition) {
        throw new Error(`T038 contract failed: ${label}`);
    }
};

const sourceGuide = path.join(root, 'scss', 'easyedu', 'components', '_guide.scss');
const sourceDiscovery = path.join(root, 'scss', 'easyedu', 'components', '_guide-discovery.scss');
const kitGuide = path.join(kit, 'scss', 'easyedu', 'components', '_guide.scss');
const kitDiscovery = path.join(kit, 'scss', 'easyedu', 'components', '_guide-discovery.scss');
const guideScss = read(sourceGuide);
const discoveryScss = read(sourceDiscovery);
const template = read(path.join(root, 'templates', 'easyedu_guide.mustache'));
const discovery = read(path.join(root, 'classes', 'local', 'guide_discovery.php'));

assert(normalize(guideScss) === normalize(read(kitGuide)), 'shared Guide SCSS is identical in Kit and consumer');
assert(normalize(discoveryScss) === normalize(read(kitDiscovery)), 'shared Discovery SCSS is identical in Kit and consumer');
assert(guideScss.includes('.easyedu-guide-nav-item__path'), 'Guide supplies an explicit path glyph role');
assert(guideScss.includes('> .fa:not(.easyedu-guide-nav-item__path),'),
    'generic chapter-icon paint does not override the compact route pictogram');
assert(!guideScss.includes('content: attr(data-easyedu-guided-label)'), 'Guide no longer paints a text path badge');
assert(guideScss.includes('overflow-wrap: anywhere;') && guideScss.includes('white-space: normal;'),
    'Guide navigation labels may wrap instead of truncating');
assert(discoveryScss.includes('text-overflow: clip;') && discoveryScss.includes('white-space: normal;'),
    'Discovery navigation does not restore ellipsis truncation');
assert(template.includes('data-easyedu-guided-label="{{guidebadgelabel}}"'), 'legacy accessible path label contract is retained');
assert(template.includes('easyedu-guide-nav-item__path fa fa-route'), 'guided navigation renders the route pictogram');
assert(discovery.includes("$slide['navtitle'] = get_string('guide_nav_' . ($index + 1), 'local_groupimport');"),
    'modern curriculum consumes separate short labels');
assert(discovery.includes("$slide['navnumber'] = $index + 1;") && discovery.includes("$slide['navcategorymanaged'] = true;"),
    'modern curriculum preserves numbering and managed chapters');
assert(discovery.includes("$slide['navcategorylabel'] = $category !== $previouscategory ? $category : '';"),
    'chapter label is emitted once per consecutive group');

const expected = {
    en: ['The guide', 'Landmarks', 'Structure', 'Participant', 'Group', 'Grouping', 'Organise', 'Filter', 'Identifiers', 'Actions', 'Group assignment', 'Ready'],
    fr: ['Le guide', 'Repères', 'Structure', 'Participant', 'Groupe', 'Groupement', 'Organiser', 'Filtrer', 'Identifiants', 'Actions', 'Devoir de groupe', 'Prêt'],
};
for (const [language, labels] of Object.entries(expected)) {
    const languageFile = read(path.join(root, 'lang', language, 'local_groupimport.php'));
    labels.forEach((label, index) => {
        assert(languageFile.includes(`$string['guide_nav_${index + 1}'] = '${label}';`),
            `${language} short navigation label ${index + 1} matches the approved wording`);
    });
}

process.stdout.write(`${JSON.stringify({
    surface: 'T038-guide-navigation', level: 0, passed: true, checks: checks.length,
})}\n`);
