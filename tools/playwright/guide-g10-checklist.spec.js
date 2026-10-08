const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised, presentation-only native milestones. A bounded path starts
// at selection so this test never creates a group or confirms a transfer.
test('Guide G10 checklist native selection and destination highlights', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil:'commit',timeout:60000});
        if (page.url() !== process.env.EASYEDU_MOODLE_URL) {
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
        }
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status:200,contentType:'application/json',
                body:JSON.stringify(methods.map(() => ({error:false,data:{}})))});
        }
        const reads = new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        for (const width of [1280,390]) {
            await page.setViewportSize({width,height:900});
            await page.emulateMedia({reducedMotion:'no-preference'});
            await page.evaluate(async() => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const config = root.easyeduGuideConfig;
                // Preserve actual native targets/events; do not fabricate Create
                // completion or touch the course. Ephemeral owned QA profile only.
                const steps = config.paths['practice-membership'].slice(2,5).map((step,index,array) => ({
                    ...step, requiresStep:index ? array[index-1].id : null
                }));
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);
                Guide.init(root, {...config,firstVisit:false,storageKey:'g10-native-checklist-presentation',
                    paths:{...config.paths,'practice-membership':steps}});
            });
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="1"]').click();
            await guide.locator('[data-easyedu-guide-start-path="practice-membership"]').click();
            await expect(guide).toBeHidden();
            const panel = page.locator('[data-easyedu-guide-checklist]');
            await expect(panel).toBeVisible();
            await page.locator('[data-easystud-layout-mode="participants"]').click();
            const selector = page.locator('[data-easystud-participant-list] [data-easystud-user]:visible .local-groupimport-easystud-selector').first();
            const checkbox = selector.locator('input');
            await selector.click();
            await expect(checkbox).toBeChecked();
            await expect(panel.locator('[data-easyedu-guide-step-id="select-participant"]')).toHaveClass(/is-complete/);
            const highlight = page.locator('[data-easyedu-guide-highlight]');
            await expect(highlight).toBeVisible();
            const move = page.locator('[data-easystud-move-selected-participants]:visible, ' +
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]:visible').first();
            const activeMove = panel.locator('[data-easyedu-guide-step-id="open-move"]');
            await expect(activeMove).toHaveClass(/is-active/);
            await move.click();
            const dialog = page.locator('[data-easystud-move-modal]');
            await expect(dialog).toBeVisible();
            await expect(panel.locator('[data-easyedu-guide-step-id="open-move"]')).toHaveClass(/is-complete/);
            await expect(panel.locator('[data-easyedu-guide-step-id="choose-destination"]')).toHaveClass(/is-active/);
            await expect(highlight).toBeVisible();
            const destination = dialog.locator('.easyedu-searchable-choice');
            await expect(destination).toBeVisible();
            await expect.poll(async() => {
                const h = await highlight.boundingBox(), d = await destination.boundingBox();
                return h && d ? Math.max(Math.abs(h.x-d.x),Math.abs(h.y-d.y),Math.abs(h.width-d.width),Math.abs(h.height-d.height)) : Infinity;
            },{timeout:15000}).toBeLessThan(2);
            await dialog.locator('[data-easystud-close-move-modal]').first().click();
            if (await checkbox.isChecked()) await selector.click();
            await panel.locator('[data-easyedu-guide-checklist-close]').click();
            await expect(panel).toBeHidden();
            rows.push({width,nativeSelection:true,nativeMoveOpenedAndCancelled:true,destinationHighlightAligned:true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g10-checklist-result.json'),JSON.stringify({rows,errors,blocked,
            scope:'Presentation path begins at real selection; full Create/Confirm curriculum not exercised',
            fixtureRequested:false,businessTransactionConfirmed:false},null,2));
    }
});
