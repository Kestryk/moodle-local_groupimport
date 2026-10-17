/* eslint-env node */
'use strict';

// Execute the real anonymous filter against each supplied library interface, without Moodle bootstrap.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [php, output, ...libraries] = process.argv.slice(2);
assert.ok(libraries.length >= 2 && [php, output, ...libraries].every(path.isAbsolute),
    'Pass absolute PHP, external evidence directory and at least two Moodle lib paths');
assert.ok(!path.resolve(output).toLowerCase().startsWith(root.toLowerCase() + path.sep));
fs.mkdirSync(output, {recursive: true});
const source = fs.readFileSync(path.join(root, 'classes/local/import_reader.php'), 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('new class ($overflow) implements IReadFilter {');
const end = source.indexOf('\n            });', start);
assert.ok(start >= 0 && end > start, 'Review changed filter extraction boundary');
const expression = source.slice(start, end) + '\n}';
assert.ok(expression.includes('public function readCell($columnaddress, $row, $worksheetname = \'\'): bool'));
const literal = value => "'" + value.replace(/\\/g, '/').replace(/'/g, "\\'") + "'";
const results = [];
for (const [index, library] of libraries.entries()) {
    const script = `<?php
use PhpOffice\\PhpSpreadsheet\\Reader\\IReadFilter;
use PhpOffice\\PhpSpreadsheet\\Cell\\Coordinate;
use local_groupimport\\local\\import_preview;
use local_groupimport\\local\\import_reader;
define('MOODLE_INTERNAL', true);
require ${literal(path.join(library, 'phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet/Reader/IReadFilter.php'))};
require ${literal(path.join(library, 'phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet/Cell/Coordinate.php'))};
require ${literal(path.join(root, 'classes/local/import_preview.php'))};
require ${literal(path.join(root, 'classes/local/import_reader.php'))};
$overflow = false;
$filter = ${expression};
$cases = [
    ['A', 1, '', true], ['BL', 1, '', true], ['BM', 1, '', false],
    ['A', import_preview::MAX_ROWS + 1, 'Sheet1', true],
    ['A', import_preview::MAX_ROWS + 2, '', false],
    ['A', '1', '', true], ['A', 0, '', false], ['A', -1, '', false],
    ['A', 1.5, '', false], ['A', true, '', false], ['A', [], '', false],
    ['A', '1.5', '', false], ['A', '-1', '', false],
    ['', 1, '', false], ['A1', 1, '', false], [null, 1, '', false],
    [[], 1, '', false], ['AAAA', 1, '', false], ['A', 1, [], false],
];
foreach ($cases as $case) {
    $overflow = false;
    $actual = $filter->readCell($case[0], $case[1], $case[2]);
    if ($actual !== $case[3] || $overflow !== !$case[3]) {
        throw new RuntimeException('Filter case failed: ' . json_encode($case));
    }
}
echo json_encode(['passed' => true, 'cases' => count($cases), 'runtimeAccess' => false]);
`;
    const file = path.join(output, 'probe-' + index + '.php');
    fs.writeFileSync(file, script);
    const run = spawnSync(php, [file], {encoding: 'utf8', timeout: 30000});
    fs.writeFileSync(path.join(output, 'probe-' + index + '.log'), (run.stdout || '') + (run.stderr || ''));
    assert.equal(run.status, 0, 'Native interface probe failed; see external log');
    results.push({library, ...JSON.parse(run.stdout)});
}
fs.writeFileSync(path.join(output, 'proof.json'), JSON.stringify({passed: true, results}, null, 2) + '\n');
process.stdout.write(JSON.stringify({passed: true, interfaces: results.length, casesPerInterface: 19,
    productFilterExtracted: true, runtimeAccess: false}) + '\n');
