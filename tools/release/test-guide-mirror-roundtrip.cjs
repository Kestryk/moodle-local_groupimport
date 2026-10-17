'use strict';
// Source-only adapter round trip; no browser, build, runtime or service access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2]);
const read = (base, file) => fs.readFileSync(path.join(base, file), 'utf8').replace(/\r\n/g, '\n');
const js = read(kit, 'guide/amd/src/easyedu_guide.js');
assert.equal(js, read(root, 'easyedu-guide-kit/amd/src/easyedu_guide.js'));
execFileSync(process.execPath, ['--input-type=module', '--check'], {input: js});
let body = js.replace('export const destroy =', 'const destroy =')
    .replace("import {createFullscreenController} from './easyedu_guide_fullscreen';", '')
    .replace("import {disclosePanel, cancel as cancelRecapPanel} from '../../../motion/amd/src/easyedu_motion';", '')
    .replace("import * as Motion from '../../../motion/amd/src/easyedu_motion';", '')
    .replace('export const init =', 'const init =').replace('export default init;', '');
const fullscreen = read(kit, 'guide/amd/src/easyedu_guide_fullscreen.js');
assert.equal(fullscreen, read(root, 'easyedu-guide-kit/amd/src/easyedu_guide_fullscreen.js'));
body = fullscreen.replace('export const createFullscreenController =', 'const createFullscreenController =') + '\n' +
    'const disclosePanel = Motion.disclosePanel;\nconst cancelRecapPanel = Motion.cancel;\n' + body;
const boundary = body.indexOf('const SELECTORS =');
const labels = /^(    (?:close|next|previous|start|hint|complete|guidedPath|visited|completedSteps|completeStepFirst): )'[^\r\n]*'(,?)$/gm;
assert.equal([...body.slice(0, boundary).matchAll(labels)].length, 10);
body = body.slice(0, boundary).replace(labels, "$1''$2") + body.slice(boundary);
for (const key of ['getPathContext', 'getPathContextToken', 'setPathContext', 'guideModality']) {
    body = body.replace(`export const ${key} =`, `const ${key} =`);
}
for (const [key, fallback] of [['guidedPath', 'Guided path'], ['visited', 'visited'], ['completedSteps', 'steps completed']]) {
    body = body.replaceAll(`config.labels.${key} || '${fallback}'`, `config.labels.${key} || ''`);
}
const expected = '// This file is generated from the embedded EasyEdu guide kit source and adapted to Moodle AMD.\n' +
    '// Keep behaviour aligned with easyedu-guide-kit/amd/src/easyedu_guide.js, then pass\n' +
    '// selectors, paths and labels from plugin-specific PHP/Mustache data.\n\n' +
    "define(['local_groupimport/motion'], function(Motion) {\n" + body.trimEnd() + '\n\nreturn {\n' +
    '  destroy: destroy,\n  getPathContext: getPathContext,\n  getPathContextToken: getPathContextToken,\n' +
    '  setPathContext: setPathContext,\n  init: init,\n  guideModality: guideModality\n};\n});\n';
assert.equal(expected, read(root, 'amd/src/easyedu_guide.js'), 'AMD adapter round trip is exact');
let api;
let narrow = false;
let touch = false;
const window = {matchMedia: query => ({matches: query === '(max-width: 64rem)' ? narrow : touch})};
vm.runInNewContext(expected, {window, define: (deps, factory) => {assert.deepEqual(Array.from(deps), ['local_groupimport/motion']); api = factory({});}});
for (const key of ['destroy', 'init', 'getPathContext', 'getPathContextToken', 'setPathContext', 'guideModality']) {
    assert.equal(typeof api[key], 'function', key + ' remains callable');
}
for (const [n, t] of [[false, false], [true, false], [false, true], [true, true]]) {
    narrow = n; touch = t;
    assert.deepEqual(JSON.parse(JSON.stringify(api.guideModality())),
        {narrow: n, touch: n || t, pointer: n || t ? 'touch' : 'mouse'});
}
window.matchMedia = undefined;
assert.equal(api.guideModality().pointer, 'mouse');
let template = read(kit, 'guide/templates/easyedu_guide.mustache');
assert.equal(template, read(root, 'easyedu-guide-kit/templates/easyedu_guide.mustache'));
template = template.replace('{{> guide_simplecreate}}', '{{> local_groupimport/guide_simplecreate}}')
    .replace('<span class="easyedu-guide__launcher-label">{{guideopenlabel}}</span>', '<span class="easyedu-guide__launcher-label" aria-hidden="true">{{guidehoverlabel}}</span>')
    .replace('aria-hidden="true">Everything is set</span>', 'aria-hidden="true">{{guidechecklistdonelabel}}</span>')
    .replace('data-complete-message="Everything is set"', 'data-complete-message="{{guidechecklistdonelabel}}"')
    .replace('<span data-easyedu-guide-checklist-message-text>Everything is set</span>', '<span data-easyedu-guide-checklist-message-text>{{guidechecklistdonelabel}}</span>');
assert.equal(template, read(root, 'templates/easyedu_guide.mustache'));
const partial = read(kit, 'guide/templates/guide_simplecreate.mustache');
assert.equal(partial, read(root, 'easyedu-guide-kit/templates/guide_simplecreate.mustache'));
assert.equal(partial.replace('@template guide_simplecreate', '@template local_groupimport/guide_simplecreate'), read(root, 'templates/guide_simplecreate.mustache'));
for (const name of ['_guide.scss', '_guide-discovery.scss', '_animations.scss']) {
    const file = 'scss/easyedu/components/' + name;
    assert.equal(read(root, file), read(kit, file), file);
}
console.log(JSON.stringify({surface: 'guide-mirror-roundtrip', passed: true, amdExports: 6, scss: 3, templates: 2, runtimeAccess: false}));