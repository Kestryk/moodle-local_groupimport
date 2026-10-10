const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised successor. Existing course, no fixture or business command.
// The historical static-card scenario remains immutable at its own asset pin.
test('Guide French inspection preserves normal and reduced lifecycle', async({page}, info) => {
    test.setTimeout(360000);
    page.setDefaultTimeout(15000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.searchParams.set('lang', 'fr');
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url.href, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(url.href, {waitUntil:'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status:200, contentType:'application/json',
                body:JSON.stringify(methods.map(() => ({error:false, data:{}})))});
        }
        const allowed = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => allowed.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute(
            'data-easystud-loading-state', 'ready', {timeout:60000});
        const root = page.locator('.easyedu-guide--discovery');
        await expect(root.locator('[data-easyedu-guide-slide]')).toHaveCount(24);
        const scenes = root.locator('[data-easyedu-guide-scene="inspection"]');
        await expect(scenes).toHaveCount(2);
        await expect(root.locator('.easyedu-guide-visual--card-detail')).toHaveCount(1);
        const indices = await scenes.evaluateAll(nodes => nodes.map(node =>
            node.closest('[data-easyedu-guide-slide]').getAttribute('data-easyedu-guide-slide')));
        const key = 'local_groupimport.easyedu_guide.' +
            new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('id') + '.checklist';
        const completion = await page.evaluate(key =>
            JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key);
        for (const motion of ['no-preference', 'reduce']) for (const width of [1280, 768, 390]) for (const index of indices) {
            await page.setViewportSize({width, height:1000});
            await page.emulateMedia({reducedMotion:motion});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = root.locator('[data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
            const slide = root.locator('[data-easyedu-guide-slide="' + index + '"]');
            const scene = slide.locator('[data-easyedu-guide-scene="inspection"]');
            await expect(scene).toBeVisible();
            await expect(slide.locator('[data-easyedu-guide-introduction] dt')).toHaveCount(3);
            await expect(slide.locator('.easyedu-guide-visual--card-detail')).toHaveCount(0);
            const next = slide.locator('[data-guide-playback="next-phase"]');
            if (motion === 'no-preference') {
            for (const phase of ['orient', 'open', 'enter', 'review', 'return']) {
                await expect(scene).toHaveAttribute('data-guide-phase', phase);
                if (phase === 'review') {
                    await expect(scene.locator('[data-guide-inspection-input]')).toHaveAttribute('readonly', '');
                    await expect(scene.locator('[data-guide-inspection-chips]')).toBeVisible();
                    await expect(scene.locator('[data-guide-inspection-panel] button')).toHaveCount(0);
                }
                if (phase === 'orient') {
                    const pause = slide.locator('[data-guide-playback="pause"]');
                    await expect(pause).toBeEnabled();
                    await pause.click();
                    await expect(pause).toHaveAttribute('aria-pressed', 'true');
                    await page.waitForTimeout(350);
                    await expect(scene).toHaveAttribute('data-guide-phase', 'orient');
                    await pause.click();
                    await expect(pause).toHaveAttribute('aria-pressed', 'false');
                }
                await expect(next).toBeEnabled();
                await next.click();
            }

            }
            await expect(scene).toHaveAttribute('data-guide-scene-finished', 'true');
            await expect(scene.locator('[data-guide-inspection-panel]')).toBeHidden();
            await expect(scene.locator('[data-guide-inspection-input]')).toHaveValue('');
            await expect(scene.locator('[data-guide-recap]')).toBeVisible();
            const measured = await scene.evaluate(async node => {
                await document.fonts.ready;
                const utilities = [...node.querySelectorAll('.easyedu-guide-scene__utilities button')];
                return {overflow:node.scrollWidth > node.clientWidth + 1,
                    utilities:utilities.map(button => {
                        const box = button.getBoundingClientRect(), style = getComputedStyle(button);
                        return {height:box.height, font:style.fontSize, weight:style.fontWeight};
                    }),
                    glyphFont:getComputedStyle(node.querySelector('[data-guide-inspection-trigger] .fa')).fontFamily};
            });
            rows.push({language:'fr', motion, width, index, measured, pauseResume:motion === 'no-preference'});
            expect(measured.overflow).toBeFalsy();
            expect(measured.glyphFont.toLowerCase()).toContain('awesome');
            expect(measured.utilities).toHaveLength(2);
            for (const button of measured.utilities) {
                expect(button.font).toBe('12.48px'); expect(button.weight).toBe('600');
                expect(Math.abs(button.height - 30.4)).toBeLessThan(0.1);
            }
            await scene.locator('[data-guide-scene-command="reset"]').click();
            await expect(scene).not.toHaveAttribute('data-guide-scene-finished', 'true');
            await expect(scene.locator('[data-guide-inspection-panel]')).toBeHidden();
            await scene.locator('[data-guide-scene-command="replay"]').click();
            if (motion === 'no-preference') {
                await expect(scene).toHaveAttribute('data-guide-phase', 'orient');
            } else {
                await expect(scene).toHaveAttribute('data-guide-scene-finished', 'true');
            }
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toBeHidden();
            expect(await page.evaluate(key =>
                JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key)).toEqual(completion);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-french-inspection-result.json'),
            JSON.stringify({rows, errors, blocked, fixtures:false, businessWrites:false}, null, 2));
    }
});
