// Real curriculum, shared Mustache and generated AMD. No Moodle/session/database.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const [playwright, php, mustacheFile, output] = process.argv.slice(2);
assert.ok(output, 'Usage: <playwright> <php> <Moodle mustache source> <absolute output>');
const {chromium} = require(playwright);
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const renderer = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(mustacheFile, 'utf8')
    .replace('export default mustache;', 'module.exports = mustache;'), renderer);
const mustache = renderer.module.exports;
const rows = [];
fs.mkdirSync(output, {recursive: true});
(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    try {
        for (const language of ['fr', 'en']) {
            const data = JSON.parse(execFileSync(php,
                [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding: 'utf8'})).templateData;
            assert.equal(data.slides.length, 13);
            for (const width of [1600, 768, 390]) {
                const page = await browser.newPage({viewport: {width, height: 1000}});
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
                await page.route('**/*', route => route.fulfill({body: '<html></html>', contentType: 'text/html'}));
                await page.goto('http://guide.test');
                const html = mustache.render(read('templates/easyedu_guide.mustache'), data,
                    name => read('templates/' + name.split('/').pop() + '.mustache'));
                await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}' +
                    read('styles/student-management.css') + '</style>' + html);
                await page.addScriptTag({content: `window.demoAnimationAudit=[];
                    const nativeAnimate=Element.prototype.animate;Element.prototype.animate=function(frames,options){
                        window.demoAnimationAudit.push({keys:Object.keys(Array.isArray(frames)?frames[0]:frames),
                            duration:typeof options==='number'?options:options?.duration||0});
                        return nativeAnimate.call(this,frames,options);};window.modules={};window.define=(name,deps,factory)=>{
                    const exports={};const value=factory(...deps.map(d=>d==='exports'?exports:window.modules[d]));
                    window.modules[name]=value||exports;};` + read('amd/build/motion.min.js') + read('amd/build/easyedu_guide.min.js')});
                await page.evaluate(() => window.modules['local_groupimport/easyedu_guide'].init('[data-easyedu-guide-root]',
                    {storageKey: 'isolated-demos', firstVisit: false, narrationMinimumMs: 20,
                        narrationMaximumMs: 20, narrationLeadInMs: 1, narrationWordsPerMinute: 60000}));
                await page.locator('[data-easyedu-guide-open]').first().click();
                for (const level of ['minimal', 'reduced', 'full']) {
                    await page.evaluate(level => window.modules['local_groupimport/motion']
                        .setLevel(document.querySelector('[data-easyedu-guide-root]'), level), level);
                    for (const [index, kind] of [[3, 'creation'], [7, 'membership'], [10, 'actions']]) {
                        await page.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                        const scene = page.locator(`[data-easyedu-guide-slide="${index}"] [data-easyedu-guide-scene="${kind}"]`);
                        await page.evaluate(() => { window.demoAnimationAudit=[]; });
                        await scene.locator('[data-guide-scene-command="start"]').click();
                        await page.waitForFunction(selector => document.querySelector(selector)?.dataset.guideSceneFinished === 'true',
                            `[data-easyedu-guide-slide="${index}"] [data-easyedu-guide-scene]`, {timeout: 45000});
                        const result = await scene.evaluate(node => ({
                            finished: node.dataset.guideSceneFinished,
                            cards: node.querySelectorAll('[data-guide-names] > *').length,
                            animations: node.getAnimations({subtree: true}).filter(a => a.playState === 'running').length,
                            phase: node.dataset.guidePhase,
                            effects: window.demoAnimationAudit,
                        }));
                        assert.equal(result.finished, 'true');
                        if (kind === 'creation') assert.equal(result.cards, 3);
                        if (level === 'minimal') {
                            assert.equal(result.animations, 0);
                            assert.equal(result.effects.length, 0);
                        }
                        if (level === 'reduced') {
                            assert.ok(result.effects.every(e => e.duration <= 120));
                            assert.ok(result.effects.every(e => e.keys.every(k => ['opacity', 'offset', 'easing', 'composite'].includes(k))));
                        }
                        rows.push({language, width, level, slide: index + 1, ...result});
                    }
                }
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
    } finally {
        await browser.close();
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({rows, passed: rows.length === 54}, null, 2));
    }
    console.log(JSON.stringify({passed: rows.length, consoleErrors: 0}));
})().catch(error => { console.error(error); process.exitCode = 1; });
