'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const keys = {};
for (const language of ['en', 'fr']) {
    const source = fs.readFileSync(path.join(root, 'lang', language, 'local_groupimport.php'), 'utf8');
    const found = new Map();
    for (const match of source.matchAll(/^\$string\[['"]([^'"]+)['"]\]\s*=/gm)) {
        const line = source.slice(0, match.index).split('\n').length;
        assert.ok(!found.has(match[1]), `${language}:${line}: duplicate ${match[1]} (first: ${found.get(match[1])})`);
        found.set(match[1], line);
    }
    assert.ok(found.size > 1000, 'Language file was fully inspected');
    keys[language] = [...found.keys()].sort();
}
assert.deepEqual(keys.en, keys.fr, 'FR/EN expose identical unique keys');
console.log(`PASS: ${keys.en.length} unique keys per language, FR/EN parity`);
