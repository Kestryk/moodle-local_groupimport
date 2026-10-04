const {test, expect} = require('@playwright/test');

// local-supervised: native settings presentation only. Never save configuration.
test('Administration Kit read-only responsive controls', async({page}, testInfo) => {
    test.setTimeout(180000);
    const base = process.env.EASYEDU_MOODLE_URL || 'http://localhost';
    const url = new URL('/admin/settings.php?section=local_groupimport', base).toString();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME || 'Admin');
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD || '');
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
        await page.goto(url, {waitUntil: 'domcontentloaded'});
    }
    let submitted = false;
    await page.route('**/admin/settings.php*', route => {
        if (route.request().method() !== 'GET') {
            submitted = true;
            return route.abort();
        }
        return route.continue();
    });
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1000});
        const root = page.locator('#page-admin-setting-local_groupimport');
        const title = root.locator('.local-groupimport-admin-settings__page-title');
        await expect(title).toBeVisible();
        await expect(title).toHaveCSS('font-size', '20px');
        const choice = root.locator('#admin-defaultlayoutmode .easyedu-searchable-choice');
        await expect(choice).toBeVisible();
        const trigger = choice.locator('.easyedu-searchable-choice__trigger');
        await trigger.click();
        await expect(choice.getByRole('searchbox')).toBeVisible();
        await choice.getByRole('searchbox').press('Escape');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        const pickers = root.locator('[data-easyedu-color-picker]');
        await expect(pickers).toHaveCount(7);
        for (const picker of await pickers.all()) {
            const metrics = await picker.evaluate(n => {
                const r = n.getBoundingClientRect();
                const hex = n.querySelector('.easyedu-color-picker__hex');
                return {left: r.left, right: r.right, width: innerWidth,
                    display: getComputedStyle(n).display, hexHeight: hex.getBoundingClientRect().height};
            });
            expect(metrics.left).toBeGreaterThanOrEqual(0);
            expect(metrics.right).toBeLessThanOrEqual(metrics.width + 1);
            expect(metrics.display).not.toBe('block');
            expect(metrics.hexHeight).toBeGreaterThan(25);
        }
        await expect(root.locator('[data-easystud-restore-colours]')).toBeVisible();
        const palette = root.locator('#admin-themeprimarycolor');
        await palette.scrollIntoViewIfNeeded();
        await page.screenshot({path: testInfo.outputPath(`admin-palette-${width}.png`)});
        const sectionHeadings = root.locator('#adminsettings h3.main');
        expect(await sectionHeadings.count()).toBeGreaterThan(0);
        for (const heading of await sectionHeadings.all()) {
            await expect(heading).toHaveCSS('font-size', '16px');
        }
        await title.scrollIntoViewIfNeeded();
        await page.screenshot({path: testInfo.outputPath(`admin-${width}.png`), fullPage: true});
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    }
    expect(submitted).toBe(false);
    expect(errors).toEqual([]);
});
