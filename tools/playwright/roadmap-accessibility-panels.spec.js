'use strict';
const {test, expect} = require('@playwright/test');
const {default: AxeBuilder} = require('@axe-core/playwright');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

// local-supervised supplementary audit; every course action stays unsubmitted.
test('T058 audits expanded filters menus rollback and admin without writes', async({page}, info) => {
    test.setTimeout(420000); page.setDefaultTimeout(10000);
    const report = {task: 'T058', surface: 'supplement', viewport: 1280, locale: 'fr',
        servedFiles: audit.identity(), cases: [], axe: [], gaps: [], blockedWrites: [], errors: []};
    const save = () => fs.writeFileSync(info.outputPath('T058-panels.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', error => report.errors.push(error.message));
    const scan = async (selector, name) => {
        const r = await new AxeBuilder({page}).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        report.axe.push({name, violations: r.violations.map(v => ({id: v.id, impact: v.impact, help: v.help,
            nodes: v.nodes.map(n => ({target: n.target, checks: [...n.any, ...n.all, ...n.none].map(c => ({
                id: c.id, message: c.message, data: c.id === 'color-contrast' ? c.data : undefined}))}))})),
            incomplete: r.incomplete.map(v => ({id: v.id, nodes: v.nodes.length}))}); save();
    };
    const bounded = async (name, action) => {
        try { await action(); } catch (e) { report.gaps.push({name, reason: e.name + ': ' + e.message.split('\n')[0]}); save(); }
    };
    try {
        await page.setViewportSize({width: 1280, height: 900});
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await audit.login(page); await audit.blockBusinessWrites(page, report.blockedWrites);
        const root = await audit.ready(page);
        await bounded('context-menu', async () => {
            const item = root.locator('[data-easystud-user]:visible').first();
            await item.click({button: 'right'});
            const menu = root.locator('[data-easystud-context-menu]');
            await expect(menu).toBeVisible(); await audit.settle(menu);
            const record = {name: 'participant-context-menu', focusAtOpen: await menu.evaluate(n => n.contains(document.activeElement))};
            await scan('[data-easystud-context-menu]', 'context-menu');
            await page.keyboard.press('Escape');
            record.escapeClosed = await menu.waitFor({state: 'hidden', timeout: 3000}).then(() => true).catch(() => false);
            record.returnToCard = await item.evaluate(n => n.contains(document.activeElement));
            report.cases.push(record); save();
        });
        await bounded('expanded-filters', async () => {
            const toggle = root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible');
            await toggle.click(); await audit.settle(root);
            await scan('#local-groupimport-easystud', 'expanded-participant-filters');
            const hosts = root.locator('[data-easystud-filters] .easyedu-searchable-choice:visible');
            for (let i = 0; i < Math.min(await hosts.count(), 6); i++) {
                const host = hosts.nth(i), trigger = host.locator('.easyedu-searchable-choice__trigger');
                await trigger.click(); await audit.settle(host);
                const record = {name: 'filter-choice-' + i, focusAtOpen: await host.evaluate(n => n.contains(document.activeElement))};
                await page.keyboard.press('Escape'); await audit.settle(host);
                record.expandedAfterEscape = await trigger.getAttribute('aria-expanded');
                record.returnFocus = await trigger.evaluate(n => n === document.activeElement);
                report.cases.push(record); save();
            }
            if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click();
        });
        const structure = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
        await structure.click(); await audit.settle(root);
        for (const [name, toggleAttr, panelAttr] of [
            ['member-search', 'data-easystud-group-member-search-toggle', 'data-easystud-group-member-search-panel'],
            ['add-identifiers', 'data-easystud-toggle-group-email', 'data-easystud-group-email-panel'],
            ['add-groups', 'data-easystud-toggle-grouping-groups', 'data-easystud-grouping-groups-panel'],
            ['grouping-search', 'data-easystud-container-search-toggle', 'data-easystud-container-search-panel']]) {
            await bounded(name, async () => {
                const opener = root.locator('[' + toggleAttr + ']:visible').first();
                if (!await opener.count()) {report.gaps.push({name, reason: 'Native entry not visible'}); return;}
                const id = await opener.getAttribute(toggleAttr);
                const selector = '[' + panelAttr + '="' + id + '"]';
                const panel = root.locator(selector).filter({visible: true}).first();
                await opener.click(); await expect(panel).toBeVisible(); await audit.settle(panel);
                const record = {name, focusAtOpen: await panel.evaluate(n => n.contains(document.activeElement)),
                    ordinaryDisclosure: true, trapRequired: false};
                await scan(selector, name);
                await page.keyboard.press('Escape'); await audit.settle(root);
                record.escapeClosed = !await panel.isVisible();
                if (!record.escapeClosed) { await opener.click(); await audit.settle(root); }
                record.closedAfterNativeToggle = !await panel.isVisible();
                record.returnFocus = await opener.evaluate(n => n === document.activeElement);
                report.cases.push(record); save();
            });
        }
        // Direct Escape, separate from the previous audit's Tab-escape context.
        await bounded('group-settings-direct-Escape', async () => {
            const opener = root.locator('[data-easystud-structure-groups] [data-easystud-open-advanced-settings]:visible').first();
            await opener.click(); const modal = root.locator('[data-easystud-advanced-settings-modal]');
            await expect(modal).toBeVisible(); await audit.settle(modal);
            const record = {name: 'group-settings-direct-Escape', focusInsideBeforeEscape: await modal.evaluate(n => n.contains(document.activeElement))};
            await page.keyboard.press('Escape');
            record.escapeClosed = await modal.waitFor({state: 'hidden', timeout: 3000}).then(() => true).catch(() => false);
            if (!record.escapeClosed) await modal.locator('[data-easystud-close-advanced-settings]:visible').first().click();
            record.returnFocus = await opener.evaluate(n => n === document.activeElement);
            report.cases.push(record); save();
        });
        const url = audit.perfUrl(); url.pathname = '/local/groupimport/index.php';
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        const mass = page.locator('#local-groupimport-import');
        await expect(mass).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await bounded('rollback', async () => {
            const historyOpener = page.locator('[data-easyedu-navigation-item-id="mass-import-history"] button:visible').first();
            await historyOpener.click(); const history = mass.locator('[data-local-groupimport-history-modal]');
            await expect(history).toBeVisible(); await audit.settle(history);
            const restore = history.locator('[data-local-groupimport-rollback-open]:visible').first();
            if (!await restore.count()) report.gaps.push({name: 'rollback', reason: 'No suitable existing history; no synthetic import created'});
            else {
                await restore.click(); const modal = mass.locator('[data-local-groupimport-rollback-modal]');
                await expect(modal).toBeVisible(); await audit.settle(modal);
                const record = {name: 'rollback', focusAtOpen: await modal.evaluate(n => n.contains(document.activeElement))};
                await scan('[data-local-groupimport-rollback-modal]', 'rollback');
                await page.keyboard.press('Escape');
                record.escapeClosed = await modal.waitFor({state: 'hidden', timeout: 3000}).then(() => true).catch(() => false);
                if (!record.escapeClosed) await modal.locator('[data-local-groupimport-rollback-close]:visible').first().click();
                record.returnFocus = await restore.evaluate(n => n === document.activeElement);
                report.cases.push(record);
            }
            if (await history.isVisible()) await history.locator('[data-local-groupimport-history-close]:visible').first().click();
            save();
        });
        const admin = audit.perfUrl(); admin.pathname = '/admin/settings.php'; admin.search = '?section=local_groupimport&lang=fr';
        await page.route('**/admin/settings.php*', route => route.request().method() === 'GET' ? route.continue() : route.abort('blockedbyclient'));
        await page.goto(admin.href, {waitUntil: 'domcontentloaded'});
        await bounded('administration', async () => { await expect(page.locator('#adminsettings')).toBeVisible();
            await audit.settle(page.locator('#adminsettings')); await scan('#adminsettings', 'administration'); });
        report.completed = true;
        report.passed = report.axe.every(r => r.violations.length === 0) && report.gaps.length === 0;
    } finally { save(); }
});
