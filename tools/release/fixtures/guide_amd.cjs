/* eslint-env node */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Execute the real Guide dependency graph in an offline browser, in AMD order.
module.exports = (root, variant = 'built') => {
    const loader = `window.__guideFixtureModules = {};
window.amd = window.__guideFixtureModules;
window.define = (...args) => {
    const name = typeof args[0] === 'string' ? args.shift() : window.__guideFixtureLoading;
    const deps = Array.isArray(args[0]) ? args.shift() : [];
    const factory = args.shift(), exports = {}, module = {exports};
    const values = deps.map(dep => {
        if (dep === 'exports') return exports;
        if (dep === 'module') return module;
        if (!(dep in window.__guideFixtureModules)) throw Error('Missing actual AMD dependency: ' + dep);
        return window.__guideFixtureModules[dep];
    });
    const value = typeof factory === 'function' ? factory(...values) : factory;
    window.__guideFixtureModules[name] = value === undefined ? module.exports : value;
};`;
    const modules = ['motion', 'easyedu_bubble', 'easyedu_guide'].map(name => {
        const file = name === 'easyedu_guide' && variant === 'source' ?
            'amd/src/easyedu_guide.js' : 'amd/build/' + name + '.min.js';
        return 'window.__guideFixtureLoading = ' + JSON.stringify('local_groupimport/' + name) + ';\n' +
            fs.readFileSync(path.join(root, file), 'utf8');
    });
    return [loader, ...modules,
        "window.Guide = window.__guideFixtureModules['local_groupimport/easyedu_guide'];"].join('\n');
};
