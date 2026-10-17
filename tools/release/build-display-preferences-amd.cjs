// Deterministic Moodle named AMD and map for the G1 preference controller.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
if (!process.argv[2]) { throw Error('Supply the directory containing terser.'); }
const terser = require(path.join(path.resolve(process.argv[2]), 'terser'));
const root = path.resolve(__dirname, '../..');
(async() => {
    const source = fs.readFileSync(path.join(root, 'amd/src/display_preferences.js'), 'utf8').replace(/\r\n/g, '\n');
    const result = await terser.minify({'../src/display_preferences.js': source.replace('define([', 'define("local_groupimport/display_preferences", [')}, {
        compress: true, mangle: false, sourceMap: {filename: 'display_preferences.min.js', url: 'display_preferences.min.js.map'},
    });
    vm.runInNewContext(result.code, {define: (name, deps, factory) => {
        assert.equal(name, 'local_groupimport/display_preferences');
        assert.equal(deps[1], 'core_user/repository');
        assert.equal(typeof factory({}, {}, {}, {}).init, 'function');
    }});
    fs.writeFileSync(path.join(root, 'amd/build/display_preferences.min.js'), result.code + '\n');
    fs.writeFileSync(path.join(root, 'amd/build/display_preferences.min.js.map'), result.map + '\n');
    console.log('Display preferences named AMD and map PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
