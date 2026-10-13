'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

// Narrow failure evidence, no restore submission, no history fixture.
test('T058 49072 Rollback focus failure evidence FR1280 reduced', async({page}, info) => {
    test.setTimeout(120000);
    const report = {cases: [], writesBlocked: [], errors: [], servedFiles: audit.identity()};
    const save = () => fs.writeFileSync(info.outputPath('rollback-focus.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => report.errors.push(e.message));
    await page.setViewportSize({width: 1280, height: 900});
    await page.emulateMedia({reducedMotion: 'reduce'});
    try {
        await audit.login(page); await audit.blockBusinessWrites(page, report.writesBlocked);
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
        const opener = page.locator('[data-local-groupimport-rollback-open]:visible').first();
        await expect(opener).toBeVisible(); await opener.focus(); await page.keyboard.press('Enter');
        const modal = page.locator('[data-local-groupimport-rollback-modal]');
        await expect(modal).toBeVisible(); await audit.settle(modal);
        const state = async label => {
            const value = await modal.evaluate(n => ({inside: n.contains(document.activeElement),
                active: document.activeElement?.outerHTML.slice(0, 800), hidden: n.hidden}));
            report.cases.push({label, ...value}); save();
        };
        await state('initial');
        await modal.evaluate(n => {
            const stops = [...n.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')]
                .filter(x => x.tabIndex >= 0 && !x.matches(':disabled') && x.getClientRects().length &&
                    !x.closest('[hidden],[inert],[aria-hidden="true"]'));
            stops.at(-1)?.focus();
        });
        await page.keyboard.press('Tab'); await state('after-last-Tab');
        await page.screenshot({path: info.outputPath('rollback-tab-escape.png')});
        await page.keyboard.press('Escape'); await expect(modal).toBeHidden();
        await audit.settle(page.locator('body')); await state('after-Escape');
        report.historyVisible = await history.isVisible();
        report.returned = await opener.evaluate(n => n === document.activeElement);
        await page.screenshot({path: info.outputPath('rollback-return-focus.png')}); save();
        expect(report.writesBlocked).toEqual([]); expect(report.errors).toEqual([]);
        expect(report.cases[1].inside, 'Rollback must confine Tab at its last stop').toBe(true);
        expect(report.returned, 'Rollback must return focus to its History trigger').toBe(true);
    } finally {save(); await page.screenshot({path: info.outputPath('rollback-final.png')}).catch(() => {});}
});
