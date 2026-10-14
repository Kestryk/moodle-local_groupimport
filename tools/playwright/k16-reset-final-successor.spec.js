'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');
test('K16 Reset final field height and overflow-menu Cancel FR', async({page}, info) => {
    test.setTimeout(180000);
    const report = {cases: [], writesBlocked: [], errors: []};
    page.on('pageerror', e => report.errors.push(e.message));
    const metrics = n => {const s = getComputedStyle(n), r = n.getBoundingClientRect();
        return {height: r.height, padding: s.padding, radius: s.borderRadius, font: s.font,
            minHeight: s.minHeight, border: s.borderWidth};};
    page.setDefaultTimeout(30000);
    await audit.login(page); await audit.blockBusinessWrites(page, report.writesBlocked);
    try {
        for (const width of [1600, 1280, 390]) {
            await page.setViewportSize({width, height: 900});
            await page.goto(audit.perfUrl().href, {waitUntil: 'domcontentloaded'});
            const root = await audit.ready(page);
            await page.addStyleTag({path: process.env.EASYEDU_CANDIDATE_CSS});
            await root.locator('[data-easystud-search]:visible').fill('a');
            const reset = root.locator('[data-easystud-reset-filters]:visible');
            await expect(reset).toBeVisible(); await audit.settle(root);
            const row = {width, reset: await reset.evaluate(metrics)}; report.cases.push(row);
            await reset.focus(); await expect(reset).toBeFocused(); await page.keyboard.press('Enter');
            await expect(root.locator('[data-easystud-search]:visible')).toHaveValue('');
            const mobile = root.locator('[data-easystud-mobile-view="groupings"]:visible');
            if (await mobile.count()) await mobile.click();
            else await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();
            await audit.settle(root);
            const trigger = root.locator('[data-easystud-container-search-toggle]:visible').first();
            if (!await trigger.count()) {
                const grouping = root.locator('[data-easystud-grouping-id]:visible').first();
                await grouping.locator(':scope > .local-groupimport-easystud-grouping__header > [data-easystud-group-actions-toggle]:visible').click();
            }
            await trigger.click(); await audit.settle(root);
            const cancel = root.locator('[data-easystud-container-search-cancel]:visible').first();
            await expect(cancel).toBeVisible(); row.cancel = await cancel.evaluate(metrics);
            await page.screenshot({path: info.outputPath(`k16-${width}.png`)});
            expect(row.reset).toEqual(row.cancel);
            await cancel.click(); await expect(cancel).toBeHidden();
        }
        expect(report.errors).toEqual([]); expect(report.writesBlocked).toEqual([]);
    } finally {await page.screenshot({path: info.outputPath('final.png')}).catch(() => {}); fs.writeFileSync(info.outputPath('k16.json'), JSON.stringify(report, null, 2));}
});
