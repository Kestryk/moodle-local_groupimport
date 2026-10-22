// I10 (K18-32): the Guide engine is never a static dependency of Student Management or Mass
// Import; the light facade loads it on the first opener activation, or on load only when the
// page must show Guide UI immediately (first visit, welcome invitation, unfinished path resume).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const amdDeps = (file, name) => {
    let deps = null;
    vm.runInNewContext(read(file), {define: (id, list) => { assert.equal(id, name); deps = JSON.parse(JSON.stringify(list)); }});
    return deps;
};

// 1. No static engine dependency outside the facade.
const consumers = ['amd/src/page_bootstrap.js', 'amd/src/guide_bootstrap.js',
    ...fs.readdirSync(path.join(root, 'amd/src/local/cm')).map(name => 'amd/src/local/cm/' + name)];
consumers.forEach(file => assert.ok(!/easyedu_guide['"]/.test(read(file)), file + ' must import guide_api, not the engine'));
assert.deepEqual(amdDeps('amd/build/page_bootstrap.min.js', 'local_groupimport/page_bootstrap'),
    ['local_groupimport/guide_api', 'local_groupimport/course_manager']);
assert.deepEqual(amdDeps('amd/build/guide_bootstrap.min.js', 'local_groupimport/guide_bootstrap'),
    ['local_groupimport/guide_api']);
fs.readdirSync(path.join(root, 'amd/build/local/cm')).filter(name => name.endsWith('.min.js')).forEach(name => {
    assert.ok(!read('amd/build/local/cm/' + name).includes('"local_groupimport/easyedu_guide"'), name);
});

// 2. Modality fallback queries are the engine's (K15-30: one modality test).
const engine = read('amd/src/easyedu_guide.js'), api = read('amd/src/guide_api.js');
['GUIDE_NARROW_QUERY', 'GUIDE_TOUCH_QUERY'].forEach(name => {
    const pick = source => (source.match(new RegExp(`const ${name} = ('[^']+');`)) || [])[1];
    assert.ok(pick(engine) && pick(engine) === pick(api), name + ' parity');
});
assert.ok(engine.includes("storageKey: 'easyedu.guide.seen',") && api.includes("'easyedu.guide.seen'"), 'default storage key parity');

// 3. Behaviour of the built facade with a stubbed loader and DOM.
const scenario = (config, storage = {}) => {
    const loads = [], inits = [], replays = [];
    const listeners = [];
    const trigger = {closest: selector => selector === '[data-easyedu-guide-open]' ? trigger : null,
        click: () => replays.push('click')};
    const rootNode = {attrs: {}, contains: node => node === trigger,
        addEventListener: (type, fn, capture) => listeners.push({type, fn, capture}),
        removeEventListener: (type, fn) => listeners.splice(listeners.findIndex(item => item.fn === fn), 1),
        setAttribute(name, value) { this.attrs[name] = value; }, removeAttribute(name) { delete this.attrs[name]; }};
    const Guide = {init: (...args) => inits.push(args), getPathContextToken: () => 'engine-token',
        getPathContext: () => 'engine-context', setPathContext: () => true, guideModality: () => 'engine', destroy: () => {}};
    let exported;
    const window = {localStorage: {getItem: key => (key in storage ? storage[key] : null)},
        matchMedia: query => ({matches: query === '(max-width: 64rem)'})};
    vm.runInNewContext(read('amd/build/guide_api.min.js'), {window, document: {querySelector: () => rootNode},
        define: (id, deps, factory) => {
            exported = factory((modules, done) => { loads.push(modules); done(Guide); }, {error: error => { throw error; }});
        }});
    exported.init('[data-easyedu-guide-root]', config);
    return {api: exported, loads, inits, replays, listeners, rootNode, trigger};
};
const flush = () => new Promise(resolve => setImmediate(resolve));
const paths = {a: [{id: 'one'}, {id: 'two'}]};
const key = 'k';
(async() => {
    // Default Student Management load: nothing to show, engine deferred.
    let run = scenario({storageKey: key, paths, firstVisit: false, welcomeOffer: false});
    await flush();
    assert.equal(run.loads.length, 0, 'engine not loaded before opening');
    assert.equal(run.api.isLoaded(), false);
    assert.equal(run.api.getPathContextToken({}, 'a'), null);
    assert.equal(run.api.getPathContext({}, 'a'), null);
    assert.equal(run.api.setPathContext({}, 'a', {}, null), false);
    assert.deepEqual(JSON.parse(JSON.stringify(run.api.guideModality())), {touch: true, narrow: true, pointer: 'touch'});
    assert.equal(run.listeners.length, 1);
    assert.equal(run.listeners[0].capture, true);
    let prevented = 0, stopped = 0;
    const event = {target: run.trigger, preventDefault: () => prevented++, stopImmediatePropagation: () => stopped++};
    run.listeners[0].fn(event);
    run.listeners[0] && run.listeners[0].fn(event); // A second click while loading is swallowed.
    await flush();
    assert.equal(run.loads.length, 1, 'one engine request');
    assert.deepEqual(JSON.parse(JSON.stringify(run.loads[0])), ['local_groupimport/easyedu_guide']);
    assert.equal(run.inits.length, 1, 'engine bound once');
    assert.equal(run.inits[0][1].storageKey, key, 'original configuration forwarded');
    assert.deepEqual(run.replays, ['click'], 'opener replayed to the engine once');
    assert.equal(run.listeners.length, 0, 'deferred listener removed');
    assert.equal(prevented, 2);
    assert.equal(stopped, 2);
    assert.equal(run.api.getPathContextToken({}, 'a'), 'engine-token', 'engine authority after loading');
    assert.equal(run.api.guideModality(), 'engine');
    assert.equal(run.rootNode.attrs['aria-busy'], undefined);

    // Pages that must show Guide UI on load start the engine immediately.
    for (const [label, config, storage] of [
        ['welcome invitation', {storageKey: key, paths, welcomeOffer: true}, {}],
        ['first visit', {storageKey: key, paths, firstVisit: true}, {}],
        ['unfinished path resume', {storageKey: key, paths}, {[key + '.checklist']: JSON.stringify({path: 'a', completed: {a: ['one']}})}],
    ]) {
        run = scenario(config, storage);
        await flush();
        assert.equal(run.loads.length, 1, label);
        assert.equal(run.inits.length, 1, label);
        assert.equal(run.listeners.length, 0, label);
    }
    // No Guide UI on load: deferred.
    for (const [label, config, storage] of [
        ['first visit already seen', {storageKey: key, paths, firstVisit: true}, {[key]: '1'}],
        ['completed path', {storageKey: key, paths}, {[key + '.checklist']: JSON.stringify({path: 'a', completed: {a: ['one', 'two']}})}],
        ['unknown path', {storageKey: key, paths}, {[key + '.checklist']: JSON.stringify({path: 'gone'})}],
        ['corrupt state', {storageKey: key, paths}, {[key + '.checklist']: '{'}],
    ]) {
        run = scenario(config, storage);
        await flush();
        assert.equal(run.loads.length, 0, label);
        assert.equal(run.listeners.length, 1, label);
    }
    console.log('Guide API lazy engine: static isolation, modality parity, deferred open and eager cases PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
