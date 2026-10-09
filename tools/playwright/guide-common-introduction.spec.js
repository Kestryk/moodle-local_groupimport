const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: actual native Guide, open/read/close only. No fixtures.
test('Guide common introduction preserves curriculum and responsive typography', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
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
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        const root = page.locator('.easyedu-guide--discovery');
        await expect(root.locator('[data-easyedu-guide-slide]')).toHaveCount(24);
        const slide = root.locator('[data-easyedu-guide-slide="6"]');
        await expect(slide.locator('[data-easyedu-guide-introduction]')).toHaveCount(1);
        await expect(slide.locator('[data-easyedu-guide-start-path="first-structure"]')).toHaveCount(1);
        const key = 'local_groupimport.easyedu_guide.' + new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('id') + '.checklist';
        const completion = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key);
        for (const [width, motion] of [[1280, 'no-preference'], [768, 'reduce'], [390, 'no-preference']]) {
            await page.setViewportSize({width, height: 1000});
            await page.emulateMedia({reducedMotion: motion});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = root.locator('[data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="6"]').click();
            const intro = slide.locator('[data-easyedu-guide-introduction]');
            await expect(intro).toBeVisible();
            const measured = await intro.evaluate(async element => {
                await document.fonts.ready;
                const label = getComputedStyle(element.querySelector('dt'));
                const caption = getComputedStyle(element.querySelector('dd'));
                const failures = [];
                for (const node of element.querySelectorAll('dt,dd,p')) {
                    if (node.closest('[hidden]')) continue;
                    const r = node.getBoundingClientRect(), p = node.parentElement.getBoundingClientRect();
                    if (r.left < p.left - 1 || r.right > p.right + 1 || node.scrollWidth > node.clientWidth + 1) failures.push(node.tagName);
                }
                return {columns:getComputedStyle(element.querySelector('dl')).gridTemplateColumns.split(' ').length,
                    labelSize:parseFloat(label.fontSize), captionSize:parseFloat(caption.fontSize), failures,
                    sameHostFont:label.fontFamily === caption.fontFamily &&
                        label.fontFamily === getComputedStyle(element.closest('.easyedu-guide-modal')).fontFamily};
            });
            expect(measured.failures).toEqual([]); expect(measured.sameHostFont).toBeTruthy();
            expect(measured.labelSize).toBeCloseTo(14.08, 2); expect(measured.captionSize).toBeCloseTo(12.16, 2);
            expect(measured.columns).toBe(width < 768 ? 1 : 2);
            expect(await intro.locator('[data-easyedu-guide-fullscreen-help]').isVisible()).toBe(width >= 1024);
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toBeHidden();
            expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key)).toEqual(completion);
            rows.push({width, motion, ...measured, completionPreserved:true, slideCount:24, introductionIndex:6});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-common-introduction-result.json'), JSON.stringify({rows, errors, blocked,
            fixtureRequested:false, businessTransactionConfirmed:false}, null, 2));
    }
});
