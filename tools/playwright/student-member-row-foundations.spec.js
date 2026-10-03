const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised, live course. Native disclosure, hover and keyboard focus
// only: never activate Remove or modify membership, import, messages/settings.
test('Student member rows retain their canonical skin across responsive widths', async({page}, testInfo) => {
    test.setTimeout(120000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width: 1600, height: 1100});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const grouping = root.locator('[data-easystud-grouping-id]:visible').filter({
        has: page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]'),
    }).first();
    const disclosure = grouping.locator(':scope > .local-groupimport-easystud-grouping__header ' +
        '[data-easystud-collapse-toggle]');
    if (await disclosure.getAttribute('aria-expanded') === 'false') await disclosure.click();
    const reports = [];
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            if (width < 1600) await root.locator('[data-easystud-mobile-view="groups"]').click();
            await page.evaluate(() => document.fonts.ready);
            const member = root.locator('[data-easystud-member-id]:visible:not(.is-collapsed)').first();
            await expect(member).toBeVisible();
            await member.scrollIntoViewIfNeeded();
            // Wait for native layout/disclosure to settle before measuring.
            await member.evaluate(async node => {
                const animations = node.closest('#local-groupimport-easystud').getAnimations({subtree: true})
                    .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations));
                await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
            });
            const geometry = await member.evaluate(node => {
                const box = n => {
                    const r = n.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height};
                };
                const name = node.querySelector('.local-groupimport-easystud-member__name');
                const remove = node.querySelector('[data-easystud-remove-member]');
                const selector = node.querySelector('.local-groupimport-easystud-selector');
                const style = getComputedStyle(name);
                return {row: box(node), list: box(node.parentElement), name: box(name),
                    remove: box(remove), selector: box(selector),
                    rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
                    nameText: name.textContent, accessibleRemove: remove.getAttribute('aria-label'),
                    nameSize: style.fontSize, nameWeight: style.fontWeight,
                    nameColor: style.color, nameFamily: style.fontFamily};
            });
            reports.push({width, geometry});
            expect(geometry.nameText.trim()).not.toBe('');
            expect(geometry.accessibleRemove).toBeTruthy();
            expect(geometry.nameSize).toBe('13px');
            expect(geometry.nameWeight).toBe('600');
            expect(geometry.nameColor).toBe('rgb(73, 101, 122)');
            expect(geometry.nameFamily).toContain('Inter');
            for (const [name, item] of Object.entries({name: geometry.name,
                remove: geometry.remove, selector: geometry.selector})) {
                expect(Math.abs(item.y + item.h / 2 - geometry.row.y - geometry.row.h / 2),
                    `${width}/${name} vertical centre`).toBeLessThan(2);
                expect(item.x, `${width}/${name} left`).toBeGreaterThanOrEqual(geometry.row.x - 1);
                expect(item.x + item.w, `${width}/${name} right`).toBeLessThanOrEqual(
                    geometry.row.x + geometry.row.w + 1);
            }
            expect(geometry.row.x + geometry.row.w).toBeLessThanOrEqual(geometry.list.x + geometry.list.w + 1);
            expect(geometry.remove.w).toBeCloseTo(1.45 * geometry.rem, 1);
            expect(geometry.remove.h).toBeCloseTo(1.45 * geometry.rem, 1);
            const remove = member.locator('[data-easystud-remove-member]');
            if (width === 1600) {
                await remove.hover();
                await expect(remove).toHaveCSS('background-color', 'rgb(238, 245, 251)');
                await expect(remove).toHaveCSS('color', 'rgb(41, 75, 104)');
            }
            await page.mouse.move(0, 0);
            await page.keyboard.press('Tab');
            await remove.focus();
            await expect(remove).toBeFocused();
            expect(await remove.evaluate(n => n.matches(':focus-visible'))).toBe(true);
            expect(await remove.evaluate(n => getComputedStyle(n).boxShadow)).not.toBe('none');
            const group = member.locator('xpath=ancestor::*[@data-easystud-group-id][1]');
            await group.screenshot({path: testInfo.outputPath(`member-group-${width}.png`)});
        }
    } finally {
        fs.writeFileSync(testInfo.outputPath('member-row-geometry.json'), JSON.stringify(reports, null, 2));
    }
});
