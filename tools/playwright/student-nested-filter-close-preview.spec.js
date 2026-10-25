const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: disclosure state only; no fixture, selection change or business POST.
test('More filters closes its open nested choice in one action', async({page}, testInfo) => {
    test.setTimeout(180000);
    const root = page.locator('#local-groupimport-easystud');
    const records = [];
    const blocked = [];
    const errors = [];
    const guard = async route => {
        if (route.request().method() !== 'GET') {
            blocked.push({method: route.request().method(), url: route.request().url()});
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    };
    const save = () => fs.writeFileSync(
        testInfo.outputPath('nested-filter-close-native.json'),
        JSON.stringify({records, blocked, errors}, null, 2)
    );
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'no-preference'});

    for (const width of [1600, 768, 390]) {
        // Moodle hydrates this read-only view through AJAX POST. Guard only the
        // client-side interaction phase exercised by this contract.
        await page.unroute('**/local/groupimport/**', guard).catch(() => undefined);
        await page.setViewportSize({width, height: 1100});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.route('**/local/groupimport/**', guard);

        await root.locator(width > 1024 ?
            '[data-easystud-layout-mode="participants"]:visible' :
            '[data-easystud-mobile-view="participants"]:visible').click();
        const toggle = root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first();
        const panel = root.locator('[data-easystud-advanced-filters="participants"]');
        const nativeSelect = panel.locator('[data-easystud-group-filter]').first();
        const choice = nativeSelect.locator('xpath=following-sibling::*[1]');
        const choiceTrigger = choice.locator('.easyedu-searchable-choice__trigger');
        const choicePanel = choice.locator('.easyedu-searchable-choice__panel');

        for (let iteration = 1; iteration <= 3; iteration++) {
            if (await toggle.getAttribute('aria-expanded') !== 'true') {
                await toggle.click();
            }
            await expect(panel).toBeVisible();
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            await choiceTrigger.click();
            await expect(choiceTrigger).toHaveAttribute('aria-expanded', 'true');
            await expect(choicePanel).toBeVisible();

            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await expect(choiceTrigger).toHaveAttribute('aria-expanded', 'false');
            await expect(choicePanel).toBeHidden();
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            expect(await panel.evaluate(node => node.inert)).toBe(true);
            records.push({width, iteration, parentClosed: true, nestedChoiceClosed: true});
            save();
        }
    }

    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
    save();
});
