'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

test('T059 49072 remaining dialogs and long labels FR tablet mobile', async({page}, info) => {
    test.setTimeout(300000);
    const report = {task: 'T059', cases: [], gaps: [], writesBlocked: [], errors: [], servedFiles: audit.identity()};
    const save = () => fs.writeFileSync(info.outputPath('t059-remaining.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => {report.errors.push(e.message); save();});
    await audit.login(page); await audit.blockBusinessWrites(page, report.writesBlocked);
    const measure = async modal => modal.evaluate(node => {
        const surface = node.querySelector('.modal-dialog,[role="document"],.local-groupimport-easystud-modal__dialog') || node;
        const r = surface.getBoundingClientRect();
        return {left: r.left, right: r.right, viewport: innerWidth, overflow: surface.scrollWidth - surface.clientWidth};
    });
    const open = async(width, name, opener, selector) => {
        const record = {width, name}; report.cases.push(record); save();
        await expect(opener).toBeVisible(); await expect(opener).toBeEnabled(); await opener.click();
        const modal = page.locator(selector).filter({visible: true}).first();
        await expect(modal).toBeVisible(); await audit.settle(modal);
        record.native = await measure(modal);
        // Temporary DOM-only stress sample: explicitly separate from native translated labels.
        const title = modal.locator('h2,h3,.modal-title').first();
        if (await title.count()) {
            const original = await title.textContent();
            try {
                await title.evaluate(n => {n.textContent = 'Réglages du groupement — parcours international et accompagnement pédagogique personnalisé';});
                record.syntheticLongTitle = await measure(modal);
                record.titleOverflow = await title.evaluate(n => n.scrollWidth - n.clientWidth);
            } finally {await title.evaluate((n, text) => {n.textContent = text;}, original);}
        }
        await page.screenshot({path: info.outputPath(width + '-' + name + '.png')});
        await page.keyboard.press('Escape'); await expect(modal).toBeHidden(); save();
        for (const bounds of [record.native, record.syntheticLongTitle].filter(Boolean)) {
            expect(bounds.left, name).toBeGreaterThanOrEqual(-1);
            expect(bounds.right, name).toBeLessThanOrEqual(bounds.viewport + 1);
            expect(bounds.overflow, name).toBeLessThanOrEqual(1);
        }
        if (record.titleOverflow !== undefined) expect(record.titleOverflow, name).toBeLessThanOrEqual(1);
    };
    try {
        for (const width of [1024, 768, 390]) {
            await page.setViewportSize({width, height: 900});
            await page.goto(audit.perfUrl().href, {waitUntil: 'domcontentloaded'});
            const root = await audit.ready(page);
            const select = root.locator('[data-easystud-user]:visible [data-easystud-selector-input]').first();
            await select.evaluate(n => n.click());
            const action = key => root.locator(`[data-easystud-${key}]:visible, ` +
                `[data-easystud-mobile-action-trigger="[data-easystud-${key}]"]:visible`).first();
            await open(width, 'move', action('move-selected-participants'), '[data-easystud-move-modal]');
            await open(width, 'message', action('message-selected-participants'), '.local-groupimport-easystud-message-modal.show');
            for (const [view, scope] of [['groups', '[data-easystud-structure-groups]'], ['groupings', '[data-easystud-tree]']]) {
                await root.locator(`[data-easystud-mobile-view="${view}"]:visible`).click();
                await audit.settle(root);
                const kind = view === 'groups' ? 'group' : 'grouping';
                const card = root.locator(scope + ' [data-easystud-advanced-type="' + kind + '"]:visible').first();
                let settings = card.locator(':scope > .local-groupimport-easystud-' + kind + '__header > ' +
                    '[data-easystud-open-advanced-settings]:visible').first();
                if (!await settings.count()) {
                    await card.locator(':scope > [data-easystud-card-menu]:visible, ' +
                        ':scope > .local-groupimport-easystud-' + kind + '__header > [data-easystud-card-menu]:visible').first().click();
                    settings = root.locator('[data-easystud-context-menu]:visible ' +
                        '[data-easystud-context-action="' + kind + '-open-advanced-settings"]');
                }
                await open(width, view + '-settings', settings, '[data-easystud-advanced-settings-modal]');
                if (kind === 'group') {
                    const groups = root.locator(scope + ' [data-easystud-advanced-type="group"]:visible');
                    const index = await groups.evaluateAll(nodes => nodes.findIndex(n =>
                        Number.parseInt(n.getAttribute('data-easystud-advanced-count'), 10) > 0));
                    if (index >= 0) {
                        const clear = root.locator('[data-easystud-clear-all-selection]:visible').first();
                        if (await clear.count()) await clear.click();
                        await groups.nth(index).locator('[data-easystud-selector-input]').first().evaluate(n => n.click());
                        await open(width, 'confirmation', action('delete-selected-groups'), '[data-easystud-confirm-modal]');
                    } else report.gaps.push({width, name: 'confirmation', reason: 'No visible populated group; empty-group Delete is not invoked.'});
                }
            }
            const mass = audit.perfUrl(); mass.pathname = '/local/groupimport/index.php';
            await page.goto(mass.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('[data-local-groupimport-history-modal]'))
                .toHaveAttribute('data-local-groupimport-history-bound', '1');
            const history = page.locator('[data-local-groupimport-history-open]:visible, ' +
                '[data-easyedu-navigation-action="mass-import-history"]:visible').first();
            if (!await history.count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await history.click();
            await expect(page.locator('[data-local-groupimport-history-modal]')).toBeVisible();
            await expect(page.locator('[data-easyedu-navigation-panel][aria-hidden="false"]')).toHaveCount(0);
            await audit.settle(page.locator('body'));
            const rollback = page.locator('[data-local-groupimport-rollback-open]:visible').first();
            if (await rollback.count()) await open(width, 'rollback', rollback, '[data-local-groupimport-rollback-modal]');
            else report.gaps.push({width, name: 'rollback', reason: 'No native existing history trigger; no import created.'});
            save();
        }
        expect(report.writesBlocked).toEqual([]); expect(report.errors).toEqual([]);
    } finally {save();}
});
