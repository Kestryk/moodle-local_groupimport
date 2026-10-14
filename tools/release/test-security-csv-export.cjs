/* eslint-env node */
// Security lot S7-M6: the CSV export of the advanced settings lists (amd/src/local/cm/advanced_settings.js)
// keeps RFC 4180 quoting and neutralises spreadsheet formulas (OWASP CSV injection).
//
// Usage: node tools/release/test-security-csv-export.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/cm/advanced_settings.js'), 'utf8').replace(/\r\n/g, '\n');
const definition = source.match(/^const getCsvValue = (value => \{\n[\s\S]*?\n\});\n/m);
assert.ok(definition, 'advanced_settings.js defines getCsvValue as a block arrow function');
const getCsvValue = vm.runInNewContext(definition[1]);

const cases = [
    // Formula starts: a leading quote keeps them as text.
    ['=1+1', '"\'=1+1"'],
    ['=HYPERLINK("http://example.com","x")', '"\'=HYPERLINK(""http://example.com"",""x"")"'],
    ['+33 6 00 00 00 00', '"\'+33 6 00 00 00 00"'],
    ['-2+3', '"\'-2+3"'],
    ['@SUM(A1:A2)', '"\'@SUM(A1:A2)"'],
    ['\t=1+1', '"\'\t=1+1"'],
    ['\r=1+1', '"\'\r=1+1"'],
    ['＝1+1', '"\'＝1+1"'],
    ['＋1', '"\'＋1"'],
    ['－1', '"\'－1"'],
    ['＠x', '"\'＠x"'],
    // Ordinary values: RFC 4180 quoting only.
    ['Groupe A', '"Groupe A"'],
    ['Anaïs "Nini" Dupont', '"Anaïs ""Nini"" Dupont"'],
    ['a;b\nc', '"a;b\nc"'],
    ['x=1', '"x=1"'],
    ['', '""'],
    [null, '""'],
    [undefined, '""'],
    [0, '"0"'],
    [42, '"42"'],
];
cases.forEach(([value, expected]) => {
    assert.equal(getCsvValue(value), expected, `CSV cell for ${JSON.stringify(value)}`);
});
assert.match(source, /\.map\(row => row\.map\(getCsvValue\)\.join\(';'\)\)/, 'every exported cell goes through getCsvValue');
console.log(`PASS ${cases.length} CSV cells: formulas (= + - @, tab, CR, full-width) exported as text, RFC 4180 quoting kept.`);
