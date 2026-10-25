const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Read-only successor: record the real WAAPI frames; never force loading or animation state.
test('Card inline search records native disclosure timing and height continuity', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [];
    const errors = [];
    const blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    const save = () => fs.writeFileSync(testInfo.outputPath('inline-disclosure.json'),
        JSON.stringify({records, errors, blocked}, null, 2));
    await page.addInitScript(() => {
        window.easyeduDisclosureDiagnostic = [];
        const original = Element.prototype.animate;
        Element.prototype.animate = function(keyframes, options) {
            const before = this.getBoundingClientRect();
            const animation = original.call(this, keyframes, options);
            if (!this.matches('[data-easystud-group-member-search-panel]')) {
                return animation;
            }
            const node = this;
            const card = node.closest('[data-easystud-group-id]');
            const style = getComputedStyle(node);
            const start = performance.now();
            const record = {
                classes: node.className, keyframes, options,
                before: before.height, boxSizing: style.boxSizing,
                padding: style.padding, border: style.borderWidth,
                frames: [], settled: false, finished: false,
            };
            window.easyeduDisclosureDiagnostic.push(record);
            animation.finished.then(() => { record.finished = true; }).catch(() => { record.cancelled = true; });
            const sample = now => {
                const rect = node.getBoundingClientRect();
                const cr = card.getBoundingClientRect();
                record.frames.push({t: now - start, height: rect.height, cardHeight: cr.height,
                    opacity: getComputedStyle(node).opacity, hidden: node.hidden,
                    animationTime: animation.currentTime, playState: animation.playState});
                if (now - start < 650) {
                    requestAnimationFrame(sample);
                } else {
                    record.settled = true;
                }
            };
            requestAnimationFrame(sample);
            return animation;
        };
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.goto(process.env.EASYEDU_MOODLE_URL);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(url => !url.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL);
            }
            const root = page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await page.route('**/local/groupimport/**', async route => {
                if (route.request().method() !== 'GET') {
                    blocked.push({width, method: route.request().method()});
                    await route.abort('blockedbyclient');
                } else {
                    await route.continue();
                }
            });
            const mode = width <= 1024 ? '[data-easystud-mobile-view="groups"]:visible' :
                '[data-easystud-layout-mode="structure"]:visible';
            await root.locator(mode).first().click();
            const groups = root.locator('[data-easystud-group-id]:visible');
            let group = null;
            for (let index = 0; index < await groups.count(); index++) {
                const candidate = groups.nth(index);
                if (await candidate.locator(':scope > [data-easystud-group-members] [data-easystud-member-id]').count() >= 2) {
                    group = candidate;
                    break;
                }
            }
            expect(group, 'Use an existing group; no fixture mutation').not.toBeNull();
            const membersToggle = group.locator('[data-easystud-group-members-toggle]').first();
            if (await membersToggle.count() && await membersToggle.getAttribute('aria-expanded') !== 'true') {
                await membersToggle.click();
            }
            let toggle = group.locator(':scope > .local-groupimport-easystud-group__header ' +
                '> [data-easystud-group-member-search-toggle]:visible').first();
            if (!await toggle.count()) {
                await group.locator(':scope > .local-groupimport-easystud-group__header ' +
                    '> [data-easystud-group-actions-toggle]:visible').first().click();
                toggle = root.locator('[data-easystud-context-menu] ' +
                    '[data-easystud-context-action="group-search-members"]:visible').first();
            }
            await toggle.click();
            const panel = group.locator(':scope > [data-easystud-group-member-search-panel]');
            await expect(panel.locator('[data-easystud-group-member-search]')).toBeFocused();
            await page.waitForFunction(() => window.easyeduDisclosureDiagnostic.length >= 1 &&
                window.easyeduDisclosureDiagnostic.every(record => record.settled));
            await panel.locator('[data-easystud-group-member-search-cancel]').click();
            await expect(panel).toBeHidden();
            await page.waitForFunction(() => window.easyeduDisclosureDiagnostic.length >= 2 &&
                window.easyeduDisclosureDiagnostic.every(record => record.settled));
            const transitions = await page.evaluate(() => window.easyeduDisclosureDiagnostic);
            expect(transitions).toHaveLength(2);
            expect(transitions.every(record => record.finished && !record.cancelled)).toBe(true);
            records.push({width, transitions});
            save();
            await page.unroute('**/local/groupimport/**');
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        save();
    }
});
