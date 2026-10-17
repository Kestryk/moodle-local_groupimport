/* eslint-env node */
// Build an external worktree with Moodle's Babel plugins and Terser, without
// overwriting the shared build checkout's source. Its component path supplies
// Moodle's module-name resolver; the compiled input is always this worktree.
const fs = require('fs');
const path = require('path');
const buildRoot = path.resolve(process.argv[2] || '');
const pluginRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(pluginRoot, 'amd/src/navigation.js');
const target = path.join(pluginRoot, 'amd/build/navigation.min.js');
if (!process.argv[2]) { throw new Error('Pass the Moodle build checkout root.'); }
process.chdir(buildRoot);
// This pinned source-map version mistakes Node's fetch for a browser loader.
// Force its native filesystem WASM loader in this build process only.
global.fetch = undefined;
const babel = require(path.join(buildRoot, 'node_modules/@babel/core'));
const terser = require(path.join(buildRoot, 'node_modules/terser'));
const plugin = name => require.resolve(name, {paths: [buildRoot]});
const result = babel.transformSync(fs.readFileSync(sourceFile, 'utf8'), {
    filename: path.join(buildRoot, 'public/local/groupimport/amd/src/navigation.js'),
    babelrc: false, configFile: false, sourceMaps: true,
    sourceFileName: '../src/navigation.js', comments: false,
    plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
        plugin('babel-plugin-system-import-transformer'),
        path.join(buildRoot, '.grunt/babel-plugin-add-module-to-define.js')],
    presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
});
terser.minify(result.code, {mangle: false,
    sourceMap: {content: result.map, filename: 'navigation.min.js', url: 'navigation.min.js.map'},
}).then(output => {
    if (!output.code.includes('local_groupimport/navigation')) {
        throw new Error('Missing canonical Moodle module name.');
    }
    fs.writeFileSync(target, output.code + '\n');
    fs.writeFileSync(target + '.map', output.map + '\n');
    process.stdout.write('Native navigation adapter AMD rebuilt using Moodle Babel plugins and Terser.\n');
}).catch(error => { process.stderr.write(error.stack); process.exitCode = 1; });
