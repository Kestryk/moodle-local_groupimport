const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: initial Mass Import display only; no file or form mutation.
test('Mass Import empty copy uses Foundation caption', async({page}, testInfo) => {
    test.setTimeout(180000);
    const base = process.env.EASYEDU_MOODLE_URL || 'http://localhost';
    const url = new URL('/local/groupimport/index.php?id=5', base).toString();
    const errors = [];
    const records = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('mass-import-initial-balance.json'),
        JSON.stringify({records, submitted, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME || 'Admin');
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD || '');
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
        await page.goto(url, {waitUntil: 'domcontentloaded'});
    }
    let submitted = false;
    await page.route('**/local/groupimport/index.php*', route => {
        if (route.request().method() !== 'GET') {
            submitted = true;
            return route.abort();
        }
        return route.continue();
    });
    try {
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1000});
        await expect(page.locator('#local-groupimport-import'))
            .toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(page.locator('.easyedu-file-deposit .fp-btn-choose').first())
            .toBeVisible({timeout: 60000});
        await expect(page.locator('.easyedu-file-deposit .filepicker-container')).toBeHidden();
        const empty = page.locator('.local-groupimport-import-empty.easyedu-empty').first();
        await expect(empty).toBeVisible();
        const copy = empty.locator('p');
        expect((await copy.textContent()).trim().length).toBeGreaterThan(10);
        await expect(copy).toHaveCSS('font-size', '12.16px');
        await expect(empty.locator('.easyedu-empty__boundary')).toHaveCSS('stroke-dasharray', '11px, 11px');
        const fits = await empty.evaluate(node => {
            const outer = node.getBoundingClientRect();
            const text = node.querySelector('p').getBoundingClientRect();
            return text.left >= outer.left && text.right <= outer.right &&
                text.top >= outer.top && text.bottom <= outer.bottom;
        });
        expect(fits).toBe(true);
        const panelMetrics = await page.locator('.local-groupimport-import-card').evaluateAll(panels =>
            panels.map(panel => {
                const header = panel.querySelector('.easyedu-panel__header');
                const tile = header.querySelector('.easyedu-icon-tile');
                const title = header.querySelector('.easyedu-panel__title');
                const description = header.querySelector('.easyedu-panel__description');
                const bounds = node => {
                    const rect = node.getBoundingClientRect();
                    return {x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                        right: rect.right, bottom: rect.bottom};
                };
                return {panel: bounds(panel), tile: bounds(tile), title: bounds(title),
                    description: bounds(description), titleFont: getComputedStyle(title).fontSize,
                    descriptionFont: getComputedStyle(description).fontSize,
                    compactHeader: header.classList.contains('easyedu-panel__header--compact-icon'),
                    compactTile: tile.classList.contains('easyedu-icon-tile--compact')};
            }));
        records.push({width, panels: panelMetrics});
        save();
        expect(panelMetrics).toHaveLength(2);
        for (const metrics of panelMetrics) {
            expect(metrics.compactHeader).toBe(true);
            expect(metrics.compactTile).toBe(true);
            expect(metrics.tile.width).toBeCloseTo(35.2, 1);
            expect(metrics.tile.height).toBeCloseTo(35.2, 1);
            expect(metrics.titleFont).toBe('16px');
            expect(metrics.descriptionFont).toBe('14.4px');
            if (width <= 640) {
                expect(Math.abs(metrics.title.y + metrics.title.height / 2 -
                    metrics.tile.y - metrics.tile.height / 2)).toBeLessThanOrEqual(1);
                expect(Math.abs(metrics.description.x - metrics.tile.x)).toBeLessThanOrEqual(1);
            } else {
                expect(metrics.title.y - metrics.tile.y).toBeCloseTo(4, 1);
                expect(Math.abs(metrics.description.x - metrics.title.x)).toBeLessThanOrEqual(1);
            }
            expect(metrics.description.y - metrics.title.bottom).toBeGreaterThanOrEqual(5);
            expect(metrics.description.right).toBeLessThanOrEqual(metrics.panel.right - 10);
        }
        const [upload, results] = panelMetrics;
        if (width <= 768) {
            expect(results.panel.y).toBeGreaterThanOrEqual(upload.panel.bottom);
            expect(Math.abs(upload.panel.width - results.panel.width)).toBeLessThanOrEqual(1);
        } else {
            expect(Math.abs(upload.panel.y - results.panel.y)).toBeLessThanOrEqual(1);
            expect(results.panel.x).toBeGreaterThan(upload.panel.right);
            expect(upload.panel.width / results.panel.width).toBeCloseTo(44 / 56, 1);
        }
        await empty.screenshot({path: testInfo.outputPath(`mass-import-empty-${width}.png`)});
        await page.locator('.local-groupimport-import-card--upload').screenshot({
            path: testInfo.outputPath(`mass-import-upload-${width}.png`)});
        if (width > 1200) {
            // Transient framing probe on the native DOM, not an uploaded preview.
            // Reduced motion isolates settled centring; timed disclosure has its
            // own native scenario and is deliberately not claimed by this check.
            await page.emulateMedia({reducedMotion: 'reduce'});
            const rail = await page.locator('#local-groupimport-import').evaluate(node => {
                const priorPreview = node.classList.contains('has-preview');
                const priorCollapsed = node.classList.contains('is-upload-collapsed');
                try {
                    node.classList.add('has-preview', 'is-upload-collapsed');
                    const card = node.querySelector('.local-groupimport-import-card--upload').getBoundingClientRect();
                    const tile = node.querySelector('.local-groupimport-import-card--upload .easyedu-icon-tile')
                        .getBoundingClientRect();
                    return {transientClassProbe: true, railWidth: card.width, tileWidth: tile.width,
                        centerDelta: Math.abs(tile.left + tile.width / 2 - card.left - card.width / 2)};
                } finally {
                    node.classList.toggle('has-preview', priorPreview);
                    node.classList.toggle('is-upload-collapsed', priorCollapsed);
                }
            });
            await page.emulateMedia({reducedMotion: 'no-preference'});
            records.push({width, compactRail: rail});
            save();
            expect(rail.railWidth).toBeCloseTo(77.6, 1);
            expect(rail.tileWidth).toBeCloseTo(35.2, 1);
            expect(rail.centerDelta).toBeLessThanOrEqual(1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    }
    expect(submitted).toBe(false);
    expect(errors).toEqual([]);
    } finally {
        save();
    }
});
