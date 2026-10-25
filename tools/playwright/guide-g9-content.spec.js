const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised copy/containment, independent from normal-Motion proof.
test('Guide G9 Actions consequence responsive copy', async({page}, info) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const errors = [], blocked = [], records = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'reduce'});
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
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
            const slide = modal.locator('[data-easyedu-guide-slide="3"]');
            await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="actions"]')?.dataset.guideSceneFinished === 'true');
            const consequence = slide.locator('.easyedu-guide-scene__context > p').first();
            await expect(consequence).toContainText('Only their Projet Orion membership is removed');
            await expect(consequence).toContainText('their other groups are preserved');
            await consequence.scrollIntoViewIfNeeded();
            const geometry = await consequence.evaluate(node => ({overflow: node.scrollWidth > node.clientWidth + 1,
                fontFamily: getComputedStyle(node).fontFamily, fontSize: getComputedStyle(node).fontSize}));
            expect(geometry.overflow).toBe(false);
            records.push({width, geometry, explicitSourceRemoval: true});
            await modal.screenshot({path: info.outputPath(`guide-g9-content-${width}.png`)});
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g9-content-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
