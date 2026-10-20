/* eslint-env node */
'use strict';

// Compare snapshots from a disposable native migration; never connects to Moodle.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [beforePath, afterPath, output] = process.argv.slice(2);
assert.ok([beforePath, afterPath, output].every(value => value && path.isAbsolute(value)),
    'Pass absolute before/after JSON and external evidence output paths');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const before = read(beforePath), after = read(afterPath), checks = [];
const check = (name, callback) => { callback(); checks.push({name, status: 'PASS'}); };
check('Native group IDs, descriptions, idnumbers and timestamps preserved', () => assert.deepEqual(after.groups, before.groups));
check('Native grouping records preserved', () => assert.deepEqual(after.groupings, before.groupings));
check('Group memberships preserved', () => assert.deepEqual(after.members, before.members));
check('Group/grouping links preserved', () => assert.deepEqual(after.links, before.links));
check('Course enrolments preserved', () => assert.deepEqual(after.enrolments, before.enrolments));
check('Role assignments preserved', () => assert.deepEqual(after.roles, before.roles));
if (before.users) {
    check('Participant accounts and identity fields preserved', () => assert.deepEqual(after.users, before.users));
}
check('Configured V1 identifier fields preserved', () => {
    for (const key of ['alloweduserfields', 'defaultuserfield']) {
        assert.equal(after.config[key], before.config[key]);
    }
});
check('Plugin identity upgraded to target and legacy workflow retained', () => {
    assert.equal(Number(after.config.version), 2026101801);
    assert.equal(Number(after.config.enablesimplifiedview), 0);
});
check('Default retention introduced without purging migration history', () => {
    assert.equal(Number(after.config.historyretentiondays), 365);
    const originals = before.history || [];
    assert.equal(after.history.length, originals.length);
    for (const row of originals) {
        const actual = after.history.find(candidate => candidate.id === row.id);
        assert.ok(actual);
        for (const key of Object.keys(row)) {
            assert.equal(actual[key], row[key], 'Historical field ' + key + ' preserved');
        }
    }
});
check('History extension fields present', () => {
    for (const field of ['changesjson', 'rollbackuserid', 'timerolledback']) {
        assert.ok(after.historycolumns.includes(field));
    }
});
check('Institution and customized tours preserved; only shipped tours may be disabled', () => {
    assert.equal(after.tours.length, before.tours.length);
    for (const row of before.tours) {
        const actual = after.tours.find(candidate => candidate.id === row.id);
        assert.ok(actual);
        if ((row.description || '').includes('TRI15') || (row.name || '').includes('TRI15')) {
            assert.deepEqual(actual, row);
        } else {
            const permitted = {...row};
            if (actual.enabled !== row.enabled) {
                assert.ok(['tour_groupimport_teacher_name,local_groupimport',
                    'tour_groupimport_coursehome_name,local_groupimport'].includes(row.name));
                assert.equal(Number(actual.enabled), 0);
                permitted.enabled = actual.enabled;
            }
            assert.deepEqual(actual, permitted);
        }
    }
    assert.deepEqual(after.steps, before.steps, 'No tour step rewritten or removed');
});
check('Retention task registered', () => {
    assert.ok(after.tasks.some(task => task.classname.endsWith('purge_import_history')));
});
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify({status: 'PASS', baselineVersion: before.config.version,
    targetVersion: after.config.version, counts: {groups: after.groups.length, groupings: after.groupings.length,
        memberships: after.members.length, enrolments: after.enrolments.length, history: after.history.length},
    checks, nativeBrowserCertified: false}, null, 2) + '\n');
console.log(JSON.stringify({status: 'PASS', checks: checks.length}));
