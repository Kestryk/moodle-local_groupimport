// SM-50 local-supervised candidate: existing rows, selection/filter/density only.
// No entity command, fixture, settings Save or Guide mutation.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Mobile participant density hides only memberships and preserves desktop mode', async ({page}, testInfo) => {
    test.setTimeout(300000);
    page.setDefaultTimeout(15000);
    const records = [], blocked = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const root = page.locator('#local-groupimport-easystud');
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
        blocked.push({scope: 'core', methods});
        return route.abort('blockedbyclient');
    });
    const pluginGuard = route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()});
        return route.abort('blockedbyclient');
    };
    const settle = async () => root.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const select = card => card.locator(':scope > .local-groupimport-easystud-selector').click();
    const inspect = async (card, width, state, hidden) => {
        await settle();
        const result = await card.evaluate(node => {
            const bounds = node.getBoundingClientRect();
            const rect = el => {
                const b = el.getBoundingClientRect();
                return {x: b.left - bounds.left, y: b.top - bounds.top, w: b.width, h: b.height};
            };
            const title = rect(node.querySelector('.local-groupimport-easystud-user__name'));
            const selector = rect(node.querySelector(':scope > .local-groupimport-easystud-selector'));
            const square = rect(node.querySelector(':scope > .local-groupimport-easystud-selector .local-groupimport-easystud-selector__ui'));
            const membershipRows = [...node.querySelectorAll('[data-easystud-participant-memberships]')];
            const otherRows = [...node.querySelectorAll('.local-groupimport-easystud-user__meta-group')]
                .filter(row => !row.hasAttribute('data-easystud-participant-memberships'));
            return {
                card: {w: bounds.width, h: bounds.height}, title, selector, square,
                gap: title.x - selector.x - selector.w,
                membershipHidden: membershipRows.map(row => row.hidden),
                membershipDisplay: membershipRows.map(row => getComputedStyle(row).display),
                otherRows: otherRows.map(row => ({hidden: row.hidden, display: getComputedStyle(row).display,
                    font: getComputedStyle(row).fontFamily})),
                headline: {font: getComputedStyle(node.querySelector('.local-groupimport-easystud-user__name')).fontFamily},
                horizontalOverflow: bounds.right > window.innerWidth + 1 || bounds.left < -1,
                targetOverlapsTitle: selector.x < title.x + title.w && selector.x + selector.w > title.x &&
                    selector.y < title.y + title.h && selector.y + selector.h > title.y,
            };
        });
        // Retain geometry even when an assertion fails, unlike the initial
        // served run (2a6b6b1). Keep every original behavior/target oracle.
        records.push({width, state, result});
        expect(result.membershipHidden.length).toBeGreaterThan(0);
        expect(result.membershipHidden.every(value => value === hidden)).toBe(true);
        expect(result.membershipDisplay.every(value => hidden ? value === 'none' : value !== 'none')).toBe(true);
        expect(result.otherRows.every(row => !row.hidden && row.display !== 'none')).toBe(true);
        expect(result.otherRows.every(row => row.font === result.headline.font)).toBe(true);
        expect(result.horizontalOverflow).toBe(false);
        expect(result.targetOverlapsTitle).toBe(false);
        expect(result.gap).toBeGreaterThanOrEqual(4);
        expect(result.selector.w).toBeGreaterThanOrEqual(44);
        expect(result.selector.h).toBeGreaterThanOrEqual(44);
        return result;
    };
    const density = root.locator('[data-easystud-density-toggle]').first();
    const mobileDensity = root.locator('[data-easystud-mobile-membership-toggle]');
    const clickDensity = async () => {
        if (page.viewportSize().width <= 1024) {
            await expect(mobileDensity).toBeVisible();
            await mobileDensity.click();
            await settle();
            await expect(mobileDensity).toHaveAttribute('aria-pressed', await density.getAttribute('aria-pressed'));
            return;
        }
        if (!await density.isVisible()) {
            const toggle = root.locator('[data-easystud-panel-actions-toggle]:visible').first();
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        }
        await density.click();
        await settle();
    };
    try {
        for (const width of [390, 768, 1024]) {
            await page.unroute('**/local/groupimport/**', pluginGuard).catch(() => undefined);
            await page.setViewportSize({width, height: 1100});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(url => !url.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await page.route('**/local/groupimport/**', pluginGuard);
            const mobile = root.locator('[data-easystud-mobile-view="participants"]:visible');
            if (await mobile.count()) await mobile.click();
            await settle();
            await expect(root).not.toHaveClass(/local-groupimport-easystud--compact-users/);
            const cards = root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')
                .filter({has: page.locator('[data-easystud-participant-memberships]')});
            expect(await cards.count()).toBeGreaterThanOrEqual(2);
            const ids = await cards.evaluateAll(nodes => nodes.slice(0, 2).map(node => node.getAttribute('data-user-id')));
            const first = root.locator(`[data-easystud-participant-list] [data-user-id="${ids[0]}"]`);
            const second = root.locator(`[data-easystud-participant-list] [data-user-id="${ids[1]}"]`);
            const baseline = await inspect(first, width, 'zero-selected', true);
            await inspect(second, width, 'zero-selected-second', true);
            await expect(density).toHaveAttribute('aria-pressed', 'true');
            // Observe actual native resize animations after the hidden-row mutation.
            await root.evaluate(node => {
                window.easyeduSm50Motion = [];
                const observer = new MutationObserver(changes => {
                    const cards = new Set(changes.map(change => change.target.closest('[data-easystud-user]')).filter(Boolean));
                    cards.forEach(card => card.getAnimations().forEach(animation => {
                        if (animation.effect.getKeyframes().some(frame => frame.height)) {
                            window.easyeduSm50Motion.push({duration: animation.effect.getTiming().duration,
                                policy: node.getAttribute('data-easyedu-motion-policy')});
                        }
                    }));
                });
                observer.observe(node, {subtree: true, attributes: true, attributeFilter: ['hidden']});
                window.easyeduSm50Observer = observer;
            });
            await select(first);
            const sole = await inspect(first, width, 'sole-selected', false);
            expect(sole.card.h).toBeGreaterThan(baseline.card.h);
            expect(Math.abs(sole.selector.y - baseline.selector.y)).toBeLessThanOrEqual(1);
            await inspect(second, width, 'sole-selected-other', true);
            if (width === 390) await first.screenshot({path: testInfo.outputPath('membership-sole-390.png')});
            await select(second);
            await inspect(first, width, 'two-selected-first', true);
            await inspect(second, width, 'two-selected-second', true);
            await select(first);
            await inspect(second, width, 'one-survivor', false);
            await select(second);
            await inspect(second, width, 'zero-after-deselection', true);
            const normal = await page.evaluate(() => window.easyeduSm50Motion.slice());
            expect(normal.length).toBeGreaterThan(0);
            expect(normal.every(sample => sample.duration >= 100 && sample.duration <= 200)).toBe(true);
            records.push({width, state: 'native-normal-motion', normal});

            await clickDensity();
            await expect(density).toHaveAttribute('aria-pressed', 'false');
            await inspect(first, width, 'manual-full', false);
            await select(first); await select(second);
            await inspect(first, width, 'manual-full-two-selected', false);
            await clickDensity();
            await expect(density).toHaveAttribute('aria-pressed', 'true');
            await inspect(first, width, 'manual-compact-two-selected', true);
            // Clear selection through the real action before filtered reselection.
            await root.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').click();
            const search = root.locator('[data-easystud-search]');
            const name = (await first.locator('.local-groupimport-easystud-user__name').innerText()).trim();
            await search.fill(name); await settle();
            await expect(first).toBeVisible();
            await select(first);
            await inspect(first, width, 'filtered-sole-selected', false);
            await search.fill(''); await settle();
            await select(first);
            await inspect(first, width, 'filter-cleared-selection-cleared', true);

            if (width === 390) {
                await page.emulateMedia({reducedMotion: 'reduce'});
                await page.evaluate(() => { window.easyeduSm50Motion = []; });
                await select(first); await inspect(first, width, 'reduced-sole', false);
                expect(await page.evaluate(() => window.easyeduSm50Motion.length)).toBe(0);
                await select(first); await inspect(first, width, 'reduced-zero', true);
                await page.emulateMedia({reducedMotion: 'no-preference'});
                await page.setViewportSize({width: 320, height: 1000}); await settle();
                await inspect(first, 320, 'narrow-zero', true);
                await select(first); await inspect(first, 320, 'narrow-sole', false);
                await select(first);
            }
            const groupingState = await root.evaluate(node => [...node.querySelectorAll('[data-easystud-grouping-id]')]
                .map(grouping => [grouping.getAttribute('data-easystud-grouping-id'), grouping.className]));
            await page.setViewportSize({width: 1600, height: 1100}); await settle();
            const desktopCompact = await root.evaluate(node => node.classList.contains('local-groupimport-easystud--compact-users'));
            await expect(mobileDensity).toBeHidden();
            expect(desktopCompact).toBe(true);
            await select(first); await settle();
            await expect(root).toHaveClass(/local-groupimport-easystud--single-participant-selected/);
            await select(first); await settle();
            await clickDensity();
            await expect(root).not.toHaveClass(/local-groupimport-easystud--compact-users/);
            await page.setViewportSize({width, height: 1100}); await settle();
            await inspect(first, width, 'return-mobile', true);
            await page.setViewportSize({width: 1600, height: 1100}); await settle();
            await expect(root).not.toHaveClass(/local-groupimport-easystud--compact-users/);
            const groupingsAfter = await root.evaluate(node => [...node.querySelectorAll('[data-easystud-grouping-id]')]
                .map(grouping => [grouping.getAttribute('data-easystud-grouping-id'), grouping.className]));
            expect(groupingsAfter).toEqual(groupingState);
            records.push({width, state: 'desktop-preference-and-grouping-preserved'});
            await page.evaluate(() => window.easyeduSm50Observer.disconnect());
        }
        expect(blocked).toEqual([]); expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('membership-density-proof.json'), JSON.stringify({records, blocked, errors}, null, 2));
    }
});
