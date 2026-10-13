const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// local-supervised: audit the existing Group workflow before installing its Guide successor.
// Existing data only; native selection, destination search and Cancel. Never confirm.
test('Activity grouping uses native group destination and preserves memberships on Cancel', async({page}, info) => {
    test.setTimeout(360000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    const motion = process.env.EASYEDU_GUIDE_REVIEW_MOTION || 'no-preference';
    expect(['no-preference', 'reduce']).toContain(motion);
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
    const dialog = workspace.locator('[data-easystud-move-modal]');
    const memberships = async() => workspace.evaluate(root => Array.from(new Set(
        Array.from(root.querySelectorAll('[data-easystud-tree] [data-easystud-group-id]'))
            .map(group => [group.getAttribute('data-easystud-group-id'),
                group.closest('[data-easystud-grouping-id]')?.getAttribute('data-easystud-grouping-id') || '0'].join(':'))
    )).sort());
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        if (language) await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: motion});
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
        await page.evaluate(async() => {
            const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root);
            Guide.init(root, {...config, firstVisit: false, welcomeOffer: false,
                storageKey: 'activity-grouping-authority-native-qa'});
        });
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const view = workspace.locator(width <= 1024 ?
                '[data-easystud-mobile-view="groups"]:visible' : '[data-easystud-layout-mode="structure"]:visible').first();
            await expect(view).toBeVisible();
            if (await view.getAttribute('aria-pressed') !== 'true') await view.click();
            const before = await memberships();
            expect(before.length).toBeGreaterThan(0);
            const selector = workspace.locator('[data-easystud-tree] [data-easystud-group-id]:visible > ' +
                '.local-groupimport-easystud-selector:visible').first();
            await expect(selector).toBeVisible();
            const checkbox = selector.locator('input');
            if (await checkbox.isChecked()) await selector.click();
            await selector.click(); await expect(checkbox).toBeChecked();
            const action = workspace.locator('[data-easystud-move-selected-groups]:visible, ' +
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-groups]"]:visible').first();
            await expect(action).toBeEnabled(); await action.click();
            await expect(dialog).toBeVisible(); await expect(dialog).toHaveAttribute('data-easystud-move-context', 'group');
            const choice = dialog.locator('.easyedu-searchable-choice'); await expect(choice).toBeVisible();
            const select = dialog.locator('[data-easystud-move-destination]');
            const options = await select.locator('option').evaluateAll(nodes => nodes.map(node => ({
                value: node.value, label: node.textContent.trim(), disabled: node.disabled,
            })));
            expect(options.some(option => option.value === '0')).toBe(true);
            const target = options.find(option => /^[1-9]\d*$/.test(option.value) && !option.disabled);
            expect(target, 'Existing grouping required; no fixture creation').toBeTruthy();
            await choice.locator('.easyedu-searchable-choice__trigger').click();
            const search = choice.locator('input[type="search"]');
            await expect(search).toBeVisible(); await search.fill(target.label);
            await choice.locator('.easyedu-searchable-choice__option:visible').filter({hasText: target.label}).first().click();
            await expect(select).toHaveValue(target.value);
            const remove = dialog.locator('[data-easystud-move-remove-origin]');
            await expect(remove).not.toBeChecked();
            await expect(dialog.locator('[data-easystud-confirm-move]')).toBeEnabled();
            expect(await memberships()).toEqual(before);
            await dialog.locator('[data-easystud-close-move-modal]').first().click();
            await expect(dialog).toBeHidden();
            await expect(dialog).not.toHaveAttribute('data-easystud-move-context', /.+/);
            expect(await memberships()).toEqual(before);
            await expect(checkbox).toBeChecked(); await selector.click(); await expect(checkbox).not.toBeChecked();
            rows.push({width, language: await page.locator('html').getAttribute('lang'), motion,
                nativeGroupSelection: true, typedGroupDialog: true, destinationSearch: true,
                positiveDestination: true, removeOriginalDefault: false, cancelRetainsMemberships: true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-activity-grouping-authority-native.json'), JSON.stringify({
            rows, errors, blocked, fixtureRequested: false, businessWriteRequested: false,
            installedSuccessorPath: false, confirmationProof: false,
        }, null, 2));
    }
});
