/* eslint-env node */
'use strict';

// K18-A: the actual Motion primitive, checklist fold guard and PHP curriculum.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2]);
const php = process.argv[3];
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const source = read(path.join(root, 'amd/src/motion.js'));
const canonical = read(path.join(kit, 'motion/amd/src/easyedu_motion.js'));
const primitive = text => text.slice(text.indexOf('/**\n * Give an illustrated click'), text.indexOf('export const enter ='));
assert.ok(primitive(source).includes('export const clickFeedback'));
assert.equal(primitive(source), primitive(canonical), 'One identical click primitive, without replacing inherited Motion policies');
const guide = read(path.join(root, 'amd/src/easyedu_guide.js'));
assert.ok(!guide.includes("animate(element, [{transform: 'scale(1)'}, {transform: 'scale(.94)'"));
assert.ok(guide.includes('Motion.clickFeedback(element, {root, level: getMotionLevel(root), animate:'));
assert.ok(guide.includes('Motion.clickFeedback(trigger, {root, level: getMotionLevel(root)})'));
const buttons = read(path.join(root, 'scss/easyedu/components/_buttons.scss'));
const discovery = read(path.join(root, 'scss/easyedu/components/_guide-discovery.scss'));
assert.ok(buttons.includes('@mixin demonstration-action {'));
assert.ok(buttons.includes('> :not(.fa) { line-height: normal; }'));
assert.ok(buttons.includes('@media (max-width: 40rem), (pointer: coarse) {\n' +
    '    min-block-size: var(--easyedu-touch-target-min);'));
assert.ok(!discovery.includes('$secondary: true, $matched-size: true'), 'Replay has no independent white action recipe');
assert.equal(buttons, read(path.join(kit, 'scss/easyedu/components/_buttons.scss')));
const start = guide.indexOf('const foldChecklistAwayFromTarget =');
const end = guide.indexOf('const unfoldAvoidingChecklist =', start);
let minimizeSync = 0;
const fold = vm.runInNewContext('(() => {' + guide.slice(start, end) + '\nreturn foldChecklistAwayFromTarget;})()', {
    document: {activeElement: null}, CHECKLIST_AVOIDING_CLASS: 'is-avoiding',
    syncChecklistMinimizeControl: () => minimizeSync++, isVisibleElement: () => true,
});
const target = {};
const otherTarget = {};
const state = new Set();
const checklist = {
    classList: {contains: key => state.has(key), add: (...keys) => keys.forEach(key => state.add(key))},
    removeAttribute: () => undefined,
};
const owner = {easyeduGuideChecklistExpandedTarget: target};
fold(owner, checklist, target);
assert.equal(state.size, 0, 'An explicit restore cannot immediately auto-fold the same target');
fold(owner, checklist, otherTarget);
assert.ok(state.has('is-minimized'), 'A new target retains automatic avoidance');
assert.equal(minimizeSync, 1);

(async() => {
    let cases = 0;
    for (const text of [source, canonical]) {
        const api = vm.runInNewContext('(() => {' + text.replace(/^export const /gm, 'const ') +
            '\nreturn {clickFeedback};})()', {
            window: {matchMedia: () => ({matches: false})},
            document: {querySelector: () => null, body: {classList: {contains: () => false}}},
        });
        for (const level of ['full', 'reduced', 'minimal']) {
            const element = {
                animate: () => {
                    throw new Error('The owned scene clock must be used');
                },
                closest: () => element, matches: () => true,
                getAttribute: name => name === 'data-easyedu-motion-level' ? level : 'enabled',
                hasAttribute: () => false,
            };
            let effects = 0;
            await api.clickFeedback(element, {root: element, level, animate: (node, frames, timing) => {
                assert.equal(node, element);
                assert.deepEqual(Array.from(frames, frame => frame.transform), ['scale(1)', 'scale(.94)', 'scale(1)']);
                assert.ok(timing.duration > 0);
                effects++;
                return globalThis.Promise.resolve(true);
            }});
            assert.equal(effects, level === 'full' ? 1 : 0, 'Reduced/minimal never scale a click target');
            cases++;
        }
    }
    for (const language of ['fr', 'en']) {
        const payload = JSON.parse(execFileSync(php,
            [path.join(root, 'tools/release/guide-current-curriculum-fixture.php'), language],
            {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));
        const slides = payload.templateData.slides;
        assert.equal(slides.length, 13);
        assert.equal(slides[2].id, 'create-one');
        assert.equal(slides[2].commonintroduction, undefined, 'No creation recap after the demonstration');
        assert.ok(slides[2].discoveryscene.note.includes('#*3'), 'The creation syntax warning survives');
        assert.ok(read(path.join(root, 'templates/easyedu_guide.mustache')).includes('data-guide-simplecreate-note'));
        cases++;
    }
    process.stdout.write(JSON.stringify({surface: 'guide-k18-controls', passed: true, cases,
        checklist: 'manual restore wins for the same target; new target still avoids', runtimeAccess: false}) + '\n');
})().catch(error => {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
});
