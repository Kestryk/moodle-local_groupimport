const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: filter existing participants only; do not submit a business command.
test('Quick role filters consume the neutral and selected Kit action skins', async ({page}, testInfo) => {
    test.setTimeout(120000);
    const errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 1600, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() === 'GET') await route.continue();
        else {
            blocked.push(route.request().method());
            await route.abort('blockedbyclient');
        }
    });
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await root.locator('[data-easystud-layout-mode="participants"]:visible').first().click();
    await root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first().click();
    const quick = root.locator('[data-easystud-role-toggle]:visible');
    await expect(quick).toBeVisible();
    const button = quick.locator('[data-easystud-role-choice]').first();
    await expect(button).toHaveClass(/foundation-selection-action/);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    const before = await button.evaluate(node => {
        const style = getComputedStyle(node);
        return {font: style.fontSize, radius: style.borderRadius, colour: style.color,
            background: style.backgroundColor, height: node.getBoundingClientRect().height};
    });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    const after = await button.evaluate(node => {
        const style = getComputedStyle(node);
        return {colour: style.color, background: style.backgroundColor};
    });
    expect(before.font).toBe('12.48px');
    expect(before.height).toBeGreaterThanOrEqual(30);
    expect(before.radius).toBe('999px');
    expect(after.background).not.toBe(before.background);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(errors).toEqual([]);
    expect(blocked).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('role-quick-filter-kit-native.json'),
        JSON.stringify({before, after, errors, blocked}, null, 2));
});
