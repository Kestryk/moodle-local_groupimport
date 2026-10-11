// Local-supervised T006 measurement: real Guide slides, no injected layout.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('T006 measures actual introduction to scene status spacing', async({page}, info) => {
    test.setTimeout(240000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json', body: JSON.stringify(methods.map(() => ({error: false, data: {}})))
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    try {
        for (const language of ['en', 'fr']) for (const width of [1280, 390]) {
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.searchParams.set('lang', language);
            await page.setViewportSize({width, height: 1000});
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('html')).toHaveAttribute('lang', language);
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('[data-easyedu-guide-modal]:visible'); await expect(modal).toBeVisible();
            const ids = await modal.locator('[data-easyedu-guide-slide]').evaluateAll(slides => slides
                .filter(slide => slide.querySelector('.easyedu-guide-introduction__note') && slide.querySelector('.easyedu-guide-scene__live'))
                .map(slide => slide.getAttribute('data-easyedu-guide-slide')));
            expect(ids.length).toBeGreaterThan(0);
            for (const id of ids) {
                await modal.locator('[data-easyedu-guide-nav-item="' + id + '"]').click();
                const slide = modal.locator('[data-easyedu-guide-slide="' + id + '"]'); await expect(slide).toBeVisible();
                await expect(page.locator('[data-easyedu-guide-root]')).toHaveAttribute('data-easyedu-guide-current-slide', id);
                await slide.evaluate(async node => {
                    await document.fonts.ready;
                    await Promise.all(node.getAnimations({subtree: true}).filter(animation => Number.isFinite(animation.effect?.getComputedTiming().iterations))
                        .map(animation => animation.finished.catch(() => {})));
                });
                const geometry = await slide.evaluate(node => {
                    const note = node.querySelector('.easyedu-guide-introduction__note'), status = node.querySelector('.easyedu-guide-scene__live');
                    const box = element => {const rect = element.getBoundingClientRect(); return {top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width};};
                    const noteBox = box(note), statusBox = box(status);
                    return {note: noteBox, status: statusBox, gap: statusBox.top - noteBox.bottom,
                        noteMarginEnd: getComputedStyle(note).marginBlockEnd, statusMarginStart: getComputedStyle(status).marginBlockStart,
                        mode: node.querySelector('[data-easyedu-guide-scene]')?.getAttribute('data-easyedu-guide-scene')};
                });
                records.push({language, width, id, ...geometry});
                expect(geometry.note.height).toBeGreaterThan(0); expect(geometry.status.height).toBeGreaterThan(0);
            }
            await modal.locator('[data-easyedu-guide-close]').click(); await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-introduction-scene-gap-baseline.json'), JSON.stringify({records, errors, blocked,
            scope: 'T006 baseline only, gap not certified corrected; native current slides EN/FR1280/390; no demo Start or business writes.',
            injectedStyles: false, humanAccepted: false, settingsSaved: false, fixtureRequested: false}, null, 2));
    }
});
