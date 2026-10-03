/* eslint-env node */
// Business-only membership identity helper; no Kit styling or HTTP commands.
const fs = require('node:fs');
const path = require('node:path');
const toolchainRoot = process.argv[2];
if (!toolchainRoot) throw new Error('Supply the directory containing terser.');
const terser = require(path.join(path.resolve(toolchainRoot), 'terser'));
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/member_selection.js'), 'utf8');
if (!source.includes('export const snapshotMemberPairs =')) throw new Error('Unexpected member selection source.');
const wrapped = 'define("local_groupimport/member_selection", [], function() {\n' +
    source.replace('export const snapshotMemberPairs =', 'const snapshotMemberPairs =') +
    '\nreturn {snapshotMemberPairs};\n});';
const filename = 'member_selection.min.js';
terser.minify({'../src/member_selection.js': wrapped}, {
    compress: true, mangle: false, sourceMap: {filename, url: `${filename}.map`},
}).then(result => {
    if (!result.code || !result.map) throw new Error('Incomplete AMD build.');
    fs.writeFileSync(path.join(root, 'amd/build', filename), `${result.code}\n`);
    fs.writeFileSync(path.join(root, 'amd/build', `${filename}.map`), `${result.map}\n`);
    process.stdout.write('Selected member identity AMD built.\n');
}).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
