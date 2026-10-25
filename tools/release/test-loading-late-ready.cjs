// Consumer readiness only. Virtual timers retain the original fail-open/fades.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = '7f391af4d6531f0ef62c6adc7d410c7426d94153';
const norm = s => s.replace(/\r\n/g, '\n');
const read = f => norm(fs.readFileSync(path.join(root, f), 'utf8'));
const old = f => norm(execFileSync('git', ['show', `${baseline}:${f}`], {cwd: root}).toString());
const additions = [
    `        // Student Management can finish after fail-open has exposed its content.
        // Keep that deadline and reveal unchanged; only recover the readiness
        // marker after the real manager and the existing stability gate finish.
        var recoverLateReady = root.getAttribute('data-easyedu-loading-recover-late-ready') === '1';
`,
    `            if (recoverLateReady && state === 'ready' &&
                    root.getAttribute(loadingStateAttribute) === 'degraded' &&
                    root.getAttribute(readyAttribute) === '1') {
                clearVisualStabilityGate();
                if (managerReadyObserver) {
                    managerReadyObserver.disconnect();
                    managerReadyObserver = null;
                }
                // Content is already revealed and interactive. Never replay the
                // Skeleton handoff or change focus, geometry, inert or Motion.
                root.setAttribute(loadingStateAttribute, 'ready');
                if (diagnostics) {
                    diagnostics.record('manager-ready', Object.assign({
                        reason: 'late-' + (reason || 'unknown'), recoveredFrom: 'degraded'
                    }, captureVisibility(root)));
                }
                return true;
            }
`,
    `                if (state === 'degraded' && recoverLateReady) {
                    // Initialization can complete during the existing exit fade.
                    // Restart only its stability check after fail-open settles.
                    clearVisualStabilityGate();
                    managerReadyScheduled = false;
                    scheduleManagerReady();
                }
`
];
let reconstructed = read('js/loading_state_bootstrap.js');
for (const block of additions) {
    assert.equal(reconstructed.split(block).length, 2, 'Exact one additive recovery block');
    reconstructed = reconstructed.replace(block, '');
}
reconstructed = reconstructed.replace(
    "if (managerReadyObserver && !(state === 'degraded' && recoverLateReady)) {",
    'if (managerReadyObserver) {');
assert.ok(reconstructed === old('js/loading_state_bootstrap.js'), 'All other bootstrap deadline/fades/guards preserved');
assert.ok(read('templates/manage.mustache').replace('    data-easyedu-loading-recover-late-ready="1"\n', '') === old('templates/manage.mustache'));
for (const f of ['styles.css', 'index.php', 'settings.php', 'js/admin_settings_loading.js',
    'amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/build/course_manager.min.js.map',
    'amd/src/motion.js', 'amd/build/motion.min.js', 'templates/easyedu_navigation.mustache']) {
    assert.ok(read(f) === old(f), `${f}: complete identity`);
}

const simulate = (source, optIn, reduced, initAt) => {
    let now = 0, sequence = 0;
    const timers = new Map(), observers = [], states = [], events = [], classes = new Set();
    const timer = (fn, delay = 0) => {const id = ++sequence; timers.set(id, {at: now + delay, fn}); return id;};
    const attrs = new Map([['data-easystud-loading-state', 'loading'],
        ['data-easystud-loading-reveal-duration', '320']]);
    if (optIn) attrs.set('data-easyedu-loading-recover-late-ready', '1');
    const content = {hidden: true, inert: false, getBoundingClientRect: () => ({width: 400, height: 600}),
        setAttribute() {}, removeAttribute() {}};
    const skeleton = {hidden: false, getBoundingClientRect: () => ({width: 400, height: 600})};
    const node = {id: 'local-groupimport-easystud',
        classList: {contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c)},
        getAttribute: key => attrs.get(key) ?? null,
        setAttribute: (key, value) => {
            attrs.set(key, value);
            if (key === 'data-easystud-loading-state') states.push({at: now, state: value});
            observers.filter(o => o.active && o.node === node && o.options.attributeFilter?.includes(key))
                .forEach(o => o.fn());
        },
        querySelector: selector => selector === '[data-easystud-loading-skeleton]' ? skeleton : content,
        getBoundingClientRect: () => ({width: 400, height: 600})};
    class Observer {
        constructor(fn) {this.fn = fn; observers.push(this);}
        observe(n, options) {this.node = n; this.options = options; this.active = true;}
        disconnect() {this.active = false;}
    }
    const window = {location: {href: 'http://localhost/manage.php?easystudloadingdiagnostics=1'},
        performance: {now: () => now}, setTimeout: timer, clearTimeout: id => timers.delete(id),
        requestAnimationFrame: fn => timer(fn, 16), matchMedia: () => ({matches: reduced}),
        getComputedStyle: n => ({display: n.hidden ? 'none' : 'block', visibility: 'visible'})};
    const document = {readyState: 'complete', getElementById: () => node, querySelectorAll: () => [],
        fonts: {ready: {then: fn => fn()}}, dispatchEvent: e => events.push(e.detail)};
    vm.runInNewContext(source, {window, document, MutationObserver: Observer, URL, Number, Object,
        CustomEvent: class {constructor(type, options) {this.detail = options.detail;}},
        getComputedStyle: n => ({display: n.hidden ? 'none' : 'block', visibility: 'visible'})});
    if (initAt !== null) timer(() => node.setAttribute('data-easystud-manager-initialised', '1'), initAt);
    while (timers.size) {
        const [id, task] = [...timers].sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (task.at > 12000) break;
        timers.delete(id); now = task.at; task.fn();
    }
    return {state: attrs.get('data-easystud-loading-state'), states, events,
        contentHidden: content.hidden, skeletonHidden: skeleton.hidden, inert: content.inert,
        busy: attrs.get('aria-busy'), observers: observers.filter(o => o.active).length};
};
let count = 0;
for (const reduced of [false, true]) {
    for (const initAt of [100, 7990, 8030, 9000, null]) {
        for (const optIn of [false, true]) {
            const result = simulate(read('js/loading_state_bootstrap.js'), optIn, reduced, initAt);
            const legacy = simulate(old('js/loading_state_bootstrap.js'), false, reduced, initAt);
            if (!optIn || legacy.state === 'ready' || initAt === null) {
                assert.deepEqual(result.states, legacy.states, 'Exact original normal/fail-open transition');
            } else {
                assert.equal(result.state, 'ready', 'Real late initialization recovers readiness');
                assert.deepEqual(result.states.slice(0, 1), legacy.states, 'Original degraded handoff unchanged');
                assert.equal(result.states.filter(s => s.state === 'degraded').length, 1);
                assert.equal(result.states.filter(s => s.state === 'ready').length, 1);
                assert.ok(result.events.some(e => e.details.recoveredFrom === 'degraded'));
            }
            assert.equal(result.contentHidden, false);
            assert.equal(result.skeletonHidden, true);
            assert.equal(result.inert, false);
            assert.equal(result.busy, 'false');
            if (result.state === 'ready') assert.equal(result.observers, 0,
                JSON.stringify({optIn, reduced, initAt, states: result.states, events: result.events}));
            count++;
        }
    }
}
console.log(`PASS ${count} normal/reduced/legacy/late/never-init cases; full unrelated CSS/AMD/Guide unchanged.`);
