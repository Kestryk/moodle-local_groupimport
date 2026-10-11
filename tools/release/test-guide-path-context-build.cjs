// New successor; historical whole-engine tests stay pinned, not silently rewritten.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = 'afa41fcc92dafd5e823706b860b1c2efbe49f804';
const old = file => execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}).replace(/\r\n/g, '\n');
const source = read('amd/src/easyedu_guide.js');
const canonical = read('easyedu-guide-kit/amd/src/easyedu_guide.js');
const bounded = text => text.slice(text.indexOf('const getStateKey ='), text.indexOf('const resolveTarget ='));
assert.equal(bounded(source), bounded(canonical).replace(/export const /g, 'const '));
let reconstructed = source;
const start = reconstructed.indexOf('// Opt-in ID-only context.');
const end = reconstructed.indexOf('const getCompletedSteps =', start);
assert.ok(start >= 0 && end > start);
reconstructed = reconstructed.slice(0, start) + reconstructed.slice(end);
reconstructed = reconstructed.replace('const state = withoutPathContext(loadGuideState(config), pathName);',
    'const state = loadGuideState(config);');
const from = reconstructed.indexOf('      // New context sessions invalidate obsolete native callbacks,');
const to = reconstructed.indexOf('      if (isPathComplete(', from);
assert.ok(from >= 0 && to > from);
reconstructed = reconstructed.slice(0, from) + reconstructed.slice(to);
for (const name of ['getPathContext', 'getPathContextToken', 'setPathContext']) {
    reconstructed = reconstructed.replace('  ' + name + ': ' + name + ',\n', '');
}
assert.equal(reconstructed, old('amd/src/easyedu_guide.js'), 'Complete unrelated adapted engine preserved');
const protectedFiles = ['amd/src/course_manager.js', 'amd/build/course_manager.min.js',
    'amd/build/course_manager.min.js.map', 'amd/src/motion.js', 'amd/build/motion.min.js',
    'manage.php', 'classes/local/guide_discovery.php', 'ajax.php', 'settings.php', 'version.php',
    'templates/manage.mustache', 'templates/easyedu_guide.mustache', 'styles.css',
    'lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php'];
protectedFiles.forEach(file => assert.equal(read(file), old(file), file));
let built;
vm.runInNewContext(read('amd/build/easyedu_guide.min.js'), {
    define: (name, dependencies, factory) => {built = {name, dependencies, api: factory()};},
});
assert.equal(built.name, 'local_groupimport/easyedu_guide');
assert.deepEqual(Array.from(built.dependencies), []);
assert.deepEqual(Object.keys(built.api).sort(), ['destroy', 'getPathContext', 'getPathContextToken', 'init', 'setPathContext']);
for (const name of Object.keys(built.api)) assert.equal(typeof built.api[name], 'function');
assert.equal(built.api.getPathContext(null, 'qa'), null);
assert.equal(built.api.getPathContextToken(null, 'qa'), null);
assert.equal(built.api.setPathContext(null, 'qa', {}, null), false);
const map = JSON.parse(read('amd/build/easyedu_guide.min.js.map'));
assert.equal(Object.prototype.hasOwnProperty.call(map, 'sourcesContent'), false);
console.log(JSON.stringify({status: 'PASS', callableExports: 5, protectedProductFiles: protectedFiles.length,
    completeUnrelatedEnginePreserved: true, baseline,
    scope: 'Adapted canonical parity and generated AMD; no new path or native business completion proof'}, null, 2));
