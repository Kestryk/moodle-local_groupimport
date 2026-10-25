// Reconstruct every original archived byte after presentation-only physical wrapping.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const folder = path.join(root, 'docs/history/retired-test-contracts-2026-10-17');
const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'physical-wraps.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const entry of manifest.files) {
    const wrapped = fs.readFileSync(path.join(folder, entry.file));
    assert.equal(sha(wrapped), entry.wrappedSha256, entry.file + ': wrapped bytes');
    assert.equal(wrapped.at(-1), 10, entry.file + ': final LF');
    const lines = wrapped.subarray(0, -1).toString('utf8').split('\n');
    assert(lines.every(line => Buffer.byteLength(line) <= 132), entry.file + ': physical line budget');
    const originals = [];
    let position = 0;
    for (const count of entry.physicalLinesPerOriginalLine) {
        assert(Number.isInteger(count) && count > 0, entry.file + ': exact reconstruction count');
        originals.push(lines.slice(position, position + count).join(''));
        position += count;
    }
    assert.equal(position, lines.length, entry.file + ': all physical lines accounted for');
    const original = Buffer.from(originals.join('\n') + '\n');
    assert.equal(original.length, entry.originalBytes, entry.file + ': original byte length');
    assert.equal(sha(original), entry.originalSha256, entry.file + ': original exact SHA-256');
}
console.log(JSON.stringify({passed: true, archives: manifest.files.length, exactOriginalBytesPreserved: true}));
