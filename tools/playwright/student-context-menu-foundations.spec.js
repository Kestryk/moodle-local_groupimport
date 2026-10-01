const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: view switching, context selection and menu open/close only.
// Never activate a business menu item, submit, drop or modify course data.
test('Student context menus preserve responsive geometry and focus', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:1600, height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout:60000});
    const menu = root.locator('[data-easystud-context-menu]');
    const backdrop = root.locator('[data-easystud-context-backdrop]');
    const reports = [];
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height:1100});
            for (const [view, selector] of [
                ['participants', '[data-easystud-user]'],
                ['groups', '[data-easystud-group-id]'],
                ['groupings', '[data-easystud-grouping-id]'],
            ]) {
                const responsive = width <= 1024;
                if (responsive) {
                    await root.locator(`[data-easystud-mobile-view="${view}"]`).click();
                    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', view);
                } else if (view === 'groups') {
                    const grouping = root.locator('[data-easystud-grouping-id]:visible').filter({
                        has:page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]'),
                    }).first();
                    const disclosure = grouping.locator(
                        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
                    if (await disclosure.getAttribute('aria-expanded') === 'false') await disclosure.click();
                }
                const card = root.locator(`${selector}:visible`).first();
                await expect(card).toBeVisible();
                await card.scrollIntoViewIfNeeded();
                let trigger;
                if (responsive) {
                    trigger = card.locator(':scope > [data-easystud-card-menu], ' +
                        ':scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu], ' +
                        ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]').first();
                    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
                    const target = await trigger.boundingBox();
                    expect(target.width).toBeGreaterThanOrEqual(43);
                    expect(target.height).toBeGreaterThanOrEqual(43);
                    await trigger.click();
                    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
                } else {
                    await card.click({button:'right', position:{x:100, y:20}});
                }
                await expect(menu).toBeVisible();
                if (responsive) {
                    await expect(menu).toHaveClass(/is-mobile-sheet/);
                    await expect(backdrop).toBeVisible();
                } else {
                    await expect(menu).not.toHaveClass(/is-mobile-sheet/);
                    await expect(backdrop).toBeHidden();
                }
                const report = await menu.evaluate(node => {
                    const box = n => {
                        const r = n.getBoundingClientRect();
                        return {x:r.x, y:r.y, w:r.width, h:r.height};
                    };
                    const actions = [...node.querySelectorAll('[role="menuitem"]')]
                        .filter(n => n.getClientRects().length);
                    return {box:box(node), viewport:{w:innerWidth, h:innerHeight},
                        focusedItem:actions.some(n => n === document.activeElement),
                        overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
                        items:actions.map(n => ({action:n.getAttribute('data-easystud-context-action'),
                            box:box(n), icon:n.querySelector('.fa') ? box(n.querySelector('.fa')) : null,
                            label:n.textContent.trim(), disabled:n.disabled})),
                    };
                });
                reports.push({width, view, ...report});
                fs.writeFileSync(testInfo.outputPath('context-menu-geometry.json'), JSON.stringify(reports, null, 2));
                expect(report.items.length).toBeGreaterThan(0);
                expect(report.focusedItem).toBe(true);
                expect(report.overflow).toBeLessThanOrEqual(2);
                expect(report.box.x).toBeGreaterThanOrEqual(-1);
                expect(report.box.x + report.box.w).toBeLessThanOrEqual(report.viewport.w + 1);
                expect(report.box.y).toBeGreaterThanOrEqual(-1);
                expect(report.box.y + report.box.h).toBeLessThanOrEqual(report.viewport.h + 1);
                for (const item of report.items) {
                    expect(item.label).not.toBe('');
                    expect(item.box.x).toBeGreaterThanOrEqual(report.box.x);
                    expect(item.box.x + item.box.w).toBeLessThanOrEqual(report.box.x + report.box.w + 1);
                    if (item.icon) {
                        expect(Math.abs(item.icon.y + item.icon.h / 2 - item.box.y - item.box.h / 2)).toBeLessThan(1);
                    }
                }
                await page.screenshot({path:testInfo.outputPath(`context-menu-${view}-${width}.png`)});
                await page.keyboard.press('Escape');
                await expect(menu).toBeHidden();
                await expect(backdrop).toBeHidden();
                if (responsive) {
                    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
                    await expect(trigger).toBeFocused();
                }
                // Selection is a transient UI state used by the native context
                // controller. Restore it without issuing any business command.
                const checked = root.locator('input[data-easystud-select-item]:checked:visible');
                while (await checked.count()) await checked.first().uncheck();
            }
        }
    } finally {
        await page.keyboard.press('Escape');
        const checked = root.locator('input[data-easystud-select-item]:checked:visible');
        while (await checked.count()) await checked.first().uncheck();
    }
});
