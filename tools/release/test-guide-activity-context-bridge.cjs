// Bounded successor: execute new helpers and the actual native Group adapter.
// No Moodle command, browser, real-user storage or migration is exercised.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = 'c1cdbccacd55f825f5fa29af1811d443da571c87';
const old = file => execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}).replace(/\r\n/g, '\n');
const source = read('amd/src/course_manager.js');
const start = source.indexOf('// Capture before the native asynchronous Group batch,');
const end = source.indexOf('// Completion uses the same result authority', start);
assert.ok(start > 0 && end > start);
const helpers = source.slice(start, end);
let restored = source.slice(0, start - 1) + source.slice(end);
restored = restored.replace("import * as Guide from './easyedu_guide';\n", '')
    .replace('        const activityEvidence = captureActivityGroupingConfirmation(root, value, groups);\n', '')
    .replace('            commitActivityGroupingConfirmation(root, activityEvidence, responses);\n', '');
assert.ok(restored === old('amd/src/course_manager.js'), 'All unrelated native interaction code preserved');
const protectedFiles = ['amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js',
    'amd/src/motion.js', 'amd/build/motion.min.js', 'manage.php', 'classes/local/guide_discovery.php',
    'ajax.php', 'settings.php', 'version.php', 'styles.css', 'templates/manage.mustache',
    'lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php',
    'tools/release/test-guide-activity-grouping-authority.cjs', 'tools/release/test-guide-path-context-build.cjs'];
protectedFiles.forEach(file => assert.equal(read(file), old(file), file));

let cases = 0;
const fixture = () => {
    const state = {connected: true, hidden: false, disabled: false, step: 'confirm-groups',
        token: true, current: true, writes: [], completions: []};
    const next = {get disabled() {return state.disabled;}, getAttribute: () => state.step};
    const checklist = {get hidden() {return state.hidden;}, querySelector: () => next};
    const host = {get isConnected() {return state.connected;},
        querySelectorAll: () => [{getAttribute: () => '31'}]};
    const token = {epoch: 4};
    const context = {document: {querySelector: () => checklist},
        Guide: {getPathContextToken: () => state.token ? token : null,
            setPathContext: (node, name, data, originalToken) => {
                assert.equal(node, host);
                assert.equal(name, 'prepare-activity-grouping');
                assert.equal(originalToken, token, 'Never generate a token in the response callback');
                if (!state.current) return false;
                state.writes.push(JSON.parse(JSON.stringify(data)));
                return true;
            }},
        emitNativePathCompletion: (node, name, step) => state.completions.push([name, step])};
    vm.runInNewContext(helpers + '\nthis.capture = captureActivityGroupingConfirmation;' +
        '\nthis.commit = commitActivityGroupingConfirmation;', context);
    return {state, host, ...context};
};
const groups = ids => ids.map(id => ({getAttribute: () => id}));
for (const destination of ['', '0', '-1', '031', '31', '99', 31, null]) {
    for (const ids of [[], ['10'], ['10', '11'], ['10', '10'], ['x'], [null]]) {
        const qa = fixture();
        const evidence = qa.capture(qa.host, destination, groups(ids));
        const expected = destination === '31' && ids.length > 0 && ids.every(id => /^[1-9]\d*$/.test(id));
        assert.equal(!!evidence, expected);
        assert.equal(qa.state.writes.length, 0, 'Capture is read-only');
        if (evidence) {
            assert.ok(Object.isFrozen(evidence));
            assert.ok(Object.isFrozen(evidence.context));
            assert.ok(Object.isFrozen(evidence.context.groupIds));
            assert.equal(evidence.requestCount, ids.length);
            assert.deepEqual(Array.from(evidence.context.groupIds), [...new Set(ids)]);
            assert.equal(qa.commit(qa.host, evidence, ids.map(() => ({existing: true}))), true);
            assert.equal(qa.state.writes.length, 1);
            assert.equal(qa.state.completions.length, 1);
        }
        cases++;
    }
}
for (const [key, value] of [['connected', false], ['hidden', true], ['disabled', true],
    ['step', 'select-groups'], ['token', false]]) {
    const qa = fixture();
    qa.state[key] = value;
    assert.equal(qa.capture(qa.host, '31', groups(['10'])), null);
    cases++;
}
for (const [key, value] of [['connected', false], ['hidden', true], ['disabled', true],
    ['step', 'select-groups'], ['current', false]]) {
    const qa = fixture();
    const evidence = qa.capture(qa.host, '31', groups(['10']));
    qa.state[key] = value;
    assert.equal(qa.commit(qa.host, evidence, [{existing: false}]), false);
    assert.equal(qa.state.writes.length, 0);
    assert.equal(qa.state.completions.length, 0);
    cases++;
}
for (const responses of [[], [{}], [{}, {}, {}], [{}, null], [{}, {success: false}]]) {
    const qa = fixture();
    const evidence = qa.capture(qa.host, '31', groups(['10', '11']));
    assert.equal(qa.commit(qa.host, evidence, responses), false);
    assert.equal(qa.state.writes.length, 0);
    cases++;
}

// Reuse the immutable predecessor's native DOM fixture, not a new command model.
// Only inject the two added bridge spies; all 73 original command assertions remain.
const predecessor = read('tools/release/test-guide-activity-grouping-authority.cjs');
const mainStart = predecessor.indexOf('async function main()');
assert.ok(mainStart > 0);
let captures = 0;
let commits = 0;
const harness = predecessor.slice(0, mainStart).replace('    const context = {',
    '    const context = {\n' +
    '        captureActivityGroupingConfirmation: () => { bridge.capture(); return null; },\n' +
    '        commitActivityGroupingConfirmation: () => { bridge.commit(); return false; },');
const sandbox = {require, __dirname, console, setImmediate, bridge: {
    capture: () => captures++, commit: () => commits++}};
vm.runInNewContext(harness + '\nthis.runNativeCase = runCase;', sandbox);
async function main() {
    let nativeCases = 0;
    for (const count of [0, 1, 2]) for (const destinationId of ['', '0', '31']) {
        for (const removeOriginal of [false, true]) for (const existing of [false, true]) {
            for (const failure of [false, true]) {
                const before = {captures, commits};
                await sandbox.runNativeCase({count, destinationId, removeOriginal, existing, failure});
                assert.equal(captures - before.captures, destinationId && count ? 1 : 0);
                assert.equal(commits - before.commits,
                    destinationId === '31' && count && !(failure && count > 1) ? 1 : 0);
                nativeCases++;
            }
        }
    }
    const before = captures;
    await sandbox.runNativeCase({count: 2, destinationId: '31', removeOriginal: false,
        existing: false, failure: false, cancelOnly: true});
    assert.equal(captures, before, 'Cancel never captures an asynchronous confirmation');
    nativeCases++;
    let built;
    vm.runInNewContext(read('amd/build/course_manager.min.js'), {
        define: (name, dependencies, factory) => {built = {name, dependencies, factory};}});
    assert.equal(built.name, 'local_groupimport/course_manager');
    assert.deepEqual(Array.from(built.dependencies), ['local_groupimport/motion',
        'local_groupimport/searchable_choices', 'local_groupimport/member_selection',
        'local_groupimport/easyedu_guide']);
    console.log(JSON.stringify({status: 'PASS', helperCases: cases, nativeAdapterCases: nativeCases,
        protectedFiles: protectedFiles.length, unrelatedNativeCodePreserved: true,
        pathInstalled: false, browserProof: false, baseline}, null, 2));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
