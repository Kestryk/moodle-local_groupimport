/* eslint-env node */
// This successor changes adapter signal order only, not selection/business logic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const current = fs.readFileSync(path.join(root, 'amd/src/course_manager.js'), 'utf8').replace(/\r\n/g, '\n');
const baseline = execFileSync('git', ['show', '33adae21520fd8ed53220b413af07fc3198393f8:amd/src/course_manager.js'],
    {cwd: root, encoding: 'utf8'}).replace(/\r\n/g, '\n');
const start = 'const updateSelectionActions = root => {';
const end = '// Bind multi-selection across participant, group, grouping and member items.';
const extract = source => source.slice(source.indexOf(start), source.indexOf(end));
const before = extract(baseline);
const after = extract(current);
const signal = "    if (selectedUsers.length) {\n        emitPracticeCompletion(root, 'select-participant');\n    }\n";
assert.equal(before.split(signal).length, 2);
assert.equal(after.split(signal).length, 2);
const comment = '    // Completion may synchronously highlight the next action. Publish only\n' +
    '    // after native enablement and the responsive action tray are ready.\n';
assert.equal(before.replace(signal, ''), after.replace(comment, '').replace(signal, ''));
assert.ok(after.indexOf(signal) > after.indexOf('renderMobileActionBar(root,'));
assert.ok(after.indexOf(signal) > after.indexOf('syncPaginationSelectionControls(root);'));
assert.equal(current.slice(0, current.indexOf(start)), baseline.slice(0, baseline.indexOf(start)));
assert.equal(current.slice(current.indexOf(end)), baseline.slice(baseline.indexOf(end)));
console.log('PASS: identical course manager except completion signal after action readiness.');
