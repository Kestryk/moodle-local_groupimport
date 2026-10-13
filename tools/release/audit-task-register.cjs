'use strict';

/** Check roadmap scope/evidence integrity without changing recorded acceptance. */
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..', '..');
const intakePath = 'docs/testing/claude-interface-review-intake-2026-10-11.json';
const intake = JSON.parse(fs.readFileSync(path.join(root, intakePath), 'utf8'));
const plan = fs.readFileSync(path.join(root, intake.immutablePlan), 'utf8');
const originals = new Map([...plan.matchAll(/^- \[ \] (T\d{3}) (.+)$/gm)]
    .map(match => [match[1], match[2].trim()]));
const failures = [];
const seen = new Set();
if (originals.size !== 61 || intake.taskCount !== 61 || intake.tasks.length !== 61) {
    failures.push('The received roadmap must retain exactly 61 tasks.');
}
if (intake.humanChecklistDeferred !== true || intake.replacesOlderLots !== false) {
    failures.push('Human checklist and older-lot boundaries changed.');
}
const rows = intake.tasks.map(task => {
    if (seen.has(task.id)) failures.push(`${task.id}: duplicate task.`);
    seen.add(task.id);
    if (originals.get(task.id) !== task.receivedScope) failures.push(`${task.id}: received scope drift.`);
    if (!task.status || !Array.isArray(task.related) || typeof task.nativeVerified !== 'boolean') {
        failures.push(`${task.id}: missing status/evidence/native field.`);
    }
    if (task.humanAccepted !== false) failures.push(`${task.id}: human acceptance must remain open.`);
    const evidence = [...new Set([...(task.related || []), ...(task.proof ? [task.proof] : [])])];
    const fileReferences = evidence.filter(item => /^(?:docs\/|tools\/|RETOUR-).+\.(?:md|json|cjs|js|php|ps1)$/.test(item));
    for (const file of fileReferences) {
        const base = file.startsWith('RETOUR-') ? path.dirname(intake.externalHandoff) : root;
        if (!fs.existsSync(path.join(base, file))) failures.push(`${task.id}: missing evidence ${file}.`);
    }
    if (task.status !== 'queued' && fileReferences.length === 0) {
        failures.push(`${task.id}: recorded progress lacks an evidence file.`);
    }
    return {lot: task.id, status: task.status, nativeVerified: task.nativeVerified,
        humanAccepted: task.humanAccepted, decisionGate: task.decisionGate,
        proofState: task.status === 'queued' ? 'pending' : 'recorded-not-replayed',
        evidence, checkedFileReferences: fileReferences};
});
for (const id of originals.keys()) if (!seen.has(id)) failures.push(`${id}: missing received task.`);
const result = {
    lot: 'T031', level: 'N0', passed: failures.length === 0,
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
    immutablePlan: intake.immutablePlan, intake: intakePath,
    counts: {tasks: rows.length, queued: rows.filter(row => row.status === 'queued').length,
        progressRecorded: rows.filter(row => row.status !== 'queued').length,
        nativeFlagsRetained: rows.filter(row => row.nativeVerified).length,
        humanAccepted: rows.filter(row => row.humanAccepted).length,
        checkedFileReferences: rows.reduce((sum, row) => sum + row.checkedFileReferences.length, 0)},
    humanChecklistOpen: intake.humanChecklistDeferred === true,
    failures, tasks: rows,
};
const outputArg = process.argv.find(arg => arg.startsWith('--output='));
if (outputArg) {
    const output = path.resolve(outputArg.slice('--output='.length));
    if (output === root || output.startsWith(root + path.sep)) throw new Error('Raw report must be external.');
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
}
console.log(JSON.stringify({...result, tasks: undefined}));
process.exitCode = result.passed ? 0 : 1;
