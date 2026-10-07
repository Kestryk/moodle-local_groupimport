// Isolated adapter/path progression: no Moodle bootstrap, commands or writes.
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
        await page.goto('http://practice.test');
        const courseSource = fs.readFileSync(path.join(root, 'amd/src/course_manager.js'), 'utf8');
        const helper = courseSource.match(/const emitPracticeCompletion = \(root, step\) => \{[\s\S]*?\n\};/)[0];
        assert.ok(courseSource.includes("if (createdGroups.length) {\n                    emitPracticeCompletion(root, 'create-group');") ||
            /if \(createdGroups.length\) \{\s+emitPracticeCompletion\(root, 'create-group'\)/.test(courseSource));
        assert.match(courseSource, /emitGuidedCompletion\(root, 1, 'actions'\);\s+emitPracticeCompletion\(root, 'confirm-move'\)/);
        for (const language of ['en', 'fr']) {
            const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-discovery-fixture.php'), language], {encoding: 'utf8'}));
            assert.equal(data.practicePath.length, 6);
            assert.deepEqual(data.practicePath.map(step => step.id), ['create-group', 'open-participants', 'select-participant',
                'open-move', 'choose-destination', 'confirm-move']);
            for (let i = 1; i < 6; i++) assert.equal(data.practicePath[i].requiresStep, data.practicePath[i - 1].id);
            Object.assign(data, {discoverypresentation: true, rootclass: 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
                guideopenlabel: 'Open', guidecloselabel: 'Close', guiderestorelabel: 'Restore', slidecount: 4});
            for (const width of [1280, 768, 390]) {
                await page.setViewportSize({width, height: 900});
                await page.setContent(`<style>*{box-sizing:border-box}[hidden]{display:none!important}${fs.readFileSync(path.join(root, 'styles.css'), 'utf8')}</style>` +
                    '<div id="workspace"></div>' + mustache.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data));
                await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' +
                    fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8') + '\n' + helper + '\nwindow.emitPracticeCompletion=emitPracticeCompletion;'});
                await page.evaluate(steps => window.Guide.init('[data-easyedu-guide-root]', {firstVisit: true,
                    storageKey: `practice-${Date.now()}`, paths: {'practice-membership': steps}}), data.practicePath);
                await page.locator('[data-easyedu-guide-nav-item="1"]').click();
                await page.locator('[data-easyedu-guide-slide="1"] [data-easyedu-guide-start-path]').click();
                const checklist = page.locator('[data-easyedu-guide-checklist]');
                assert.equal(await checklist.getAttribute('data-easyedu-guide-path'), 'practice-membership');
                assert.equal(await checklist.locator('[data-easyedu-guide-step-id]').count(), 6);
                assert.equal(await checklist.locator('[data-easyedu-guide-step-id]:disabled').count(), 5);
                const rows = await checklist.locator('[data-easyedu-guide-step-id]').evaluateAll(nodes => nodes.map(node => {
                    const box = node.getBoundingClientRect();
                    const copy = node.querySelector('span:last-child').getBoundingClientRect();
                    return {height: box.height, copyHeight: copy.height,
                        contained: copy.top >= box.top && copy.bottom <= box.bottom,
                        overlay: getComputedStyle(node, '::before').display};
                }));
                assert.ok(rows.every(row => row.contained), JSON.stringify(rows));
                assert.ok(rows.slice(1).every(row => row.overlay === 'none'), JSON.stringify(rows));
                await page.evaluate(() => window.emitPracticeCompletion(document.querySelector('#workspace'), 'confirm-move'));
                assert.equal(await checklist.locator('.is-complete').count(), 0, 'Out-of-order completion rejected');
                for (const step of data.practicePath) {
                    await page.evaluate(id => window.emitPracticeCompletion(document.querySelector('#workspace'), id), step.id);
                    assert.equal(await checklist.locator(`[data-easyedu-guide-step-id="${step.id}"]`).getAttribute('aria-disabled'), 'false');
                    assert.ok(await checklist.locator(`[data-easyedu-guide-step-id="${step.id}"]`).evaluate(node => node.classList.contains('is-complete')));
                }
                await checklist.locator('[data-easyedu-guide-checklist-close]').click();
                await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
                console.log(`PASS ${language} ${width}: six localized milestones, dependency locks and ordered adapter signals (isolated only)`);
            }
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
