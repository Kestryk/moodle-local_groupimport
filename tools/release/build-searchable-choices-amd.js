/* eslint-env node */
// Build the canonical Kit controller using the existing validated toolchain.
const fs = require('node:fs');
const path = require('node:path');
const toolchainRoot = process.argv[2];
if (!toolchainRoot) throw new Error('Supply the directory containing terser.');
const terser = require(path.join(path.resolve(toolchainRoot), 'terser'));
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/searchable_choices.js'), 'utf8');
if (!source.includes('export const enhanceSelect =')) throw new Error('Unexpected Kit choice module.');
const wrapped = 'define("local_groupimport/searchable_choices", [], function() {\n' +
    source.replace(/export const /g, 'const ') + '\nreturn {enhanceSelect, enhanceMultipleSelect};\n});';
const filename = 'searchable_choices.min.js';
terser.minify({'../src/searchable_choices.js': wrapped}, {
    compress: true, mangle: false, sourceMap: {filename, url: `${filename}.map`},
}).then(result => {
    if (!result.code || !result.map) throw new Error('Incomplete AMD build.');
    fs.writeFileSync(path.join(root, 'amd/build', filename), `${result.code}\n`);
    fs.writeFileSync(path.join(root, 'amd/build', `${filename}.map`), `${result.map}\n`);
    process.stdout.write('Canonical searchable choices AMD built.\n');
}).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
