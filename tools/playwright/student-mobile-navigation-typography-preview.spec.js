const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised, read-only navigation open/close. Never follow destinations.
test('Mobile navigation keeps Kit typography, opaque paint and aligned targets', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [];
    const errors = [];
    const blocked = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('mobile-navigation-type-native.json'),
        JSON.stringify({records, errors, blocked}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'no-preference'});

    for (const width of [768, 390]) {
        await page.setViewportSize({width, height: 900});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        const root = page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.route('**/local/groupimport/**', async route => {
            if (route.request().method() !== 'GET') {
                blocked.push({method: route.request().method(), url: route.request().url()});
                await route.abort('blockedbyclient');
            } else {
                await route.continue();
            }
        });
        const opener = page.locator('[data-easyedu-navigation-open]:visible').first();
        await opener.click();
        const panel = page.locator('[data-easyedu-navigation-panel]');
        await expect(panel).toHaveAttribute('aria-hidden', 'false');
        await expect(panel).toBeVisible();
        await expect.poll(() => panel.evaluate(node => getComputedStyle(node).opacity)).toBe('1');
        const geometry = await panel.evaluate((node, viewportWidth) => {
            const style = getComputedStyle(node);
            const title = node.querySelector('.easyedu-navigation__panel-title');
            const titleStyle = getComputedStyle(title);
            const rows = [...node.querySelectorAll('.easyedu-navigation__item')]
                .filter(row => row.getClientRects().length && getComputedStyle(row).display !== 'none')
                .map(row => {
                    const r = row.getBoundingClientRect();
                    const label = row.querySelector('.easyedu-navigation__item-label');
                    const lr = label?.getBoundingClientRect();
                    const icon = row.querySelector(':scope > .fa');
                    const ir = icon?.getBoundingClientRect();
                    const rs = getComputedStyle(row);
                    return {
                        text: label?.textContent.trim(), font: rs.fontFamily, size: rs.fontSize,
                        weight: rs.fontWeight, height: r.height, background: rs.backgroundColor,
                        labelContained: !lr || (lr.left >= r.left && lr.right <= r.right &&
                            lr.top >= r.top && lr.bottom <= r.bottom),
                        iconCentreDelta: ir ? Math.abs(ir.top + ir.height / 2 - r.top - r.height / 2) : 0,
                        iconHeight: ir?.height || 0,
                    };
                });
            const guide = node.querySelector('.easyedu-guide__launcher-label');
            return {
                width: viewportWidth, panel: {background: style.backgroundColor, opacity: style.opacity,
                    family: style.fontFamily},
                title: {font: titleStyle.fontFamily, size: titleStyle.fontSize, weight: titleStyle.fontWeight},
                guide: guide ? {font: getComputedStyle(guide).fontFamily,
                    size: getComputedStyle(guide).fontSize, weight: getComputedStyle(guide).fontWeight} : null,
                rows,
            };
        }, width);
        records.push(geometry);
        save();
        expect(geometry.panel.opacity).toBe('1');
        expect(geometry.panel.background).not.toMatch(/rgba\(.+, 0\)|transparent/);
        expect(geometry.panel.family).toContain('Inter');
        expect(geometry.title.size).toBe('16px');
        expect(geometry.title.weight).toBe('600');
        expect(geometry.guide.font).toBe(geometry.title.font);
        expect(geometry.guide.size).toBe('16px');
        expect(geometry.guide.weight).toBe('700');
        const destinations = geometry.rows.filter(row => row.text);
        expect(destinations).toHaveLength(3);
        expect(geometry.rows.length).toBeGreaterThan(0);
        for (const row of geometry.rows) {
            expect(row.font).toBe(geometry.title.font);
            expect(row.height).toBeGreaterThanOrEqual(44);
            expect(row.labelContained).toBe(true);
            expect(row.iconCentreDelta).toBeLessThanOrEqual(1);
            expect(row.size).toBe('15px');
            expect(row.weight).toBe('500');
        }
        await panel.screenshot({path: testInfo.outputPath(`mobile-navigation-${width}.png`)});
        await panel.locator('[data-easyedu-navigation-close]').click();
        await expect(panel).toHaveAttribute('aria-hidden', 'true');
        await expect(opener).toBeFocused();
        await page.unroute('**/local/groupimport/**');
    }
    expect(errors).toEqual([]);
    expect(blocked).toEqual([]);
    save();
});
