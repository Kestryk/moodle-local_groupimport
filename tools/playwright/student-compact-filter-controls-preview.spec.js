const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: native client-side filters; no fixture or business write.
test('Compact filter toggle and Reset retain native state and responsive geometry', async({page}, testInfo) => {
    test.setTimeout(180000);
    const root = page.locator('#local-groupimport-easystud');
    const records = [], blocked = [], errors = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('compact-filter-controls-native.json'),
        JSON.stringify({records, blocked, errors}, null, 2));
    const guard = async route => {
        if (route.request().method() !== 'GET') {
            blocked.push(route.request().method());
            await route.abort('blockedbyclient');
        } else { await route.continue(); }
    };
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    try {
        for (const width of [1600, 768, 390]) {
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
            const cases = width > 1024 ? [
                {mode: 'participants', key: 'participants', filter: 'participant-groups'},
                {mode: 'structure', key: 'structure', filter: 'structure-groups'},
            ] : [{mode: 'groups', key: 'structure', filter: 'structure-groups'}];
            for (const entry of cases) {
                await root.locator(width > 1024 ? `[data-easystud-layout-mode="${entry.mode}"]:visible` :
                    `[data-easystud-mobile-view="${entry.mode}"]:visible`).click();
                const more = root.locator(`[data-easystud-advanced-filters-toggle="${entry.filter}"]:visible`).first();
                if (await more.getAttribute('aria-expanded') !== 'true') { await more.click(); }
                const panel = root.locator(`[data-easystud-advanced-filters="${entry.filter}"]`);
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                const input = panel.locator(`[data-easystud-catalog-show-ungrouped="${entry.key}"]`);
                const label = input.locator('..');
                await expect(label).toBeVisible();
                await expect(label).toHaveClass(/easyedu-filter-toggle/);
                await label.click();
                await expect(input).toBeChecked();
                const reset = panel.locator(`[data-easystud-reset-catalog-filters="${entry.key}"]`);
                await expect(reset).toBeVisible();
                await expect(reset).toHaveCSS('font-size', '12.16px');
                const geometry = await label.evaluate(node => {
                    const span = node.querySelector('span');
                    const track = getComputedStyle(span, '::before');
                    const thumb = getComputedStyle(span, '::after');
                    const rect = node.getBoundingClientRect();
                    const reset = node.parentElement.querySelector('[data-easystud-reset-catalog-filters]');
                    const r = reset.getBoundingClientRect();
                    return {font: getComputedStyle(node).fontSize, border: getComputedStyle(node).borderTopWidth,
                        h: rect.height, x: rect.x, right: rect.right, trackW: track.width, trackH: track.height,
                        thumbW: thumb.width, thumbH: thumb.height, gap: getComputedStyle(span).paddingInlineStart,
                        resetH: r.height, centerDelta: Math.abs(rect.y + rect.height / 2 - r.y - r.height / 2)};
                });
                records.push({width, mode: entry.mode, geometry});
                save();
                expect(geometry.font).toBe('12.16px');
                expect(geometry.border).toBe('0px');
                expect(geometry.h).toBeGreaterThanOrEqual(44);
                expect(geometry.trackW).toBe('36px');
                expect(geometry.trackH).toBe('20px');
                expect(geometry.thumbW).toBe('14px');
                expect(geometry.thumbH).toBe('14px');
                expect(geometry.gap).toBe('48px');
                expect(geometry.x).toBeGreaterThanOrEqual(0);
                expect(geometry.right).toBeLessThanOrEqual(width);
                if (width > 1024) {
                    expect(geometry.resetH).toBeCloseTo(30.4, 1);
                    expect(geometry.centerDelta).toBeLessThanOrEqual(1);
                } else { expect(geometry.resetH).toBeGreaterThanOrEqual(44); }
                await panel.screenshot({path: testInfo.outputPath(`compact-filter-controls-${entry.mode}-${width}.png`)});
                await reset.click();
                await expect(input).not.toBeChecked();
                expect(await panel.locator('[data-easystud-catalog-grouping-filter]').evaluate(node =>
                    node.selectedOptions.length)).toBe(0);
                await more.click();
                await expect(more).toHaveAttribute('aria-expanded', 'false');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            }
        }
        expect(blocked).toEqual([]);
        expect(errors).toEqual([]);
    } finally { save(); }
});
