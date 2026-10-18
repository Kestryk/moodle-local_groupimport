/* eslint-env node */
// Compile the Mass Import modules (amd/src/local/mi/*.js, GMI-C4) with the Moodle Babel plugins and
// Terser, like build-sm-amd.js does for local/sm and local/cm.
// Usage: node tools/release/build-mi-amd.cjs <Moodle build checkout root>
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
const sourceDir = path.join(pluginRoot, 'amd/src/local/mi');
const buildDir = path.join(pluginRoot, 'amd/build/local/mi');

// Mass Import must stay light: it may use the shared navigation component and the dependency-free
// Guide launcher, never the Student Management modules (local/cm, local/sm) themselves.
const allowed = ['../../easyedu_navigation', '../cm/guide_launcher', './'];
const names = fs.readdirSync(sourceDir).filter(name => name.endsWith('.js')).sort();
if (!names.length) {
    throw new Error('No Mass Import module in amd/src/local/mi.');
}
const launcher = fs.readFileSync(path.join(pluginRoot, 'amd/src/local/cm/guide_launcher.js'), 'utf8');
if (/^import\b/m.test(launcher)) {
    throw new Error('local/cm/guide_launcher.js must stay dependency-free: Mass Import loads it alone.');
}

const buildModule = name => {
    const base = name.replace(/\.js$/, '');
    const source = fs.readFileSync(path.join(sourceDir, name), 'utf8').replace(/\r\n/g, '\n');
    const statements = source.match(/^import\b/gm) || [];
    const imports = [...source.matchAll(/^import (?:\* as \w+|\w+|\{[^}]*\}) from '([^']+)';$/gm)].map(match => match[1]);
    if (imports.length !== statements.length) {
        throw new Error(`local/mi/${name}: unexpected import statement form.`);
    }
    imports.forEach(from => {
        const ok = from.startsWith('./') ? names.includes(from.slice(2) + '.js') : allowed.includes(from);
        if (!ok) {
            throw new Error(`local/mi/${name} imports a module outside its allowed set: ${from}`);
        }
    });
    if (/^export (let|var|default)\b/m.test(source)) {
        throw new Error(`local/mi/${name} must only use named constant exports.`);
    }
    const result = babel.transformSync(source, {
        filename: path.join(sourceDir, name),
        babelrc: false, configFile: false, sourceMaps: true,
        sourceFileName: '../../../src/local/mi/' + name, comments: false,
        plugins: [plugin('babel-plugin-transform-es2015-modules-amd-lazy'),
            plugin('babel-plugin-system-import-transformer')],
        presets: [[plugin('@babel/preset-env'), {modules: false, useBuiltIns: false}]],
    });
    const moduleName = `local_groupimport/local/mi/${base}`;
    if (!/^define\(\[/m.test(result.code)) {
        throw new Error(`Unexpected AMD output for mi/${name}.`);
    }
    const named = result.code.replace(/^define\(\[/m, `define("${moduleName}", [`);
    const dependencies = named.slice(0, named.indexOf(']'));
    if (/local\/sm\/|course_manager|\.\.\/cm\/(?!guide_launcher")/.test(dependencies)) {
        throw new Error(`Unexpected dependencies for mi/${name}: ${dependencies}`);
    }
    return terser.minify(named, {mangle: false,
        sourceMap: {content: result.map, filename: base + '.min.js', url: base + '.min.js.map'},
    }).then(output => {
        if (!output.code.startsWith(`define("${moduleName}"`)) {
            throw new Error(`Missing canonical Moodle module name for mi/${name}.`);
        }
        fs.mkdirSync(buildDir, {recursive: true});
        fs.writeFileSync(path.join(buildDir, base + '.min.js'), output.code + '\n');
        fs.writeFileSync(path.join(buildDir, base + '.min.js.map'), output.map + '\n');
        return `mi/${base} (${Buffer.byteLength(output.code)} bytes)`;
    });
};

Promise.all(names.map(buildModule)).then(built => {
    process.stdout.write(`Mass Import AMD rebuilt: ${built.join(', ')}.\n`);
}).catch(error => {
    process.stderr.write(error.stack || String(error));
    process.exitCode = 1;
});
