// Local-supervised T041 diagnosis: real entry, focus, Escape and Cancel only.
// No business writes, settings changes, injected modal or Guide progression.
const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

test('T041 records native card modal keyboard baseline with safe core reads', async({page}, info) => {
    test.setTimeout(180000);
    const records = [], blocked = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 1280, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
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
        for (const kind of ['participant', 'group', 'grouping']) {
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', 'en');
            await root.locator('[data-easystud-layout-mode="' +
                (kind === 'participant' ? 'participants' : 'structure') + '"]:visible').click();
            const opener = kind === 'participant' ? root.locator('[data-easystud-open-user]:visible').first() :
                root.locator(kind === 'group' ? '[data-easystud-structure-groups]' : '[data-easystud-tree]')
                    .locator('[data-easystud-open-advanced-settings][data-easystud-advanced-target="' + kind + '"]:visible').first();
            await opener.click();
            const modal = root.locator(kind === 'participant' ? '[data-easystud-user-modal]' :
                '[data-easystud-advanced-settings-modal]');
            await expect(modal).toBeVisible();
            const insideAtOpen = await modal.evaluate(node => node.contains(document.activeElement));
            await page.keyboard.press('Escape');
            await page.waitForTimeout(450);
            const escapeClosed = !await modal.isVisible();
            if (!escapeClosed) await modal.locator(kind === 'participant' ? '[data-easystud-close-user-modal]' :
                '.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]').click();
            await expect(modal).toBeHidden();
            const returned = await opener.evaluate(node => node === document.activeElement);
            records.push({kind, insideAtOpen, escapeClosed, returned, width: 1280});
        }
        expect(blocked).toEqual([]); expect(errors).toEqual([]);
        // Diagnosis is deliberately successful when it records the defect.
        expect(records).toHaveLength(3);
    } finally {
        fs.writeFileSync(info.outputPath('card-modal-keyboard-baseline-safe-reads.json'), JSON.stringify({
            records, errors, blocked, fixtureRequested: false, settingsSaved: false,
            scope: 'Native diagnostic, not a corrected keyboard claim or human acceptance.'
        }, null, 2));
    }
});
