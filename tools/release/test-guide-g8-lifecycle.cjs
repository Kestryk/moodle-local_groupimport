// Isolated Guide state machine and shared presentation; no Moodle writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.argv[2]);
const mustache = require(process.argv[3]);
const root = path.resolve(__dirname, '../..');
(async() => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    try {
        const page = await browser.newPage({reducedMotion: 'reduce'});
        await page.route('**/*', route => route.fulfill({status: 200, contentType: 'text/html', body: '<html></html>'}));
        await page.goto('http://guide-g8.test');
        await page.clock.install();
        // Freeze the clock between deliberate advances: otherwise real test
        // execution time is added to the19,999ms expiry boundary assertion.
        await page.clock.pauseAt(new Date(Date.now() + 1000));
        const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-discovery-fixture.php'), 'en'], {encoding: 'utf8'}));
        Object.assign(data, {discoverypresentation: true, rootclass: 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
            guideopenlabel: 'Open', guidecloselabel: 'Close', guiderestorelabel: 'Restore',
            guideresumetitle: 'A path is in progress', guideresumelabel: 'Resume', guidecancelpathlabel: 'Cancel path',
            guideresetpathlabel: 'Reset this path', slidecount: 4});
        const ids = data.practicePath.map(step => step.id);
        const render = async completed => {
            await page.evaluate(completed => localStorage.setItem('g8.checklist', JSON.stringify({path: 'practice-membership',
                slideIndex: 1, activeIndex: 0, completed: {'practice-membership': completed, other: ['retained']}})), completed);
            await page.setContent(`<style>*{box-sizing:border-box}[hidden]{display:none!important}${fs.readFileSync(path.join(root, 'styles.css'), 'utf8')}</style>` +
                mustache.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data));
            await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' +
                fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8')});
            await page.evaluate(steps => window.Guide.init('[data-easyedu-guide-root]', {storageKey: 'g8', firstVisit: false,
                paths: {'practice-membership': steps}}), data.practicePath);
        };
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 900});
            await render(ids);
            assert.equal(await page.locator('[data-easyedu-guide-checklist]').isVisible(), false);
            assert.equal(await page.locator('[data-easyedu-guide-resume]').isVisible(), false, 'Completed path never resumes on reload');
            await page.locator('[data-easyedu-guide-open]').click();
            const reset = page.locator('[data-easyedu-guide-slide="1"] [data-easyedu-guide-reset-path]');
            assert.equal(await reset.isVisible(), true);
            await page.locator('[data-easyedu-guide-slide="1"] [data-easyedu-guide-start-path]').click();
            await page.clock.runFor(1000);
            assert.equal(await page.locator('[data-easyedu-guide-step-id].is-complete').count(), 0, 'Completed Start restarts its path');
            assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('g8.checklist')).completed.other), ['retained']);
            await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
            await render([ids[0]]);
            assert.equal(await page.locator('[data-easyedu-guide-resume]').isVisible(), true);
            assert.equal(await page.locator('[data-easyedu-guide-checklist]').isVisible(), false);
            await page.locator('[data-easyedu-guide-resume-path]').click();
            assert.equal(await page.locator('[data-easyedu-guide-checklist]').isVisible(), true);
            assert.equal(await page.locator('[data-easyedu-guide-step-id].is-complete').count(), 1);
            await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
            await render([ids[0]]);
            await page.clock.runFor(19999);
            assert.equal(await page.locator('[data-easyedu-guide-resume]').isVisible(), true);
            await page.clock.runFor(1);
            assert.equal(await page.locator('[data-easyedu-guide-resume]').isVisible(), false, 'Exact20s expiry');
            await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
            await render([ids[0]]);
            await page.locator('[data-easyedu-guide-cancel-path]').click();
            assert.equal(await page.locator('[data-easyedu-guide-checklist]').isVisible(), false);
            assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('g8.checklist')).path), null);
            await page.locator('[data-easyedu-guide-open]').click();
            await reset.click();
            assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('g8.checklist')).completed),
                {'practice-membership': [], other: ['retained']});
            const invitation = page.locator('[data-easyedu-guide-slide="1"] .easyedu-guide-guided-card');
            const sizes = await invitation.evaluate(node => {
                const button = node.querySelector('[data-easyedu-guide-start-path]');
                return {card: node.getBoundingClientRect().height, button: button.getBoundingClientRect().height,
                    pill: getComputedStyle(node.querySelector('li'), '::before').width};
            });
            assert.ok(sizes.button < sizes.card / 2, JSON.stringify(sizes));
            assert.equal(sizes.pill, '15px');
            await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
            console.log(`PASS ${width}: complete reload suppression, explicit Resume/Cancel,20s expiry, path-local restart/reset and invitation sizing`);
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
