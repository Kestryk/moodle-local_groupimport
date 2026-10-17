// Isolated production renderer/controller proof. No Moodle bootstrap or writes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.argv[2]);
const renderer = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(process.argv[3], 'utf8').replace('export default mustache;', 'module.exports = mustache;'), renderer);
const root = path.resolve(__dirname, '../..'), output = path.resolve(process.argv[5]);
fs.mkdirSync(output, {recursive: true});
(async () => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'}), records = [];
    try {
        for (const language of ['en', 'fr']) for (const width of [1280, 768, 390]) {
            const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-demonstration-entry-fixture.php'), language], {encoding: 'utf8'}));
            const page = await browser.newPage({viewport: {width, height: 1000}}), errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/*', route => route.fulfill({body: '<html></html>'}));
            await page.goto('http://scene-header.test');
            await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}' + fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '</style><div class="local-groupimport-easystud easyedu-ui">' + renderer.module.exports.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data.templateData) + '</div>');
            await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' + fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8')});
            await page.evaluate(() => window.Guide.init('[data-easyedu-guide-root]', {storageKey: 'scene-header-qa', firstVisit: false}));
            await page.locator('[data-easyedu-guide-open]').first().click();
            const modal = page.locator('[data-easyedu-guide-modal]');
            const slide = data.templateData.slides.find(s => s.discoveryscene?.kind === 'membership');
            await modal.locator(`[data-easyedu-guide-nav-item="${slide.index}"]`).click();
            const scene = modal.locator('[data-easyedu-guide-scene="membership"]'), header = scene.locator('[data-guide-scene-header]');
            await header.waitFor({state: 'visible'});
            assert.equal(await header.locator('[data-guide-live]').count(), 1);
            assert.equal(await scene.locator('[data-guide-scene-command="add"]').count(), 1);
            assert.equal(await header.locator('[data-guide-scene-command="move"]').count(), 1);
            assert.equal(await header.locator('[data-guide-playback="pause"]').isVisible(), false);
            assert.equal(await scene.locator('[data-guide-memberships]').getAttribute('data-guide-membership-preview'), '');
            assert.equal(await scene.locator('[data-guide-membership-title]').innerText(), slide.discoveryscene.expectedlabel);
            assert.equal(await scene.locator('[data-guide-membership-target] b').innerText(), slide.discoveryscene.addedlabel);
            assert.equal(await header.locator('[data-guide-live-copy]').innerText(), slide.discoveryscene.resultaddlabel);
            await header.locator('[data-guide-scene-command="move"]').click();
            assert.equal(await header.getAttribute('data-guide-playback-state'), 'idle');
            assert.equal(await header.locator('[data-guide-scene-command="move"]').isChecked(), true);
            assert.equal(await header.locator('[data-guide-live-copy]').innerText(), slide.discoveryscene.resultmovelabel);
            assert.equal(await scene.locator('[data-guide-membership-origin] b').innerText(), slide.discoveryscene.removedlabel);
            const ready = await header.evaluate(node => {
                const host = node.getBoundingClientRect(), start = node.querySelector('[data-guide-scene-command="start"]').getBoundingClientRect();
                const mode = node.querySelector('.easyedu-guide-scene__modes').getBoundingClientRect();
                const overflow = [...node.querySelectorAll('button, [data-guide-live-copy]')].filter(n => n.getClientRects().length).filter(n => {
                    const range = document.createRange(); range.selectNodeContents(n); const r = range.getBoundingClientRect();
                    return r.left < host.left - 1 || r.right > host.right + 1 || r.top < host.top - 1 || r.bottom > host.bottom + 1;
                }).map(n => n.textContent);
                return {overflow, startHeight: start.height, startBelowModes: start.top >= mode.bottom, position: getComputedStyle(node).position};
            });
            assert.deepEqual(ready.overflow, []); assert.ok(Math.abs(ready.startHeight - 30.4) < .1); assert.equal(ready.position, 'sticky');
            if (width === 390) assert.equal(ready.startBelowModes, true);
            await header.screenshot({path: path.join(output, `${language}-${width}-ready.png`)});
            await header.locator('[data-guide-scene-command="start"]').click();
            await header.locator('[data-guide-playback="pause"]').click();
            assert.equal(await header.getAttribute('data-guide-playback-state'), 'paused');
            assert.ok((await header.locator('[data-guide-phase-caption]').innerText()).includes('1/4'));
            assert.equal(await scene.locator('[data-guide-memberships]').getAttribute('data-guide-membership-preview'), null);
            assert.equal(await header.locator('[data-guide-scene-command="start"]').isDisabled(), true);
            assert.equal(await header.locator('[data-guide-scene-command="add"]').isDisabled(), true);
            await header.screenshot({path: path.join(output, `${language}-${width}-paused.png`)});
            await scene.locator('[data-guide-scene-command="reset"]').click();
            assert.equal(await header.locator('[data-guide-playback="pause"]').isVisible(), false);
            assert.equal(await header.getAttribute('data-guide-playback-state'), 'idle');
            assert.deepEqual(errors, []); records.push({language, width, ...ready});
            await page.evaluate(() => window.Guide.destroy('[data-easyedu-guide-root]')); await page.close();
        }
        fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({records, nativeVerified: false, humanAccepted: false}, null, 2), {flag: 'wx'});
        console.log(`PASS ${records.length} localized responsive header ownership, idle choice, Small geometry, pause/reset and text containment cases.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
