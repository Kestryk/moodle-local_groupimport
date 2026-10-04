const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Searchable filter clear-all keeps native state and focus aligned', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const root = page.locator('#local-groupimport-easystud');
    const records = [];
    const blocked = [];
    const save = () => fs.writeFileSync(
        testInfo.outputPath('searchable-filter-clear-native.json'),
        JSON.stringify({records, blocked}, null, 2)
    );
    await page.emulateMedia({reducedMotion: 'no-preference'});

    for (const width of [1600, 768, 390]) {
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
        await page.route('**/local/groupimport/**', async route => {
            if (route.request().method() !== 'GET') {
                blocked.push({width, method: route.request().method(), url: route.request().url()});
                await route.abort('blockedbyclient');
            } else {
                await route.continue();
            }
        });

        if (width <= 1024) {
            await root.locator('[data-easystud-mobile-view="participants"]:visible').first().click();
        }
        const more = root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first();
        if (await more.getAttribute('aria-expanded') !== 'true') {
            await more.click();
        }
        const select = root.locator('[data-easystud-group-filter]').first();
        const host = select.locator('xpath=following-sibling::div[contains(@class,"easyedu-searchable-choice")][1]');
        await expect(host).toBeVisible();
        await select.evaluate(node => {
            window.__easyeduClearChanges = 0;
            node.addEventListener('change', () => window.__easyeduClearChanges++);
        });
        const trigger = host.locator('.easyedu-searchable-choice__trigger');
        await trigger.click();
        const enabledOptions = host.locator('.easyedu-searchable-choice__option:not(:disabled)');
        expect(await enabledOptions.count()).toBeGreaterThanOrEqual(2);
        await enabledOptions.nth(0).click();
        await enabledOptions.nth(1).click();
        expect(await select.evaluate(node => node.selectedOptions.length)).toBe(2);

        const search = host.getByRole('searchbox');
        await search.fill('__not_an_existing_option__');
        await expect(host.getByRole('status')).toBeVisible();
        const clear = host.getByRole('button', {name: /Clear filter selection|Effacer la sélection du filtre/});
        await expect(clear).toBeVisible();
        const geometry = await clear.evaluate(button => {
            const b = button.getBoundingClientRect();
            const i = button.querySelector('.fa').getBoundingClientRect();
            const trigger = button.parentElement.querySelector('.easyedu-searchable-choice__trigger');
            const t = trigger.getBoundingClientRect();
            const chevron = trigger.querySelector('.fa:last-child').getBoundingClientRect();
            return {
                size: [b.width, b.height],
                centreDelta: [
                    Math.abs((b.left + b.width / 2) - (i.left + i.width / 2)),
                    Math.abs((b.top + b.height / 2) - (i.top + i.height / 2)),
                ],
                contained: b.left >= t.left && b.right <= t.right && b.top >= t.top && b.bottom <= t.bottom,
                chevronEndInset: t.right - chevron.right,
                chevronClearGap: chevron.left - b.right,
                chevronCentreDelta: Math.abs((chevron.top + chevron.height / 2) - (t.top + t.height / 2)),
            };
        });
        await clear.click();
        expect(await select.evaluate(node => node.selectedOptions.length)).toBe(0);
        expect(await page.evaluate(() => window.__easyeduClearChanges)).toBe(3);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(search).toBeFocused();
        await expect(clear).toBeHidden();
        expect(geometry.contained).toBe(true);
        expect(Math.max(...geometry.centreDelta)).toBeLessThanOrEqual(1);
        expect(geometry.chevronEndInset).toBeGreaterThanOrEqual(10);
        expect(geometry.chevronEndInset).toBeLessThanOrEqual(20);
        expect(geometry.chevronClearGap).toBeGreaterThanOrEqual(0);
        expect(geometry.chevronCentreDelta).toBeLessThanOrEqual(1);
        records.push({width, geometry});
        save();
        await search.press('Escape');
        await page.unroute('**/local/groupimport/**');
    }
    expect(blocked, 'Filter selection must not invoke a business request').toEqual([]);
    save();
});
