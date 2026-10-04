const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Desktop sticky selection remains centered and clears without covering final content', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const root = page.locator('#local-groupimport-easystud');
    const records = [];
    const blocked = [];
    const save = () => fs.writeFileSync(
        testInfo.outputPath('sticky-selection-native.json'),
        JSON.stringify({records, blocked}, null, 2)
    );
    await page.emulateMedia({reducedMotion: 'no-preference'});

    for (const width of [1600, 1100]) {
        await page.setViewportSize({width, height: 900});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.route('**/local/groupimport/**', async route => {
            if (route.request().method() !== 'GET') {
                blocked.push({width, method: route.request().method(), url: route.request().url()});
                await route.abort('blockedbyclient');
            } else {
                await route.continue();
            }
        });
        await root.locator('[data-easystud-layout-mode="participants"]:visible').first().click();
        const first = root.locator('[data-selectable-type="participant"]:visible [data-easystud-selector-input]').first();
        await first.click();
        const frame = root.locator('[data-easystud-clear-selection-frame]');
        await expect(frame).toBeVisible();
        const geometry = await frame.evaluate(node => {
            const r = node.getBoundingClientRect();
            const button = node.querySelector('[data-easystud-clear-all-selection]');
            const br = button.getBoundingClientRect();
            const icon = button.querySelector('.fa').getBoundingClientRect();
            const rootNode = node.closest('#local-groupimport-easystud');
            const style = getComputedStyle(node);
            const rootStyle = getComputedStyle(rootNode);
            return {
                rect: {x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom},
                viewportCentreDelta: Math.abs(r.left + r.width / 2 - innerWidth / 2),
                contained: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
                iconCentreDelta: Math.max(
                    Math.abs(icon.left + icon.width / 2 - (br.left + icon.width / 2 +
                        parseFloat(getComputedStyle(button).paddingLeft))),
                    Math.abs(icon.top + icon.height / 2 - (br.top + br.height / 2))
                ),
                background: style.backgroundImage,
                shadow: style.boxShadow,
                radius: style.borderRadius,
                rootPaddingBottom: parseFloat(rootStyle.paddingBottom),
            };
        });
        expect(geometry.viewportCentreDelta).toBeLessThanOrEqual(1);
        expect(geometry.contained).toBe(true);
        expect(geometry.background).toBe('none');
        expect(geometry.radius).toBe('999px');
        expect(geometry.rootPaddingBottom).toBeGreaterThanOrEqual(geometry.rect.height + 16);
        const bottomPagination = root.locator('[data-easystud-pagination-position="bottom"]:visible').first();
        if (await bottomPagination.count()) {
            await bottomPagination.scrollIntoViewIfNeeded();
            const overlap = await Promise.all([
                frame.boundingBox(), bottomPagination.boundingBox(),
            ]).then(([a, b]) => !a || !b ? 0 : Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)));
            expect(overlap).toBe(0);
        }
        await frame.locator('[data-easystud-clear-all-selection]').click();
        await expect(frame).toBeHidden();
        await expect(root).not.toHaveClass(/local-groupimport-easystud--has-selection/);
        records.push({width, geometry});
        save();
        await page.unroute('**/local/groupimport/**');
    }
    expect(blocked, 'Clear selection must not invoke a business request').toEqual([]);
    save();
});
