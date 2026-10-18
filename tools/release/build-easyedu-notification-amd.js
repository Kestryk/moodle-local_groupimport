/* eslint-env node */
// K18-16: build the direct AMD Kit V3 notification module (same recipe as the Guide welcome adapter).
require('./verify-build-versions.cjs').assertNode();
const fs = require('fs');
const path = require('path');

const terserPackageRoot = process.argv[2];
if (!terserPackageRoot) {
    throw new Error('Pass the absolute directory containing the Moodle toolchain terser package.');
}

const pluginRoot = path.resolve(__dirname, '..', '..');
const stem = 'easyedu_notification';
const sourcePath = path.join(pluginRoot, 'amd', 'src', `${stem}.js`);
const buildPath = path.join(pluginRoot, 'amd', 'build', `${stem}.min.js`);
const mapPath = `${buildPath}.map`;
const moduleName = `local_groupimport/${stem}`;
const terser = require(path.join(path.resolve(terserPackageRoot), 'terser'));

const source = fs.readFileSync(sourcePath, 'utf8');
const wrapper = 'define([], function()';
if (!source.includes(wrapper) || !source.includes('return {show: show, dismiss: dismiss};')) {
    throw new Error('The V3 notification direct AMD wrapper and its show/dismiss exports are required.');
}

terser.minify(
    {[`../src/${stem}.js`]: source.replace(wrapper, `define("${moduleName}", [], function()`)},
    {compress: true, mangle: false, sourceMap: {filename: path.basename(buildPath), url: path.basename(mapPath)}}
).then(result => {
    if (!result.code || !result.map || !result.code.includes(`define("${moduleName}"`)) {
        throw new Error('The generated AMD artifact lost the EasyStud module namespace.');
    }
    fs.writeFileSync(buildPath, `${result.code}\n`, 'utf8');
    fs.writeFileSync(mapPath, `${result.map}\n`, 'utf8');
    process.stdout.write('EasyEdu V3 notification AMD build completed.\n');
}).catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
