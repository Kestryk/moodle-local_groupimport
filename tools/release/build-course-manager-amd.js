/* eslint-env node */

const fs = require('fs');
const path = require('path');

const terserPackageRoot = process.argv[2];
if (!terserPackageRoot) {
    throw new Error('Pass the absolute directory containing the Moodle toolchain terser package.');
}

const pluginRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(pluginRoot, 'amd', 'src', 'course_manager.js');
const buildPath = path.join(pluginRoot, 'amd', 'build', 'course_manager.min.js');
const mapPath = `${buildPath}.map`;
const moduleName = 'local_groupimport/course_manager';
const terser = require(path.join(path.resolve(terserPackageRoot), 'terser'));

const source = fs.readFileSync(sourcePath, 'utf8');
const motionImport = "import * as Motion from './motion';";
const choicesImport = "import {enhanceSelect} from './searchable_choices';";
if (!source.includes(motionImport) || !source.includes('export const init =')) {
    throw new Error('The course manager AMD source does not contain its expected Motion import and init export.');
}

const namedSource = source
    .replace(motionImport, '')
    .replace(choicesImport, 'const {enhanceSelect} = Choices;')
    .replace('export const init =', 'const init =');
const wrappedSource = `define("${moduleName}", ["local_groupimport/motion", "local_groupimport/searchable_choices"], function(Motion, Choices) {\n` +
    `${namedSource}\nreturn {init: init};\n});`;

terser.minify(
    {'../src/course_manager.js': wrappedSource},
    {
        compress: true,
        mangle: false,
        sourceMap: {
            filename: path.basename(buildPath),
            url: path.basename(mapPath)
        }
    }
).then(result => {
    if (!result.code || !result.map || !result.code.includes(`define("${moduleName}"`)) {
        throw new Error('Terser did not produce the expected Course Manager AMD build and source map.');
    }
    fs.writeFileSync(buildPath, `${result.code}\n`, 'utf8');
    fs.writeFileSync(mapPath, `${result.map}\n`, 'utf8');
    process.stdout.write('EasyStud course manager AMD build completed.\n');
}).catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
