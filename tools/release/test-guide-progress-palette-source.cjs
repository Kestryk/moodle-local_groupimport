// Bounded successor to historical whole-CSS guards, which remain unchanged.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = 'b64821499be4af72ca93f645d8c02414026c4c81';
const normalize = value => value.replace(/\r\n/g, '\n');
const historical = file => normalize(execFileSync('git', ['show', `${base}:${file}`],
    {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
const current = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const paint = '  background: var(--easyedu-accent-soft);\n' +
    '  border-color: color-mix(in srgb, var(--easyedu-accent) 22%, var(--easyedu-surface) 78%);\n';
const css = current('styles.css');
const marker = '.path-local-groupimport .easyedu-guide.easyedu-guide--discovery .easyedu-guide-modal__progress-track {\n';
const index = css.indexOf(marker);
assert.ok(index >= 0);
const end = css.indexOf('\n}', index);
const block = css.slice(index, end);
assert.ok(block.includes(paint.trimEnd()));
assert.equal(css.slice(0, index) + block.replace(paint.trimEnd(), '').replace(/\n$/, '') + css.slice(end),
    historical('styles.css'), 'Complete unrelated CSS unchanged');
const changed = execFileSync('git', ['diff', '--name-only', base, '--',
    'amd', 'templates', 'lang', '*.php', 'scss'], {cwd: root, encoding: 'utf8'}).trim().split(/\r?\n/).filter(Boolean);
assert.deepEqual(changed, ['scss/easyedu/components/_guide-discovery.scss'],
    'All native commands, renderer, translation, Motion and other source recipes preserved');
console.log('PASS complete CSS except two Discovery track declarations; native source/Motion preserved against ' + base);
