// R10-29 successor: old feature-pinned guards intentionally retain their scope.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = '2c22f1acb3f0f16bcb4cb6e369dcca166a1ce3b1';
const norm = text => text.replace(/\r\n/g, '\n');
const before = file => norm(execFileSync('git', ['show', base + ':' + file], {
    cwd: root, encoding: 'utf8', maxBuffer: 10000000
}));
const current = file => norm(fs.readFileSync(path.join(root, file), 'utf8'));
for (const file of ['manage.php', 'classes/local/guide_discovery.php', 'templates/easyedu_guide.mustache',
    'amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js', 'amd/build/easyedu_guide.min.js.map',
    'easyedu-guide-kit/amd/src/easyedu_guide.js', 'lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php']) {
    assert.ok(before(file) === current(file), 'Retained complete source: ' + file);
}
const omitFamily = text => {
    const start = text.indexOf('.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery .easyedu-guide-introduction,');
    const end = text.indexOf('.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery .easyedu-guide-modal__fullscreen,', start);
    assert.ok(start >= 0 && end > start, 'Exact compiled family boundaries');
    return text.slice(0, start) + text.slice(end);
};
assert.ok(omitFamily(before('styles.css')) === omitFamily(current('styles.css')), 'Complete non-family CSS unchanged');
const omitScss = text => {
    const start = text.indexOf('  .easyedu-guide-introduction {');
    const end = text.indexOf('  .easyedu-guide-modal__fullscreen', start);
    assert.ok(start >= 0 && end > start);
    return text.slice(0, start) + text.slice(end);
};
assert.ok(omitScss(before('scss/easyedu/components/_guide-discovery.scss')) ===
    omitScss(current('scss/easyedu/components/_guide-discovery.scss')), 'Other shared recipes retained');
console.log('PASS R10-29 baseline: complete content/template/engine/build retained; only common-family SCSS/CSS changes.');
