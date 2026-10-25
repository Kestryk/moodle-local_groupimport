const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: open/Show/Return/Close only; no course or fixture writes.
test('Guide French twelve-slide curriculum preserves native entries and reading', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    const frenchURL=new URL(process.env.EASYEDU_MOODLE_URL);frenchURL.searchParams.set('lang','fr');
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(frenchURL.href, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil:'commit', timeout:60000});
        await page.goto(frenchURL.href, {waitUntil:'domcontentloaded'});
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
        await expect(page.locator('html')).toHaveAttribute('lang', /^fr(?:-|$)/);
        const root = page.locator('[data-easyedu-guide-root]');
        const course = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('id');
        const key = 'local_groupimport.easyedu_guide.' + course + '.checklist';
        const completed = await page.evaluate(key =>
            JSON.parse(localStorage.getItem(key) || '{}').completed || {}, key);
        const ids = ['use-this-guide','understand-workspace','create-structure',
            'read-participant-card','read-group-card','read-grouping-card','add-or-move-members',
            'search-filter-select','pasted-identifiers','choose-right-action',
            'use-groupings-in-activities','ready-to-work'];
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height:1000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('[data-easyedu-guide-modal]:visible');
            await expect(modal.locator('[data-easyedu-guide-nav-item]')).toHaveCount(12);
            await modal.locator('[data-easyedu-guide-nav-item="11"]').click();
            await expect(root).toHaveAttribute('data-easyedu-guide-current-slide', '11');
            for (let index = 0; index < ids.length; index++) {
                await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
                await expect(root).toHaveAttribute('data-easyedu-guide-current-slide', String(index));
                const slide = modal.locator('[data-easyedu-guide-slide="' + index + '"]:visible');
                await expect(slide).toHaveCount(1);
                const bounds = await slide.evaluate(async node => {
                    await document.fonts.ready;
                    return [...node.querySelectorAll('.easyedu-guide-slide__content p,.easyedu-guide-introduction dd,.easyedu-guide-introduction dt > span:last-child,.easyedu-guide-introduction p')]
                        .filter(child => child.getClientRects().length).map(child => {
                            const range = document.createRange(); range.selectNodeContents(child);
                            const ink = range.getBoundingClientRect(), box = child.getBoundingClientRect();
                            return {text:child.textContent.trim(),
                                contained:ink.left >= box.left - 1 && ink.right <= box.right + 1 &&
                                    ink.top >= box.top - 1 && ink.bottom <= box.bottom + 1};
                        });
                });
                rows.push({width,index,id:ids[index],bounds});
                expect(bounds.length).toBeGreaterThan(0);
                expect(bounds.every(item => item.contained)).toBeTruthy();
                if (index === 0) {
                    await expect(slide.locator('[data-easyedu-guide-start-path]')).toHaveCount(0);
                    await expect(slide).toContainText('Choisir un sujet');
                }
                if ([2,9,10].includes(index)) {
                    const path = {2:'practice-membership',9:'try-actions',10:'create-grouping'}[index];
                    await expect(slide.locator('[data-easyedu-guide-start-path="' + path + '"]')).toHaveCount(1);
                }
                if (index === 9) {
                    await expect(slide.locator('[data-easyedu-guide-introduction] dt')).toHaveCount(5);
                    await expect(slide).toContainText('Ctrl-clic');
                }
                await expect.poll(() => page.evaluate(key =>
                    JSON.parse(localStorage.getItem(key) || '{}').slideId, key)).toBe(ids[index]);
                const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), key);
                expect(state.presentationKey).toBe('curriculum-modern-20261010');
                expect(state.slideId).toBe(ids[index]);
                expect(state.completed || {}).toEqual(completed);
            }
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toHaveCount(0);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-french-curriculum-result.json'),
            JSON.stringify({language:'fr',rows,errors,blocked,fixtures:false,businessWrites:false},null,2));
    }
});
