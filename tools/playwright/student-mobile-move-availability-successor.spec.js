const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing selections, real view controls, Move-modal open/Cancel.
// No destination Move, settings Save, fixtures, real message draft or Guide.
test('Compact Participant Move remains available across desktop structure preference', async({page}, info) => {
    test.setTimeout(240000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], errors = [], blocked = [];
    const save = () => fs.writeFileSync(info.outputPath('mobile-move-availability.json'),
        JSON.stringify({records, errors, blocked}, null, 2));
    const root = page.locator('#local-groupimport-easystud');
    page.on('pageerror', error => errors.push(error.message));
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
        blocked.push({scope: 'core', methods}); return route.abort('blockedbyclient');
    });
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()}); return route.abort('blockedbyclient');
    });
    const settle = async() => root.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations))
            .map(animation => animation.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    try {
        await page.setViewportSize({width: 1600, height: 1100});
        await page.emulateMedia({reducedMotion: 'no-preference'});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter: true});
            await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await settle();
        const source = root.locator('[data-easystud-move-selected-participants]').first();
        const selectedIds = () => root.locator('[data-easystud-participant-list] [data-easystud-user].is-selected')
            .evaluateAll(nodes => nodes.map(node => node.getAttribute('data-user-id')));
        for (const width of [768, 390, 320]) {
            await page.setViewportSize({width: 1600, height: 1100});
            await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
            await settle();
            expect(await source.evaluate(node => node.hidden)).toBe(true);
            await page.setViewportSize({width, height: 1100});
            await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
            await settle();
            expect(await source.evaluate(node => node.hidden)).toBe(false);
            expect(await root.evaluate(node => node.easystudDesktopMode)).toBe('structure');
            const tray = root.locator('[data-easystud-mobile-actions]');
            await expect(tray).toBeHidden();
            const cards = root.locator('[data-easystud-participant-list] [data-easystud-user]:visible');
            for (let index = 0; index < 2; index++) {
                await cards.nth(index).locator(':scope > .local-groupimport-easystud-selector').click();
                await settle();
                const move = tray.locator('[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]');
                await expect(move).toBeVisible(); await expect(move).toBeEnabled();
                const before = await selectedIds(); expect(before).toHaveLength(index + 1);
                await move.click();
                const dialog = root.locator('[data-easystud-move-modal]');
                await expect(dialog).toBeVisible(); await settle();
                await dialog.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
                await expect(dialog).toBeHidden(); await expect(move).toBeFocused();
                expect(await selectedIds()).toEqual(before);
                records.push({width, selected: index + 1, stickyMoveAvailable: true, cancelFocusRestored: true}); save();
            }
            await tray.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]').click();
            await expect(tray).toBeHidden();
            await page.setViewportSize({width: 1600, height: 1100}); await settle();
            await expect(root.locator('[data-easystud-layout-mode="structure"]')).toHaveAttribute('aria-pressed', 'true');
            expect(await source.evaluate(node => node.hidden)).toBe(true);
            await root.locator('[data-easystud-layout-mode="participants"]:visible').click(); await settle();
            expect(await source.evaluate(node => node.hidden)).toBe(false);
            records.push({width, desktopPreferenceRestored: true, desktopParticipantsMoveRestored: true}); save();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally { save(); }
});
