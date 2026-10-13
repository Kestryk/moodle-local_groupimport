'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');
const {default: AxeBuilder} = require('@axe-core/playwright');

// Local supervised audit: no send, save, transfer or fixture creation.
test('T058 remaining keyboard and reduced motion audit FR1280', async({page}, info) => {
    test.setTimeout(240000);
    const report = {task: 'T058', cases: [], contrast: [], writesBlocked: [], errors: [], gaps: [],
        servedFiles: audit.identity()};
    const save = () => fs.writeFileSync(info.outputPath('t058-remaining.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => {report.errors.push(e.message); save();});
    await page.setViewportSize({width: 1280, height: 900});
    await audit.login(page);
    await audit.blockBusinessWrites(page, report.writesBlocked);
    const keyboardOpen = async opener => {await opener.focus(); await page.keyboard.press('Enter');};
    const inspect = async(name, opener, modal) => {
        const record = {name, motion: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)};
        report.cases.push(record); save();
        await keyboardOpen(opener);
        await expect(modal).toBeVisible();
        await audit.settle(modal);
        record.initialInside = await modal.evaluate(n => n.contains(document.activeElement));
        const ends = async(last) => modal.evaluate((n, last) => {
            const stops = [...n.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(x =>
                x.tabIndex >= 0 && !x.matches(':disabled') && x.getClientRects().length &&
                !x.closest('[hidden],[inert],[aria-hidden="true"]') && getComputedStyle(x).visibility === 'visible');
            const target = last ? stops.at(-1) : stops[0]; target?.focus(); return stops.length;
        }, last);
        record.stops = await ends(true);
        await page.keyboard.press('Tab');
        record.tabInside = await modal.evaluate(n => n.contains(document.activeElement));
        await ends(false); await page.keyboard.press('Shift+Tab');
        record.reverseInside = await modal.evaluate(n => n.contains(document.activeElement));
        record.motionDurations = await modal.evaluate(n => [...n.querySelectorAll('*')].filter(x => x.getClientRects().length)
            .map(x => {const s = getComputedStyle(x); return [s.animationDuration, s.transitionDuration];})
            .filter(v => v.some(x => x !== '0s')).slice(0, 20));
        await page.keyboard.press('Escape');
        record.escapeClosed = await modal.waitFor({state: 'hidden', timeout: 5000}).then(() => true).catch(() => false);
        await audit.settle(page.locator('body'));
        record.returned = await opener.evaluate(n => n === document.activeElement);
        save();
        expect(record, name).toMatchObject({initialInside: true, tabInside: true, reverseInside: true,
            escapeClosed: true, returned: true});
        expect(record.stops).toBeGreaterThan(0);
    };
    try {
        for (const reducedMotion of ['no-preference', 'reduce']) {
            await page.emulateMedia({reducedMotion});
            await page.goto(audit.perfUrl().href, {waitUntil: 'domcontentloaded'});
            const root = await audit.ready(page);
            expect(await page.locator('html').getAttribute('lang')).toMatch(/^fr/);
            const contrast = await new AxeBuilder({page}).include('#local-groupimport-easystud')
                .withRules(['color-contrast']).analyze();
            report.contrast.push({reducedMotion, violations: contrast.violations, incomplete: contrast.incomplete}); save();
            const checkbox = root.locator('[data-easystud-user]:visible [data-easystud-selector-input]').first();
            await checkbox.focus(); await page.keyboard.press('Space');
            await expect(checkbox).toBeChecked();
            await inspect('message', root.locator('[data-easystud-message-selected-participants]:visible').first(),
                page.locator('.local-groupimport-easystud-message-modal.show').last());
            await inspect('keyboard-move-alternative', root.locator('[data-easystud-move-selected-participants]:visible').first(),
                page.locator('[data-easystud-move-modal]:visible').first());
            await inspect('guide', page.locator('[data-easyedu-guide-open]:visible').first(),
                page.locator('[data-easyedu-guide-modal]:visible').first());
            const toggle = root.locator('[data-easystud-advanced-filters-toggle="participant-groups"]');
            const panel = root.locator('[data-easystud-advanced-filters="participant-groups"]');
            await keyboardOpen(toggle); await audit.settle(panel);
            const expanded = await toggle.getAttribute('aria-expanded');
            await page.keyboard.press('Tab');
            const focusedInside = await panel.evaluate(n => n.contains(document.activeElement));
            await page.keyboard.press('Escape'); await audit.settle(panel);
            report.cases.push({name: 'filter-panel', reducedMotion, expanded, focusedInside,
                expandedAfterEscape: await toggle.getAttribute('aria-expanded'),
                returned: await toggle.evaluate(n => n === document.activeElement)}); save();
        }
        const mass = audit.perfUrl(); mass.pathname = '/local/groupimport/index.php';
        await page.goto(mass.href, {waitUntil: 'domcontentloaded'});
        const rollback = page.locator('[data-local-groupimport-rollback-open]');
        report.rollbackTriggers = await rollback.count();
        report.gaps.push(report.rollbackTriggers ? 'Rollback nested History path still requires its dedicated probe.' :
            'No native Rollback trigger; no history fixture created.');
        report.gaps.push('Axe contrast scan covers the initial page only; incomplete checks require visual review.');
        report.gaps.push('Keyboard Move opening is verified; committing a transfer and sequential reachability are not certified.');
        expect(report.writesBlocked).toEqual([]); expect(report.errors).toEqual([]);
    } finally {save();}
});
