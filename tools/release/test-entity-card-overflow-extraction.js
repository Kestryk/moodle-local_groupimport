// Source-only successor; preserve historical token pins instead of rewriting them.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kitRoot = process.argv[2];
assert(kitRoot, 'Supply the canonical Kit checkout');
const base = '6ca62c5';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = name => normalize(fs.readFileSync(path.join(root, name), 'utf8'));
const before = name => normalize(execFileSync('git', ['show', `${base}:${name}`],
    {cwd: root, maxBuffer: 16 * 1024 * 1024}).toString());
const modulePath = 'scss/easyedu/components/_entity-metadata.scss';
const manifest = JSON.parse(read('easyedu-kit-docs/easyedu-kit.json'));
const pin = manifest.consumerSync.entityCardOverflowExtraction;
const canonicalManifest = JSON.parse(fs.readFileSync(path.join(kitRoot, 'easyedu-kit.json'), 'utf8'));
assert.equal(manifest.version, canonicalManifest.version);
assert.equal(pin.baseline, base);
assert.equal(pin.moduleBlob, execFileSync('git', ['hash-object', modulePath], {cwd: root}).toString().trim());
assert.equal(read(modulePath), normalize(fs.readFileSync(path.join(kitRoot, modulePath), 'utf8')));
assert.equal(read('styles.css'), before('styles.css'), 'Complete compiled CSS changed');
assert.equal(pin.normalizedCssSha256, crypto.createHash('sha256').update(read('styles.css')).digest('hex'));
const structure = read('scss/components/_structure.scss');
const start = structure.indexOf('  &-tags-toggle {');
const end = structure.indexOf('  [data-selectable-type].is-selected', start);
assert(start > 0 && end > start, 'Missing original overflow scope');
const overflow = structure.slice(start, end);
for (const recipe of ['control', 'token', 'feedback', 'link'])
    assert(overflow.includes(`@include easyedu.entity-card-overflow-${recipe}`));
for (const role of ['role', 'group', 'grouping', 'custom-info'])
    assert(overflow.includes(`@include easyedu.entity-card-token-semantic(${role}`));
assert.equal((overflow.match(/\$legacy-priority: true/g) || []).length, 7);
assert(!/!important|font-size:|padding:|border-color:|background:/.test(overflow),
    'Consumer scope must delegate presentation, not duplicate it');
for (const alias of ['accent-soft', 'primary)', 'primary-strong)'])
    assert(overflow.includes('--local-groupimport-easystud-' + alias));
assert.equal(structure.slice(0, start), before('scss/components/_structure.scss').slice(0, start));
const oldStructure = before('scss/components/_structure.scss');
assert.equal(structure.slice(end), oldStructure.slice(oldStructure.indexOf(
    '  [data-selectable-type].is-selected', oldStructure.indexOf('  &-tags-toggle {'))));
assert(!/local-groupimport|course-banner-builder|data-easystud|@keyframes/.test(read(modulePath)));
assert.equal(execFileSync('git', ['diff', base, '--name-only', '--', 'amd', 'js', 'templates',
    'classes', 'db', 'lang', 'manage.php', 'index.php', 'settings.php', 'ajax.php', 'version.php'],
    {cwd: root}).toString().trim(), '', 'Native markup/commands/data/Motion changed');
for (const name of ['scss/easyedu/components/_feedback.scss', 'scss/easyedu/components/_loading.scss',
    'scss/easyedu/components/_cards.scss']) assert.equal(read(name), before(name));
assert.deepEqual(manifest.consumerSync.entityCardTokenExtraction,
    JSON.parse(before('easyedu-kit-docs/easyedu-kit.json')).consumerSync.entityCardTokenExtraction,
    'Earlier proof pins must remain historical');
console.log('PASS: canonical overflow extraction, complete CSS identity and untouched native markup/commands/Motion. Human acceptance remains open.');
