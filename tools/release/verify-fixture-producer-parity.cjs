/* eslint-env node */
'use strict';
// Compare unmodified legacy fixtures against relocated current producers, without Moodle bootstrap.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const inventory = require('./lib/php-function-inventory.cjs');
const root = path.resolve(__dirname, '../..');
const [php, output, baseline] = process.argv.slice(2);
assert.ok(php && output && baseline, 'Usage: <absolute PHP> <new external evidence directory> <legacy-fixture Git ref>');
assert.ok(path.isAbsolute(php) && path.isAbsolute(output));
assert.ok(!path.resolve(output).toLowerCase().startsWith(root.toLowerCase() + path.sep));
assert.ok(!fs.existsSync(output), 'Preserve previous evidence');
fs.mkdirSync(output, {recursive: true});
const legacy = path.join(output, 'legacy');
for (const directory of ['classes', 'lang', 'tools/release/fixtures', 'tools/release/doubles']) {
    fs.cpSync(path.join(root, directory), path.join(legacy, directory), {recursive: true});
}
const names = ['current-curriculum', 'discovery', 'creation', 'method', 'mistakes', 'recap',
    'selection-copy', 'shortcuts'];
for (const name of names) {
    const relative = 'tools/release/guide-' + name + '-fixture.php';
    fs.writeFileSync(path.join(legacy, relative), cp.execFileSync('git', ['show', baseline + ':' + relative],
        {cwd: root, maxBuffer: 10e6}));
}
const producer = path.join(root, 'classes/output/guide_config.php');
const method = inventory(php, producer).build_template_data.function.replace(/\r\n/g, '\n')
    .replace(/^ {4}/gm, '').replace('function build_template_data',
        'function local_groupimport_build_easyedu_guide_template_data');
const paths = cp.execFileSync(php, ['-r',
    'require $argv[1]; echo local_groupimport_fixture_source_array(file_get_contents($argv[2]), "paths");',
    path.join(__dirname, 'fixtures/source_array.php'), producer], {encoding: 'utf8'});
const page = fs.readFileSync(path.join(root, 'classes/output/manage_page.php'), 'utf8')
    .replace(/\r\n/g, '\n').replace(/^ {4}/gm, '').replace(/^<\?php/, '');
// This text is scanned by the unchanged legacy fixtures; it is never included as a page.
fs.writeFileSync(path.join(legacy, 'manage.php'), '<?php\n' + page + '\n' + method + '\n' +
    "        'paths' => " + paths + ",\n        'labels' => [\n");
const report = {baseline, scope: 'Current producer bodies reconstituted at their pre-I3 locations; no native runtime', cases: []};
for (const name of names) for (const language of ['en', 'fr']) {
    const relative = 'tools/release/guide-' + name + '-fixture.php';
    const before = cp.spawnSync(php, ['-d', 'auto_prepend_file=' + path.join(legacy, 'classes/local/identity.php'),
        path.join(legacy, relative), language], {encoding: 'utf8', maxBuffer: 10e6});
    const after = cp.spawnSync(php, [path.join(root, relative), language], {encoding: 'utf8', maxBuffer: 10e6});
    for (const [variant, result] of [['before', before], ['after', after]]) {
        fs.writeFileSync(path.join(output, name + '-' + language + '-' + variant + '.json'), result.stdout || '');
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stderr, '', 'No PHP warnings');
    }
    assert.deepEqual(JSON.parse(after.stdout), JSON.parse(before.stdout), name + '/' + language);
    report.cases.push({fixture: name, language, equal: true});
}
fs.writeFileSync(path.join(output, 'parity.json'), JSON.stringify(report, null, 2) + '\n');
console.log('PASS: ' + report.cases.length + ' strict bilingual fixture JSON comparisons');
