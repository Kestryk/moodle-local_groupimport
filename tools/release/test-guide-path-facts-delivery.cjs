'use strict';
// Exercise the delivered AMD entry, not only its already-correct source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};
const raw = {users: [], groups: [], groupings: []};
const model = {raw};
const facts = [];
const attrs = new Map();
const guideRoot = {};
const workspace = {
    easystudGuideOwner: guideRoot,
    classList: {add: noop, remove: noop, contains: () => false},
    getAttribute: key => attrs.get(key),
    setAttribute: (key, value) => attrs.set(key, value),
    removeAttribute: key => attrs.delete(key),
    querySelector: () => null,
    querySelectorAll: () => [],
    dispatchEvent: noop,
    addEventListener: noop,
};
const facade = {};
vm.runInNewContext(read('amd/build/guide_api.min.js'), {
    define: (name, dependencies, factory) => Object.assign(facade, factory(noop, {error: error => {throw error;}})),
});
const modules = {
    'local_groupimport/guide_api': facade,
    'local_groupimport/local/sm/store': {createStore: async () => ({raw, loadMs: 0})},
    'local_groupimport/local/sm/participants': {createParticipantModel: async () => model},
    'local_groupimport/local/sm/groups': {attachGroupCatalogs: async value => value},
    'local_groupimport/local/cm/shared': {onReady: callback => callback(), runSafely: callback => callback()},
    'local_groupimport/local/cm/state': {setOnDemandParticipants: value => assert.equal(value.model, model)},
    'core/log': {error: error => {throw error;}},
};
const stub = value => new Proxy(value || {}, {get: (target, key) => key in target ? target[key] : noop});
let hooks;
vm.runInNewContext(read('amd/build/local/cm/guide_hooks.min.js'), {
    define: (name, dependencies, factory) => {
        const exports = {};
        factory(...dependencies.map(dependency => dependency === 'exports' ? exports :
            stub(dependency === '../../guide_api' ? facade : modules[dependency])));
        hooks = exports;
    },
});
modules['local_groupimport/local/cm/guide_hooks'] = {
    publishGuidePathFacts: (host, current) => {
        assert.equal(attrs.get('data-easystud-sm-ready'), undefined, 'facts precede the ready signal');
        hooks.publishGuidePathFacts(host, current);
        facts.push(JSON.parse(JSON.stringify(guideRoot.easyeduGuidePathFacts)));
    },
};
let manager;
vm.runInNewContext(read('amd/build/course_manager.min.js'), {
    define: (name, dependencies, factory) => {manager = factory(...dependencies.map(dependency => stub(modules[dependency])));},
    document: {getElementById: () => workspace},
    window: {performance: {now: () => 0}, setTimeout: noop, requestAnimationFrame: callback => callback(),
        addEventListener: noop},
    CustomEvent: class {},
});
(async () => {
    manager.init('workspace', 9);
    await workspace.easystudSmStarting;
    assert.equal(attrs.get('data-easystud-sm-ready'), '1');
    assert.deepEqual(facts, [{participants: false, groups: false, groupings: false, memberSource: false}]);
    raw.users.push({id: 7});
    raw.groups.push({id: 1, memberids: [7]}, {id: 2, memberids: []});
    raw.groupings.push({id: 3});
    hooks.publishGuidePathFacts(workspace, model);
    assert.equal(JSON.stringify(guideRoot.easyeduGuidePathFacts),
        JSON.stringify({participants: true, groups: true, groupings: true, memberSource: true}));
    raw.groups.splice(0);
    raw.groupings.splice(0);
    hooks.publishGuidePathFacts(workspace, model);
    assert.equal(guideRoot.easyeduGuidePathFacts.groups, false, 'later model changes replace the facts');
    assert.equal(guideRoot.easyeduGuidePathFacts.memberSource, false);
    const withoutGuide = {querySelector: () => null};
    hooks.publishGuidePathFacts(withoutGuide, model);
    assert.equal(withoutGuide.easyeduGuidePathFacts, undefined);
    const published = guideRoot.easyeduGuidePathFacts;
    hooks.publishGuidePathFacts(workspace, {raw: {users: null, groups: []}});
    assert.equal(guideRoot.easyeduGuidePathFacts, published, 'incomplete state is not an empty course');
    const nestedGuide = {};
    hooks.publishGuidePathFacts({querySelector: () => nestedGuide}, model);
    assert.equal(nestedGuide.easyeduGuidePathFacts.participants, true, 'non-portalled desktop root');
    console.log(JSON.stringify({passed: true, deliveredEntry: true, lazyFacade: true, portalledOwner: true,
        emptyCourse: true, liveModelChanges: true}));
})().catch(error => {console.error(error); process.exitCode = 1;});
