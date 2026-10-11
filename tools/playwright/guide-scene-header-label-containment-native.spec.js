const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: actual Moodle Guide, fictional scenes, isolated progress key.
test('Localized Guide header labels fit their own padded controls in Moodle', async ({page}, info) => {
    test.setTimeout(300000);
    const rows = [], errors = [], blocked = [];
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
        const methods = route.request().postDataJSON().map(call => call.methodname);
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state', 'core_message_get_unsent_message']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort();
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const qaKey = 'guide-scene-header-label-containment-native-qa';
    try {
        for (const language of ['en', 'fr']) {
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.searchParams.set('lang', language);
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language));
            await page.evaluate(async key => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                root.headerQaOriginal = config; Guide.destroy(root);
                Guide.init(root, {...config, firstVisit: false, welcomeOffer: false, storageKey: key});
            }, qaKey);
            for (const width of [1280, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                if (!await page.locator('[data-easyedu-guide-open]:visible').count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
                const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
                await expect(modal).toBeVisible();
                const scene = modal.locator('[data-easyedu-guide-scene="membership"]');
                const index = await scene.evaluate(n => n.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const header = scene.locator('[data-guide-scene-header]'); await expect(header).toBeVisible();
                await expect(header).toHaveAttribute('data-guide-playback-state', 'idle');
                await expect(header.locator('[data-guide-playback="pause"]')).toBeHidden();
                await expect(scene.locator('[data-guide-memberships]')).toHaveAttribute('data-guide-membership-preview', '');
                await header.locator('[data-guide-scene-command="move"]').click();
                await expect(header.locator('[data-guide-scene-command="move"]')).toHaveAttribute('aria-pressed', 'true');
                await expect(scene.locator('[data-guide-membership-origin]')).toHaveClass(/is-removed/);
                const geometry = await header.evaluate(n => {
                    const r = n.getBoundingClientRect();
                    const visible = [...n.querySelectorAll('button, [data-guide-live-copy]')].filter(t => t.getClientRects().length);
                    const paint = visible.map(t => {
                        const range = document.createRange(); range.selectNodeContents(t);
                        const b = range.getBoundingClientRect(), own = t.getBoundingClientRect(), css = getComputedStyle(t);
                        const inset = t.tagName === 'BUTTON' ? {
                            left: parseFloat(css.paddingLeft) + parseFloat(css.borderLeftWidth),
                            right: parseFloat(css.paddingRight) + parseFloat(css.borderRightWidth)
                        } : {left: 0, right: 0};
                        return {text: t.textContent.trim(),
                            fitsOwnLane: b.left >= own.left + inset.left - 1 && b.right <= own.right - inset.right + 1 &&
                                b.top >= own.top - 1 && b.bottom <= own.bottom + 1,
                            fitsHeader: b.left >= r.left - 1 && b.right <= r.right + 1 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1,
                            scrollOverflow: t.scrollWidth > t.clientWidth + 1};
                    });
                    return {headerInlineSize: r.width, paint,
                        overflow: paint.filter(t => !t.fitsOwnLane || !t.fitsHeader || t.scrollOverflow).map(t => t.text),
                        height: n.querySelector('[data-guide-scene-command="start"]').getBoundingClientRect().height};
                });
                rows.push({language, viewportWidth: width, ...geometry});
                expect(geometry.overflow).toEqual([]); expect(geometry.height).toBeCloseTo(30.4, 1);
                await header.screenshot({path: info.outputPath(`${language}-${width}-ready.png`)});
                await header.locator('[data-guide-scene-command="start"]').click();
                await header.locator('[data-guide-playback="pause"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state', 'paused');
                await expect(header.locator('[data-guide-phase-caption]')).toContainText('1/4');
                await expect(header.locator('[data-guide-scene-command="start"]')).toBeDisabled();
                await header.screenshot({path: info.outputPath(`${language}-${width}-paused.png`)});
                await scene.locator('[data-guide-scene-command="reset"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state', 'idle');
                await expect(header.locator('[data-guide-playback="pause"]')).toBeHidden();
                await page.keyboard.press('Escape'); await expect(modal).toBeHidden();
            }
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(async key => {
            const root = document.querySelector('[data-easyedu-guide-root]');
            if (root?.headerQaOriginal) {
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                Guide.destroy(root); Guide.init(root, root.headerQaOriginal); delete root.headerQaOriginal;
            }
            localStorage.removeItem(key);
            localStorage.removeItem(key + '.checklist');
        }, qaKey).catch(() => {});
        fs.writeFileSync(info.outputPath('scene-header-label-containment-native.json'), JSON.stringify({rows, errors, blocked, humanAccepted: false}, null, 2));
    }
});
