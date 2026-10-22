/* eslint-env node */
// Build the canonical Kit controller using the existing validated toolchain.
require('./verify-build-versions.cjs').assertNode();
const fs = require('node:fs');
const path = require('node:path');
const toolchainRoot = process.argv[2];
if (!toolchainRoot) throw new Error('Supply the directory containing terser.');
const terser = require(path.join(path.resolve(toolchainRoot), 'terser'));
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/searchable_choices.js'), 'utf8');
if (!source.includes('export const enhanceSelect =')) throw new Error('Unexpected Kit choice module.');
// This canonical Kit controller must stay a dependency-free, self-contained AMD module
// (test-searchable-choices-exports.js and test-choice-amd-exports.js assert dependencies.length
// === 0 and call factory() with no injected module). X9: countLabel still has a single authored
// definition in local/count_label.js; inline its implementation here at build time instead of
// duplicating the source or adding a runtime AMD dependency.
const importLine = "import {countLabel} from './local/count_label';";
if (!source.includes(importLine)) throw new Error('Missing shared countLabel import.');
const countLabelSource = fs.readFileSync(path.join(root, 'amd/src/local/count_label.js'), 'utf8');
const countLabelMatch = countLabelSource.match(/export const countLabel = [\s\S]+/);
if (!countLabelMatch) throw new Error('Could not extract the shared countLabel implementation.');
const inlinedCountLabel = countLabelMatch[0].replace(/^export const /, 'const ').trim();
const body = source.replace(importLine, inlinedCountLabel);
// Export the complete public surface. A hard-coded two-function list silently
// removed closeChoicesWithin during minification and broke parent disclosure.
const publicNames = [...source.matchAll(/^export const ([A-Za-z_$][\w$]*)\s*=/gm)].map(match => match[1]);
if (!publicNames.includes('closeChoicesWithin')) throw new Error('Missing nested disclosure lifecycle export.');
const wrapped = 'define("local_groupimport/searchable_choices", [], function() {\n' +
    body.replace(/export const /g, 'const ') + '\nreturn {' + publicNames.join(', ') + '};\n});';
const filename = 'searchable_choices.min.js';
terser.minify({'../src/searchable_choices.js': wrapped}, {
    compress: true, mangle: false, sourceMap: {filename, url: `${filename}.map`},
}).then(result => {
    if (!result.code || !result.map) throw new Error('Incomplete AMD build.');
    fs.writeFileSync(path.join(root, 'amd/build', filename), `${result.code}\n`);
    fs.writeFileSync(path.join(root, 'amd/build', `${filename}.map`), `${result.map}\n`);
    process.stdout.write('Canonical searchable choices AMD built.\n');
}).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
