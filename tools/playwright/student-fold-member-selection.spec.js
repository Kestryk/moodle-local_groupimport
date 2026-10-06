const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing course-5 cards, local checkbox/fold/reopen only.
// No fixtures, real transfer/removal, settings Save, Send, import or Guide.
test('Folding a Group clears only its member selections with original Motion', async({page}, info) => {
    test.setTimeout(240000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], errors = [], blocked = [];
    const save = () => fs.writeFileSync(info.outputPath('fold-member-selection.json'),
        JSON.stringify({records, errors, blocked}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(name => name === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(name => reads.has(name))) return route.continue();
        blocked.push({scope: 'core', methods}); return route.abort('blockedbyclient');
    });
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()}); return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-easystud');
    const settle = () => root.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations))
            .map(animation => animation.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const selected = () => root.locator('[data-selectable-type="member"].is-selected').evaluateAll(nodes =>
        nodes.map(node => ({group: node.closest('[data-easystud-group-id]').getAttribute('data-easystud-group-id'),
            user: node.getAttribute('data-easystud-member-id'),
            checked: node.querySelector('[data-easystud-selector-input]').checked})));
    const assertActions = async count => {
        for (const selector of ['[data-easystud-move-selected-members]', '[data-easystud-delete-selected-members]']) {
            const actions = root.locator(selector);
            expect(await actions.count()).toBeGreaterThan(0);
            expect(await actions.evaluateAll(nodes => nodes.every(node => node.disabled))).toBe(count === 0);
        }
        if (await root.evaluate(node => node.getAttribute('data-easystud-mobile-view-active') !== null &&
                matchMedia('(max-width: 1100px)').matches)) {
            const tray = root.locator('[data-easystud-mobile-actions]');
            if (count) await expect(tray).toBeVisible(); else await expect(tray).toBeHidden();
        }
    };
    try {
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter: true});
            await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        for (const reducedMotion of ['no-preference', 'reduce']) {
            await page.emulateMedia({reducedMotion});
            for (const width of [1600, 768, 390, 320]) {
                await page.setViewportSize({width, height: 1100});
                if (width === 1600) await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
                else await root.locator('[data-easystud-mobile-view="groups"]:visible').click();
                await settle();
                const clear = root.locator('[data-easystud-clear-all-selection]:visible').first();
                if (await clear.count()) {await clear.click(); await settle();}
                const candidates = await root.locator('[data-easystud-group-id]:visible').evaluateAll(nodes =>
                    nodes.filter(node => node.querySelectorAll(':scope > [data-easystud-group-members] ' +
                        '[data-easystud-member-id]').length >= 3).map(node => node.getAttribute('data-easystud-group-id')));
                const ids = [...new Set(candidates)];
                expect(ids.length, 'Existing two populated groups required; never create fixtures').toBeGreaterThanOrEqual(2);
                const groups = ids.slice(0, 2).map(id => root.locator('[data-easystud-group-id="' + id + '"]:visible').first());
                for (const group of groups) {
                    const toggle = group.locator('[data-easystud-group-members-toggle]');
                    await expect(toggle).toBeVisible();
                    if (await toggle.getAttribute('aria-expanded') !== 'true') {await toggle.click(); await settle();}
                }
                const firstMembers = groups[0].locator(':scope > [data-easystud-group-members] [data-easystud-member-id]');
                for (const member of [firstMembers.first(), firstMembers.last()]) {
                    await member.locator(':scope > .local-groupimport-easystud-selector').click(); await settle();
                }
                await groups[1].locator(':scope > [data-easystud-group-members] [data-easystud-member-id]').first()
                    .locator(':scope > .local-groupimport-easystud-selector').click(); await settle();
                const before = await selected(); expect(before).toHaveLength(3); await assertActions(3);
                const other = before.filter(item => item.group === ids[1]); expect(other).toHaveLength(1);
                const toggle = groups[0].locator('[data-easystud-group-members-toggle]');
                const list = groups[0].locator(':scope > [data-easystud-group-members]');
                // Observe the real finite disclosure, without pausing or replacing it.
                await list.evaluate(node => {
                    node.dataset.sm62Observed = 'false';
                    const observer = new MutationObserver(() => {
                        if (node.classList.contains('is-easyedu-disclosing')) node.dataset.sm62Observed = 'true';
                    });
                    observer.observe(node, {attributes: true, attributeFilter: ['class']});
                    node.sm62Observer = observer;
                });
                await toggle.click(); await settle();
                await expect(toggle).toHaveAttribute('aria-expanded', 'false');
                if (reducedMotion === 'no-preference') await expect(list).toHaveAttribute('data-sm62-observed', 'true');
                expect(await selected()).toEqual(other);
                expect(await root.locator('[data-easystud-group-id="' + ids[0] + '"] [data-selectable-type="member"]')
                    .evaluateAll(nodes => nodes.every(node => !node.classList.contains('is-selected') &&
                        !node.querySelector('[data-easystud-selector-input]').checked))).toBe(true);
                await assertActions(1);
                await toggle.click(); await settle();
                await expect(toggle).toHaveAttribute('aria-expanded', 'true'); expect(await selected()).toEqual(other);
                await groups[1].locator('[data-easystud-group-members-toggle]').click(); await settle();
                expect(await selected()).toEqual([]); await assertActions(0);
                expect(await root.evaluate(node => node.hasAttribute('data-easystud-selection-type'))).toBe(false);
                await list.evaluate(node => {node.sm62Observer.disconnect(); delete node.sm62Observer;
                    delete node.dataset.sm62Observed;});
                records.push({width, reducedMotion, selectedBefore: 3, preservedOtherGroup: true,
                    allDuplicateCopiesCleared: true, reopenDoesNotReselect: true, actionsReconciled: true,
                    originalDisclosureObserved: reducedMotion === 'no-preference'}); save();
            }
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {save();}
});
