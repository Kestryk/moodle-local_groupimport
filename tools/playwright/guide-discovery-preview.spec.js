const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised Guide preview: illustrations and open/cancel only.
test('Guide discovery first version native preview', async({page}, info) => {
    test.setTimeout(210000);
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
        blocked.push('plugin write');
        return route.abort('blockedbyclient');
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
        blocked.push(methods);
        return route.abort('blockedbyclient');
    });
    const guide = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
    const modal = guide.locator('[data-easyedu-guide-modal]');
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    try {
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            // Native launcher projection may live outside the portalled Guide root.
            const launchers = page.locator('[data-easyedu-guide-open]:visible');
            if (await launchers.count()) await launchers.first().click();
            else {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
            }
            await expect(modal).toBeVisible();
            for (let index = 0; index < 4; index++) {
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const slide = modal.locator(`[data-easyedu-guide-slide="${index}"]`);
                await expect(slide).toBeVisible();
                await expect(guide).not.toHaveAttribute('data-easyedu-guide-slide-transition', /.+/);
                const topic = modal.locator(`[data-easyedu-guide-nav-item="${index}"] .easyedu-guide-nav-copy > span`);
                expect(await topic.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
                const bodySize = await slide.locator('.easyedu-guide-slide__content p').evaluate(node => getComputedStyle(node).fontSize);
                expect(bodySize).toBe('14.08px');
                if (index === 1) {
                    const input = await slide.locator('[data-guide-pattern]').boundingBox();
                    const actions = await slide.locator('.easyedu-guide-scene__creation-controls .easyedu-guide-scene__actions').boundingBox();
                    if (width === 1280) {
                        expect(actions.x).toBeGreaterThan(input.x + input.width);
                        expect(actions.y + actions.height).toBeCloseTo(input.y + input.height, 0);
                    } else if (width === 390) {
                        expect(actions.y).toBeGreaterThanOrEqual(input.y + input.height);
                    }
                    await slide.locator('[data-guide-scene-command="preview"]').first().click();
                    await expect(slide.locator('[data-guide-names] > span')).toHaveCount(3);
                    await expect(slide.locator('[data-guide-names] [data-guide-name]')).toHaveCount(3);
                    await expect(slide.locator('[data-guide-names]')).toHaveAttribute('aria-busy', 'false');
                    await expect(slide.locator('.easyedu-guide-guided-card__steps li')).toHaveCount(3);
                    await expect(slide.locator('.easyedu-guide-guided-card__body > small')).not.toBeEmpty();
                }
                if (index === 3 && width === 1280) {
                    await expect(slide.locator('[data-easyedu-guide-scene]')).toHaveAttribute('data-guide-scene-finished', 'true', {timeout: 70000});
                    await expect(slide.locator('[data-guide-recap]')).toBeVisible();
                    await expect(slide.locator('[data-guide-source-empty]')).toBeVisible();
                }
                const geometry = await modal.locator('.easyedu-guide-modal__dialog').evaluate(node => {
                    const r = node.getBoundingClientRect();
                    const buttons = [...node.querySelectorAll('.easyedu-guide-modal__footer-actions button')].map(b => {
                        const box = b.getBoundingClientRect(); return {height: box.height, width: box.width};
                    });
                    const progress = node.querySelector('.easyedu-guide-modal__progress-track').getBoundingClientRect();
                    return {x: r.x, right: r.right, bottom: r.bottom, buttons, progress: {x: progress.x, width: progress.width, height: progress.height}};
                });
                expect(geometry.x).toBeGreaterThanOrEqual(0);
                expect(geometry.right).toBeLessThanOrEqual(width + 1);
                expect(geometry.bottom).toBeLessThanOrEqual(1001);
                expect(geometry.buttons[0].height).toBeCloseTo(geometry.buttons[1].height, 0);
                expect(geometry.progress.width).toBeGreaterThan((geometry.right - geometry.x) * 0.8);
                expect(geometry.progress.height).toBeGreaterThanOrEqual(3.9);
                records.push({width, index, geometry});
                await modal.screenshot({path: info.outputPath(`guide-${width}-${index}.png`)});
            }
            await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
            await modal.locator('[data-easyedu-guide-interface-cue-action] button').click();
            await expect(modal).toBeHidden();
            await expect(guide.locator('[data-easyedu-guide-interface-return]')).toBeVisible();
            await guide.locator('[data-easyedu-guide-interface-return-button]').click();
            await expect(modal).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-discovery-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
