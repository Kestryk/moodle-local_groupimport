const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: inspect existing cards only; do not submit a business command.
test('Grouping search uses the Kit field and secondary Cancel', async ({page}, testInfo) => {
    test.setTimeout(120000);
    const records = [];
    const blocked = [];
    const root = page.locator('#local-groupimport-easystud');
    await page.setViewportSize({width: 1600, height: 1100});
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() === 'GET') await route.continue();
        else {
            blocked.push({method: route.request().method(), url: route.request().url()});
            await route.abort('blockedbyclient');
        }
    });

    await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();
    const card = root.locator('[data-easystud-grouping-id]:visible').first();
    const toggle = card.locator('[data-easystud-container-search-toggle]:visible').first();
    await toggle.evaluate(node => node.scrollIntoView({block: 'center', behavior: 'instant'}));
    await toggle.click();
    const panel = card.locator('[data-easystud-container-search-panel]').first();
    await expect(panel).toBeVisible();
    const field = panel.locator('.easyedu-search-field');
    const input = panel.locator('[data-easystud-container-group-search]');
    const cancel = panel.locator('[data-easystud-container-search-cancel]');
    await expect(field).toHaveCount(1);
    await expect(cancel).toHaveClass(/easyedu-button--secondary/);
    await expect(input).toBeFocused();
    const dimensions = await panel.evaluate(node => {
        const search = node.querySelector('.easyedu-search-field');
        const button = node.querySelector('[data-easystud-container-search-cancel]');
        const sr = search.getBoundingClientRect();
        const br = button.getBoundingClientRect();
        return {fieldHeight: sr.height, cancelHeight: br.height, fieldY: sr.y, cancelY: br.y};
    });
    expect(Math.abs(dimensions.fieldHeight - dimensions.cancelHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(dimensions.fieldY - dimensions.cancelY)).toBeLessThanOrEqual(1);
    await input.fill('__no_existing_group__');
    await cancel.click();
    await expect(panel).toBeHidden();
    await expect(input).toHaveValue('');
    records.push({width: 1600, dimensions});

    for (const width of [768, 390]) {
        await page.setViewportSize({width, height: 1100});
        await root.locator('[data-easystud-mobile-view="groupings"]:visible').first().click();
        const responsiveCard = root.locator('[data-easystud-grouping-id]:visible').first();
        await expect(responsiveCard.locator('[data-easystud-container-search-toggle]').first()).toBeHidden();
        records.push({width, exposure: 'hidden by responsive source contract'});
    }
    expect(blocked, 'Search and Cancel must not issue a business request').toEqual([]);
    fs.writeFileSync(testInfo.outputPath('grouping-search-cancel-native.json'),
        JSON.stringify({records, blocked}, null, 2));
});
