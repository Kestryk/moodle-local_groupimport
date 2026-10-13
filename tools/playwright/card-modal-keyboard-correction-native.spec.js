// Local-supervised T041: actual desktop/compact entry, focus, Escape and Cancel.
// EN normal / FR reduced are18 bounded cases, not the complete locale/motion matrix.
const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

test('T041 card dialogs focus and Escape preserve native Cancel on desktop and mobile', async({page}, info) => {
    test.setTimeout(480000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    const target = new URL(process.env.EASYEDU_MOODLE_URL);
    target.searchParams.set('lang', 'en');
    await page.goto(target.href, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}})))
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-easystud');
    try {
        for (const language of ['en', 'fr']) for (const width of [1280, 768, 390]) {
            const reduced = language === 'fr';
            await page.emulateMedia({reducedMotion: reduced ? 'reduce' : 'no-preference'});
            await page.setViewportSize({width, height: 1000});
            target.searchParams.set('lang', language);
            await page.goto(target.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('html')).toHaveAttribute('lang', language);
            expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(reduced);
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            for (const kind of ['participant', 'group', 'grouping']) {
                if (width < 1024) {
                    await root.locator('[data-easystud-mobile-view="' +
                        ({participant: 'participants', group: 'groups', grouping: 'groupings'})[kind] + '"]:visible').click();
                } else {
                    await root.locator('[data-easystud-layout-mode="' +
                        (kind === 'participant' ? 'participants' : 'structure') + '"]:visible').click();
                }
                let opener, entry = 'direct';
                if (kind === 'participant') {
                    opener = root.locator('[data-easystud-open-user]:visible').first();
                    await opener.click();
                } else {
                    const item = root.locator(kind === 'group' ?
                        '[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible' :
                        '[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible').first();
                    const direct = item.locator(':scope > .local-groupimport-easystud-group__header > ' +
                        '[data-easystud-open-advanced-settings]:visible, :scope > .local-groupimport-easystud-grouping__header > ' +
                        '[data-easystud-open-advanced-settings]:visible');
                    if (await direct.count()) {opener = direct; await opener.click();}
                    else {
                        opener = item.locator(':scope > [data-easystud-card-menu]:visible, ' +
                            ':scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]:visible, ' +
                            ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first();
                        await opener.click(); entry = 'context-menu';
                        await root.locator('[data-easystud-context-menu]:visible ' +
                            '[data-easystud-context-action="' + kind + '-open-advanced-settings"]').click();
                    }
                }
                const modal = root.locator(kind === 'participant' ? '[data-easystud-user-modal]' :
                    '[data-easystud-advanced-settings-modal]');
                await expect(modal).toBeVisible();
                const close = modal.locator(kind === 'participant' ? '[data-easystud-close-user-modal]' :
                    '.local-groupimport-easystud-modal__header [data-easystud-close-advanced-settings]');
                const insideAtOpen = await modal.evaluate(node => node.contains(document.activeElement));
                const closeFocused = await close.evaluate(node => node === document.activeElement);
                // Capture diagnostics before assertions, even if this new successor fails.
                records.push({language, reduced, width, kind, entry, insideAtOpen, closeFocused});
                expect(insideAtOpen).toBe(true); await expect(close).toBeFocused();
                if (kind !== 'participant') {
                    await modal.locator('[name="name"]').focus();
                    // Focus is tested without editing any field or submitting its form.
                }
                await page.keyboard.press('Escape'); await expect(modal).toBeHidden();
                await expect(opener).toBeFocused();
                records[records.length - 1].escapeClosed = true;
                records[records.length - 1].returned = true;
            }
        }
        expect(records).toHaveLength(18); expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('card-modal-keyboard-correction-native.json'), JSON.stringify({
            records, errors, blocked, fixtureRequested: false, settingsSaved: false,
            scope: 'Native initial Close focus and Escape/return-focus only; no full Tab trap, visual acceptance or business action.'
        }, null, 2));
    }
});
