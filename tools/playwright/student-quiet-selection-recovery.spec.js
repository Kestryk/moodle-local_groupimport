// SM-52 successor: preserve the historical sticky scenario and test the quiet
// public skin on the actual desktop capsule; responsive proxies stay separate.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Quiet desktop recovery preserves focus geometry clearing and mobile proxy', async ({page}, testInfo) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(15000);
    const records = [], blocked = [], errors = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('quiet-selection-native.json'),
        JSON.stringify({records, blocked, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
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
    const root = page.locator('#local-groupimport-easystud');
    await page.setViewportSize({width: 1600, height: 900});
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()});
        return route.abort('blockedbyclient');
    });
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const settle = () => root.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const frame = root.locator('[data-easystud-clear-selection-frame]');
    const button = frame.locator('[data-easystud-clear-all-selection]');
    const inspect = async (width, state) => {
        await settle();
        const result = await button.evaluate(node => {
            const b = node.getBoundingClientRect(), style = getComputedStyle(node);
            const frame = node.closest('[data-easystud-clear-selection-frame]');
            const f = frame.getBoundingClientRect(), body = document.body.getBoundingClientRect();
            const icon = node.querySelector('.fa'), i = icon.getBoundingClientRect();
            return {width: b.width, height: b.height, background: style.backgroundColor,
                border: style.borderTopColor, shadow: style.boxShadow, color: style.color,
                font: style.fontFamily, fontSize: style.fontSize, weight: style.fontWeight,
                iconColor: getComputedStyle(icon).color, iconCentreDelta: Math.abs(i.top + i.height / 2 - b.top - b.height / 2),
                focusVisible: node.matches(':focus-visible'),
                frame: {width: f.width, height: f.height, centerDelta: Math.abs(f.left + f.width / 2 - body.left - body.width / 2),
                    contained: f.left >= body.left && f.right <= body.right && f.bottom <= document.documentElement.clientHeight},
                reservedBottom: parseFloat(getComputedStyle(node.closest('#local-groupimport-easystud')).paddingBottom)};
        });
        records.push({width, state, result}); save();
        expect(result.frame.centerDelta).toBeLessThanOrEqual(1);
        expect(result.frame.contained).toBe(true);
        expect(result.height).toBeCloseTo(30.4, 1);
        expect(result.fontSize).toBe('12.48px');
        expect(result.weight).toBe('600');
        expect(result.iconColor).toBe(result.color);
        expect(result.iconCentreDelta).toBeLessThanOrEqual(1);
        expect(result.reservedBottom).toBeGreaterThanOrEqual(result.frame.height + 16);
        return result;
    };
    for (const width of [1600, 1100]) {
        await page.setViewportSize({width, height: 900});
        await root.locator('[data-easystud-layout-mode="participants"]:visible').first().click();
        await root.locator('[data-selectable-type="participant"]:visible > .local-groupimport-easystud-selector').first().click();
        await expect(frame).toBeVisible();
        await expect(button).toHaveClass(/easyedu-selection-recovery-action/);
        await page.mouse.move(0, 0);
        const idle = await inspect(width, 'rest');
        expect(idle.background).toBe('rgba(0, 0, 0, 0)');
        expect(idle.border).toBe('rgba(0, 0, 0, 0)');
        await button.hover();
        const hover = await inspect(width, 'hover');
        expect(hover.background).toBe('rgb(247, 249, 252)');
        expect(hover.border).toBe('rgba(0, 0, 0, 0)');
        expect(hover.width).toBe(idle.width);
        await page.mouse.move(0, 0);
        await page.keyboard.press('Tab');
        await button.focus();
        const focus = await inspect(width, 'keyboard-focus');
        expect(focus.focusVisible).toBe(true);
        expect(focus.shadow).not.toBe('none');
        expect(focus.border).toBe('rgb(138, 188, 227)');
        const footer = root.locator('[data-easystud-pagination-position="bottom"]:visible').first();
        if (await footer.count()) {
            await footer.scrollIntoViewIfNeeded();
            const [a, b] = await Promise.all([frame.boundingBox(), footer.boundingBox()]);
            expect(Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))).toBe(0);
        }
        await button.click();
        await expect(frame).toBeHidden();
        await expect(root).not.toHaveClass(/local-groupimport-easystud--has-selection/);
    }
    await page.setViewportSize({width: 390, height: 844});
    await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
    await settle();
    await root.locator('[data-selectable-type="participant"]:visible > .local-groupimport-easystud-selector').first().click();
    const mobile = root.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible');
    await expect(mobile).toBeVisible();
    await expect(mobile).not.toHaveClass(/easyedu-selection-recovery-action/);
    records.push({width: 390, state: 'unchanged-mobile-proxy', classes: await mobile.getAttribute('class')});
    await mobile.click();
    await expect(root).not.toHaveClass(/local-groupimport-easystud--has-selection/);
    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
    save();
});
