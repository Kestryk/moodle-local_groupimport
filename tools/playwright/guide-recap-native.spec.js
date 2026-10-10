const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: open/Show/Return/Close only; no course or fixture writes.
test('Guide recap lesson preserves native reading and composition', async({page}, info) => {
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
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute(
            'data-easystud-loading-state', 'ready', {timeout:60000});
        const root = page.locator('[data-easyedu-guide-root]');
        const course = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('id');
        const key = 'local_groupimport.easyedu_guide.' + course + '.checklist';
        const completed = await page.evaluate(key =>
            JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key);
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height:1000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('[data-easyedu-guide-modal]:visible');
            const nav = modal.locator('[data-easyedu-guide-nav-item]').filter({hasText:'Key points'});
            await expect(nav).toHaveCount(1);
            const index = await nav.getAttribute('data-easyedu-guide-nav-item');
            await nav.click();
            await expect(root).toHaveAttribute('data-easyedu-guide-current-slide', index);
            const slide = modal.locator('[data-easyedu-guide-slide="' + index + '"]:visible');
            const explanation = slide.locator('[data-easyedu-guide-introduction]');
            await expect(explanation.locator('dt')).toHaveCount(3);
            await expect(explanation).toContainText('A grouping gathers groups, not participants directly');
            await expect(slide.locator('.easyedu-guide-visual--workflow .easyedu-guide-step-pill')).toHaveCount(4);
            const bounds = await slide.evaluate(async node => {
                await document.fonts.ready;
                const nodes = [...node.querySelectorAll('p,dd,dt > span:last-child,.easyedu-guide-step-pill > span:last-child')];
                return nodes.filter(child => child.getClientRects().length).map(child => {
                    const range = document.createRange(); range.selectNodeContents(child);
                    const ink = range.getBoundingClientRect(), box = child.getBoundingClientRect();
                    return {text:child.textContent.trim(),
                        contained:ink.left >= box.left - 1 && ink.right <= box.right + 1 &&
                            ink.top >= box.top - 1 && ink.bottom <= box.bottom + 1};
                });
            });
            rows.push({width, index, bounds});
            expect(bounds).toHaveLength(12);
            expect(bounds.every(item => item.contained)).toBeTruthy();
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toHaveCount(0);
            expect(await page.evaluate(key =>
                JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key)).toEqual(completed);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-recap-result.json'),
            JSON.stringify({rows, errors, blocked, fixtures:false, businessWrites:false}, null, 2));
    }
});
