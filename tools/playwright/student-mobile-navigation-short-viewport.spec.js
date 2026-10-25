// SM-47 successor: settle the drawer transform, then exercise real viewport scrolling.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Compact navigation fits short viewports and retains native scroll access', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [], unexpectedWrites = [];
    page.on('pageerror', e => errors.push(e.message));
    const url = new URL('/local/groupimport/manage.php?id=5', process.env.EASYEDU_MOODLE_URL).toString();
    await page.goto(url);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u => !u.pathname.includes('/login/'));
    }
    // Open/Close only. Observe requests instead of installing routing, which
    // disables HTTP cache and distorted the native startup deadline diagnostic.
    page.on('request', request => {
        if (new URL(request.url()).pathname.startsWith('/local/groupimport/') && request.method() !== 'GET')
            unexpectedWrites.push(request.method());
    });
    try {
        for (const width of [768, 390]) for (const reduced of [false, true]) {
            await page.setViewportSize({width, height: 600});
            await page.emulateMedia({reducedMotion: reduced ? 'reduce' : 'no-preference'});
            await page.goto(url);
            const root = page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await page.evaluate(() => document.fonts.ready);
            const opener = page.locator('[data-easyedu-navigation-open]:visible').first();
            await opener.click();
            const panel = page.locator('[data-easyedu-navigation-panel]');
            await expect(panel).toHaveAttribute('aria-hidden', 'false');
            // Opacity is already 1 before sliding completes. Require terminal translation.
            await expect.poll(() => panel.evaluate(n => {
                const value = getComputedStyle(n).transform;
                return value === 'none' ? 0 : Math.abs(new DOMMatrixReadOnly(value).m41);
            })).toBeLessThan(0.1);
            const scroll = panel.locator('[data-easyedu-navigation-panel-scroll]');
            await expect.poll(() => panel.locator('[data-easyedu-navigation-participant-item]').count()).toBeGreaterThan(0);
            const record = {width, reduced}; records.push(record);
            record.geometry = await panel.evaluate(n => {
                const r = n.getBoundingClientRect(), s = getComputedStyle(n);
                const header = n.querySelector('.easyedu-navigation__panel-header').getBoundingClientRect();
                const scroller = n.querySelector('[data-easyedu-navigation-panel-scroll]');
                const t = n.querySelector('.easyedu-navigation__panel-title'), range = document.createRange();
                range.selectNodeContents(t);
                return {x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width,
                    height: r.height, viewport: innerWidth, headerTop: header.top,
                    scrollClient: scroller.clientHeight, scrollTotal: scroller.scrollHeight,
                    background: s.backgroundColor, transform: s.transform,
                    titleBounds: [...range.getClientRects()].map(b => ({x: b.x, right: b.right, top: b.top, bottom: b.bottom})),
                    headerBottom: header.bottom, overflow: n.scrollWidth - n.clientWidth};
            });
            expect(record.geometry.x).toBeGreaterThanOrEqual(-0.1);
            expect(record.geometry.right).toBeLessThanOrEqual(width + 0.1);
            expect(record.geometry.y).toBeCloseTo(0, 1);
            expect(record.geometry.bottom).toBeCloseTo(600, 1);
            expect(record.geometry.background).toBe('rgb(255, 255, 255)');
            expect(record.geometry.overflow).toBe(0);
            expect(record.geometry.scrollTotal).toBeGreaterThan(record.geometry.scrollClient);
            for (const b of record.geometry.titleBounds) {
                expect(b.x).toBeGreaterThanOrEqual(record.geometry.x);
                expect(b.right).toBeLessThanOrEqual(record.geometry.right);
                expect(b.bottom).toBeLessThanOrEqual(record.geometry.headerBottom);
            }
            await page.screenshot({path: testInfo.outputPath(`navigation-short-top-${width}-${reduced}.png`)});
            await scroll.evaluate(n => { n.scrollTop = n.scrollHeight; });
            record.scrolled = await panel.evaluate(n => {
                const last = n.querySelector('[data-easyedu-navigation-participant-links]').lastElementChild;
                const r = last.getBoundingClientRect(), header = n.querySelector('.easyedu-navigation__panel-header').getBoundingClientRect();
                const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
                const scroller = n.querySelector('[data-easyedu-navigation-panel-scroll]');
                return {lastLabel: last.textContent.trim(), top: r.top, bottom: r.bottom,
                    headerTop: header.top, headerBottom: header.bottom, hit: hit === last || last.contains(hit),
                    scrollTop: scroller.scrollTop, scrollTotal: scroller.scrollHeight, scrollClient: scroller.clientHeight};
            });
            expect(record.scrolled.scrollTop).toBeGreaterThan(0);
            expect(record.scrolled.hit).toBe(true);
            expect(record.scrolled.bottom).toBeLessThanOrEqual(600);
            expect(record.scrolled.top).toBeGreaterThanOrEqual(record.scrolled.headerBottom);
            expect(record.scrolled.headerTop).toBeCloseTo(record.geometry.headerTop, 1);
            await page.screenshot({path: testInfo.outputPath(`navigation-short-bottom-${width}-${reduced}.png`)});
            await panel.locator('[data-easyedu-navigation-close]').click();
            await expect(panel).toHaveAttribute('aria-hidden', 'true');
            await expect(opener).toBeFocused();
        }
        expect(errors).toEqual([]); expect(unexpectedWrites).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('navigation-short-viewport.json'),
            JSON.stringify({records, errors, unexpectedWrites}, null, 2));
    }
});
