/* eslint-env node */
'use strict';

// Offline contract only: this does not bootstrap or certify a Moodle installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const version = read('version.php');
assert.match(version, /\$plugin->requires = 2024100700;/);
const baseline = process.argv[2];
if (baseline) {
    const predecessor = cp.execFileSync('git', ['show', baseline + ':version.php'], {cwd: root, encoding: 'utf8'})
        .replace(/\r\n/g, '\n');
    assert.equal(version.replace(/^\$plugin->requires.*$/m, ''), predecessor.replace(/^\$plugin->requires.*$/m, ''),
        'Only the installation floor changes, not schema version, maturity or release');
}
const template = read('templates/manage.mustache');
const selects = template.match(/<select\b[\s\S]*?>/g) || [];
const styled = selects.filter(tag => /\bform-select\b/.test(tag));
assert.equal(styled.length, 6);
styled.forEach(tag => assert.match(tag, /\bcustom-select\b/, 'Bootstrap 4 native select fallback'));
const manage = read('classes/output/manage_page.php');
assert.equal((manage.match(/fa fa-plus easyedu-inline-icon--leading/g) || []).length, 2);
assert.doesNotMatch(manage, /\b(?:me|ms)-[0-5]\b/, 'No Bootstrap 5-only icon spacing');
const css = read('styles/student-management.css');
assert.match(css, /\.visually-hidden\s*\{/);
assert.match(css, /easyedu-inline-icon--leading/);
console.log(JSON.stringify({status: 'PASS', requires: 2024100700, dualSelects: styled.length,
    native45: 'pending phase 10 / K18-04'}));
