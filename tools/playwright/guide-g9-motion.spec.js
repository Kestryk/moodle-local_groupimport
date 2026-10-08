const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised. Illustration only: deny plugin/business writes, no fixture.
test('Guide G9 native responsive narration and scene motion', async({page}, info) => {
    test.setTimeout(540000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({reducedMotion: 'no-preference'});
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
            const modal = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await page.evaluate(() => {
                window.g9NativePhases = [];
                const root = document.querySelector('.easyedu-guide--discovery');
                window.g9NativeObserver = new MutationObserver(entries => {
                    for (const entry of entries) {
                        const scene = entry.target;
                        window.g9NativePhases.push({scene: scene.dataset.easyeduGuideScene,
                            phase: scene.dataset.guidePhase, at: performance.now(),
                            copy: scene.closest('[data-easyedu-guide-slide]').querySelector('[data-guide-live-copy]')?.textContent || ''});
                    }
                });
                root.querySelectorAll('[data-easyedu-guide-scene]').forEach(scene =>
                    window.g9NativeObserver.observe(scene, {attributes: true, attributeFilter: ['data-guide-phase']}));
            });
            for (const [index, name] of [[2, 'membership'], [3, 'actions']]) {
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const slide = modal.locator(`[data-easyedu-guide-slide="${index}"]`);
                await expect(slide).toBeVisible();
                await page.waitForFunction(sceneName => document.querySelector(
                    `[data-easyedu-guide-scene="${sceneName}"]`)?.dataset.guideSceneFinished === 'true', name, {timeout: 60000});
                const result = await slide.evaluate(node => {
                    const scene = node.querySelector('[data-easyedu-guide-scene]');
                    const rect = el => {const b = el.getBoundingClientRect(); return {x: b.x, y: b.y, w: b.width, h: b.height};};
                    const live = node.querySelector('[data-guide-live]');
                    const copy = node.querySelector('[data-guide-live-copy]');
                    const body = node.closest('.easyedu-guide-modal__body');
                    body.scrollTop = body.scrollHeight;
                    return {phase: scene.dataset.guidePhase,
                        finished: scene.dataset.guideSceneFinished,
                        live: rect(live), copy: rect(copy), body: rect(body),
                        weight: getComputedStyle(copy).fontWeight,
                        overflow: [...node.querySelectorAll('p, [data-guide-live-copy], .easyedu-guide-recap li')]
                            .some(el => el.scrollWidth > el.clientWidth + 1),
                        ghostVisible: !!node.querySelector('[data-guide-ghost]') &&
                            getComputedStyle(node.querySelector('[data-guide-ghost]')).display !== 'none',
                        phases: window.g9NativePhases.filter(row => row.scene === scene.dataset.easyeduGuideScene)};
                });
                expect(result.finished).toBe('true');
                expect(result.overflow).toBe(false);
                expect(Number(result.weight)).toBeGreaterThanOrEqual(600);
                expect(Math.abs(result.live.y - result.body.y)).toBeLessThan(1);
                const select = result.phases.find(row => row.phase === 'select');
                const next = result.phases.find(row => row.phase === 'menu');
                expect(select).toBeTruthy(); expect(next).toBeTruthy();
                const words = select.copy.trim().split(/\s+/).length;
                expect(next.at - select.at).toBeGreaterThanOrEqual(Math.max(2400, 900 + words * 60000 / 180));
                if (width <= 768 && name === 'membership') expect(result.ghostVisible).toBe(false);
                records.push({width, scene: name, result});
                await modal.screenshot({path: info.outputPath(`guide-g9-motion-${width}-${name}.png`)});
            }
            await page.evaluate(() => window.g9NativeObserver.disconnect());
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();
            expect(await page.locator('[data-guide-ghost]').count()).toBe(0);
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(() => window.g9NativeObserver?.disconnect()).catch(() => {});
        fs.writeFileSync(info.outputPath('guide-g9-motion-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
