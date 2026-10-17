/* eslint-env node */
// Compile only this worktree's shared Kit bubble (K-BUBBLE) using the existing Moodle toolchain.
// Moodle's add-module-to-define plugin needs the file inside the build checkout; the module only
// uses named exports, so naming the define() call is all it would do (same as build-sm-amd.js).
require('./verify-build-versions.cjs').assertNode();
const fs = require('fs');
const path = require('path');
if (!process.argv[2]) { throw new Error('Pass the Moodle build checkout root.'); }
const buildRoot = path.resolve(process.argv[2]);
const pluginRoot = path.resolve(__dirname, '../..');
process.chdir(buildRoot);
const source = path.join(pluginRoot, 'amd/src/easyedu_bubble.js');
const target = path.join(pluginRoot, 'amd/build/easyedu_bubble.min.js');
const moduleName = 'local_groupimport/easyedu_bubble';
global.fetch = undefined;
const babel = require(path.join(buildRoot, 'node_modules/@babel/core'));
const terser = require(path.join(buildRoot, 'node_modules/terser'));
const plugin = name => require.resolve(name, {paths: [buildRoot]});
const result = babel.transformSync(fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n'), {
    filename: source,
    babelrc: false, configFile: false, sourceMaps: true,
    sourceFileName: '../src/easyedu_bubble.js', comments: false,
    plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
        plugin('babel-plugin-system-import-transformer')],
    presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
});
if (!/^define\(\["exports"\]/m.test(result.code)) {
    throw new Error('The Kit bubble must stay import-free (Motion is injected).');
}
const named = result.code.replace(/^define\(\[/m, `define("${moduleName}", [`);
terser.minify(named, {mangle: false,
    sourceMap: {content: result.map, filename: 'easyedu_bubble.min.js', url: 'easyedu_bubble.min.js.map'},
}).then(output => {
    if (!output.code.startsWith(`define("${moduleName}"`)) {
        throw new Error('Missing canonical Moodle module name.');
    }
    fs.writeFileSync(target, output.code + '\n');
    fs.writeFileSync(target + '.map', output.map + '\n');
    process.stdout.write('Kit bubble AMD rebuilt using Moodle Babel plugins and Terser.\n');
}).catch(error => { process.stderr.write(error.stack); process.exitCode = 1; });
