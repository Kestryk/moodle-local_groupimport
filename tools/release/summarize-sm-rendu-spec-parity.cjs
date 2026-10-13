'use strict';

/** Compare actual paired runs; equal failures are parity, never product PASS. */
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const index = arg.indexOf('=');
    return [arg.slice(2, index), arg.slice(index + 1)];
}));
if (!args.after || !args.output) throw new Error('--after=<matrix.json> and --output=<external-report.json> required.');
const root = path.resolve(__dirname, '..', '..');
const output = path.resolve(args.output);
if (output.startsWith(root + path.sep)) throw new Error('Raw reports stay outside the checkout.');
const after = JSON.parse(fs.readFileSync(args.after, 'utf8'));
const before = args.before && fs.existsSync(args.before) ? JSON.parse(fs.readFileSync(args.before, 'utf8')) : null;
const key = record => `${record.spec}\n${record.title}`;
const index = matrix => {
    const entries = new Map();
    for (const record of matrix?.records || []) {
        if (!entries.has(key(record))) entries.set(key(record), {});
        entries.get(key(record))[record.mode] = record;
    }
    return entries;
};
const afterIndex = index(after);
const beforeIndex = index(before);
const resultState = pair => {
    if (!pair?.legacy || !pair?.reactive) return 'pending';
    const {legacy, reactive} = pair;
    if (legacy.status === 'passed' && reactive.status === 'passed') return 'both-pass';
    if (legacy.status !== reactive.status || legacy.firstError !== reactive.firstError || legacy.line !== reactive.line) {
        return 'different-outcome';
    }
    if (legacy.status === 'failed' && legacy.firstError) return 'same-failure';
    return 'unresolved-infrastructure';
};
const cases = [...new Set([...afterIndex.keys(), ...beforeIndex.keys()])].map(caseKey => {
    const afterPair = afterIndex.get(caseKey);
    const beforePair = beforeIndex.get(caseKey);
    const record = afterPair?.legacy || afterPair?.reactive || beforePair?.legacy || beforePair?.reactive;
    return {spec: record.spec, title: record.title,
        before: resultState(beforePair), after: resultState(afterPair),
        beforeRuns: beforePair || {}, afterRuns: afterPair || {}};
});
const files = execFileSync('git', ['diff', '--name-only', 'c9e1fed', 'HEAD', '--', 'tools/playwright'],
    {cwd: root, encoding: 'utf8'}).trim().split(/\r?\n/).filter(file => file.endsWith('.spec.js'));
const tested = new Set(cases.filter(item => item.after !== 'pending').map(item => `tools/playwright/${item.spec}`));
const counts = Object.fromEntries(['both-pass','same-failure','different-outcome','pending','unresolved-infrastructure']
    .map(state => [state, cases.filter(item => item.after === state).length]));
const report = {
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
    productBase: 'c9e1fed8', afterMatrixStatus: after.status, beforeMatrixStatus: before?.status || 'pending',
    counts, allSelectedModesCompared: after.status === 'completed' && counts.pending === 0,
    fullModifiedSpecScopeCompared: files.every(file => tested.has(file)),
    modifiedSpecs: files, unpairedSpecs: files.filter(file => !tested.has(file)), cases,
};
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({sourceHead: report.sourceHead, afterMatrixStatus: report.afterMatrixStatus,
    beforeMatrixStatus: report.beforeMatrixStatus, counts, unpairedSpecs: report.unpairedSpecs.length,
    allSelectedModesCompared: report.allSelectedModesCompared, fullModifiedSpecScopeCompared: report.fullModifiedSpecScopeCompared}));
