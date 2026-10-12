/* eslint-env node */
// Compile the SM-RENDU modules (amd/src/local/sm/*.js) with the Moodle Babel plugins and Terser.
// Usage: node tools/release/build-sm-amd.js <Moodle build checkout root>
const fs = require('fs');
const path = require('path');
if (!process.argv[2]) { throw new Error('Pass the Moodle build checkout root.'); }
const buildRoot = path.resolve(process.argv[2]);
const pluginRoot = path.resolve(__dirname, '../..');
process.chdir(buildRoot);
global.fetch = undefined;
const babel = require(path.join(buildRoot, 'node_modules/@babel/core'));
const terser = require(path.join(buildRoot, 'node_modules/terser'));
const plugin = name => require.resolve(name, {paths: [buildRoot]});
const sourceDir = path.join(pluginRoot, 'amd/src/local/sm');
const buildDir = path.join(pluginRoot, 'amd/build/local/sm');
fs.mkdirSync(buildDir, {recursive: true});
const names = fs.readdirSync(sourceDir).filter(name => name.endsWith('.js')).sort();
Promise.all(names.map(name => {
    const base = name.replace(/\.js$/, '');
    const result = babel.transformSync(fs.readFileSync(path.join(sourceDir, name), 'utf8'), {
        filename: path.join(sourceDir, name),
        babelrc: false, configFile: false, sourceMaps: true,
        sourceFileName: '../../../src/local/sm/' + name, comments: false,
        // Moodle's add-module-to-define plugin needs the file inside the build checkout;
        // these modules only use named exports, so naming the define() call is all it would do.
        plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
            plugin('babel-plugin-system-import-transformer')],
        presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
    });
    const moduleName = `local_groupimport/local/sm/${base}`;
    if (!/^define\(\[/m.test(result.code)) {
        throw new Error(`Unexpected AMD output for ${name}.`);
    }
    const named = result.code.replace(/^define\(\[/m, `define("${moduleName}", [`);
    return terser.minify(named, {mangle: false,
        sourceMap: {content: result.map, filename: base + '.min.js', url: base + '.min.js.map'},
    }).then(output => {
        if (!output.code.startsWith(`define("local_groupimport/local/sm/${base}"`)) {
            throw new Error(`Missing canonical Moodle module name for ${name}.`);
        }
        fs.writeFileSync(path.join(buildDir, base + '.min.js'), output.code + '\n');
        fs.writeFileSync(path.join(buildDir, base + '.min.js.map'), output.map + '\n');
        return base;
    });
})).then(built => {
    process.stdout.write(`SM-RENDU AMD rebuilt: ${built.join(', ')}.\n`);
}).catch(error => { process.stderr.write(error.stack || String(error)); process.exitCode = 1; });
