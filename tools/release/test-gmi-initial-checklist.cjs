/* eslint-env node */
'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict');
const {chromium} = require(process.argv[2]);
const output = process.argv[3], root = path.resolve(__dirname, '../..');
fs.mkdirSync(output, {recursive: true});
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = cp.execFileSync('git', ['show', '48ed6808:amd/src/easyedu_guide.js'], {cwd: root, encoding: 'utf8'})
    .replace(/\r\n/g, '\n');
const slice = (source, start, end) => {
    assert.ok(source.includes(start) && source.includes(end));
    return source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
};
const functions = source => [
    slice(source, 'const resolveActiveChecklistTarget =', 'const observeHighlightedTarget ='),
    slice(source, 'const CHECKLIST_AVOID_MARGIN =', 'const showInterfaceReturn ='),
    slice(source, 'const renderChecklist =', 'const updateChecklistMessage ='),
    slice(source, 'const setActiveChecklistStep =', 'const markChecklistStepComplete =')
].join('\n');
(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    const rows = [], errors = [];
    try {
        for (const level of ['full', 'reduced', 'minimal']) for (const lang of ['fr', 'en']) {
            const pair = {};
            for (const version of ['before', 'after']) {
                const page = await browser.newPage({viewport: {width: 1600, height: 1000}});
                page.on('pageerror', error => errors.push(error.message));
                page.on('console', message => {if (message.type() === 'error') { errors.push(message.text()); }});
                const css = read('styles/student-management.css').replaceAll('../fonts/InterVariable.woff2',
                    'data:font/woff2;base64,' + fs.readFileSync(root + '/fonts/InterVariable.woff2').toString('base64'));
                await page.setContent(`<style>${css}</style>
                  <main class="easyedu-ui easyedu-guide local-groupimport-easystud-easyedu-guide easyedu-guide--discovery" data-easyedu-motion-level="${level}" id="root">
                    <button id="target" style="position:fixed;left:900px;top:820px">Cancel</button>
                    <div id="warning" style="position:fixed;left:900px;top:830px;width:575px;height:170px">Warning</div>
                    <aside class="easyedu-guided-panel" data-checklist hidden><div data-items></div></aside>
                  </main>`);
                await page.evaluate(() => document.fonts.ready);
                pair[version] = await page.evaluate(async({source, lang}) => {
                    const root = document.querySelector('#root');
                    // Isolate the real render/docking functions from storage, modal focus and progress services.
                    const setup = `
                      const SELECTORS={checklist:'[data-checklist]',checklistItems:'[data-items]',checklistMessage:'[data-message]'};
                      const isCompactChecklistViewport=()=>false;
                      const getExternalTargetDialog=()=>null;
                      const isVisibleElement=e=>!!e&&e.getBoundingClientRect().height>0&&!e.hidden;
                      const rectsOverlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
                      const getFixedTopClearance=()=>60;
                      const dockChecklistAboveTarget=()=>{};
                      const hideInterfaceReturn=()=>{};
                      const syncChecklistMinimizeControl=()=>{};
                      const saveChecklistProgress=()=>{};
                      const updateChecklistHeader=()=>{};
                      const updateChecklistMessage=()=>{};
                      const isStepComplete=()=>false;
                      const getCompletedSteps=()=>[];
                      const isRequirementMet=()=>true;
                      const getLockedStepRequirement=()=>'';
                      const getStepText=(step,key)=>step[key]||'';
                      const loadGuideState=()=>({path:'review',activeIndex:0});
                      const resolveStepHighlightTarget=()=>document.querySelector('#target');
                      const resolveTarget=(config,selector)=>document.querySelector(selector);
                    `;
                    const api = Function(setup + source +
                        '\nreturn {renderChecklist,setActiveChecklistStep,dockChecklistAwayFromTarget};')();
                    const step = {id: 'cancel-preview', title: lang === 'fr' ? 'Annuler' : 'Cancel', avoidCompanion: '#warning'};
                    const config = {paths: {review: [step]}, unlockPaths: [], labels: {}};
                    root.easyeduGuideConfig = config;
                    const checklist = root.querySelector('[data-checklist]');
                    const sample = () => {
                        const a = checklist.getBoundingClientRect(), b = document.querySelector('#warning').getBoundingClientRect();
                        return {overlap: Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
                            Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)),
                            x: a.x, y: a.y, width: a.width, height: a.height, classes: checklist.className};
                    };
                    api.renderChecklist(root, config, 'review');
                    const immediate = sample();
                    const frames = [];
                    await new Promise(resolve => {
                        const started = performance.now();
                        const frame = () => {frames.push(sample());
                            if (performance.now() - started < 350) requestAnimationFrame(frame); else resolve();};
                        requestAnimationFrame(frame);
                    });
                    api.setActiveChecklistStep(root, config, 0);
                    const afterStep = sample();
                    // Reproduce the later highlight callback; it repaired the old
                    // layout only after the initial overlap had already painted.
                    api.dockChecklistAwayFromTarget(root, document.querySelector('#target'), document.querySelector('#warning'));
                    await new Promise(resolve => setTimeout(resolve, 650));
                    const at1s = sample();
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    const at5s = sample();
                    return {immediate, frames, afterStep, at1s, at5s};
                }, {source: functions(version === 'before' ? baseline : read('amd/src/easyedu_guide.js')), lang});
                await page.close();
            }
            fs.writeFileSync(output + '/latest-pair.json', JSON.stringify(pair, null, 2));
            assert.ok(pair.before.immediate.overlap > 0, 'Baseline reproduces the initial overlap');
            assert.equal(pair.after.immediate.overlap, 0, 'No initial overlap before yielding');
            assert.ok(pair.after.frames.length > 2);
            pair.after.frames.forEach(frame => assert.equal(frame.overlap, 0, 'Every painted frame stays clear'));
            assert.equal(pair.after.afterStep.overlap, 0);
            assert.equal(pair.before.at1s.overlap, 0);
            assert.equal(pair.before.at5s.overlap, 0);
            assert.equal(pair.after.at1s.overlap, 0);
            assert.equal(pair.after.at5s.overlap, 0);
            rows.push({level, lang, ...pair});
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(output + '/initial-checklist.json', JSON.stringify({status: 'PASS', rows, errors}, null, 2));
        console.log(JSON.stringify({status: 'PASS', cases: rows.length, errors: errors.length}));
    } finally {await browser.close();}
})().catch(error => {console.error(error.stack); process.exitCode = 1;});
