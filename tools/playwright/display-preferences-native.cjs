// Local supervised G1 proof. Arguments are external paths; credentials stay process-local.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const [playwrightPath, artifact, baseUrl, secretPath, chromePath] = process.argv.slice(2);
assert(playwrightPath && artifact && /^http:\/\/localhost:(8052|8054|8055)$/.test(baseUrl) && secretPath && chromePath);
const {chromium} = require(playwrightPath);
const password = fs.readFileSync(secretPath, 'utf8').trim();
const results = [], errors = [];

(async() => {
    fs.mkdirSync(artifact, {recursive: true});
    const browser = await chromium.launch({executablePath: chromePath, headless: true});
    let original;
    const context = await browser.newContext({viewport: {width: 1600, height: 1000}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); } });
    const repository = (method, ...args) => page.evaluate(({method, args}) => new Promise((resolve, reject) => {
        require(['core_user/repository'], api => api[method](...args).then(resolve, reject));
    }), {method, args});
    try {
        await page.goto(baseUrl + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
        await page.locator('#username').fill('claude-sm-test');
        await page.locator('#password').fill(password);
        await Promise.all([page.waitForURL(url => !url.pathname.endsWith('/login/index.php'), {waitUntil: 'commit', timeout: 180000}),
            page.locator('#loginbtn').click({noWaitAfter: true})]);
        await page.goto(baseUrl + '/local/groupimport/manage.php?id=71&lang=fr', {waitUntil: 'domcontentloaded', timeout: 180000});
        await page.locator('.local-groupimport-easystud:not(.local-groupimport-easystud--booting)').waitFor({timeout: 180000});
        original = await repository('getUserPreference', 'easyedu_motion_level');
        for (const lang of ['fr', 'en']) {
            await page.goto(baseUrl + '/local/groupimport/manage.php?id=71&lang=' + lang, {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.locator('.local-groupimport-easystud:not(.local-groupimport-easystud--booting)').waitFor({timeout: 180000});
            assert((await page.locator('html').getAttribute('lang')).startsWith(lang));
            for (const viewportWidth of [1600, 768, 390]) {
                await page.setViewportSize({width: viewportWidth, height: viewportWidth === 390 ? 844 : 1000});
                const navigation = page.locator('[data-easyedu-navigation]').first();
                let opener;
                if (viewportWidth === 1600) {
                    opener = navigation.locator('.easyedu-navigation__preferences-source [data-easyedu-display-open]');
                    await opener.hover();
                    await page.locator('.local-groupimport-easystud-hover-popover').waitFor({state: 'visible'});
                } else {
                    await navigation.locator('[data-easyedu-navigation-open]').click();
                    opener = navigation.locator('[data-easyedu-navigation-panel] [data-easyedu-display-open]');
                }
                await opener.click();
                const dialog = page.locator('[data-easyedu-display-dialog]');
                await dialog.waitFor({state: 'visible'});
                await page.waitForTimeout(300);
                const geometry = await dialog.evaluate(dialog => {
                    const rect = dialog.getBoundingClientRect();
                    const body = dialog.querySelector('.easyedu-preferences-dialog__body');
                    const buttons = [...dialog.querySelectorAll('footer button')].map(button => {
                        const box = button.getBoundingClientRect(), range = document.createRange();
                        range.selectNodeContents(button.querySelector('.easyedu-control-label') || button);
                        const text = range.getBoundingClientRect();
                        return {height: box.height, dx: (text.left + text.width / 2) - (box.left + box.width / 2),
                            dy: (text.top + text.height / 2) - (box.top + box.height / 2)};
                    });
                    return {width: rect.width, height: rect.height, viewportContained: rect.left >= 0 && rect.right <= innerWidth &&
                        rect.top >= 0 && rect.bottom <= innerHeight, horizontalOverflow: body.scrollWidth - body.clientWidth, buttons};
                });
                results.push({lang, viewportWidth, geometry});
                fs.writeFileSync(path.join(artifact, 'native-progress.json'), JSON.stringify(results, null, 2));
                assert(geometry.viewportContained && geometry.horizontalOverflow === 0);
                for (const button of geometry.buttons) {
                    assert(Math.abs(button.dx) <= 0.5 && Math.abs(button.dy) <= 0.5, 'Footer text centre');
                    assert.equal(button.height, geometry.buttons[0].height, 'Equal Kit footer heights');
                }
                await page.screenshot({path: path.join(artifact, `native-${lang}-${viewportWidth}.png`)});
                for (const level of ['full', 'reduced', 'minimal']) {
                    await dialog.locator('[value=' + level + ']').click();
                    await dialog.locator('[type=submit]').click();
                    await dialog.waitFor({state: 'hidden'});
                    assert.equal(await repository('getUserPreference', 'easyedu_motion_level'), level);
                    assert.equal(await page.locator('#local-groupimport-easystud').getAttribute('data-easyedu-motion-level'), level);
                    await opener.click();
                    await dialog.waitFor({state: 'visible'});
                    await page.waitForTimeout(220);
                    assert(await dialog.locator('[value=' + level + ']').isChecked());
                }
                await dialog.locator('[data-easyedu-display-reset]').click();
                await dialog.locator('[type=submit]').click();
                await dialog.waitFor({state: 'hidden'});
                assert.equal(await repository('getUserPreference', 'easyedu_motion_level'), 'default');
                await opener.click();await dialog.waitFor({state: 'visible'});await page.waitForTimeout(220);
                await dialog.locator('[value=minimal]').check();
                await page.keyboard.press('Escape');await dialog.waitFor({state: 'hidden'});
                assert.equal(await repository('getUserPreference', 'easyedu_motion_level'), 'default', 'Escape must not save');
                assert(await opener.evaluate(node => node === document.activeElement), 'Opener focus');
                if (viewportWidth !== 1600) {
                    await navigation.locator('[data-easyedu-navigation-close]').click();
                }
            }
        }
        // A real document reload must recover the saved personal choice before first interaction.
        await repository('setUserPreference', 'easyedu_motion_level', 'minimal');
        await page.reload({waitUntil: 'domcontentloaded', timeout: 180000});
        assert.equal(await page.locator('#local-groupimport-easystud').getAttribute('data-easyedu-motion-level'), 'minimal');
        await page.setViewportSize({width: 1600, height: 1000});
        await page.locator('[data-easyedu-guide-open]').first().click();
        const guide = page.locator('[data-easyedu-guide-modal].is-open');
        await guide.locator('[data-easyedu-display-open]').click();
        const dialog = page.locator('[data-easyedu-display-dialog]');
        await dialog.waitFor({state: 'visible'});await page.keyboard.press('Escape');await dialog.waitFor({state: 'hidden'});
        assert(await guide.isVisible(), 'Nested Escape keeps Guide open');
        assert.equal(errors.length, 0, errors.join('\n'));
    } finally {
        if (original !== undefined) {
            await repository('setUserPreference', 'easyedu_motion_level', original || 'default');
        }
        await browser.close();
        fs.writeFileSync(path.join(artifact, 'native.json'), JSON.stringify({results, errors, preferenceRestored: original !== undefined}, null, 2));
    }
    console.log(JSON.stringify({passed: results.length, consoleErrors: errors.length, results}));
})().catch(error => { console.error(error); process.exitCode = 1; });
