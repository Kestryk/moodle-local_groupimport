/* eslint-env node */
// Strict successor of the existing native Ready recap regression. No product edits.
// Args: Playwright module, allocated pool URL, admin secret file, NEW output, phase.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const [pw, base, secret, output, phase = 'precise'] = process.argv.slice(2);
assert([pw, secret, output].every(value => value && path.isAbsolute(value)));
const target = new URL(base);
assert(['localhost', '127.0.0.1'].includes(target.hostname));
assert(['8052', '8054', '8055'].includes(target.port), 'Use only the allocated test pool');
assert(!fs.existsSync(output), 'Keep previous evidence immutable');
assert.match(phase, /^[a-z0-9-]+$/i);
fs.mkdirSync(output, {recursive: true});
const original = fs.readFileSync(path.join(__dirname, 'test-guide-ready-native.cjs'), 'utf8');
const saveAuth = 'await context.storageState({path:auth});';
assert.equal(original.split(saveAuth).length, 2, 'Review an upstream harness change');
// Keep the real login and cookies in memory; do not persist authentication artifacts.
const source = original.replace(saveAuth, '/* Authentication stays in the temporary browser context. */');
const probe = path.join(output, 'native-probe.cjs');
fs.writeFileSync(probe, source);
const child = cp.spawnSync(process.execPath, [probe, pw, base, secret, output, phase], {
    encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024,
});
fs.writeFileSync(path.join(output, 'native.log'), (child.stdout || '') + (child.stderr || ''));
assert.equal(child.status, 0, 'Existing native regression must pass without weaker assertions');
const report = JSON.parse(fs.readFileSync(path.join(output, phase + '.json'), 'utf8'));
assert.equal(report.status, 'PASS');
assert.equal(report.rows.length, 16);
assert.deepEqual(report.errors, []);
const tiles = report.rows.flatMap(row => row.tiles);
const max = key => Math.max(...tiles.map(tile => tile[key]));
assert.equal(max('overflowRight'), 0, 'Zero painted overflow beyond the right border');
assert.equal(max('overflowLeft'), 0, 'Zero painted overflow beyond the left border');
assert.equal(max('contentOverflowRight'), 0, 'Zero encroachment into right padding');
assert.equal(Math.max(0, ...tiles.map(tile => tile.paint.bottom - tile.tile.bottom)), 0);
const english = report.rows.filter(row => row.surface === 'sm' && row.lang === 'en');
assert.equal(english.length, 4);
assert(english.every(row => row.tiles.some(tile =>
    tile.text === 'One name per group, or a whole series at once.')));
assert(!fs.existsSync(path.join(output, 'auth-state.json')));
const proof = {
    status: 'PASS', cases: report.rows.length, tiles: tiles.length, consoleErrors: 0,
    overflowRight: 0, overflowLeft: 0, contentOverflowRight: 0, verticalOverflow: 0,
    originalSourceSha256: crypto.createHash('sha256').update(original).digest('hex'),
    harnessAdaptation: 'Disable disk authentication persistence only; existing DOM and paint checks retained',
};
fs.writeFileSync(path.join(output, 'precise-summary.json'), JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof));
