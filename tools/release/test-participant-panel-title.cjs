// Current K15-25 contract; c1f0cf02 intentionally superseded the combined column label.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('classes/output/manage_page.php');
const mappings = [...source.matchAll(/'participantstitle'\s*=>\s*(get_string\([^\n]+\)),/g)];
assert.equal(mappings.length, 1, 'One actual participant column mapping');
assert.equal(mappings[0][1], "get_string('participants')", 'K15-25 uses the core column label, not the combined view name');
const php = process.env.PHP_BINARY || process.env.PHP || 'php';
const output = JSON.parse(execFileSync(php, ['-r', `
function get_string($key, $component = '') {
    if ($key !== 'participants' || $component !== '') { throw new RuntimeException('Wrong label source'); }
    return 'Participants';
}
echo json_encode(${mappings[0][1]});`], {encoding: 'utf8'}));
assert.equal(output, 'Participants');
const template = read('templates/manage.mustache');
const headings = [...template.matchAll(/<h3\b[^>]*>\s*{{participantstitle}}\s*<\/h3>/g)];
assert.equal(headings.length, 2, 'Desktop and compact column headings use the same actual field');
for (const [locale, label] of [['en', 'Participants & groups'], ['fr', 'Participants & groupes']]) {
    const lang = read('lang/' + locale + '/local_groupimport.php');
    assert.ok(lang.includes("$string['layoutmodeparticipants'] = '" + label + "';"), 'Combined view label retained: ' + locale);
    assert.ok(lang.includes("$string['mobileviewparticipants'] = 'Participants';"), 'Compact entity label retained: ' + locale);
}
assert.match(source, /'mobileviewparticipants' => get_string\('mobileviewparticipants', 'local_groupimport'\)/);
console.log('PASS current core Participants mapping, two heading slots and distinct FR/EN workspace/compact labels; obsolete whole-file freeze superseded by K15-25/I3.');