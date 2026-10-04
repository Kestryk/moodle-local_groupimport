/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const toolchain = process.argv[2];
if (!toolchain) throw new Error('Supply the directory containing terser.');
const terser = require(path.join(path.resolve(toolchain), 'terser'));
const root = path.resolve(__dirname, '../..');
const input = "import {enhanceSelect, enhanceMultipleSelect} from './searchable_choices';";
const source = fs.readFileSync(path.join(root, 'amd/src/admin_choices.js'), 'utf8');
if (!source.includes(input)) throw new Error('Unexpected admin choice dependencies.');
const wrapped = 'define("local_groupimport/admin_choices", ["local_groupimport/searchable_choices"], ' +
    'function(Choices) {\n' + source.replace(input, 'const {enhanceSelect, enhanceMultipleSelect} = Choices;')
        .replace('export const init =', 'const init =') + '\nreturn {init};\n});';
const filename = 'admin_choices.min.js';
terser.minify({'../src/admin_choices.js': wrapped}, {
    compress: true, mangle: false, sourceMap: {filename, url: `${filename}.map`},
}).then(result => {
    if (!result.code || !result.map) throw new Error('Incomplete admin choices build.');
    fs.writeFileSync(path.join(root, 'amd/build', filename), `${result.code}\n`);
    fs.writeFileSync(path.join(root, 'amd/build', `${filename}.map`), `${result.map}\n`);
    console.log('Admin choices AMD built.');
}).catch(error => { console.error(error.message); process.exitCode = 1; });
