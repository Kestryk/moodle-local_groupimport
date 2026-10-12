const {expect} = require('@playwright/test');
const fs = require('node:fs');

// Reads actual Moodle chrome under isolated Guide progress; no course commands.
exports.exerciseChrome = async ({page}, info, stage) => {
    const rows = [], errors = [], blocked = [], qaKey = 'guide-chrome-density-native-qa';
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
    const restore = () => page.evaluate(async key => {
        const root = document.querySelector('[data-easyedu-guide-root]');
        if (root?.chromeOriginalConfig) {
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root); Guide.init(root, root.chromeOriginalConfig); delete root.chromeOriginalConfig;
        }
        localStorage.removeItem(key); localStorage.removeItem(key + '.checklist');
    }, qaKey);
    try {
        for (const language of ['en', 'fr']) for (const width of [1600, 1280, 390, 320]) {
            await page.setViewportSize({width, height: width === 1600 ? 900 : width === 1280 ? 800 : 844});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.searchParams.set('lang', language);
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language));
            await page.evaluate(async key => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                root.chromeOriginalConfig = root.easyeduGuideConfig; Guide.destroy(root);
                Guide.init(root, {...root.chromeOriginalConfig, firstVisit: false, welcomeOffer: false, storageKey: key});
            }, qaKey);
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
            await expect(modal.locator('[data-easyedu-guide-slide="0"]')).toBeVisible();
            await expect.poll(() => modal.evaluate(node => node.getAnimations({subtree: true})
                .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity &&
                    ['running', 'paused'].includes(animation.playState)).length)).toBe(0);
            const measure = () => modal.evaluate(node => {
                const rect = element => {const box = element.getBoundingClientRect(); return {left: box.left, right: box.right, top: box.top, bottom: box.bottom, height: box.height, width: box.width};};
                const display = element => getComputedStyle(element).display;
                const footer = node.querySelector('.easyedu-guide-modal__footer'), count = footer.querySelector('.easyedu-guide-modal__step-count');
                const progress = node.querySelector('.easyedu-guide-modal__progress'), track = progress.querySelector('.easyedu-guide-modal__progress-track');
                const subtitle = node.querySelector('.easyedu-guide-modal__title-wrap > div > p');
                return {body: rect(node.querySelector('.easyedu-guide-modal__body')), header: rect(node.querySelector('.easyedu-guide-modal__header')),
                    footer: rect(footer), count: {display: display(count), text: count.textContent, rect: rect(count), font: getComputedStyle(count).fontFamily},
                    progress: rect(progress), track: {...rect(track), background: getComputedStyle(track).backgroundColor},
                    topLabelDisplay: display(progress.querySelector('.easyedu-guide-modal__progress-label')),
                    subtitleDisplay: display(subtitle), cue: rect(node.querySelector('.easyedu-guide-interface-cue')),
                    buttons: [...footer.querySelectorAll('button')].map(button => ({text: button.textContent.trim(), rect: rect(button), font: getComputedStyle(button).fontFamily}))};
            });
            const first = await measure(); rows.push({language, width, state: 'first', ...first});
            expect(first.track.height).toBe(4);
            if (stage === 'baseline') {
                expect(first.topLabelDisplay).not.toBe('none'); expect(first.count.display).toBe('none');
                expect(first.subtitleDisplay).not.toBe('none');
            } else {
                expect(first.topLabelDisplay).toBe('none'); expect(first.count.display).not.toBe('none');
                expect(first.count.text).toMatch(/1.*12/); expect(first.count.font).toContain('Inter');
                expect(first.subtitleDisplay === 'none').toBe(width <= 640);
                expect(first.count.rect.left).toBeGreaterThanOrEqual(first.footer.left);
                if (first.count.rect.bottom <= first.buttons[0].rect.top) {
                    expect(width).toBe(320); // Existing wrap on the narrowest layout.
                } else {
                    expect(first.count.rect.right).toBeLessThanOrEqual(first.buttons[0].rect.left + 1);
                }
                for (const button of first.buttons) {
                    expect(button.rect.left).toBeGreaterThanOrEqual(first.footer.left);
                    expect(button.rect.right).toBeLessThanOrEqual(first.footer.right);
                    expect(button.rect.bottom).toBeLessThanOrEqual(first.footer.bottom);
                    expect(button.font).toContain('Inter');
                }
            }
            await page.screenshot({path: info.outputPath(`${language}-${width}-first.png`)});
            if (stage !== 'baseline') {
                // The introductory slide deliberately has no interface target.
                // Check the approved dedicated row on the actual membership scene.
                await modal.locator('[data-easyedu-guide-nav-item="6"]').click();
                await expect(modal.locator('[data-easyedu-guide-slide="6"]')).toBeVisible();
                const contextual = await measure();
                expect(contextual.cue.height).toBeGreaterThan(0);
                rows.push({language, width, state: 'contextual', ...contextual});
            }
            await modal.locator('[data-easyedu-guide-nav-item="11"]').click();
            await expect(modal.locator('[data-easyedu-guide-slide="11"]')).toBeVisible();
            const last = await measure(); rows.push({language, width, state: 'last', ...last});
            if (stage !== 'baseline') {
                expect(last.count.text).toMatch(/12.*12/); expect(last.count.rect.right).toBeLessThanOrEqual(last.footer.right);
            }
            await page.keyboard.press('Escape'); await expect(modal).toBeHidden(); await restore();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await restore().catch(() => {});
        fs.writeFileSync(info.outputPath('guide-chrome-native.json'), JSON.stringify({stage, rows, errors, blocked, humanAccepted: false}, null, 2));
    }
};
