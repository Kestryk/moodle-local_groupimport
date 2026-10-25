'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');
test('T058 Rollback keyboard FR1280 390 normal reduced', async({page}, info) => {
    test.setTimeout(240000);
    const report = {cases: [], writesBlocked: [], errors: []};
    page.on('pageerror', e => report.errors.push(e.message));
    await audit.login(page); await audit.blockBusinessWrites(page, report.writesBlocked);
    try {
        for (const width of [1280, 390]) for (const motion of ['no-preference', 'reduce']) {
            await page.setViewportSize({width, height: 900}); await page.emulateMedia({reducedMotion: motion});
            const url = audit.perfUrl(); url.pathname = '/local/groupimport/index.php';
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            const history = page.locator('[data-local-groupimport-history-modal]');
            await expect(history).toHaveAttribute('data-local-groupimport-history-bound', '1');
            const trigger = page.locator('[data-local-groupimport-history-open]:visible, ' +
                '[data-easyedu-navigation-action="mass-import-history"]:visible').first();
            if (!await trigger.count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await trigger.click(); await expect(history).toBeVisible();
            await expect(page.locator('[data-easyedu-navigation-panel][aria-hidden="false"]')).toHaveCount(0);
            await audit.settle(page.locator('body'));
            const opener = history.locator('[data-local-groupimport-rollback-open]:visible').first();
            const modal = page.locator('[data-local-groupimport-rollback-modal]');
            await expect(modal).toHaveAttribute('data-local-groupimport-rollback-bound', '1');
            for (const exit of ['Escape', 'cancel', 'backdrop']) {
                await opener.focus(); await page.keyboard.press('Enter');
                await expect(modal).toBeVisible(); await audit.settle(modal);
                expect(await modal.evaluate(n => document.activeElement.matches('[data-local-groupimport-rollback-close]') &&
                    n.contains(document.activeElement))).toBe(true);
                const stops = modal.locator('button:visible, a[href]:visible, input:not([type="hidden"]):visible');
                await stops.last().focus(); await page.keyboard.press('Tab'); await expect(stops.first()).toBeFocused();
                await page.keyboard.press('Shift+Tab'); await expect(stops.last()).toBeFocused();
                if (exit === 'Escape') await page.keyboard.press('Escape');
                else if (exit === 'cancel') await modal.locator('[data-local-groupimport-rollback-close]').last().click();
                else await modal.click({position: {x: 2, y: 2}});
                await expect(modal).toBeHidden(); await audit.settle(page.locator('body'));
                await expect(history).toBeVisible(); await expect(opener).toBeFocused();
                report.cases.push({width, motion, exit, passed: true});
            }
            await page.screenshot({path: info.outputPath(`rollback-${width}-${motion}.png`)});
        }
        expect(report.errors).toEqual([]); expect(report.writesBlocked).toEqual([]);
    } finally {fs.writeFileSync(info.outputPath('rollback.json'), JSON.stringify(report, null, 2));}
});
