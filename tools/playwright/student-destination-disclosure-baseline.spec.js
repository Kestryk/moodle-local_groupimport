const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised; existing selection/open/Search/Escape/Cancel only, never Move.
test('Destination choice records native frame continuity at three widths', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.addInitScript(() => {
        window.destinationFrames = [];
        const original = Element.prototype.animate;
        Element.prototype.animate = function(keyframes, options) {
            const animation = original.call(this, keyframes, options);
            if (!this.matches('.easyedu-searchable-choice__panel')) return animation;
            const node = this, start = performance.now();
            const record = {options, keyframes, first: node.getBoundingClientRect().height, frames: [], settled: false};
            window.destinationFrames.push(record);
            const sample = now => {
                record.frames.push({t: now - start, height: node.getBoundingClientRect().height,
                    opacity: getComputedStyle(node).opacity, hidden: node.hidden});
                if (now - start < 500) requestAnimationFrame(sample);
                else record.settled = true;
            };
            requestAnimationFrame(sample);
            return animation;
        };
    });
    try {
        for (const width of [1600, 768, 390]) {
            for (const kind of ['participants', 'groups']) {
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
                    if (route.request().method() === 'GET') await route.continue();
                    else { blocked.push(route.request().method()); await route.abort('blockedbyclient'); }
                });
                if (kind === 'groups') {
                    await root.locator(width <= 1024 ? '[data-easystud-mobile-view="groups"]:visible' :
                        '[data-easystud-layout-mode="structure"]:visible').first().click();
                }
                const card = root.locator(kind === 'participants' ? '[data-easystud-user]:visible' :
                    '[data-easystud-group-id]:visible').first();
                await card.locator('[data-easystud-selector-input]').first().evaluate(input => input.click());
                const action = `[data-easystud-move-selected-${kind}]`;
                const opener = root.locator(width <= 1024 ?
                    `[data-easystud-mobile-action-trigger="${action}"]:visible` : `${action}:visible`).first();
                await opener.click();
                const dialog = root.locator('[data-easystud-move-modal]');
                await expect(dialog).toBeVisible();
                const chooser = dialog.locator('.easyedu-searchable-choice');
                const trigger = chooser.locator('.easyedu-searchable-choice__trigger');
                await trigger.click();
                await expect.poll(() => page.evaluate(() => window.destinationFrames.at(-1)?.settled)).toBe(true);
                const opening = await page.evaluate(() => window.destinationFrames.at(-1));
                const search = chooser.getByRole('searchbox');
                await expect(search).toBeFocused();
                await search.press('Escape');
                await expect.poll(() => page.evaluate(() => window.destinationFrames.at(-1)?.settled)).toBe(true);
                const closing = await page.evaluate(() => window.destinationFrames.at(-1));
                await expect(trigger).toBeFocused();
                await expect(chooser.locator('.easyedu-searchable-choice__panel')).toBeHidden();
                records.push({width, kind, opening, closing});
                await dialog.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
                await expect(dialog).toBeHidden();
            }
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('destination-disclosure.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
