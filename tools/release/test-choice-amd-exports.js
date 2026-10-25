// Execute the generated public surface, not just source-name text matches.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/searchable_choices.js'), 'utf8');
const names = [...source.matchAll(/^export const ([A-Za-z_$][\w$]*)\s*=/gm)].map(match => match[1]);
let exported;
vm.runInNewContext(fs.readFileSync(path.join(root, 'amd/build/searchable_choices.min.js'), 'utf8'), {
    define: (name, dependencies, factory) => {
        assert.equal(name, 'local_groupimport/searchable_choices');
        assert.equal(dependencies.length, 0);
        exported = factory();
    },
});
assert.deepEqual(Object.keys(exported).sort(), names.sort());
names.forEach(name => assert.equal(typeof exported[name], 'function', name));
console.log('PASS executed canonical choice AMD exports: ' + names.join(', '));
