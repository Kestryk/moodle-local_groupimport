const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local supervised proof: real templates, isolated Guide progress, no course commands.
test('Claude review1 Guide settled native scene explanation and path reading order', async ({page}, info) => {
    test.setTimeout(360000);
    const rows = [], errors = [], blocked = [], qaKey = 'guide-review1-order-native-qa';
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort();
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const calls = route.request().postDataJSON();
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (calls.every(call => reads.has(call.methodname))) return route.continue();
        if (calls.every(call => call.methodname === 'core_message_get_unsent_message')) {
            return route.fulfill({contentType: 'application/json', body: JSON.stringify(calls.map(() => ({error: false, data: []})))});
        }
        blocked.push(calls.map(call => call.methodname)); return route.abort();
    });
    const initialise = () => page.evaluate(async key => {
        const root = document.querySelector('[data-easyedu-guide-root]');
        const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
        root.review1OrderOriginalConfig = root.easyeduGuideConfig;
        Guide.destroy(root);
        Guide.init(root, {...root.review1OrderOriginalConfig, firstVisit: false, welcomeOffer: false, storageKey: key});
    }, qaKey);
    const restore = (clear = false) => page.evaluate(async ({key, clear}) => {
        const root = document.querySelector('[data-easyedu-guide-root]');
        if (root?.review1OrderOriginalConfig) {
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root); Guide.init(root, root.review1OrderOriginalConfig);
            delete root.review1OrderOriginalConfig;
        }
        if (clear) {localStorage.removeItem(key); localStorage.removeItem(key + '.checklist');}
    }, {key: qaKey, clear});
    const open = async () => {
        if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
        }
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        await expect(page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]')).toBeVisible();
    };
    try {
        for (const language of ['en', 'fr']) for (const width of [1600, 1280, 390]) {
            await page.setViewportSize({width, height: width === 1600 ? 900 : width === 1280 ? 800 : 844});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.searchParams.set('lang', language);
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language));
            await initialise(); await open();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            const slides = modal.locator('[data-easyedu-guide-slide]');
            expect(await slides.count()).toBe(12);
            for (let index = 0; index < 12; index++) {
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const slide = slides.nth(index); await expect(slide).toBeVisible();
                // Visibility precedes the accepted entry transform settling. Ignore
                // perpetual decorative motion, not finite translation of the scene.
                await expect.poll(() => slide.evaluate(node => node.getAnimations({subtree: true})
                    .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity &&
                        ['running', 'paused'].includes(animation.playState)).length)).toBe(0);
                const sample = await slide.evaluate(node => {
                    const rect = element => element ? {top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom} : null;
                    const visuals = [...node.querySelectorAll('.easyedu-guide-visual,[data-easyedu-guide-scene]')];
                    const explanation = node.querySelector('[data-easyedu-guide-introduction]');
                    const path = node.querySelector('.easyedu-guide-guided-card');
                    const precedes = (left, right) => !!(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING);
                    return {index: node.dataset.easyeduGuideSlide, visualCount: visuals.length,
                        visualBottom: Math.max(0, ...visuals.map(element => element.getBoundingClientRect().bottom)),
                        explanation: rect(explanation), path: rect(path),
                        ordered: !explanation || visuals.every(element => precedes(element, explanation)),
                        pathOrdered: !explanation || !path || precedes(explanation, path),
                        membershipIntroCount: node.querySelectorAll('[data-easyedu-guide-scene="membership"] .easyedu-guide-scene__intro').length};
                });
                rows.push({language, width, ...sample});
                expect(sample.ordered).toBe(true); expect(sample.pathOrdered).toBe(true);
                expect(sample.membershipIntroCount).toBe(0);
                if (sample.explanation && sample.visualCount) {
                    expect(sample.explanation.top).toBeGreaterThanOrEqual(sample.visualBottom - 1);
                }
                if (sample.explanation && sample.path) {
                    expect(sample.path.top).toBeGreaterThanOrEqual(sample.explanation.bottom - 1);
                }
                if ([0, 4, 5].includes(index)) {
                    await page.screenshot({path: info.outputPath(`${language}-${width}-slide-${index + 1}.png`)});
                }
            }
            await page.keyboard.press('Escape'); await expect(modal).toBeHidden();
            await restore(true);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await restore(true).catch(() => {});
        fs.writeFileSync(info.outputPath('review1-reading-order-native.json'), JSON.stringify({rows, errors, blocked, humanAccepted: false}, null, 2));
    }
});
