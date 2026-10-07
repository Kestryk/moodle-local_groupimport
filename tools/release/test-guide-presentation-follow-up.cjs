// Isolated G7 animation/long-checklist proof; no Moodle bootstrap or writes.
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
        const page = await browser.newPage({viewport: {width: 1280, height: 900}});
        page.setDefaultTimeout(15000);
        await page.route('**/*', route => route.fulfill({status: 200, contentType: 'text/html', body: '<html></html>'}));
        await page.goto('http://guide.test');
        const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-discovery-fixture.php'), 'en'], {encoding: 'utf8'}));
        Object.assign(data, {discoverypresentation: true, rootclass: 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
            guideopenlabel: 'Open', guidecloselabel: 'Close', guidetitle: 'Guide EasyStud', guidesubtitle: 'Student Management',
            guidepreviouslabel: 'Previous', guidenextlabel: 'Next', guiderestorelabel: 'Restore', slidecount: 4});
        // Synthetic long-list proof remains independent from real Practice.
        data.slides[1].guidedpath = 'first-structure';
        await page.setContent(`<style>*{box-sizing:border-box}[hidden]{display:none!important}${fs.readFileSync(path.join(root, 'styles.css'), 'utf8')}</style>` +
            mustache.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data));
        await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' +
            fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8')});
        await page.evaluate(() => window.Guide.init('[data-easyedu-guide-root]', {storageKey: 'g7', firstVisit: true,
            paths: {'first-structure': Array.from({length: 8}, (_, i) => ({id: `step-${i}`, title: `Step ${i + 1}`,
                description: 'An isolated presentation example', completionMode: 'event'}))}}));
        await page.locator('[data-easyedu-guide-nav-item="2"]').click();
        await page.waitForFunction(() => document.getAnimations().filter(a =>
            a.effect?.target?.hasAttribute('data-guide-ghost') && a.playState === 'running' && a.effect.getTiming().duration === 1200).length);
        const samples = await page.evaluate(async() => {
            const ghost = document.querySelector('[data-guide-ghost]'), cursor = document.querySelector('[data-easyedu-guide-slide="2"] [data-guide-cursor]');
            const pair = [ghost, cursor].map(target => document.getAnimations().find(a =>
                a.effect?.target === target && a.playState === 'running' && a.effect.getTiming().duration === 1200));
            pair.forEach(a => a.pause());
            const rows = [];
            for (const f of [0.08, 0.5, 0.96]) {
                pair.forEach(a => { a.currentTime = 1200 * f; });
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const a = ghost.getBoundingClientRect(), b = cursor.getBoundingClientRect();
                const target = document.querySelector('[data-easyedu-guide-slide="2"] [data-guide-destination]');
                const c = target.getBoundingClientRect();
                rows.push({dx: b.left - a.left, dy: b.top - a.top,
                    overlap: a.right >= c.left && a.left <= c.right && a.bottom >= c.top && a.top <= c.bottom,
                    dashed: target.classList.contains('is-guide-drop-target')});
            }
            pair.forEach(a => { a.currentTime = 200; a.play(); }); return rows;
        });
        for (const row of samples) {
            assert.ok(Math.abs(row.dx - 48) < 1, JSON.stringify(row));
            assert.ok(Math.abs(row.dy - 28) < 1, JSON.stringify(row));
            assert.equal(row.dashed, row.overlap);
        }
        await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="membership"]').dataset.guideSceneFinished === 'true');
        assert.equal(await page.locator('[data-guide-scene-command="add"]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-guide-scene-command="move"]').click();
        assert.equal(await page.locator('[data-guide-scene-command="move"]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-easyedu-guide-nav-item="3"]').click();
        await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="actions"]').dataset.guideSceneFinished === 'true', null, {timeout: 60000});
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 900});
            const geometry = await page.locator('[data-easyedu-guide-slide="3"] [data-guide-live]').evaluate(async node => {
                const body = node.closest('.easyedu-guide-modal__body');
                body.scrollTop = body.scrollHeight;
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const box = node.getBoundingClientRect(), port = body.getBoundingClientRect();
                return {gap: box.top - port.top, padding: getComputedStyle(body).paddingTop,
                    inset: getComputedStyle(node).top, scroll: body.scrollTop, max: body.scrollHeight - body.clientHeight};
            });
            console.log('Sticky geometry', width, JSON.stringify(geometry));
            assert.ok(Math.abs(geometry.gap) < 1, JSON.stringify(geometry));
        }
        // Keep the original long-list fixture viewport/oracle independent from
        // the preceding responsive reading-edge sweep.
        await page.setViewportSize({width: 1280, height: 900});
        await page.locator('[data-easyedu-guide-nav-item="1"]').click();
        await page.locator('[data-easyedu-guide-start-path]').click();
        const checklist = page.locator('[data-easyedu-guide-checklist]');
        assert.equal(await checklist.getAttribute('data-easyedu-guide-checklist-scroll'), '');
        assert.ok(await checklist.locator('[data-easyedu-guide-checklist-items]').evaluate(node => node.scrollHeight > node.clientHeight));
        await checklist.locator('[data-easyedu-guide-checklist-minimize]').click();
        assert.equal(await checklist.locator('[data-easyedu-guide-checklist-title]').isVisible(), true);
        assert.equal(await checklist.locator('[data-easyedu-guide-checklist-items]').isVisible(), false);
        await checklist.locator('[data-easyedu-guide-checklist-restore]').click();
        assert.equal(await checklist.locator('[data-easyedu-guide-checklist-items]').isVisible(), true);
        await checklist.locator('[data-easyedu-guide-checklist-close]').click();
        await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
        assert.equal(await page.locator('[data-guide-ghost]').count(), 0);
        console.log('PASS G7: actual synchronized transforms/drop overlap, selected comparison, long checklist scroll, reduced Restore and teardown');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
