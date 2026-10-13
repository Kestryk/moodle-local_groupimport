const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// local-supervised: canonical storage API only, ephemeral QA config/key and existing IDs.
// No new activity path, business completion, course mutation or actual browser-reload proof.
test('Guide context survives reinitialization and rejects writes after native Reset', async({page}, info) => {
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
            status: 200, contentType: 'application/json', body: JSON.stringify(methods.map(() => ({error: false, data: {}}))),
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const checklist = page.locator('[data-easyedu-guide-checklist]');
    const open = async() => {
        if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
        }
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
    };
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: motion});
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const index = await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                const key = 'guide-context-native-qa-' + width;
                Guide.destroy(root);
                // Seed only this temporary QA key, never real reading/progress.
                localStorage.setItem(key + '.checklist', JSON.stringify({
                    completed: {'create-grouping': ['create-grouping']},
                    pathContexts: {'other-qa': {destinationId: '99', groupIds: ['88']}},
                }));
                const qa = {...config, storageKey: key, firstVisit: false, welcomeOffer: false,
                    pathContextFields: {'verify-with-filters': {destinationId: 'id', groupIds: 'ids'}}};
                Guide.init(root, qa);
                return config.slideIds.indexOf('search-filter-select');
            }, width);
            await open();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
            await modal.locator('[data-easyedu-guide-start-path="verify-with-filters"]').click();
            await expect(modal).toBeHidden(); await expect(checklist).toBeVisible();
            const stored = await page.evaluate(async() => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                const group = document.querySelector('[data-easystud-tree] [data-easystud-group-id]');
                const grouping = document.querySelector('[data-easystud-grouping-id]');
                if (!group || !grouping) throw Error('Existing IDs required; no fixture creation');
                const data = {destinationId: grouping.dataset.easystudGroupingId, groupIds: [group.dataset.easystudGroupId]};
                root.qaPathContextToken = Guide.getPathContextToken(root, 'verify-with-filters');
                const result = Guide.setPathContext(root, 'verify-with-filters', data, root.qaPathContextToken);
                const config = root.easyeduGuideConfig;
                Guide.destroy(root); Guide.init(root, config);
                const restored = Guide.getPathContext(root, 'verify-with-filters');
                const staleRejected = !Guide.setPathContext(root, 'verify-with-filters', data, root.qaPathContextToken);
                return {result, restored, data, staleRejected};
            });
            expect(stored.result).toBe(true); expect(stored.restored).toEqual(stored.data); expect(stored.staleRejected).toBe(true);
            await expect(checklist).toBeHidden();
            const resume = page.locator('[data-easyedu-guide-resume]'); await expect(resume).toBeVisible();
            await resume.locator('[data-easyedu-guide-resume-path]').click(); await expect(checklist).toBeVisible();
            await page.evaluate(async() => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                root.qaPathContextToken = Guide.getPathContextToken(root, 'verify-with-filters');
            });
            await open(); await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
            await modal.locator('[data-easyedu-guide-reset-path="verify-with-filters"]').click();
            const reset = await page.evaluate(async() => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                const state = JSON.parse(localStorage.getItem(root.easyeduGuideConfig.storageKey + '.checklist'));
                return {context: Guide.getPathContext(root, 'verify-with-filters'),
                    lateAccepted: Guide.setPathContext(root, 'verify-with-filters',
                        {destinationId: '31', groupIds: ['10']}, root.qaPathContextToken),
                    completed: state.completed, other: state.pathContexts['other-qa'], path: state.path};
            });
            expect(reset.context).toBeNull(); expect(reset.lateAccepted).toBe(false); expect(reset.path).toBeNull();
            expect(reset.completed['create-grouping']).toEqual(['create-grouping']);
            expect(reset.completed['verify-with-filters']).toEqual([]);
            expect(reset.other).toEqual({destinationId: '99', groupIds: ['88']});
            await modal.locator('[data-easyedu-guide-close]').click(); await expect(modal).toBeHidden();
            rows.push({width, language: await page.locator('html').getAttribute('lang'), motion,
                qaContextStored: true, reinitPreservesContext: true, noAutomaticChecklist: true,
                nativeResume: true, nativeResetClearsOwnContextOnly: true, obsoleteTokenRejected: true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-path-context-native.json'), JSON.stringify({rows, errors, blocked,
            fixtureRequested: false, businessWriteRequested: false, realUserStorageTouched: false,
            actualPageReloadTested: false, activityPathInstalled: false}, null, 2));
    }
});
