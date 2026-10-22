/* eslint-env node */
// Compile the dependency-free shared leaf modules directly under amd/src/local
// (X9: single definitions reused by local/sm, local/cm and local/mi) with the
// Moodle Babel plugins and Terser, like build-sm-amd.js does for local/sm and local/cm.
// Usage: node tools/release/build-local-shared-amd.cjs <Moodle build checkout root>
require('./verify-build-versions.cjs').assertNode();
const fs = require('fs');
const path = require('path');
if (!process.argv[2]) {
    throw new Error('Pass the Moodle build checkout root.');
}
const buildRoot = path.resolve(process.argv[2]);
const pluginRoot = path.resolve(__dirname, '../..');
process.chdir(buildRoot);
global.fetch = undefined;
const babel = require(path.join(buildRoot, 'node_modules/@babel/core'));
const terser = require(path.join(buildRoot, 'node_modules/terser'));
const plugin = name => require.resolve(name, {paths: [buildRoot]});
const sourceDir = path.join(pluginRoot, 'amd/src/local');
const buildDir = path.join(pluginRoot, 'amd/build/local');
const names = fs.readdirSync(sourceDir).filter(name => name.endsWith('.js')).sort();
if (!names.length) {
    throw new Error('No shared leaf module in amd/src/local.');
}

const buildModule = name => {
    const base = name.replace(/\.js$/, '');
    const source = fs.readFileSync(path.join(sourceDir, name), 'utf8').replace(/\r\n/g, '\n');
    // Dependency-free on purpose: any module importing one of these must not pull in anything
    // else through it (Mass Import, the course manager and SM-RENDU all reuse these leaves).
    if (/^import\b/m.test(source)) {
        throw new Error(`local/${name} must stay dependency-free: it is reused by lighter consumers.`);
    }
    if (/^export (let|var|default)\b/m.test(source)) {
        throw new Error(`local/${name} must only use named constant exports.`);
    }
    const result = babel.transformSync(source, {
        filename: path.join(sourceDir, name),
        babelrc: false, configFile: false, sourceMaps: true,
        sourceFileName: '../../src/local/' + name, comments: false,
        plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
            plugin('babel-plugin-system-import-transformer')],
        presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
    });
    const moduleName = `local_groupimport/local/${base}`;
    if (!/^define\(\[/m.test(result.code)) {
        throw new Error(`Unexpected AMD output for local/${name}.`);
    }
    const named = result.code.replace(/^define\(\[/m, `define("${moduleName}", [`);
    if (!/^define\("[^"]+", \["exports"\]/.test(named)) {
        throw new Error(`Unexpected dependencies for local/${name}: must only declare "exports".`);
    }
    return terser.minify(named, {mangle: false,
        sourceMap: {content: result.map, filename: base + '.min.js', url: base + '.min.js.map'},
    }).then(output => {
        if (!output.code.startsWith(`define("${moduleName}"`)) {
            throw new Error(`Missing canonical Moodle module name for local/${name}.`);
        }
        fs.mkdirSync(buildDir, {recursive: true});
        fs.writeFileSync(path.join(buildDir, base + '.min.js'), output.code + '\n');
        fs.writeFileSync(path.join(buildDir, base + '.min.js.map'), output.map + '\n');
        return base;
    });
};

Promise.all(names.map(buildModule)).then(built => {
    process.stdout.write('Shared leaf AMD modules rebuilt: ' + built.join(', ') + '\n');
}).catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
