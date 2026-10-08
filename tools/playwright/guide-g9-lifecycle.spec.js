const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised G9 successor: no creation, transfer, message or settings Save.
// G8 remains unchanged. Add persistent Reset/reload/Cancel and keyboard proof.
test('Guide G9 lifecycle and native destination review', async({page}, info) => {
    test.setTimeout(240000);
    page.setDefaultTimeout(15000);
    // Native PHP navigation gets its independent existing readiness budget;
    // short interaction timeouts must not also truncate a cold Moodle load.
    page.setDefaultNavigationTimeout(60000);
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
            // Native navigation launcher: baseline with the pointer away,
            // preserve restored focus, but no stale pointer hover palette.
            if (width === 1280) {
                const opener = page.locator('[data-easyedu-navigation-desktop] [data-easyedu-guide-open]:visible').first();
                await page.mouse.move(width - 2, 998);
                const paint = () => opener.locator('.easyedu-guide__launcher-icon').evaluate(node => {
                    const css = getComputedStyle(node);
                    return {background: css.backgroundImage, color: css.color};
                });
                const resting = await paint();
                await opener.click(); await expect(modal).toBeVisible();
                await modal.locator('[data-easyedu-guide-close]').click();
                await expect(modal).toBeHidden(); await page.mouse.move(width - 2, 998);
                await expect.poll(paint).toEqual(resting);
                await expect(opener).toBeFocused();
                expect(await opener.evaluate(node => node.matches(':focus-visible'))).toBe(false);
                records.push({width, launcherPointerCloseRestingPaint: true});
            }
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
            // Compact UI delegates the same native command through its real
            // sticky action control; never click the hidden desktop source.
            const move = workspace.locator('[data-easystud-move-selected-participants]:visible, ' +
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]:visible').first();
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
            const previous = checklist.locator('[data-easyedu-guide-step-id="select-participant"]');
            // The compact list is genuinely scrollable. Scroll the real row
            // before measuring its painted centre; off-scroll bounds are not
            // evidence that a modal intercepted a visible target.
            await previous.scrollIntoViewIfNeeded();
            const stacking = await previous.evaluate(node => {
                const box = node.getBoundingClientRect();
                const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
                const ancestors = [];
                for (let current = node; current; current = current.parentElement) {
                    const css = getComputedStyle(current);
                    if (css.zIndex !== 'auto' || css.transform !== 'none' || css.isolation === 'isolate') {
                        ancestors.push({class: current.className, zIndex: css.zIndex, transform: css.transform});
                    }
                }
                return {clickable: node.contains(hit), hitClass: hit?.className, ancestors};
            });
            records.push({width, checklistWithNativeDialog: stacking});
            expect(stacking.clickable).toBe(true);
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
            await expect(reset).toBeHidden();
            await expect(card.locator('[data-easyedu-guide-path-status]')).not.toBeEmpty();
            const stored = () => guide.evaluate(root => JSON.parse(localStorage.getItem(root.easyeduGuideConfig.storageKey + '.checklist')));
            expect((await stored()).path).toBe(null);
            expect((await stored()).completed['practice-membership']).toEqual([]);
            await card.locator('[data-easyedu-guide-start-path]').click();
            await expect(checklist.locator('.is-complete[data-easyedu-guide-step-id]')).toHaveCount(0);
            await checklist.locator('[data-easyedu-guide-checklist-return]').click();
            await expect(reset).toBeVisible(); await reset.click();
            const pattern = modal.locator('[data-guide-pattern]');
            await pattern.fill('Equipe #*3'); await pattern.press('Enter');
            await expect(modal.locator('[data-guide-name]')).toHaveCount(3);
            const geometry = await card.evaluate(node => ({card: node.getBoundingClientRect().height,
                action: node.querySelector('[data-easyedu-guide-start-path]').getBoundingClientRect().height,
                badge: getComputedStyle(node.querySelector('li'), '::before').width}));
            records.push({width, geometry, nativeMoveOpenedAndCancelled: true});
            expect(geometry.action).toBeLessThan(geometry.card / 2); expect(geometry.badge).toBe('15px');
            await modal.screenshot({path: info.outputPath(`guide-g9-${width}.png`)});
            await modal.locator('[data-easyedu-guide-close]').click(); await expect(modal).toBeHidden();
            await page.reload({waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(guide.locator('[data-easyedu-guide-resume]')).toBeHidden();
            await seed(2); await page.reload({waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await guide.locator('[data-easyedu-guide-cancel-path]').click();
            expect((await stored()).path).toBe(null);
            await page.reload({waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(guide.locator('[data-easyedu-guide-resume]')).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g9-native-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
