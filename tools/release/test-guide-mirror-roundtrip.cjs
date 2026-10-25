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
    .replace("import * as EasyeduBubble from './easyedu_bubble';\n", '')
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
    "define(['local_groupimport/motion', 'local_groupimport/easyedu_bubble'], function(Motion, EasyeduBubble) {\n" + body.trimEnd() + '\n\nreturn {\n' +
    '  destroy: destroy,\n  getPathContext: getPathContext,\n  getPathContextToken: getPathContextToken,\n' +
    '  setPathContext: setPathContext,\n  init: init,\n  guideModality: guideModality\n};\n});\n';
assert.equal(expected, read(root, 'amd/src/easyedu_guide.js'), 'AMD adapter round trip is exact');
// The shared controller is identical in canonical, embedded and runtime sources.
const bubble = read(kit, 'guide/amd/src/easyedu_bubble.js');
assert.equal(bubble, read(root, 'easyedu-guide-kit/amd/src/easyedu_bubble.js'));
assert.equal(bubble, read(root, 'amd/src/easyedu_bubble.js'));
assert.ok(!/^import\s/m.test(bubble), 'Motion remains injected into the shared controller');
execFileSync(process.execPath, ['--input-type=module', '--check'], {input: bubble});
const bubbleApi = vm.runInNewContext('(() => {' + bubble.replace(/^export const /gm, 'const ') +
    '\nreturn {BUBBLE_CLASS, GRACE_MS, createBubbleController}; })()');
assert.equal(bubbleApi.BUBBLE_CLASS, 'local-groupimport-easystud-hover-popover');
assert.equal(bubbleApi.GRACE_MS, 220);
assert.equal(typeof bubbleApi.createBubbleController, 'function');
let builtBubble;
vm.runInNewContext(read(root, 'amd/build/easyedu_bubble.min.js'), {define: (name, deps, factory) => {
    assert.equal(name, 'local_groupimport/easyedu_bubble');
    assert.deepEqual(Array.from(deps), ['exports']);
    builtBubble = {};
    factory(builtBubble);
}});
assert.equal(builtBubble.BUBBLE_CLASS, bubbleApi.BUBBLE_CLASS);
assert.equal(builtBubble.GRACE_MS, bubbleApi.GRACE_MS);
assert.equal(typeof builtBubble.createBubbleController, 'function');
let api;
let narrow = false;
let touch = false;
const window = {matchMedia: query => ({matches: query === '(max-width: 64rem)' ? narrow : touch})};
vm.runInNewContext(expected, {window, define: (deps, factory) => {assert.deepEqual(Array.from(deps), ['local_groupimport/motion', 'local_groupimport/easyedu_bubble']); api = factory({}, bubbleApi);}});
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
template = template.replace(/{{> (guide_\w+)}}/g, '{{> local_groupimport/$1}}')
    .replaceAll('{{displaypreferenceslabel}}', '{{#str}}displaypreferences, local_groupimport{{/str}}')
    .replace('<span class="easyedu-guide__launcher-label">{{guideopenlabel}}</span>', '<span class="easyedu-guide__launcher-label" aria-hidden="true">{{guidehoverlabel}}</span>')
    .replace('aria-hidden="true">Everything is set</span>', 'aria-hidden="true">{{guidechecklistdonelabel}}</span>')
    .replace('data-complete-message="Everything is set"', 'data-complete-message="{{guidechecklistdonelabel}}"')
    .replace('<span data-easyedu-guide-checklist-message-text>Everything is set</span>', '<span data-easyedu-guide-checklist-message-text>{{guidechecklistdonelabel}}</span>');
assert.equal(template, read(root, 'templates/easyedu_guide.mustache'));
for (const name of ['guide_simplecreate', 'guide_specimen', 'guide_specimen_group', 'guide_specimen_grouping', 'guide_specimen_participant', 'guide_anatomy']) {
    const file = 'templates/' + name + '.mustache';
    const partial = read(kit, 'guide/' + file);
    assert.equal(partial, read(root, 'easyedu-guide-kit/' + file));
    const localized = partial.replace('@template ' + name, '@template local_groupimport/' + name)
        .replace(/{{> (guide_\w+)}}/g, '{{> local_groupimport/$1}}');
    assert.equal(localized, read(root, file), name + ' consumer partial is an exact adapter');
}
for (const name of ['_guide.scss', '_guide-discovery.scss', '_guide-specimen.scss', '_animations.scss']) {
    const file = 'scss/easyedu/components/' + name;
    assert.equal(read(root, file), read(kit, file), file);
}
for (const file of ['scss/easyedu/_tokens.scss', 'scss/easyedu/components/_card-actions.scss', 'scss/easyedu/components/_responsive.scss']) {
    assert.equal(read(root, file), read(kit, file), file);
}
console.log(JSON.stringify({surface: 'guide-mirror-roundtrip', passed: true, amdExports: 6, bubbleExports: 3, amdModules: 3, scss: 7, templates: 7, runtimeAccess: false}));
