const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// SM-65 local-supervised diagnostic. Actual controls and native cascade only;
// client-side filtering/Reset and temporary disabled states, no product POST.
// Programmatic focus is recorded distinctly from real sequential Tab entry.
test('Ungrouped filter focus audit records actual mouse keyboard and target bounds', async({page}, info) => {
    test.setTimeout(180000);
    const records = [], blocked = [], errors = [];
    const write = () => fs.writeFileSync(info.outputPath('filter-focus-audit.json'),
        JSON.stringify({records, blocked, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()});
        return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(method => reads.has(method))) return route.continue();
        blocked.push({scope: 'core', methods});
        return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const settle = async() => page.evaluate(async() => {
        await Promise.all(document.getAnimations().filter(animation =>
            Number.isFinite(animation.effect.getComputedTiming().endTime))
            .map(animation => animation.finished.catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            const views = width > 1024 ?
                [['participants', 'participant-groups', 'participants'], ['structure', 'structure-groups', 'structure']] :
                [['groups', 'structure-groups', 'structure']];
            for (const [mode, key, catalogue] of views) {
                await root.locator(width > 1024 ? `[data-easystud-layout-mode="${mode}"]:visible` :
                    `[data-easystud-mobile-view="${mode}"]:visible`).click();
                const more = root.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
                const panel = root.locator(`[data-easystud-advanced-filters="${key}"]`);
                if (await more.getAttribute('aria-expanded') !== 'true') await more.click();
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                const input = panel.locator(`[data-easystud-catalog-show-ungrouped="${catalogue}"]`);
                const label = input.locator('..');
                const reset = panel.locator(`[data-easystud-reset-catalog-filters="${catalogue}"]`);
                const originalDisabled = await input.isDisabled();
                const read = async state => {
                    await settle();
                    const paint = await label.evaluate(node => {
                        const native = node.querySelector('input'), span = node.querySelector('span');
                        const css = getComputedStyle(node), track = getComputedStyle(span, '::before');
                        const box = node.getBoundingClientRect();
                        return {labelWidth: box.width, labelHeight: box.height,
                            labelShadow: css.boxShadow, labelOutline: css.outline,
                            trackWidth: track.width, trackHeight: track.height, trackShadow: track.boxShadow,
                            trackOutline: track.outline, checked: native.checked, disabled: native.disabled,
                            tabindex: native.tabIndex, focused: document.activeElement === native,
                            focusVisible: native.matches(':focus-visible'),
                            trackOpacity: getComputedStyle(span).opacity};
                    });
                    records.push({width, mode, catalogue, state, paint}); write();
                    expect(paint.labelHeight).toBeGreaterThanOrEqual(44);
                    expect(paint.trackWidth).toBe('36px');
                    expect(paint.trackHeight).toBe('20px');
                    return paint;
                };
                try {
                    await expect(input).not.toBeChecked();
                    await read('rest-off');
                    await label.click();
                    await expect(input).toBeChecked();
                    await read('mouse-on');
                    // Reset comes immediately after the native checkbox. A real
                    // Shift+Tab verifies sequential reachability, not input.focus().
                    await reset.focus();
                    await page.keyboard.press('Shift+Tab');
                    const keyboard = await read('keyboard-entry-on');
                    expect(keyboard.focused).toBe(true);
                    expect(keyboard.focusVisible).toBe(true);
                    await page.keyboard.press('Space');
                    await expect(input).not.toBeChecked();
                    await read('keyboard-off');
                    await input.evaluate(node => { node.disabled = true; node.blur(); });
                    await read('disabled-off');
                    await input.evaluate(node => { node.checked = true; });
                    await read('disabled-on');
                } finally {
                    await input.evaluate((node, disabled) => { node.disabled = disabled; node.checked = false;
                        node.dispatchEvent(new Event('change', {bubbles: true})); }, originalDisabled);
                    if (await reset.isVisible()) await reset.click();
                    if (await more.getAttribute('aria-expanded') === 'true') await more.click();
                    await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                }
            }
        }
        expect(blocked).toEqual([]);
        expect(errors).toEqual([]);
    } finally { write(); }
});
