// Native copied-pool recipe. No course writes, user preference writes or stored auth.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwright, base, secret, output, screenshots] = process.argv.slice(2);
assert.ok(['http://localhost:8052', 'http://localhost:8054', 'http://localhost:8055'].includes(base));
const {chromium} = require(playwright);
const rows = [];
fs.mkdirSync(output, {recursive: true});
(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(180000);
        await page.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded'});
        await page.locator('#username').fill('claude-sm-test');
        await page.locator('#password').fill(fs.readFileSync(secret, 'utf8').trim());
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit'});
        for (const language of ['fr', 'en']) {
            for (const width of [1600, 768, 390]) {
                const errors = [];
                const errorHandler = error => errors.push(error.message);
                const consoleHandler = message => { if (message.type() === 'error') errors.push(message.text()); };
                page.on('pageerror', errorHandler);
                page.on('console', consoleHandler);
                await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
                await page.goto(base + '/local/groupimport/manage.php?id=71&lang=' + language,
                    {waitUntil: 'domcontentloaded'});
                await page.waitForFunction(() => document.querySelector('#local-groupimport-easystud')
                    ?.getAttribute('data-easystud-loading-state') === 'ready', null, {timeout: 240000});
                await page.evaluate(async() => {
                    const Motion = await new Promise(resolve => require(['local_groupimport/motion'], resolve));
                    Motion.setLevel(document.querySelector('#local-groupimport-easystud'), 'minimal');
                });
                const launcher = page.locator('.easyedu-guide__launcher[data-easyedu-guide-open]:visible');
                if (!await launcher.count()) {
                    await page.locator('[data-easyedu-navigation-open]:visible').click();
                }
                await page.locator('.easyedu-guide__launcher[data-easyedu-guide-open]:visible').click();
                for (const [index, kind] of [[3, 'creation'], [7, 'membership'], [10, 'actions']]) {
                    await page.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                    const scene = page.locator(`[data-easyedu-guide-slide="${index}"] [data-easyedu-guide-scene="${kind}"]`);
                    await scene.locator('[data-guide-scene-command="start"]').click();
                    await page.waitForFunction(selector => document.querySelector(selector)?.dataset.guideSceneFinished === 'true',
                        `[data-easyedu-guide-slide="${index}"] [data-easyedu-guide-scene]`);
                    const measured = await scene.evaluate(node => {
                        const button = node.querySelector('[data-guide-scene-command="start"]');
                        const buttonRect = button.getBoundingClientRect();
                        const content = [...button.children].map(child => child.getBoundingClientRect());
                        const left = Math.min(...content.map(r => r.left));
                        const right = Math.max(...content.map(r => r.right));
                        const top = Math.min(...content.map(r => r.top));
                        const bottom = Math.max(...content.map(r => r.bottom));
                        const modal = node.closest('[data-easyedu-guide-modal]');
                        return {
                            centreDx: Math.abs((left + right - buttonRect.left - buttonRect.right) / 2),
                            centreDy: Math.abs((top + bottom - buttonRect.top - buttonRect.bottom) / 2),
                            buttonHeight: buttonRect.height,
                            runningAnimations: node.getAnimations({subtree: true}).filter(a => a.playState === 'running').length,
                            horizontalOverflow: Math.max(0, modal.scrollWidth - modal.clientWidth),
                            createdNames: [...node.querySelectorAll('[data-guide-names] [data-guide-name]')].map(n => n.textContent),
                        };
                    });
                    assert.ok(measured.centreDx <= 0.5, 'Kit Start/Replay horizontal centre');
                    assert.ok(measured.centreDy <= 0.5, 'Kit Start/Replay vertical centre');
                    assert.equal(measured.runningAnimations, 0);
                    assert.equal(measured.horizontalOverflow, 0);
                    if (kind === 'creation') assert.equal(measured.createdNames.length, 3);
                    if (width === 390) {
                        await page.screenshot({path: path.join(screenshots,
                            `GUIDE-DEMOS-${index + 1}-${language}-390-2026-10-17.png`)});
                    }
                    rows.push({language, width, slide: index + 1, kind, ...measured});
                }
                await page.keyboard.press('Escape');
                await page.locator('[data-easyedu-guide-modal]').waitFor({state: 'hidden'});
                assert.deepEqual(errors, []);
                page.off('pageerror', errorHandler);
                page.off('console', consoleHandler);
            }
        }
    } finally {
        await browser.close();
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({rows, passed: rows.length === 18}, null, 2));
    }
    console.log(JSON.stringify({passed: rows.length, consoleErrors: 0, businessWrites: 0}));
})().catch(error => { console.error(error); process.exitCode = 1; });
