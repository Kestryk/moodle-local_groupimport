// Isolated transport contract: no Moodle bootstrap, browser, database or cache.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/sm/store.js'), 'utf8')
    .replace(/^import .+;\r?\n/gm, '').replace(/export const /g, 'const ');
let requests = 0;
let latest;
class Reactive {
    setInitialState(state) { this.state = state; }
}
const context = {
    Reactive, window: {performance: {now: () => 0}},
    Ajax: {call: calls => {
        requests++;
        assert.equal(calls[0].methodname, 'local_groupimport_get_state');
        assert.equal(calls[0].args.courseid, 71);
        return [Promise.resolve({state: JSON.stringify(latest)})];
    }},
};
vm.runInNewContext(source + '\nthis.api = {createStore, fetchState};', context);
const state = () => ({meta: {schema: 1, courseid: 71, version: 133},
    roles: [{id: 5, name: 'Participant'}], users: [{id: 9, fullname: '</script><img onerror=bad()>'}],
    groups: [], groupings: []});
const host = text => {
    let element = text === undefined ? null : {textContent: text, remove: () => {element = null;}};
    return {ownerDocument: {getElementById: id => {
        assert.equal(id, 'easystud-initial-state');
        return element;
    }}};
};
let checks = 0;
(async () => {
    latest = state();
    const root = host(JSON.stringify(latest));
    const first = await context.api.createStore(root, 71);
    assert.equal(JSON.stringify(first.raw), JSON.stringify(latest));
    assert.equal(requests, 0); checks++;
    latest.users[0].fullname = 'Changed after initial document';
    latest.meta.version = 134;
    const second = await context.api.createStore(root, 71);
    assert.equal(second.raw.users[0].fullname, latest.users[0].fullname);
    assert.equal(requests, 1); checks++;
    await context.api.fetchState(71);
    assert.equal(requests, 2); checks++;
    for (const text of [undefined, '{broken', 'null', JSON.stringify({...state(), meta: {schema: 1, courseid: 72}}),
        JSON.stringify({...state(), meta: {schema: 2, courseid: 71}}), JSON.stringify({...state(), users: null})]) {
        const before = requests;
        const current = await context.api.createStore(host(text), 71);
        assert.equal(requests, before + 1);
        assert.equal(JSON.stringify(current.raw), JSON.stringify(latest)); checks++;
    }
    const manage = fs.readFileSync(path.join(__dirname, '../../manage.php'), 'utf8');
    const gate = manage.indexOf("require_capability('moodle/course:managegroups', $context);");
    // I8 (AUDIT-REFACTORING-CODE-20261021): the document used to call get_state::execute()
    // directly (rebuilding the course model a second time after page_data()). It now calls
    // course_state::build() once and derives the lean page shape from that same result via
    // page_data_from_build(), so the initial-state script still comes from the same build()
    // schema (asserted by the rest of this contract), without the duplicate SQL reads.
    const build = manage.indexOf('\\local_groupimport\\service\\course_state::build($course, $context)');
    const derived = manage.indexOf('course_state::page_data_from_build($builtstate, $course, $context)');
    assert(gate > 0 && build > gate && derived > build);
    assert(manage.includes('JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT |'));
    assert(manage.includes('JSON_INVALID_UTF8_SUBSTITUTE'));
    assert(manage.includes("'type' => 'application/json'"));
    assert(manage.includes('catch (\\Throwable $exception)'));
    assert(manage.includes('if ($initialstatejson !== false)'));
    checks += 6;
    console.log(JSON.stringify({passed: true, checks, requests, runtimeAccess: false,
        persistentCache: false, freshRefresh: true, singleConsumption: true}));
})().catch(error => { console.error(error); process.exitCode = 1; });
