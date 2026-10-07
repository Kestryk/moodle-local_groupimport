const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised G7 successor. No creation, transfer, message or settings Save.
// Preserve the failed G7 source/oracle and G6 scenarios as historical evidence.
// 0.4.137 corrects the reading inset; record geometry before the strict assertion.
test('Guide G8 lifecycle and native destination review', async({page}, info) => {
    test.setTimeout(240000);
    const errors = [], blocked = [], records = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const allowed = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => allowed.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const guide = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
    const modal = guide.locator('[data-easyedu-guide-modal]');
    const open = async() => {
        if (await page.locator('[data-easyedu-guide-open]:visible').count()) {
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        } else {
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        }
        await expect(modal).toBeVisible();
    };
    try {
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const seed = async count => page.evaluate(count => {
                const root = document.querySelector('[data-easyedu-guide-root].easyedu-guide--discovery');
                const config = root.easyeduGuideConfig;
                const steps = config.paths['practice-membership'];
                localStorage.setItem(config.storageKey + '.checklist', JSON.stringify({
                    presentationKey: config.presentationKey, path: 'practice-membership', slideIndex: 1,
                    completed: {'practice-membership': steps.slice(0, count).map(step => step.id)}
                }));
                return {count: steps.length};
            }, count);
            await seed(6);
            await page.reload({waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(guide.locator('[data-easyedu-guide-checklist]')).toBeHidden();
            await expect(guide.locator('[data-easyedu-guide-resume]')).toBeHidden();
            await seed(2);
            await page.reload({waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            const notice = guide.locator('[data-easyedu-guide-resume]');
            const checklist = guide.locator('[data-easyedu-guide-checklist]');
            await expect(notice).toBeVisible(); await expect(checklist).toBeHidden();
            await notice.locator('[data-easyedu-guide-resume-path]').click();
            await expect(checklist).toBeVisible();
            if (await checklist.locator('[data-easyedu-guide-checklist-restore]').isVisible()) {
                await checklist.locator('[data-easyedu-guide-checklist-restore]').click();
            }
            // Select one real native card; Guide progress only was seeded. No
            // Create/Move/Save endpoint is called or stubbed as successful.
            const workspace = page.locator('#local-groupimport-easystud');
            const participants = workspace.locator('[data-easystud-mobile-view="participants"]:visible, [data-easystud-layout-mode="participants"]:visible').first();
            if (await participants.getAttribute('aria-pressed') !== 'true') await participants.click();
            const selection = workspace.locator('[data-easystud-participant-list] [data-easystud-user]:visible .local-groupimport-easystud-selector').first();
            await selection.click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="select-participant"]')).toHaveClass(/is-complete/);
            const move = workspace.locator('[data-easystud-move-selected-participants]:visible').first();
            await expect(move).toBeEnabled(); await move.click();
            const destination = workspace.locator('[data-easystud-move-modal]');
            await expect(destination).toBeVisible();
            await expect(checklist).toBeVisible();
            await expect(checklist.locator('[data-easyedu-guide-step-id="open-move"]')).toHaveClass(/is-complete/);
            await expect.poll(() => page.evaluate(() => {
                const root = document.querySelector('[data-easyedu-guide-root].easyedu-guide--discovery');
                return root.easyeduGuideCurrentTarget?.classList.contains('easyedu-searchable-choice') || false;
            })).toBe(true);
            const chooser = destination.locator('.easyedu-searchable-choice');
            await chooser.locator('.easyedu-searchable-choice__trigger').click();
            await chooser.locator('.easyedu-searchable-choice__option:visible').first().click();
            await expect(checklist.locator('[data-easyedu-guide-step-id="choose-destination"]')).toHaveClass(/is-complete/);
            await expect.poll(() => page.evaluate(() => {
                const root = document.querySelector('[data-easyedu-guide-root].easyedu-guide--discovery');
                return root.easyeduGuideCurrentTarget?.hasAttribute('data-easystud-confirm-move') || false;
            })).toBe(true);
            // Review an earlier completed step: close native dialog safely,
            // retain completion/unlocks, then reopen a later destination.
            await checklist.locator('[data-easyedu-guide-step-id="select-participant"]').click();
            await expect(destination).toBeHidden();
            await checklist.locator('[data-easyedu-guide-step-id="choose-destination"]').click();
            await expect(destination).toBeVisible();
            await expect(checklist).toBeVisible();
            await destination.locator('[data-easystud-close-move-modal]').first().click();
            await expect(destination).toBeHidden();
            await checklist.locator('[data-easyedu-guide-checklist-return]').click();
            await expect(modal).toBeVisible();
            const card = modal.locator('[data-easyedu-guide-slide="1"] .easyedu-guide-guided-card');
            const reset = card.locator('[data-easyedu-guide-reset-path]');
            await expect(reset).toBeVisible(); await reset.click();
            const geometry = await card.evaluate(node => ({card: node.getBoundingClientRect().height,
                action: node.querySelector('[data-easyedu-guide-start-path]').getBoundingClientRect().height,
                badge: getComputedStyle(node.querySelector('li'), '::before').width}));
            records.push({width, geometry, nativeMoveOpenedAndCancelled: true});
            expect(geometry.action).toBeLessThan(geometry.card / 2); expect(geometry.badge).toBe('15px');
            await modal.screenshot({path: info.outputPath(`guide-g8-${width}.png`)});
            await modal.locator('[data-easyedu-guide-close]').click(); await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g8-native-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
