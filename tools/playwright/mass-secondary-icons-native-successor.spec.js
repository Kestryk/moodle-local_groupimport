const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Exact native FA-on-tile and nested-FA structures, passive initial GET only.
test('Mass Import native icons share compact header geometry', async ({page}, testInfo) => {
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
                const r = n.getBoundingClientRect(), self = n.matches('.fa'), glyph = self ? n : n.querySelector('.fa');
                if (!glyph) throw Error('Native tile has no FA glyph');
                const g = glyph.getBoundingClientRect(), style = getComputedStyle(n), pseudo = getComputedStyle(glyph, '::before');
                return {classes:n.className,width:r.width,height:r.height,self,
                    glyphSize:getComputedStyle(glyph).fontSize,content:pseudo.content,pseudoLine:pseudo.lineHeight,
                    pseudoMaxWidth:pseudo.maxWidth,align:style.alignItems,justify:style.justifyContent,
                    centerX:self?null:g.x+g.width/2-r.x-r.width/2,
                    centerY:self?null:g.y+g.height/2-r.y-r.height/2,
                    contained:g.x>=r.x&&g.y>=r.y&&g.right<=r.right&&g.bottom<=r.bottom};
            }));
            expect(tiles).toHaveLength(4);
            expect(tiles.filter(t => t.self)).toHaveLength(2);
            for (const tile of tiles) {
                expect(tile.width).toBeCloseTo(35.2, 1);
                expect(tile.height).toBeCloseTo(35.2, 1);
                expect(tile.glyphSize).toBe('17px');
                expect(tile.content).not.toBe('none');
                expect(tile.pseudoLine).toBe('17px');
                expect(tile.align).toBe('center');
                expect(tile.justify).toBe('center');
                if (!tile.self) {
                    expect(Math.abs(tile.centerX)).toBeLessThanOrEqual(1);
                    expect(Math.abs(tile.centerY)).toBeLessThanOrEqual(1);
                }
                expect(tile.contained).toBe(true);
            }
            const tracks = [];
            for (const selector of ['.easyedu-file-deposit__heading', '.easyedu-information__header']) {
                const track = await root.locator(selector).evaluate(n => getComputedStyle(n).gridTemplateColumns);
                expect(parseFloat(track)).toBeCloseTo(35.2, 1);
                tracks.push(track);
            }
            const indent = await root.locator('[id^="filepicker-wrapper-"]').evaluate(n => getComputedStyle(n).paddingInlineStart);
            expect(parseFloat(indent)).toBeCloseTo(width <= 640 ? 0 : 50.4, 1);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            expect(overflow).toBeLessThanOrEqual(2);
            records.push({width,tiles,tracks,indent,overflow});
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('secondary-icon-geometry.json'), JSON.stringify({records,errors,blocked}, null, 2));
    }
});
