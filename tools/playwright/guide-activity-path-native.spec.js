const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// local-supervised: existing groups, actual new path; stop at Cancel, never confirm.
test('Activity path recognizes native grouping selection and destination without course writes', async({page}, info) => {
    test.setTimeout(360000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    const motion = process.env.EASYEDU_GUIDE_REVIEW_MOTION || 'no-preference';
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}}))),
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const workspace = page.locator('#local-groupimport-easystud');
    const checklist = page.locator('[data-easyedu-guide-checklist]');
    const dialog = workspace.locator('[data-easystud-move-modal]');
    const memberships = () => workspace.evaluate(root => Array.from(new Set(
        Array.from(root.querySelectorAll('[data-easystud-tree] [data-easystud-group-id]')).map(group =>
            group.getAttribute('data-easystud-group-id') + ':' +
            (group.closest('[data-easystud-grouping-id]')?.getAttribute('data-easystud-grouping-id') || '0'))
    )).sort());
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: motion});
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const index = await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                if (config.paths['prepare-activity-grouping']?.length !== 5) throw Error('Five installed steps required');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                Guide.destroy(root);
                Guide.init(root, {...config, firstVisit: false, welcomeOffer: false,
                    storageKey: 'activity-path-native-qa-' + width});
                return config.slideIds.indexOf('use-groupings-in-activities');
            }, width);
            const before = await memberships();
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
            await guide.locator('[data-easyedu-guide-start-path="prepare-activity-grouping"]').click();
            await expect(guide).toBeHidden(); await expect(checklist).toBeVisible();
            const grouping = workspace.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').first();
            const toggle = grouping.locator('[data-easystud-collapse-toggle]').first();
            if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
            await toggle.click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="open-grouping"]')).toHaveClass(/is-complete/);
            const selector = workspace.locator('[data-easystud-tree] [data-easystud-group-id]:visible > ' +
                '.local-groupimport-easystud-selector:visible').first();
            const checkbox = selector.locator('input');
            if (await checkbox.isChecked()) await selector.click();
            await selector.click(); await expect(checkbox).toBeChecked();
            await expect(checklist.locator('[data-easyedu-guide-step-id="select-groups"]')).toHaveClass(/is-complete/);
            await expect(dialog).toBeVisible();
            await expect(dialog).toHaveAttribute('data-easystud-move-context', 'group');
            const choice = dialog.locator('.easyedu-searchable-choice');
            const select = dialog.locator('[data-easystud-move-destination]');
            const target = await select.locator('option').evaluateAll(nodes => nodes.map(node => ({
                value: node.value, label: node.textContent.trim(),
            })).find(option => /^[1-9]\d*$/.test(option.value)));
            expect(target).toBeTruthy();
            await choice.locator('.easyedu-searchable-choice__trigger').click();
            await choice.locator('input[type="search"]').fill(target.label);
            await choice.locator('.easyedu-searchable-choice__option:visible').filter({hasText: target.label}).first().click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="choose-grouping"]')).toHaveClass(/is-complete/);
            await expect(checklist.locator('[data-easyedu-guide-step-id="confirm-groups"]')).not.toHaveClass(/is-complete/);
            await expect(dialog.locator('[data-easystud-move-remove-origin]')).not.toBeChecked();
            await dialog.locator('[data-easystud-close-move-modal]').first().click();
            await expect(dialog).toBeHidden();
            expect(await memberships()).toEqual(before);
            await expect(checklist.locator('[data-easyedu-guide-step-id="confirm-groups"]')).not.toHaveClass(/is-complete/);
            await expect(checklist.locator('[data-easyedu-guide-step-id="verify-grouping"]')).not.toHaveClass(/is-complete/);
            rows.push({width, language, motion, completedNativeSteps: 3, cancelPreservesMemberships: true});
            await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                const config = root.easyeduGuideConfig;
                Guide.destroy(root); localStorage.removeItem('activity-path-native-qa-' + width);
                Guide.init(root, {...config, firstVisit: false, welcomeOffer: false});
            }, width);
            // Selection is native UI state, not a course mutation.
            if (await checkbox.isChecked()) await selector.click();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-activity-path-native.json'), JSON.stringify({
            rows, errors, blocked, installedPath: true, businessWriteRequested: false,
            confirmedAssignmentProof: false, sameGroupingFinalNativeProof: false,
        }, null, 2));
    }
});
