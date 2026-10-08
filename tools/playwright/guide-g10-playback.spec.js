const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local supervised: actual Moodle template and built controller. No fixtures,
// no Create/Move/Send or preference request. Route policy fails on unexpected writes.
test('Guide G10 playback pause resume next and departure', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    // Bound missing controls, not login or optional external asset loading.
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
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
        for (const [width, motion] of [[1280, 'no-preference'], [390, 'no-preference'], [768, 'reduce']]) {
            await page.setViewportSize({width, height: 1000});
            await page.emulateMedia({reducedMotion: motion});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
            const slide = modal.locator('[data-easyedu-guide-slide="3"]');
            const scene = slide.locator('[data-easyedu-guide-scene="actions"]');
            // The sticky reading banner is a sibling above the teaching scene.
            const live = slide.locator('[data-guide-live]');
            const pause = live.locator('[data-guide-playback="pause"]');
            const next = live.locator('[data-guide-playback="next-phase"]');
            if (motion === 'reduce') {
                await expect(scene).toHaveAttribute('data-guide-scene-finished', 'true');
            } else {
                await expect(scene).toHaveAttribute('data-guide-phase', 'select', {timeout: 20000});
                await pause.click();
                await expect(pause).toHaveAttribute('aria-pressed', 'true');
                await expect(pause.locator('.fa-play')).toHaveCount(1);
                const copy = await live.locator('[data-guide-live-copy]').textContent();
                await page.waitForTimeout(600);
                await expect(scene).toHaveAttribute('data-guide-phase', 'select');
                expect(await live.locator('[data-guide-live-copy]').textContent()).toEqual(copy);
                await next.dblclick();
                await expect(scene).toHaveAttribute('data-guide-phase', 'menu');
                await expect(live).toHaveAttribute('data-guide-playback-state', 'paused');
                await page.waitForTimeout(600);
                await expect(scene).toHaveAttribute('data-guide-phase', 'menu');
                await pause.click();
                await expect(live).toHaveAttribute('data-guide-playback-state', 'playing');
                await pause.click();
                for (const phase of ['confirm', 'validate']) {
                    await next.click();
                    await expect(scene).toHaveAttribute('data-guide-phase', phase);
                    await expect(live).toHaveAttribute('data-guide-playback-state', 'paused');
                }
                // G10-D: confirmation may have scrolled the cards out of view.
                // Resume naturally, rather than skipping the transfer itself.
                const backgroundScroll = await page.evaluate(() => window.scrollY);
                await modal.locator('.easyedu-guide-modal__body').evaluate(n => { n.scrollTop = n.scrollHeight; });
                await pause.evaluate(n => n.click());
                if (width > 768) {
                    await page.waitForFunction(() => document.getAnimations().some(a =>
                        a.effect?.target?.classList.contains('easyedu-guide-scene__person') &&
                        a.effect.getTiming().duration === 1200 && a.playState === 'running'), null, {timeout: 30000});
                    const visibility = await scene.locator('[data-guide-source] .easyedu-guide-scene__person').first().evaluate(n => {
                        const body = n.closest('.easyedu-guide-modal__body').getBoundingClientRect();
                        const card = n.getBoundingClientRect();
                        return {cardTop:card.top,cardBottom:card.bottom,top:body.top,bottom:body.bottom};
                    });
                    expect(visibility.cardTop).toBeGreaterThanOrEqual(visibility.top);
                    expect(visibility.cardTop).toBeLessThan(visibility.bottom);
                    expect(visibility.cardBottom).toBeGreaterThan(visibility.top);
                }
                await expect(scene).toHaveAttribute('data-guide-scene-finished', 'true');
                expect(await page.evaluate(() => window.scrollY)).toEqual(backgroundScroll);
            }
            await expect(pause).toBeDisabled(); await expect(next).toBeDisabled();
            await expect(live.locator('[data-guide-activity]')).toBeHidden();
            await expect(scene.locator('[data-guide-recap]')).toBeVisible();
            const geometry = await live.evaluate(node => {
                const controls = [...node.querySelectorAll('[data-guide-playback]')].map(c => {
                    const r = c.getBoundingClientRect(); return {width:r.width,height:r.height};
                });
                return {overflow:node.scrollWidth > node.clientWidth + 1, controls};
            });
            expect(geometry.overflow).toBe(false);
            expect(Math.abs(geometry.controls[0].height - geometry.controls[1].height)).toBeLessThan(0.01);
            await scene.locator('[data-guide-scene-command="reset"]').click();
            await expect(live).toHaveAttribute('data-guide-playback-state', 'idle');
            await modal.locator('[data-easyedu-guide-nav-item="2"]').click();
            const intro = modal.locator('[data-easyedu-guide-slide="2"] .easyedu-guide-scene__intro');
            await expect(intro).toBeVisible();
            const introGeometry = await intro.evaluate(n => ({width:n.clientWidth,scroll:n.scrollWidth}));
            expect(introGeometry.width).toBeGreaterThan(0);
            expect(introGeometry.scroll).toBeLessThanOrEqual(introGeometry.width + 1);
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toBeHidden();
            expect(await page.evaluate(() => document.querySelector('[data-easyedu-guide-root]').easyeduGuideScenePlayback)).toBeNull();
            rows.push({width,motion,geometry,introGeometry,moveRevealVerified:motion !== 'reduce',finishedAndReset:true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g10-playback-result.json'), JSON.stringify({rows,errors,blocked,
            fixtureRequested:false,businessTransactionConfirmed:false},null,2));
    }
});
