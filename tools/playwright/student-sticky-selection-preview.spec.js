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
        await expect(frame.locator('[data-easystud-clear-all-selection]')).toHaveClass(/foundation-selection-action/);
        const geometry = await frame.evaluate(node => {
            const r = node.getBoundingClientRect();
            const button = node.querySelector('[data-easystud-clear-all-selection]');
            const br = button.getBoundingClientRect();
            const icon = button.querySelector('.fa').getBoundingClientRect();
            const rootNode = node.closest('#local-groupimport-easystud');
            const style = getComputedStyle(node);
            const buttonStyle = getComputedStyle(button);
            const iconStyle = getComputedStyle(button.querySelector('.fa'));
            const count = node.querySelector('[data-easystud-clear-selection-count]');
            const countStyle = getComputedStyle(count);
            const rootStyle = getComputedStyle(rootNode);
            return {
                rect: {x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom},
                layoutViewport: {
                    innerWidth,
                    clientWidth: document.documentElement.clientWidth,
                    bodyWidth: document.body.getBoundingClientRect().width,
                    frameCentre: r.left + r.width / 2,
                },
                // Moodle's rendered canvas excludes the native Windows scrollbar
                // gutter. The recovery capsule must centre on that visible canvas,
                // rather than on the browser's outer CSS viewport.
                viewportCentreDelta: Math.abs(r.left + r.width / 2 -
                    (document.body.getBoundingClientRect().left + document.body.getBoundingClientRect().width / 2)),
                contained: r.left >= document.body.getBoundingClientRect().left &&
                    r.right <= document.body.getBoundingClientRect().right &&
                    r.bottom <= document.documentElement.clientHeight,
                iconCentreDelta: Math.max(
                    Math.abs(icon.left + icon.width / 2 - (br.left + icon.width / 2 +
                        parseFloat(getComputedStyle(button).paddingLeft))),
                    Math.abs(icon.top + icon.height / 2 - (br.top + br.height / 2))
                ),
                background: style.backgroundImage,
                shadow: style.boxShadow,
                radius: style.borderRadius,
                buttonFontSize: buttonStyle.fontSize,
                buttonFontWeight: buttonStyle.fontWeight,
                buttonColour: buttonStyle.color,
                buttonSize: {width: br.width, height: br.height},
                iconColour: iconStyle.color,
                capsulePadding: {
                    top: style.paddingTop, bottom: style.paddingBottom,
                    left: style.paddingLeft, right: style.paddingRight,
                    gap: style.columnGap, border: style.borderTopColor,
                },
                countType: {size: countStyle.fontSize, weight: countStyle.fontWeight, colour: countStyle.color},
                rootPaddingBottom: parseFloat(rootStyle.paddingBottom),
            };
        });
        records.push({width, geometry});
        save();
        expect(geometry.viewportCentreDelta).toBeLessThanOrEqual(1);
        expect(geometry.contained).toBe(true);
        expect(geometry.background).toBe('none');
        expect(geometry.radius).toBe('999px');
        expect(geometry.buttonFontWeight).toBe('600');
        expect(geometry.buttonColour).toBe('rgb(92, 108, 125)');
        expect(geometry.iconColour).toBe(geometry.buttonColour);
        expect(geometry.buttonSize.height).toBeCloseTo(30.4, 1);
        expect(geometry.countType.size).toBe('12.48px');
        expect(geometry.countType.weight).toBe('700');
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
        await page.unroute('**/local/groupimport/**');
    }
    expect(blocked, 'Clear selection must not invoke a business request').toEqual([]);
    save();
});
