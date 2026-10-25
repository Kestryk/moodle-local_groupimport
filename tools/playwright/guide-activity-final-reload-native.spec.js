const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing memberships and artificial QA prerequisites; no confirmed assignment proof.
test('Activity final context survives page reload and requires explicit Resume without course writes', async({page}, info) => {
    test.setTimeout(360000);
    const rows = [], errors = [], blocked = [], diagnostic = [];
    const aligned = async target => {
        const highlight = page.locator('[data-easyedu-guide-highlight]');
        await expect(target).toBeVisible(); await expect(highlight).toBeVisible();
        await expect.poll(async() => {
            const h = await highlight.boundingBox(), t = await target.boundingBox();
            return h && t ? Math.max(Math.abs(h.x - t.x), Math.abs(h.y - t.y),
                Math.abs(h.width - t.width), Math.abs(h.height - t.height)) : Infinity;
        }).toBeLessThan(2);
    };
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    const motion = process.env.EASYEDU_GUIDE_REVIEW_MOTION || 'no-preference';
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 390, height: 1000});
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
        const memberships = () => workspace.evaluate(root => Array.from(new Set(
        Array.from(root.querySelectorAll('[data-easystud-tree] [data-easystud-group-id]')).map(group =>
            group.getAttribute('data-easystud-group-id') + ':' +
            (group.closest('[data-easystud-grouping-id]')?.getAttribute('data-easystud-grouping-id') || '0'))
    )).sort());
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: motion});
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
        for (const width of [390, 768, 1280]) {
            await page.setViewportSize({width, height: 1000});
            const setup = await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]'),
                    config = root.easyeduGuideConfig || root.activityPathQaConfig;
                root.activityPathQaConfig = config;
                const groupingNodes = Array.from(document.querySelectorAll(
                    '[data-easystud-tree] [data-easystud-grouping-id]'));
                const destination = groupingNodes.find(node => node.querySelector('[data-easystud-group-id]'));
                const other = groupingNodes.find(node => node !== destination &&
                    node.dataset.easystudGroupingId !== destination?.dataset.easystudGroupingId);
                if (!destination || !other) throw Error('Two existing groupings and assigned groups required; no fixtures');
                const ids = Array.from(new Set(Array.from(destination.querySelectorAll('[data-easystud-group-id]'))
                    .filter(node => node.closest('[data-easystud-grouping-id]') === destination)
                    .map(node => node.dataset.easystudGroupId)));
                if (!ids.length) throw Error('Existing membership required');
                const data = {destinationId: destination.dataset.easystudGroupingId, groupIds: ids};
                const missingId = '999999999';
                if (document.querySelector('[data-easystud-group-id="' + missingId + '"]')) throw Error('QA missing ID exists');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                const key = 'activity-final-reload-qa-' + width;
                Guide.destroy(root);
                // Isolate final recognition only: these four prerequisites are artificial QA history,
                // NOT evidence of a native confirmed assignment. Never write the real user's key.
                localStorage.setItem(key + '.checklist', JSON.stringify({
                    completed: {'prepare-activity-grouping': ['open-grouping', 'select-groups',
                        'choose-grouping', 'confirm-groups']},
                    pathContexts: {'prepare-activity-grouping': {...data, groupIds: [...ids, missingId]}},
                }));
                Guide.init(root, {...config, firstVisit: false, welcomeOffer: false, storageKey: key});
                return {index: config.slideIds.indexOf('use-groupings-in-activities'), data,
                    otherId: other.dataset.easystudGroupingId, missingId};
            }, width);
            const before = await memberships();
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="' + setup.index + '"]').click();
            await guide.locator('[data-easyedu-guide-start-path="prepare-activity-grouping"]').click();
            await expect(guide).toBeHidden(); await expect(checklist).toBeVisible();
            const destination = workspace.locator('[data-easystud-tree] [data-easystud-grouping-id="' +
                setup.data.destinationId + '"]').first();
            const toggle = destination.locator('[data-easystud-collapse-toggle]').first();
            const finalStep = checklist.locator('[data-easyedu-guide-step-id="verify-grouping"]');
            await aligned(toggle);
            await expect(finalStep).not.toHaveClass(/is-complete/);
            const disclose = async grouping => {
                const control = grouping.locator('[data-easystud-collapse-toggle]').first();
                const children = grouping.locator('.local-groupimport-easystud-tree__children').first();
                if (await control.getAttribute('aria-expanded') === 'true') {
                    await control.click(); await expect(children).toBeHidden();
                }
                await control.click(); await expect(children).toBeVisible();
                await expect.poll(() => children.evaluate(node =>
                    !node.classList.contains('is-easyedu-disclosing'))).toBe(true);
            };
            await disclose(destination);
            await expect(finalStep).not.toHaveClass(/is-complete/);
            const contextAccepted = await page.evaluate(async data => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                return Guide.setPathContext(root, 'prepare-activity-grouping', data,
                    Guide.getPathContextToken(root, 'prepare-activity-grouping'));
            }, setup.data);
            expect(contextAccepted).toBe(true);
            // Real navigation destroys the document; canonical persistence is read under
            // the same isolated QA key after native initialization, without reseeding it.
            await page.reload({waitUntil: 'domcontentloaded'});
            await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
            const restored = await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                root.activityPathQaConfig = config;
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                Guide.destroy(root);
                Guide.init(root, {...config, firstVisit: false, welcomeOffer: false,
                    storageKey: 'activity-final-reload-qa-' + width});
                return Guide.getPathContext(root, 'prepare-activity-grouping');
            }, width);
            expect(restored).toEqual(setup.data);
            await expect(checklist).toBeHidden();
            const resume = page.locator('[data-easyedu-guide-resume]');
            await expect(resume).toBeVisible();
            await resume.locator('[data-easyedu-guide-resume-path]').click();
            await expect(checklist).toBeVisible();
            await aligned(toggle);
            await expect(finalStep).not.toHaveClass(/is-complete/);
            // Correct context alone and an unrelated real disclosure do not complete verification.
            await expect(finalStep).not.toHaveClass(/is-complete/);
            await disclose(workspace.locator('[data-easystud-tree] [data-easystud-grouping-id="' +
                setup.otherId + '"]').first());
            await expect(finalStep).not.toHaveClass(/is-complete/);
            await disclose(destination);
            await expect(finalStep).toHaveClass(/is-complete/);
            expect(await memberships()).toEqual(before);
            const finished = await page.evaluate(async() => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                const context = Guide.getPathContext(root, 'prepare-activity-grouping');
                Guide.destroy(root); Guide.init(root, config);
                return {context, state: JSON.parse(localStorage.getItem(config.storageKey + '.checklist'))};
            });
            expect(finished.context).toEqual(setup.data);
            expect(finished.state.completed['prepare-activity-grouping']).toContain('verify-grouping');
            await expect(checklist).toBeHidden();
            await expect(page.locator('[data-easyedu-guide-resume]')).toBeHidden();
            rows.push({width, language, motion, actualReducedMotion: await page.evaluate(() =>
                matchMedia('(prefers-reduced-motion: reduce)').matches),
                prerequisiteSetup: 'artificial QA only', exactDestinationCue: true,
                missingExpectedGroupRejected: true, otherGroupingRejected: true,
                contextWriteAloneDoesNotComplete: true, nativeSameGroupingDisclosureCompletesFinal: true,
                membershipsPreserved: true, completedReinitDoesNotOfferResume: true,
                actualPageReload: true, noReseedingAfterReload: true, explicitResumeRequired: true});
            await page.evaluate(async width => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                Guide.destroy(root);
                const key = 'activity-final-reload-qa-' + width + '.checklist';
                localStorage.removeItem(key);
                localStorage.removeItem(key + '.before-' + root.activityPathQaConfig.presentationKey);
            }, width);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        diagnostic.push(await workspace.evaluate(root => ({
            guideNested: !!root.querySelector('[data-easyedu-guide-root]'),
            nativeGroupings: Array.from(root.querySelectorAll('[data-easystud-grouping-id]')).map(grouping => ({
                id: grouping.getAttribute('data-easystud-grouping-id'),
                expanded: grouping.querySelector('[data-easystud-collapse-toggle]')?.getAttribute('aria-expanded'),
            })),
        })).catch(() => ({unavailable: true})));
        fs.writeFileSync(info.outputPath('guide-activity-final-reload-native.json'), JSON.stringify({
            rows, errors, blocked, diagnostic, installedPath: true, businessWriteRequested: false,
            confirmedAssignmentProof: false, sameGroupingFinalNativeProof: true, prerequisiteHistoryArtificial: true,
        }, null, 2));
    }
});
