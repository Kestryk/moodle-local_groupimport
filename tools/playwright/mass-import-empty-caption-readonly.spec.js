const {test, expect} = require('@playwright/test');

// local-supervised: initial Mass Import display only; no file or form mutation.
test('Mass Import empty copy uses Foundation caption', async({page}, testInfo) => {
    test.setTimeout(180000);
    const base = process.env.EASYEDU_MOODLE_URL || 'http://localhost';
    const url = new URL('/local/groupimport/index.php?id=5', base).toString();
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
    await page.route('**/local/groupimport/index.php*', route => {
        if (route.request().method() !== 'GET') {
            submitted = true;
            return route.abort();
        }
        return route.continue();
    });
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1000});
        const empty = page.locator('.local-groupimport-import-empty.easyedu-empty').first();
        await expect(empty).toBeVisible();
        const copy = empty.locator('p');
        expect((await copy.textContent()).trim().length).toBeGreaterThan(10);
        await expect(copy).toHaveCSS('font-size', '12.16px');
        await expect(empty.locator('.easyedu-empty__boundary')).toHaveCSS('stroke-dasharray', '11px, 11px');
        const fits = await empty.evaluate(node => {
            const outer = node.getBoundingClientRect();
            const text = node.querySelector('p').getBoundingClientRect();
            return text.left >= outer.left && text.right <= outer.right &&
                text.top >= outer.top && text.bottom <= outer.bottom;
        });
        expect(fits).toBe(true);
        await empty.screenshot({path: testInfo.outputPath(`mass-import-empty-${width}.png`)});
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    }
    expect(submitted).toBe(false);
    expect(errors).toEqual([]);
});
