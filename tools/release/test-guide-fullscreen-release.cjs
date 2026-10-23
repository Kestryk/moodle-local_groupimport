/* eslint-env node */
'use strict';
// Regression: a browser exit can precede a Guide close while host release is pending.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || path.join(__dirname,
    '../../easyedu-guide-kit/amd/src/easyedu_guide_fullscreen.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(source.replace('export const createFullscreenController =',
    'globalThis.createFullscreenController ='), sandbox);
const classes = () => {
 const set = new Set(); return {add: x => set.add(x), remove: x => set.delete(x)};
};
const flush = async() => {
 for (let i = 0; i < 8; i++) {
 await Promise.resolve();
}
};
const fixture = (unstable = false) => {
    const events = new Map(),
timers = [],
attributes = new Map();
    const box = (top = 0) => ({left: 0, top, width: 800, height: 900});
    const html = {classList: classes()},
parent = {parentElement: html, children: [], getBoundingClientRect: () => box()};
    html.getBoundingClientRect = () => box();
    html.children = [parent];
    const host = {tagName: 'MAIN', hidden: false,
        getBoundingClientRect: () => box(unstable && attributes.has('data-easyedu-guide-parked') ? -40 : 0),
        style: {setProperty() {}, removeProperty() {}}, setAttribute: n => attributes.set(n, ''),
        removeAttribute: n => attributes.delete(n)};
    const document = {documentElement: html, fullscreenElement: null, fullscreenEnabled: true,
        addEventListener: (n, fn) => events.set(n, fn), removeEventListener: n => events.delete(n)};
    let browserExits = 0;
    document.exitFullscreen = async() => {
 browserExits++; document.fullscreenElement = null; events.get('fullscreenchange')?.();
};
    document.defaultView = {innerWidth: 1600, setTimeout: fn => {
 timers.push(fn); return timers.length;
},
        getComputedStyle: () => ({display: 'block'}), addEventListener() {}, removeEventListener() {}};
    const element = {ownerDocument: document, parentElement: parent, isConnected: true, hidden: false,
        getBoundingClientRect: () => box(),
        requestFullscreen: async() => {
 document.fullscreenElement = element; events.get('fullscreenchange')?.();
}};
    parent.children = [element, host];
    return {controller: sandbox.createFullscreenController(element), document, timers, attributes,
        exits: () => browserExits};
};
(async() => {
    for (const mode of ['owned-exit', 'browser-exit-before-close', 'destroy-after-browser-exit']) {
        const f = fixture();
        assert.equal(await f.controller.toggle(), true);
        assert.equal(f.attributes.has('data-easyedu-guide-parked'), true);
        if (mode !== 'owned-exit') {
 await f.document.exitFullscreen();
}
        const before = f.exits();
        let resolved = false;
        const release = (mode.startsWith('destroy') ? f.controller.destroy() : f.controller.exit()).then(() => {
 resolved = true;
});
        await flush();
        assert.equal(resolved, false, mode + ': close must wait while host is parked');
        if (mode !== 'owned-exit') {
 assert.equal(f.exits(), before, 'Do not exit another fullscreen session');
}
        assert.equal(f.timers.length, 1);
        f.timers.shift()();
        await release;
        assert.equal(f.attributes.has('data-easyedu-guide-parked'), false);
        assert.equal(resolved, true);
    }
    const idle = fixture();
    await idle.controller.exit();
    assert.equal(idle.timers.length, 0, 'No release delay without parking');
    const unsafe = fixture(true);
    assert.equal(await unsafe.controller.toggle(), true);
    assert.equal(unsafe.attributes.has('data-easyedu-guide-parked'), false, 'Do not park a group whose flow moves');
    assert.equal(unsafe.controller.isHostParked(), false);
    await unsafe.document.exitFullscreen();
    await unsafe.controller.exit();
    assert.equal(unsafe.timers.length, 0, 'No stranded release wait after all groups were rejected');
    process.stdout.write('PASS: release barriers, stable parking and rejection of geometry-changing containment\n');
})().catch(error => {
 process.stderr.write(String(error)); process.exitCode = 1;
});
