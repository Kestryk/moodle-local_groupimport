'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2]);
const files = [
    path.join(kit, 'guide/amd/src/easyedu_guide.js'),
    path.join(root, 'easyedu-guide-kit/amd/src/easyedu_guide.js'),
    path.join(root, 'amd/src/easyedu_guide.js'),
];
const navigation = file => {
    const source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const start = source.indexOf('const bindNavWheel = root => {');
    const end = source.indexOf('\nconst bindHighlightAutoRefresh =', start);
    assert.ok(start >= 0 && end > start, 'Navigation binding exists');
    return source.slice(start, end).trim();
};
const sources = files.map(navigation);
assert.equal(sources[0], sources[1], 'Canonical and embedded navigation bindings match');
assert.equal(sources[1], sources[2], 'Moodle uses the shared navigation binding');

for (const source of sources) {
    const listeners = [];
    const document = {};
    const window = {getComputedStyle: () => ({direction: 'ltr'})};
    const reveals = [];
    const scrolls = [];
    const item = name => ({
        closest: () => items[name],
        scrollIntoView: options => reveals.push({name, options}),
    });
    const items = {first: item('first'), second: item('second')};
    const nav = {
        dataset: {}, scrollWidth: 1000, clientWidth: 300,
        contains: element => Object.values(items).includes(element),
        scrollBy: options => scrolls.push(options),
        closest: () => null,
    };
    const guide = {querySelector: () => nav};
    const dispatch = (target, type, event) => {
        listeners.filter(listener => listener.target === target && listener.type === type)
            .forEach(listener => listener.callback(event));
    };
    const environment = {
        root: guide, document, window,
        SELECTORS: {nav: 'nav', navItem: 'item'},
        addTrackedListener: (owner, target, type, callback) => listeners.push({target, type, callback}),
        updateNavScrollButtons: () => null,
        getScrollBehavior: () => 'smooth',
        clearTrackedTimeout: () => null,
        setTrackedTimeout: () => 1,
        isModalOpen: () => false,
        scrollActiveNavItemIntoView: () => null,
    };
    vm.runInNewContext('(() => {\n' + source + '\nbindNavWheel(root);\n})();', environment);

    dispatch(nav, 'pointerdown', {target: items.first});
    dispatch(nav, 'focusin', {target: items.first});
    assert.equal(reveals.length, 0, 'Pointer focus keeps the pressed pill stationary until click');
    dispatch(document, 'pointerup', {});
    dispatch(nav, 'focusin', {target: items.second});
    assert.equal(reveals.at(-1).name, 'second', 'Non-pointer focus still reveals its pill');
    assert.equal(reveals.at(-1).options.inline, 'center');
    assert.equal(reveals.at(-1).options.behavior, 'smooth', 'Existing Motion scroll policy is preserved');

    for (const release of ['pointerup', 'pointercancel']) {
        dispatch(nav, 'pointerdown', {target: items.first});
        dispatch(document, release, {});
        const before = reveals.length;
        dispatch(nav, 'focusin', {target: items.first});
        assert.equal(reveals.length, before + 1, 'Release outside the nav cannot suppress a later focus');
    }
    dispatch(nav, 'pointerdown', {target: items.first});
    dispatch(nav, 'focusin', {target: items.second});
    assert.equal(reveals.at(-1).name, 'second', 'Pointer origin does not suppress another focused pill');

    let prevented = false;
    dispatch(nav, 'wheel', {ctrlKey: false, deltaX: 0, deltaY: 30, preventDefault: () => {
        prevented = true;
    }});
    assert.equal(prevented, true);
    assert.equal(scrolls.at(-1).left, 30, 'Wheel scrolling remains scoped to the navigation');

    const count = listeners.length;
    vm.runInNewContext('(() => {\n' + source + '\nbindNavWheel(root);\n})();', environment);
    assert.equal(listeners.length, count, 'Rebinding does not duplicate input listeners');
}

process.stdout.write('PASS: shared Guide pointer focus, subsequent focus, cancellation and wheel contracts (3 producers).\n');
