const {expect} = require('@playwright/test');
const fs = require('node:fs');

// Claude's 250ms continuous illustration probe, with isolated Guide progress,
// approved authentication and denied course commands. Never confirms real data.
exports.exerciseReview2 = async ({page}, info, stage) => {
    const rows = [], errors = [], blocked = [], qaKey = 'guide-review2-native-qa';
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
        if (root?.review2OriginalConfig) {
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root); Guide.init(root, root.review2OriginalConfig); delete root.review2OriginalConfig;
        }
        localStorage.removeItem(key); localStorage.removeItem(key + '.checklist');
    }, qaKey);
    try {
        const cases = stage === 'baseline' ? [['fr', 1280, 'move']] :
            ['en', 'fr'].flatMap(language => [1600, 1280, 390].flatMap(width =>
                ['add', 'move'].map(mode => [language, width, mode])));
        for (const [language, width, mode] of cases) {
            await page.setViewportSize({width, height: width === 1600 ? 900 : width === 1280 ? 800 : 844});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.searchParams.set('lang', language);
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language));
            await page.evaluate(async key => {
                const root = document.querySelector('[data-easyedu-guide-root]');
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                root.review2OriginalConfig = root.easyeduGuideConfig; Guide.destroy(root);
                Guide.init(root, {...root.review2OriginalConfig, firstVisit: false, welcomeOffer: false, storageKey: key});
            }, qaKey);
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="6"]').click();
            const scene = modal.locator('[data-easyedu-guide-scene="membership"]');
            await expect(scene).toBeVisible();
            await expect.poll(() => modal.evaluate(node => node.getAnimations({subtree: true})
                .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity &&
                    ['running', 'paused'].includes(animation.playState)).length)).toBe(0);
            await scene.locator(`[data-guide-scene-command="${mode}"]`).click();
            const samples = [];
            await scene.evaluate(node => {
                node.review2Samples = []; const body = node.closest('.easyedu-guide-modal__body');
                node.review2Timer = setInterval(() => {
                    const header = node.querySelector('[data-guide-scene-header]').getBoundingClientRect(), bb = body.getBoundingClientRect();
                    const visible = element => !element.hidden && element.getBoundingClientRect().height > 0 &&
                        getComputedStyle(element).visibility !== 'hidden' && element.offsetParent !== null;
                    const targets = [...node.querySelectorAll('[data-guide-cursor],[data-guide-confirm],[data-guide-menu]')]
                        .filter(visible).map(element => {
                            const r = element.getBoundingClientRect();
                            const sticky = header.top <= bb.top + 2;
                            return {name: element.hasAttribute('data-guide-cursor') ? 'cursor' : element.hasAttribute('data-guide-confirm') ? 'dialog' : 'menu',
                                top: r.top, bottom: r.bottom, headerBottom: header.bottom, bodyBottom: bb.bottom,
                                violation: r.bottom > bb.bottom + 1 || (sticky && r.top < header.bottom - 1 && r.bottom > bb.top)};
                        });
                    const texts = [...node.querySelectorAll('[data-guide-confirm] *')].filter(element => visible(element) && !element.children.length)
                        .map(element => ({text: element.textContent.trim(), width: element.clientWidth, scroll: element.scrollWidth,
                            whiteSpace: getComputedStyle(element).whiteSpace}));
                    const copy = node.querySelector('[data-guide-live-copy]');
                    node.review2Samples.push({phase: node.dataset.guidePhase || 'entry', targets, texts,
                        copy: copy.textContent, announced: node.querySelector('[data-guide-live-announcement]')?.textContent || ''});
                }, 250);
            });
            await scene.locator('[data-guide-scene-command="start"]').click();
            try {
                await expect(scene).toHaveAttribute('data-guide-scene-finished', 'true', {timeout: 100000});
            } finally {
                samples.push(...await scene.evaluate(node => {clearInterval(node.review2Timer); return node.review2Samples;}));
            }
            const textOverflow = samples.flatMap(sample => sample.texts.filter(text => text.scroll > text.width));
            const repeated = [];
            for (let i = 1; i < samples.length; i++) for (const target of samples[i].targets.filter(target => target.violation)) {
                if (samples[i - 1].targets.some(before => before.name === target.name && before.violation)) repeated.push({i, ...target});
            }
            const row = {language, width, mode, samples, textOverflow, repeated}; rows.push(row);
            await page.screenshot({path: info.outputPath(`${language}-${width}-${mode}-finished.png`)});
            if (stage !== 'baseline') {
                expect(textOverflow).toEqual([]); expect(repeated).toEqual([]);
                const active = samples.filter(sample => /^\d+\s*·/.test(sample.announced));
                expect(active.length).toBeGreaterThan(0);
                expect(active.every(sample => !/^\d+\s*·/.test(sample.copy))).toBe(true);
            }
            await page.keyboard.press('Escape'); await expect(modal).toBeHidden(); await restore();
        }
        if (stage === 'baseline') expect(rows[0].textOverflow.length).toBeGreaterThan(0);
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(() => document.querySelectorAll('[data-easyedu-guide-scene]').forEach(node => clearInterval(node.review2Timer))).catch(() => {});
        await restore().catch(() => {});
        fs.writeFileSync(info.outputPath('guide-review2-native.json'), JSON.stringify({stage, rows, errors, blocked, humanAccepted: false}, null, 2));
    }
};
