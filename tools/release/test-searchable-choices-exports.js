/* eslint-env node */
// Execute the built module: string presence cannot prove a callable AMD export.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/searchable_choices.js'), 'utf8');
const built = fs.readFileSync(path.join(root, 'amd/build/searchable_choices.min.js'), 'utf8');
let api;
vm.runInNewContext(built, {define(name, dependencies, factory) {
    assert.equal(name, 'local_groupimport/searchable_choices');
    assert.equal(dependencies.length, 0);
    api = factory();
}});
const expected = [...source.matchAll(/^export const ([A-Za-z_$][\w$]*)\s*=/gm)].map(match => match[1]);
assert.deepEqual(Object.keys(api).sort(), expected.sort());
for (const name of expected) assert.equal(typeof api[name], 'function', name);
assert.equal(api.closeChoicesWithin(null), 0);
assert.equal(api.closeChoicesWithin({querySelectorAll: () => []}), 0);
console.log('PASS: every public source function is a callable generated AMD export, including nested closure.');
