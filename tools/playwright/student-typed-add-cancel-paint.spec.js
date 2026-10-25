const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// SM-73 local-supervised. Open/Cancel only, no typed identifiers or Add action.
// Temporary palette/disabled paint is restored; original card Motion untouched.
test('Typed-add Cancel inherits canonical compact button paint in native Moodle', async({page}, info) => {
    test.setTimeout(180000);
    const records = [], blocked = [], errors = [];
    const save = () => fs.writeFileSync(info.outputPath('typed-add-cancel-paint.json'),
        JSON.stringify({records, blocked, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 1600, height: 1100});
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
    const originalStyle = await root.getAttribute('style');
    const settle = async() => page.evaluate(async() => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await Promise.all(document.getAnimations().filter(animation =>
            Number.isFinite(animation.effect.getComputedTiming().endTime))
            .map(animation => animation.finished.catch(() => {})));
    });
    try {
        for (const [family, mode, listSelector, openerSelector, panelSelector, addSelector, cancelSelector] of [
            ['participants-in-group', 'participants', '.local-groupimport-easystud-participant-groups__list',
                '[data-easystud-toggle-group-email]', '[data-easystud-group-email-panel]',
                '[data-easystud-add-group-emails]', '[data-easystud-cancel-group-email]'],
            ['groups-in-grouping', 'structure', '.local-groupimport-easystud-tree__groupings',
                '[data-easystud-toggle-grouping-groups]', '[data-easystud-grouping-groups-panel]',
                '[data-easystud-add-grouping-groups]', '[data-easystud-cancel-grouping-groups]'],
        ]) {
            const switcher = root.locator(`[data-easystud-layout-mode="${mode}"]:visible`);
            await switcher.click(); await expect(switcher).toHaveAttribute('aria-pressed', 'true'); await settle();
            const list = root.locator(listSelector), opener = list.locator(openerSelector + ':visible').first();
            await opener.click();
            const panel = list.locator(panelSelector + ':visible').first();
            await expect(panel).toHaveClass(/is-open/);
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/); await settle();
            const cancel = panel.locator(cancelSelector), add = panel.locator(addSelector);
            const originalDisabled = await cancel.isDisabled();
            const read = async state => {
                await settle();
                const paint = await cancel.evaluate(node => {
                    const css = getComputedStyle(node), box = node.getBoundingClientRect();
                    const token = (property, value) => {
                        const probe = document.createElement('i');node.parentElement.append(probe);
                        probe.style[property] = value;
                        const resolved = getComputedStyle(probe)[property];probe.remove();return resolved;
                    };
                    return {height: box.height, font: css.fontSize, family: css.fontFamily,
                        background: css.backgroundColor, ink: css.color, ring: css.boxShadow,
                        primary: token('color', 'var(--easyedu-primary)'),
                        soft: token('backgroundColor', 'var(--easyedu-primary-soft)'),
                        muted: token('color', 'var(--easyedu-text-muted)'),
                        focusVisible: node.matches(':focus-visible')};
                });
                records.push({family, state, paint});save();
                expect(paint.font).toBe('12px');
                expect(paint.family).toContain('Inter');
                expect(paint.height).toBeGreaterThanOrEqual(26);
                return paint;
            };
            try {
                for (const colour of ['official', 'custom-primary']) {
                    await root.evaluate((node, {style, colour}) => {
                        node.style.cssText = style || '';
                        if (colour === 'custom-primary') {
                            node.style.setProperty('--easyedu-primary', '#7b3f98');
                            node.style.setProperty('--easyedu-primary-chosen', '#7b3f98');
                            node.style.setProperty('--easyedu-primary-soft', 'color-mix(in srgb,#7b3f98 10%,#fff 90%)');
                        }
                    }, {style: originalStyle, colour});
                    await page.mouse.move(1599, 1099);await cancel.evaluate(node => node.blur());
                    const rest = await read(colour + '/rest');expect(rest.ink).toBe(rest.primary);
                    await cancel.hover();const hover = await read(colour + '/hover');
                    expect(hover.background).toBe(hover.soft);expect(hover.ink).toBe(hover.primary);
                    await add.focus();await page.keyboard.press('Tab');
                    await expect(cancel).toBeFocused();
                    const focus = await read(colour + '/keyboard');
                    expect(focus.focusVisible).toBe(true);expect(focus.ring).not.toBe('none');
                    await cancel.evaluate(node => { node.disabled = true; node.blur(); });
                    const disabled = await read(colour + '/disabled');expect(disabled.ink).toBe(disabled.muted);
                    await cancel.evaluate((node, value) => { node.disabled = value; }, originalDisabled);
                }
            } finally {
                await cancel.evaluate((node, value) => { node.disabled = value; }, originalDisabled);
                await root.evaluate((node, value) => {
                    if (value === null) node.removeAttribute('style');else node.setAttribute('style', value);
                }, originalStyle);
                await cancel.click();await expect(panel).toBeHidden();
            }
        }
        expect(records).toHaveLength(16);
        expect(blocked).toEqual([]);expect(errors).toEqual([]);
    } finally {
        await root.evaluate((node, value) => {
            if (value === null) node.removeAttribute('style');else node.setAttribute('style', value);
        }, originalStyle).catch(() => {});save();
    }
});
