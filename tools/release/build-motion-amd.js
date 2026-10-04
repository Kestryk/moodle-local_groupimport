/* eslint-env node */
// Compile only this worktree's Motion source using the existing Moodle toolchain.
const fs = require('fs');
const path = require('path');
if (!process.argv[2]) { throw new Error('Pass the Moodle build checkout root.'); }
const buildRoot = path.resolve(process.argv[2]);
const pluginRoot = path.resolve(__dirname, '../..');
process.chdir(buildRoot);
const source = path.join(pluginRoot, 'amd/src/motion.js');
const target = path.join(pluginRoot, 'amd/build/motion.min.js');
global.fetch = undefined;
const babel = require(path.join(buildRoot, 'node_modules/@babel/core'));
const terser = require(path.join(buildRoot, 'node_modules/terser'));
const plugin = name => require.resolve(name, {paths: [buildRoot]});
const result = babel.transformSync(fs.readFileSync(source, 'utf8'), {
    filename: path.join(buildRoot, 'public/local/groupimport/amd/src/motion.js'),
    babelrc: false, configFile: false, sourceMaps: true,
    sourceFileName: '../src/motion.js', comments: false,
    plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
        plugin('babel-plugin-system-import-transformer'),
        path.join(buildRoot, '.grunt/babel-plugin-add-module-to-define.js')],
    presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
});
terser.minify(result.code, {mangle: false,
    sourceMap: {content: result.map, filename: 'motion.min.js', url: 'motion.min.js.map'},
}).then(output => {
    if (!output.code.startsWith('define("local_groupimport/motion"')) {
        throw new Error('Missing canonical Moodle module name.');
    }
    fs.writeFileSync(target, output.code + '\n');
    fs.writeFileSync(target + '.map', output.map + '\n');
    process.stdout.write('Motion AMD rebuilt using Moodle Babel plugins and Terser.\n');
}).catch(error => { process.stderr.write(error.stack); process.exitCode = 1; });
