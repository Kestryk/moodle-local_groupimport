// ci-reusable: bounded T041 adapter, not a visual or whole-modal accessibility proof.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const declarations = require('./lib/js-declarations.cjs');
const modulePath = 'amd/src/local/cm/modal.js';
const helper = declarations(root, modulePath, ['bindCardModalKeyboard']);
const dependencies = declarations(root, modulePath,
    ['modalKeyboardState', 'modalFocusVisible', 'modalTabStops']);
const document = {activeElement: null};
const context = vm.createContext({document, getComputedStyle: () => ({visibility: 'visible'})});
vm.runInContext(dependencies + '\n' + helper + '\nthis.bind = bindCardModalKeyboard;', context);
const handlers = {}, focusCalls = [], close = {disabled: false, isConnected: true, tabIndex: 0,
    matches: selector => selector !== ':disabled', closest: () => null, getClientRects: () => [{}], focus: options => focusCalls.push(options)};
let closing = false, cancels = 0;
const modal = {hidden: false, setAttribute(name, value) {this[name] = value;},
    focus() {this.focused = true;}, classList: {contains: () => closing},
    querySelector: () => close, querySelectorAll: () => [close], addEventListener: (name, listener) => {handlers[name] = listener;}};
const focus = context.bind(modal, () => {cancels++;});
focus(); assert.equal(focusCalls.length, 1); assert.equal(focusCalls[0].preventScroll, true);
const key = (key, defaultPrevented = false) => {
    const event = {key, defaultPrevented, prevented: false, stopped: false,
        preventDefault() {this.prevented = true;}, stopPropagation() {this.stopped = true;}};
    handlers.keydown(event); return event;
};
assert.equal(key('Enter').prevented, false); assert.equal(cancels, 0);
assert.equal(key('Escape', true).stopped, false); assert.equal(cancels, 0);
modal.hidden = true; key('Escape'); assert.equal(cancels, 0);
modal.hidden = false; closing = true; key('Escape'); assert.equal(cancels, 0);
closing = false; const escaped = key('Escape');
assert.equal(escaped.prevented, true); assert.equal(escaped.stopped, true); assert.equal(cancels, 1);
close.disabled = true; focus(); assert.equal(focusCalls.length, 1);
assert.equal(modal.focused, true, 'Empty tab-stop list focuses the dialog itself');
assert.equal(modal.tabindex, '-1');
assert.ok(read('amd/build/local/cm/modal.min.js').includes('bindCardModalKeyboard'));
const map = JSON.parse(read('amd/build/local/cm/modal.min.js.map'));
assert.ok(map.sourcesContent.some(content => content.includes(helper.trimEnd())), 'Generated map includes current production helper');
console.log('PASS current modal keyboard behavior and actual split-module source-map identity; historical whole-controller freeze retired.');
