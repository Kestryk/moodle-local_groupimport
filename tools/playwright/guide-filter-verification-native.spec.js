const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing participants, filters and selection only; no business writes.
test('Guide filter path verifies matching results and clears selection', async({page}, info) => {
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
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const workspace = page.locator('#local-groupimport-easystud');
    const checklist = page.locator('[data-easyedu-guide-checklist]');
    const highlight = page.locator('[data-easyedu-guide-highlight]');
    const aligned = async target => {
        await expect(target).toBeVisible(); await expect(highlight).toBeVisible();
        await expect.poll(async() => {
            const h = await highlight.boundingBox(), t = await target.boundingBox();
            return h && t ? Math.max(Math.abs(h.x - t.x), Math.abs(h.y - t.y),
                Math.abs(h.width - t.width), Math.abs(h.height - t.height)) : Infinity;
        }).toBeLessThan(2);
    };
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        if (language) await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: motion});
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const index = await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                if (config.paths['verify-with-filters']?.length !== 4) throw Error('Four actual filter milestones required');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                Guide.destroy(root);
                Guide.init(root, {...config, firstVisit: false, storageKey: 'filter-verification-native-qa-' + width});
                return config.slideIds.indexOf('search-filter-select');
            }, width);
            expect(index).toBeGreaterThanOrEqual(0);
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
            await guide.locator('[data-easyedu-guide-start-path="verify-with-filters"]').click();
            await expect(guide).toBeHidden(); await expect(checklist).toBeVisible();
            const toggle = workspace.locator('[data-easystud-advanced-filters-toggle="participants"]:visible');
            await aligned(toggle);
            if (await toggle.getAttribute('aria-expanded') === 'true') {
                await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            }
            await toggle.click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="open-filters"]')).toHaveClass(/is-complete/);
            const search = workspace.locator('[data-easystud-search]:visible'); await aligned(search);
            const name = await workspace.locator('[data-easystud-participant-list] ' +
                '[data-easystud-user]:visible .local-groupimport-easystud-user__name').first().textContent();
            expect(name.trim()).not.toBe(''); await search.fill(name.trim());
            await expect(checklist.locator('[data-easyedu-guide-step-id="apply-filter"]')).toHaveClass(/is-complete/);
            const select = workspace.locator('[data-easystud-guide-result-scope="participants"] ' +
                '[data-easystud-select-results]:visible').first();
            await aligned(select); await select.click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="select-results"]')).toHaveClass(/is-complete/);
            const scope = await workspace.evaluate(root => {
                const items = Array.from(root.querySelector('[data-easystud-participant-list]').children)
                    .filter(node => node.matches('[data-easystud-user]'));
                return {matching: items.filter(node => !node.hasAttribute('data-easystud-filter-hidden')).length,
                    selected: items.filter(node => node.classList.contains('is-selected')).length,
                    outside: items.filter(node => node.hasAttribute('data-easystud-filter-hidden') &&
                        node.classList.contains('is-selected')).length};
            });
            expect(scope.matching).toBeGreaterThan(0); expect(scope.selected).toBe(scope.matching); expect(scope.outside).toBe(0);
            const clear = workspace.locator('[data-easystud-clear-all-selection]:visible, ' +
                '[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();
            await aligned(clear); await clear.click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="clear-selection"]')).toHaveClass(/is-complete/);
            await expect(workspace.locator('[data-easystud-participant-list] [data-easystud-user].is-selected')).toHaveCount(0);
            await checklist.locator('[data-easyedu-guide-checklist-close]').click();
            await expect(checklist).toBeHidden(); await search.fill('');
            rows.push({width, language: await page.locator('html').getAttribute('lang'), motion, scope,
                fourMilestones: true, allTargetsAligned: true, membershipsUnchanged: true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-filter-verification-native.json'), JSON.stringify({rows, errors, blocked,
            fixtureRequested: false, businessWriteRequested: false}, null, 2));
    }
});
