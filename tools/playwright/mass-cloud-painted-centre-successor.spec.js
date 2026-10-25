// SM-53 strict successor. Historical diagnostic stays immutable; captures
// measure actual native paint after canonical intrinsic-width normalization.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Mass Import cloud paint is centered with intrinsic shared icon width', async ({page}, testInfo) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], blocked = [], errors = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('cloud-painted-bounds.json'),
        JSON.stringify({records, blocked, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() === 'GET') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(name => name === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(name => reads.has(name))) return route.continue();
        blocked.push({scope: 'core', methods});
        return route.abort('blockedbyclient');
    });
    const target = new URL('/local/groupimport/index.php?id=5', process.env.EASYEDU_MOODLE_URL).toString();
    await page.setViewportSize({width: 1600, height: 1100});
    await page.goto(target, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
        await page.goto(target, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()});
        return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        await page.evaluate(() => document.fonts.ready);
        const tile = root.locator('.easyedu-file-deposit__icon');
        await tile.scrollIntoViewIfNeeded();
        await tile.evaluate(node => {
            const r = node.getBoundingClientRect();
            window.scrollBy(0, r.top + r.height / 2 - innerHeight / 2);
        });
        const geometry = await tile.evaluate(node => {
            const t = node.getBoundingClientRect(), glyph = node.querySelector('.fa');
            const g = glyph.getBoundingClientRect(), p = getComputedStyle(glyph, '::before');
            const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
            ctx.font = `${p.fontStyle} ${p.fontWeight} ${p.fontSize} ${p.fontFamily}`;
            const content = p.content.replace(/^['"]|['"]$/g, ''), metrics = ctx.measureText(content);
            return {tile: {w: t.width, h: t.height}, glyph: {w: g.width, h: g.height},
                slotCentreDelta: {x: g.x + g.width / 2 - t.x - t.width / 2,
                    y: g.y + g.height / 2 - t.y - t.height / 2},
                color: getComputedStyle(glyph).color, font: p.fontFamily, size: p.fontSize,
                unobstructed: node.contains(document.elementFromPoint(t.x + t.width / 2, t.y + t.height / 2)),
                metrics: {advance: metrics.width, left: metrics.actualBoundingBoxLeft,
                    right: metrics.actualBoundingBoxRight, ascent: metrics.actualBoundingBoxAscent,
                    descent: metrics.actualBoundingBoxDescent, fontAscent: metrics.fontBoundingBoxAscent,
                    fontDescent: metrics.fontBoundingBoxDescent},
                overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth};
        });
        expect(geometry.unobstructed, 'Do not hide sticky overlays to capture the icon').toBe(true);
        const capture = await tile.screenshot({path: testInfo.outputPath(`cloud-${width}.png`)});
        const paint = await page.evaluate(async ({data, color}) => {
            const image = new Image(); image.src = data; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
            const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number);
            let minX = image.width, minY = image.height, maxX = -1, maxY = -1, count = 0;
            // Full/near-full foreground paint only: pale border/background do
            // not qualify. Keep raw crop for independent visual inspection.
            for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
                const i = (y * image.width + x) * 4;
                if (pixels[i + 3] >= 240 && rgb.every((v, c) => Math.abs(pixels[i + c] - v) <= 35)) {
                    minX = Math.min(minX, x); minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
                }
            }
            return {capture: {w: image.width, h: image.height}, count,
                bounds: {x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1},
                centreDelta: {x: (minX + maxX + 1 - image.width) / 2,
                    y: (minY + maxY + 1 - image.height) / 2}};
        }, {data: `data:image/png;base64,${capture.toString('base64')}`, color: geometry.color});
        records.push({width, geometry, paint}); save();
        expect(geometry.tile.w).toBeCloseTo(35.2, 1);
        expect(geometry.tile.h).toBeCloseTo(35.2, 1);
        expect(geometry.size).toBe('17px');
        expect(geometry.overflow).toBeLessThanOrEqual(2);
        expect(paint.count).toBeGreaterThan(10);
        expect(Math.abs(paint.centreDelta.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(paint.centreDelta.y)).toBeLessThanOrEqual(1);
        expect(geometry.glyph.w).toBeCloseTo(geometry.metrics.advance, 1);
        const peers = await root.locator('.easyedu-icon-tile:visible').evaluateAll(nodes => nodes.map(n => {
            const r = n.getBoundingClientRect(), glyph = n.matches('.fa') ? n : n.querySelector('.fa');
            return {width: r.width, height: r.height, fontSize: getComputedStyle(glyph).fontSize};
        }));
        expect(peers).toHaveLength(4);
        for (const peer of peers) {
            expect(peer.width).toBeCloseTo(35.2, 1);
            expect(peer.height).toBeCloseTo(35.2, 1);
            expect(peer.fontSize).toBe('17px');
        }
    }
    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
    save();
});
