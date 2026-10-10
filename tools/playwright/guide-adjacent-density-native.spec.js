const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: open/Show/Return/Close only; no course or fixture writes.
test('Guide adjacent Small actions preserve native Show and Return', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil:'commit', timeout:60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
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
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const measure = async button => button.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree:true}).filter(animation =>
            animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
        const box = node.getBoundingClientRect(), style = getComputedStyle(node);
        return {height:box.height, font:style.fontSize, weight:style.fontWeight,
            overflow:node.scrollWidth > node.clientWidth + 1};
    });
    const assertSmall = metrics => {
        expect(metrics.font).toBe('12.48px'); expect(metrics.weight).toBe('600');
        expect(Math.abs(metrics.height - 30.4)).toBeLessThan(0.1);
        expect(metrics.overflow).toBeFalsy();
    };
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute(
            'data-easystud-loading-state', 'ready', {timeout:60000});
        const root = page.locator('[data-easyedu-guide-root]');
        const course = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('id');
        const key = 'local_groupimport.easyedu_guide.' + course + '.checklist';
        const completed = await page.evaluate(key =>
            JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key);
        for (const width of [1280, 768, 390]) for (const index of [9, 10]) {
            await page.setViewportSize({width, height:1000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('[data-easyedu-guide-modal]:visible');
            await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
            await expect(root).toHaveAttribute('data-easyedu-guide-current-slide', String(index));
            const show = modal.locator('[data-easyedu-guide-slide="' + index + '"] [data-easyedu-guide-show-target]:visible');
            const showMetrics = await measure(show);
            rows.push({width, index, action:'show', metrics:showMetrics}); assertSmall(showMetrics);
            await show.click();
            await expect(modal).toHaveCount(0);
            const returnButton = page.locator('[data-easyedu-guide-interface-return-button]:visible');
            await expect(returnButton).toBeVisible();
            const returnMetrics = await measure(returnButton);
            rows.push({width, index, action:'return', metrics:returnMetrics}); assertSmall(returnMetrics);
            await returnButton.click();
            const reopened = page.locator('[data-easyedu-guide-modal]:visible');
            await expect(reopened).toBeVisible();
            await expect(root).toHaveAttribute('data-easyedu-guide-current-slide', String(index));
            await reopened.locator('[data-easyedu-guide-close]').first().click();
            await expect(reopened).toHaveCount(0);
            expect(await page.evaluate(key =>
                JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key)).toEqual(completed);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-adjacent-density-result.json'),
            JSON.stringify({rows, errors, blocked, fixtures:false, businessWrites:false}, null, 2));
    }
});
