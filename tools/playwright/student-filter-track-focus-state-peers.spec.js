const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// Additive R10-07 successor: native global reduced policy is exactly0.001ms.
// Preserve all predecessors; compact Reset appears only for active filters.
// Compare focus widths at equivalent checked states, never Off against On.
test('Ungrouped filter equal-state focus preserves native track geometry', async({page}, info) => {
    test.setTimeout(240000);
    const records = [], errors = [], blocked = [];
    const write = () => fs.writeFileSync(info.outputPath('filter-track-focus-native.json'), JSON.stringify({records, errors, blocked, businessWrites: false}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(15000);
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const names = route.request().postDataJSON().map(call => call.methodname);
        if (names.every(name => name === 'core_message_get_unsent_message')) return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(names.map(() => ({error: false, data: {}})))});
        if (areSafeAjaxReads(names, ['core_get_string', 'core_get_strings', 'core_output_load_template', 'core_output_load_template_with_dependencies', 'core_courseformat_get_state'])) return route.continue();
        blocked.push(names); return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const locale = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const settle = () => page.evaluate(async() => {
        await document.fonts.ready;
        await Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'none'});
            const routes = width > 1024 ? [['participants', 'participant-groups', 'participants'], ['structure', 'structure-groups', 'structure']] : [['groups', 'structure-groups', 'structure']];
            for (const [mode, key, catalogue] of routes) {
                await root.locator(width > 1024 ? `[data-easystud-layout-mode="${mode}"]:visible` : `[data-easystud-mobile-view="${mode}"]:visible`).click();
                await settle();
                const more = root.locator(`[data-easystud-advanced-filters-toggle="${key}"]:visible`);
                const panel = root.locator(`[data-easystud-advanced-filters="${key}"]`);
                if (await more.getAttribute('aria-expanded') !== 'true') await more.click();
                await settle();
                const input = panel.locator(`[data-easystud-catalog-show-ungrouped="${catalogue}"]`);
                const label = input.locator('..');
                const reset = panel.locator(`[data-easystud-reset-catalog-filters="${catalogue}"]`);
                await expect(label).toHaveClass(/easyedu-filter-toggle--track-focus/);
                const original = await input.evaluate(node => ({checked: node.checked, disabled: node.disabled}));
                const read = async state => {
                    await settle();
                    const paint = await label.evaluate(node => {
                        const native = node.querySelector('input'), span = node.querySelector('span');
                        const css = getComputedStyle(node), track = getComputedStyle(span, '::before'), thumb = getComputedStyle(span, '::after'), rect = node.getBoundingClientRect();
                        return {width: rect.width, height: rect.height, layoutHeight: node.offsetHeight, minimumHeight: css.minHeight, labelShadow: css.boxShadow, trackShadow: track.boxShadow, trackOutline: track.outline, trackWidth: track.width, trackHeight: track.height, thumbWidth: thumb.width, focused: document.activeElement === native, focusVisible: native.matches(':focus-visible'), checked: native.checked, disabled: native.disabled, forcedColors: matchMedia('(forced-colors: active)').matches, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, transition: track.transitionDuration};
                    });
                    records.push({width, mode, catalogue, state, paint}); write();
                    // DOMRect after native transforms can differ by0.00003px; layout/CSS remain exactly44.
                    expect(paint.layoutHeight).toBeGreaterThanOrEqual(44); expect(paint.minimumHeight).toBe('44px');
                    expect(paint.height).toBeGreaterThanOrEqual(44 - 1 / 1024);
                    expect(paint.trackWidth).toBe('36px'); expect(paint.trackHeight).toBe('20px'); expect(paint.thumbWidth).toBe('14px');
                    expect(paint.labelShadow).toBe('none');
                    return paint;
                };
                try {
                    await expect(input).not.toBeChecked();
                    const rest = await read('rest-off'); expect(rest.trackShadow).toBe('none');
                    await label.click(); await expect(input).toBeChecked();
                    const mouse = await read('mouse-on'); expect(mouse.focusVisible).toBe(false); expect(mouse.trackShadow).toBe('none');
                    await reset.focus(); await page.keyboard.press('Shift+Tab');
                    const keyboard = await read('keyboard-on'); expect(keyboard.focused).toBe(true); expect(keyboard.focusVisible).toBe(true); expect(keyboard.trackShadow).not.toBe('none'); expect(keyboard.width).toBe(mouse.width);
                    await page.keyboard.press('Space'); await expect(input).not.toBeChecked();
                    const off = await read('keyboard-off'); expect(off.trackShadow).not.toBe('none'); expect(off.width).toBe(rest.width);
                    await page.emulateMedia({forcedColors: 'active'});
                    const forced = await read('forced-keyboard'); expect(forced.forcedColors).toBe(true); expect(forced.trackShadow).toBe('none'); expect(forced.trackOutline).toMatch(/solid/); expect(forced.trackOutline).not.toContain('rgba(0, 0, 0, 0)');
                    await page.emulateMedia({forcedColors: 'none'});
                    await input.evaluate(node => {node.disabled = true; node.blur();});
                    const disabled = await read('disabled-off'); expect(disabled.checked).toBe(false); expect(disabled.trackShadow).toBe('none');
                    await input.evaluate(node => {node.checked = true;}); await read('disabled-on');
                    await page.emulateMedia({reducedMotion: 'reduce'});
                    const reduced = await read('reduced'); expect(reduced.reduced).toBe(true); expect(reduced.transition).toBe('1e-06s');
                } finally {
                    await page.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'none'});
                    await input.evaluate((node, state) => {node.disabled = state.disabled; node.checked = state.checked; node.dispatchEvent(new Event('change', {bubbles: true}));}, original);
                    if (await more.getAttribute('aria-expanded') === 'true') await more.click();
                    await settle();
                }
            }
        }
        expect(records).toHaveLength(32); expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {write();}
});
