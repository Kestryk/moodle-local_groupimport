/* eslint-env node */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const guard = require('./verify-build-versions.cjs');
guard.assertNode();
assert.throws(() => guard.assertNode('20.17.0'), /requires Node 22\.11\.0; running 20\.17\.0/);
assert.throws(() => guard.assertNode('22.12.0'), /requires Node 22\.11\.0/);
assert.throws(() => guard.assertSass({info: 'dart-sass\t1.80.0\t(Sass Compiler)'}),
    /requires Dart Sass 1\.79\.1; loaded 1\.80\.0/);
assert.throws(() => guard.assertSass({info: ''}), /loaded unknown/);
guard.assertSass({info: 'dart-sass\t1.79.1\t(Sass Compiler)'});
const builders = fs.readdirSync(__dirname).filter(file => /^build.*\.(?:cjs|js)$/.test(file));
for (const file of builders) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const marker = "require('./verify-build-versions.cjs').assertNode();";
    assert.ok(source.includes(marker), file + ': explicit entry guard');
    assert.ok(source.indexOf(marker) < source.indexOf('const '), file + ': guard precedes build work');
}
for (const file of ['build-styles.cjs', 'build-page-styles.cjs']) {
    assert.ok(fs.readFileSync(path.join(__dirname, file), 'utf8').includes('.assertSass(sass)'),
        file + ': loaded Sass compiler is checked before compilation');
}
process.stdout.write(JSON.stringify({surface: 'TRI38-exact-build-versions', passed: true,
    node: guard.versions.node, sass: guard.versions.sass, guardedBuilders: builders.length,
    rejectedVersions: 4, dependencyChanges: false}) + '\n');
