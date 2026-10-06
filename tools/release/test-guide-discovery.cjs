const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.argv[2]);
const mustache = require(process.argv[3]);
const php = process.argv[4];
const root = path.resolve(__dirname, '../..');
(async() => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    try {
        const page = await browser.newPage({reducedMotion: 'reduce'});
        page.setDefaultTimeout(10000);
        await page.route('**/*', route => route.fulfill({status: 200, contentType: 'text/html', body: '<html></html>'}));
        await page.goto('http://guide.test');
        for (const language of ['fr', 'en']) {
            const data = JSON.parse(execFileSync(php, [path.join(__dirname, 'guide-discovery-fixture.php'), language], {encoding: 'utf8'}));
            Object.assign(data, {discoverypresentation: true, rootclass: 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
                guideopenlabel: 'Open', guidecloselabel: 'Close', guidetitle: 'Guide EasyStud', guidesubtitle: 'Student Management',
                guidepreviouslabel: 'Previous', guidenextlabel: 'Next', guideshowinterfacelabel: 'Show', guideinterfacecuelabel: 'Find in workspace',
                slidecount: 4, initialprogress: 25});
            for (const width of [1280, 768, 390]) {
                await page.setViewportSize({width, height: 900});
                await page.setContent(`<style>*{box-sizing:border-box}[hidden]{display:none!important}${fs.readFileSync(path.join(root, 'styles.css'), 'utf8')}</style>` +
                    mustache.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data));
                await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' +
                    fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8')});
                await page.evaluate(() => window.Guide.init('[data-easyedu-guide-root]', {storageKey: 'test', firstVisit: true}));
                const modal = page.locator('[data-easyedu-guide-modal]');
                if (!await modal.isVisible()) { await page.locator('[data-easyedu-guide-open]').click(); }
                await page.locator('[data-easyedu-guide-nav-item="1"]').click();
                const creation = page.locator('.easyedu-guide-scene__creation-controls');
                const inputBounds = await creation.locator('input').boundingBox();
                const actionBounds = await creation.locator('.easyedu-guide-scene__actions').boundingBox();
                const creationBounds = await creation.boundingBox();
                assert.ok(inputBounds.width > 0 && inputBounds.x + inputBounds.width <= creationBounds.x + creationBounds.width + 1);
                assert.ok(actionBounds.x + actionBounds.width <= creationBounds.x + creationBounds.width + 1);
                if (width === 1280) {
                    assert.ok(actionBounds.x > inputBounds.x + inputBounds.width, 'Desktop creation actions follow the input');
                    assert.ok(Math.abs(actionBounds.y + actionBounds.height - inputBounds.y - inputBounds.height) <= 1,
                        'Desktop creation controls share their bottom baseline');
                } else if (width === 390) {
                    assert.ok(actionBounds.y >= inputBounds.y + inputBounds.height, 'Phone controls wrap without overlapping');
                }
                await page.locator('[data-guide-scene-command="preview"]').click();
                assert.equal(await page.locator('[data-guide-names] > span').count(), 3);
                await page.locator('[data-guide-scene-command="letters"]').click();
                assert.match(await page.locator('[data-guide-names]').innerText(), /Équipe A/);
                await page.locator('[data-guide-pattern]').fill('Custom @*2');
                await page.locator('[data-guide-scene-command="preview"]').click();
                assert.equal(await page.locator('[data-guide-names]').innerText(), 'Custom A\nCustom B');
                await page.locator('[data-easyedu-guide-nav-item="2"]').click();
                await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="membership"]').dataset.guideSceneFinished === 'true');
                await page.locator('[data-guide-scene-command="move"]').click();
                await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="membership"] [data-guide-person]').hidden);
                await page.locator('[data-easyedu-guide-nav-item="3"]').click();
                await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="actions"]').dataset.guideSceneFinished === 'true');
                const rect = await modal.locator('.easyedu-guide-modal__dialog').boundingBox();
                assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1);
                assert.ok(rect.y >= 0 && rect.y + rect.height <= 901);
                await page.keyboard.press('Escape');
                assert.equal(await modal.isVisible(), false);
                await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]'));
                assert.equal(await page.locator('[data-easyedu-guide-interface-cue-action] button').count(), 0);
                console.log(`PASS ${language} ${width}: creation, add/move/actions, bounds, Escape and cleanup`);
            }
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
