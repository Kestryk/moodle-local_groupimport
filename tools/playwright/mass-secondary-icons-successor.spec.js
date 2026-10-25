const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised initial GET only. Native upload/import/settings are untouched.
test('Mass Import secondary icons share compact header geometry', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', e => errors.push(e.message));
    const target = new URL('/local/groupimport/index.php?id=5', process.env.EASYEDU_MOODLE_URL).toString();
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.goto(target);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(u => !u.pathname.includes('/login/'));
                await page.goto(target);
            }
            await page.route('**/local/groupimport/**', async route => {
                if (route.request().method() === 'GET') await route.continue();
                else {blocked.push('plugin non-GET'); await route.abort('blockedbyclient');}
            });
            const root = page.locator('#local-groupimport-import');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await page.evaluate(() => document.fonts.ready);
            await expect(root.locator('.easyedu-file-deposit__icon')).toBeVisible();
            const tiles = await root.locator('.easyedu-icon-tile:visible').evaluateAll(nodes => nodes.map(n => {
                const r = n.getBoundingClientRect(), glyph = n.querySelector('.fa'), g = glyph.getBoundingClientRect();
                return {classes: n.className, width: r.width, height: r.height, glyphSize: getComputedStyle(glyph).fontSize,
                    centerX: g.x + g.width / 2 - r.x - r.width / 2,
                    centerY: g.y + g.height / 2 - r.y - r.height / 2,
                    contained: g.x >= r.x && g.y >= r.y && g.right <= r.right && g.bottom <= r.bottom};
            }));
            expect(tiles).toHaveLength(4);
            for (const tile of tiles) {
                expect(tile.width).toBeCloseTo(35.2, 1);
                expect(tile.height).toBeCloseTo(35.2, 1);
                expect(tile.glyphSize).toBe('17px');
                expect(Math.abs(tile.centerX)).toBeLessThanOrEqual(1);
                expect(Math.abs(tile.centerY)).toBeLessThanOrEqual(1);
                expect(tile.contained).toBe(true);
            }
            const track = await root.locator('.easyedu-file-deposit__heading').evaluate(n => getComputedStyle(n).gridTemplateColumns);
            expect(parseFloat(track)).toBeCloseTo(35.2, 1);
            const informationTrack = await root.locator('.easyedu-information__header').evaluate(n => getComputedStyle(n).gridTemplateColumns);
            expect(parseFloat(informationTrack)).toBeCloseTo(35.2, 1);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            expect(overflow).toBeLessThanOrEqual(2);
            records.push({width, tiles, track, overflow});
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('secondary-icon-geometry.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
