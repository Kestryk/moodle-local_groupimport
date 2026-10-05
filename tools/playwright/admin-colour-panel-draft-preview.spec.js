const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// SM-58 local-supervised successor. Native settings are never saved. The
// historical SM-46 scenario remains pinned; this gate adds exact draft paint.
test('Administration enlarged colour draft preview preserves native settings', async({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [], blocked = [], bootstrapReads = [], mockedDraftReads = [];
    const rgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
    page.on('pageerror', error => errors.push(error.message));
    const url = new URL('/admin/settings.php?section=local_groupimport', process.env.EASYEDU_MOODLE_URL);
    await page.goto(url.href);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u => !u.pathname.includes('/login/'));
    }
    await page.route('**/*', route => {
        const request = route.request();
        if (request.method() !== 'POST') return route.continue();
        const pathname = new URL(request.url()).pathname;
        let methods = [];
        try {
            const body = request.postDataJSON();
            if (Array.isArray(body)) methods = body.map(call => call.methodname);
        } catch (_) { /* All unknown writes remain denied. */ }
        if (pathname === '/lib/ajax/service.php' && methods.length &&
                methods.every(method => method === 'core_message_get_unsent_message')) {
            // This session getter consumes its value: preserve any real draft.
            mockedDraftReads.push(...methods);
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const allowed = new Set(['core_get_string', 'core_get_strings',
            'core_output_load_template', 'core_output_load_template_with_dependencies']);
        if (pathname === '/lib/ajax/service.php' && methods.length && methods.every(method => allowed.has(method))) {
            bootstrapReads.push(...methods);
            return route.continue();
        }
        blocked.push({pathname, methods});
        return route.abort();
    });
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.goto(url.href);
            await expect(page.locator('body')).not.toHaveClass(/local-groupimport-admin-settings-page--loading/, {timeout: 60000});
            await expect(page.locator('.easyedu-color-picker__trigger')).toHaveCount(7);
            await page.evaluate(() => document.fonts.ready);
            const names = await page.locator('#adminsettings [name]').evaluateAll(ns => ns.map(n => n.name));
            for (let index = 0; index < 7; index++) {
                const control = page.locator('[data-easyedu-color-picker]').nth(index);
                const trigger = control.locator('.easyedu-color-picker__trigger');
                const hex = control.locator('.easyedu-color-picker__hex');
                const initial = await hex.inputValue();
                await trigger.click();
                const dialog = page.locator('dialog[open]');
                const preview = dialog.locator('.easyedu-color-panel__preview');
                const draft = dialog.locator('input[type=text]');
                await expect(draft).toBeFocused();
                await expect(preview).toHaveCSS('background-color', rgb(initial));
                const measure = await dialog.evaluate(n => {
                    const rect = n.getBoundingClientRect(), sample = n.querySelector('.easyedu-color-panel__preview');
                    const s = sample.getBoundingClientRect(), title = n.querySelector('h2').getBoundingClientRect();
                    const header = n.querySelector('.easyedu-color-panel__header').getBoundingClientRect();
                    const probe = document.createElement('div');
                    probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none';
                    document.body.appendChild(probe);
                    const viewport = probe.getBoundingClientRect().width; probe.remove();
                    return {width: rect.width, x: rect.x, right: rect.right, viewport,
                        overflow: n.scrollWidth - n.clientWidth, sample: {width: s.width, height: s.height},
                        gap: s.left - title.right, centerDelta: Math.abs((s.top + s.bottom - header.top - header.bottom) / 2),
                        title: getComputedStyle(n.querySelector('h2')).fontSize,
                        transition: getComputedStyle(sample).transitionDuration,
                        policy: n.parentElement.dataset.easyeduMotionPolicy || 'normal',
                        actions: [...n.querySelectorAll('.easyedu-dialog-actions button')].map(b => ({
                            height: b.getBoundingClientRect().height, font: getComputedStyle(b).fontSize}))};
                });
                records.push({width, index, measure});
                expect(measure.sample.width).toBe(80); expect(measure.sample.height).toBe(40);
                expect(measure.gap).toBeGreaterThanOrEqual(11.9); expect(measure.centerDelta).toBeLessThan(0.1);
                expect(measure.width).toBeCloseTo(Math.min(352, measure.viewport - 32), 1);
                expect(measure.x).toBeGreaterThanOrEqual(16);
                expect(measure.right).toBeLessThanOrEqual(measure.viewport - 16); expect(measure.overflow).toBe(0);
                expect(measure.title).toBe('16px');
                expect(measure.actions[0].height).toBeCloseTo(measure.actions[1].height, 2);
                expect(measure.actions[0].height).toBeCloseTo(37.6, 1); expect(measure.actions[0].font).toBe('14.08px');
                if (measure.policy === 'disabled') expect(measure.transition).toBe('0s');
                else expect(measure.transition).not.toBe('0s');
                if (index === 0) {
                    await draft.fill('#123456'); await expect(preview).toHaveCSS('background-color', rgb('#123456'));
                    expect(await hex.inputValue()).toBe(initial);
                    await draft.fill('#bad'); await expect(dialog.locator('.easyedu-button')).toBeDisabled();
                    await expect(preview).toHaveCSS('background-color', rgb('#123456'));
                    await expect(dialog.locator('[role=status]')).toBeVisible();
                    await dialog.locator('.easyedu-color-panel__preset').nth(1).click();
                    await expect(preview).toHaveCSS('background-color', rgb('#198754'));
                    await expect(dialog.locator('.easyedu-color-panel__preset').nth(1)).toHaveAttribute('aria-pressed', 'true');
                    await page.screenshot({path: testInfo.outputPath(`colour-draft-preview-${width}.png`)});
                }
                await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
                expect(await hex.inputValue()).toBe(initial);
                if (index === 0) {
                    await trigger.click(); await draft.fill('#FADEAA'); await dialog.locator('.easyedu-button').click();
                    expect(await hex.inputValue()).toBe('#FADEAA'); await expect(trigger).toBeFocused();
                    // Revert only the unsaved input draft; no settings Save.
                    await hex.fill(initial); await hex.dispatchEvent('change');
                    await page.emulateMedia({reducedMotion: 'reduce'}); await trigger.click();
                    await expect(preview).toHaveCSS('transition-duration', '0s');
                    await expect(dialog.locator('.easyedu-color-panel__preset').first()).toHaveCSS('transition-duration', '0s');
                    await expect(dialog).toHaveCSS('animation-name', 'none');
                    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
                    await page.emulateMedia({reducedMotion: 'no-preference'});
                }
            }
            expect(await page.locator('#adminsettings [name]').evaluateAll(ns => ns.map(n => n.name))).toEqual(names);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('admin-colour-draft-preview.json'), JSON.stringify({
            records, errors, blocked, bootstrapReads, mockedDraftReads, saveAttempted: false, fixturesChanged: false,
        }, null, 2));
    }
});
