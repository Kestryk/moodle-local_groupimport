// Source-only successor: presentation ownership moves, complete emitted CSS does not.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kitRoot = process.argv[2];
assert(kitRoot, 'Supply the canonical Kit checkout');
const base = '018d44e';
const normalize = value => value.replace(/\r\n/g, '\n');
const read = name => normalize(fs.readFileSync(path.join(root, name), 'utf8'));
const before = name => normalize(execFileSync('git', ['show', `${base}:${name}`], {cwd: root, maxBuffer: 16 * 1024 * 1024}).toString());
const modulePath = 'scss/easyedu/components/_entity-metadata.scss';
const manifest = JSON.parse(read('easyedu-kit-docs/easyedu-kit.json'));
const canonicalManifest = JSON.parse(fs.readFileSync(path.join(kitRoot, 'easyedu-kit.json'), 'utf8'));
assert.equal(manifest.version, canonicalManifest.version);
assert.equal(manifest.consumerSync.entityCardTokenExtraction.moduleBlob,
    execFileSync('git', ['hash-object', modulePath], {cwd: root}).toString().trim());
assert.equal(read(modulePath), normalize(fs.readFileSync(path.join(kitRoot, modulePath), 'utf8')),
    'Embedded metadata module must be canonical');
assert.equal(read('styles.css'), before('styles.css'), 'Complete compiled CSS must remain byte-identical after newline normalization');
const structure = read('scss/components/_structure.scss');
assert(structure.includes('@include easyedu.entity-card-token;'));
for (const role of ['valid', 'invalid', 'role', 'group', 'grouping', 'custom-info', 'empty'])
    assert(structure.includes(`@include easyedu.entity-card-token-semantic(${role}`), `Missing adapter: ${role}`);
assert(structure.includes('$danger-surface: var(--local-groupimport-easystud-danger-soft)'));
assert(structure.includes('$accent-surface: var(--local-groupimport-easystud-accent-soft)'));
assert(!/local-groupimport|course-banner-builder|data-easystud|@keyframes/.test(read(modulePath)));
const untouched = execFileSync('git', ['diff', base, '--name-only', '--', 'amd', 'js', 'templates', 'classes', 'db', 'lang',
    'manage.php', 'index.php', 'settings.php', 'ajax.php', 'version.php'], {cwd: root}).toString().trim();
assert.equal(untouched, '', 'Commands, native data, templates and Motion must remain unchanged');
for (const name of ['scss/easyedu/components/_feedback.scss', 'scss/easyedu/components/_loading.scss',
    'scss/easyedu/components/_cards.scss']) assert.equal(read(name), before(name));
const hash = crypto.createHash('sha256').update(read('styles.css')).digest('hex');
assert.equal(manifest.consumerSync.entityCardTokenExtraction.normalizedCssSha256, hash);
console.log(`PASS: canonical token extraction; complete normalized CSS SHA256 ${hash}; no commands/templates/Motion changes. Source-only, not new visual acceptance.`);
