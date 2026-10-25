'use strict';

// Isolated import binding contract with an inert Guide specimen before the real form.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const rootPath = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(rootPath, 'amd/src/csv_import.js'), 'utf8').replace(/\r\n/g, '\n')
    .replace("import * as Motion from './motion';", '')
    .replace("import {isImportFileReady} from './local/import_file_ready';",
        fs.readFileSync(path.join(rootPath, 'amd/src/local/import_file_ready.js'), 'utf8')
            .replace('export const isImportFileReady', 'const isImportFileReady')).replace('export const init =', 'const init =');
const timers = [];
const attributes = {};
const observers = [];
const notice = {hidden: true, scrollIntoView() {}};
let filename = null;
let uploading = false;
const pickerButton = {setAttribute() {}, removeAttribute() {}, focus() {}};
const guideInput = {owner: 'guide'};
const nativeInput = {owner: 'native'};
let submitted;
const form = {
    dataset: {},
    querySelector(selector) { return selector === '[data-local-groupimport-file-required]' ? notice : null; },
    addEventListener(type, listener) { if (type === 'submit') { submitted = listener; } },
};
const deposit = {
    dataset: {}, classList: {remove() {}},
    closest(selector) { return selector === 'form' ? form : null; },
    querySelector(selector) {
        if (selector === '.filepicker-filename a') { return filename === null ? null : {textContent: filename}; }
        if (selector === '.dndupload-inprogress') { return uploading ? {} : null; }
        return selector === '[id^="filepicker-button-"]' ? pickerButton : null;
    },
};
const wrapper = {
    querySelector(selector) {
        if (selector === '.easyedu-file-deposit--moodle') { return deposit; }
        if (selector === 'input[type="file"]') { return nativeInput; }
        return null;
    },
    contains(element) { return element === nativeInput; },
};
const root = {
    dataset: {},
    querySelectorAll() { return []; },
    querySelector(selector) {
        if (selector === '[data-local-groupimport-import-form]') { return wrapper; }
        if (selector === '.easyedu-file-deposit--moodle' || selector === '.easyedu-file-deposit') {
            return {owner: 'guide'};
        }
        if (selector === 'input[type="file"]') { return guideInput; }
        return null;
    },
    contains() { return true; },
    setAttribute(name, value) { attributes[name] = value; },
    removeAttribute(name) { delete attributes[name]; },
};
const window = {M: {core_filepicker: {instances: {}}}};
const sandbox = {window, M: window.M, Motion: {init() {}}, performance: {now: () => 0},
    document: {getElementById(id) { return id === 'root' ? root : id === 'native' ? nativeInput : guideInput; }},
    MutationObserver: class {
        constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
        observe() {}
        disconnect() { this.disconnected = true; }
    }, setTimeout: callback => { timers.push(callback); },
};
sandbox.window.setTimeout = sandbox.setTimeout;
vm.createContext(sandbox);
vm.runInContext(source + '\nthis.testImport = {init, findDeposit, findFileInput, findFilePicker, initImportFileRequirement, initImportPickerReadiness};', sandbox);
const api = sandbox.testImport;
let checks = 0;
const equal = (...args) => { assert.equal(...args); checks++; };
(async() => {
    equal(api.findDeposit(root), deposit);
    equal(api.findFileInput(root), nativeInput);
    api.initImportFileRequirement(root);
    equal(form.dataset.easyeduImportRequirementBound, '1');
    let prevented = false;
    submitted({preventDefault() { prevented = true; }, stopImmediatePropagation() {}});
    equal(prevented, true);
    equal(notice.hidden, false);
    for (filename of [null, '', '   ', 'mixed.csv']) {
        for (uploading of [false, true]) {
            notice.hidden = true;
            let blocked = false;
            submitted({preventDefault() { blocked = true; }, stopImmediatePropagation() {}});
            const ready = Boolean(filename && filename.trim() && !uploading);
            equal(blocked, !ready, 'only a completed native file permits submission');
            equal(notice.hidden, ready, 'notice tracks actual picker readiness');
        }
    }
    filename = null;
    uploading = false;
    api.init('root');
    equal(attributes['data-easyedu-loading-ready'], undefined, 'not ready before Moodle binds its actual picker');
    equal(timers.length, 1);
    window.M.core_filepicker.instances = {specimen: {options: {elementid: 'guide'}},
        actual: {options: {elementid: 'native'}}};
    equal(api.findFilePicker(root).clientId, 'actual', 'inert specimen cannot satisfy readiness');
    timers.shift()();
    await Promise.resolve();
    equal(attributes['data-easyedu-loading-ready'], '1');
    equal(observers[observers.length - 1].disconnected, true);
    delete attributes['data-easyedu-loading-ready'];
    window.M.core_filepicker.instances = {};
    api.initImportPickerReadiness(root, 'data-easyedu-loading-ready');
    const late = observers[observers.length - 1];
    attributes['data-easyedu-picker-unavailable'] = '1';
    window.M.core_filepicker.instances.actual = {options: {elementid: 'native'}};
    late.callback();
    equal(attributes['data-easyedu-loading-ready'], '1', 'native wrapper mutation permits late recovery');
    equal(attributes['data-easyedu-picker-unavailable'], undefined);
    equal(late.disconnected, true, 'observer disconnects on readiness');
    console.log(JSON.stringify({passed: true, checks, guardedStates: 8, runtimeAccess: false}));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
