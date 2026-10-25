const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised G10-B: no fixtures, no course command or preference writes.
test('Guide G10 shared header and completion presentation', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
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
        for (const [width, motion] of [[1280, 'no-preference'], [768, 'reduce'], [390, 'reduce']]) {
            await page.setViewportSize({width, height: 1000});
            await page.emulateMedia({reducedMotion: motion});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            const header = await modal.locator('.easyedu-guide-modal__header').evaluate(async node => {
                await document.fonts.ready;
                const dialog = node.closest('.easyedu-guide-modal__dialog');
                await Promise.all(dialog.getAnimations().filter(animation =>
                    animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const style = getComputedStyle(node), title = node.querySelector('h2'), icon = node.querySelector('.fa-compass');
                const rect = node.getBoundingClientRect(), i = icon.getBoundingClientRect(), t = title.getBoundingClientRect();
                return {padding: style.padding, font: getComputedStyle(title).fontSize,
                    colour: getComputedStyle(title).color, weight: getComputedStyle(title).fontWeight,
                    iconWidth: i.width, iconHeight: i.height,
                    centred: Math.abs((i.top + i.bottom - rect.top - rect.bottom) / 2) < 1,
                    overflow: node.scrollWidth > node.clientWidth + 1,
                    contained: t.left >= rect.left && t.right <= rect.right};
            });
            expect(header.centred && header.contained && !header.overflow).toBeTruthy();
            expect(Number(header.weight)).toBeGreaterThanOrEqual(700);
            // Browser DOMRect float serialization can differ below .001px,
            // even for a square layout box. This is not a paint tolerance.
            expect(Math.abs(header.iconWidth - header.iconHeight)).toBeLessThan(0.001);
            await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
            await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-scene="actions"]')?.dataset.guideSceneFinished === 'true',
                null, {timeout: 90000});
            const live = modal.locator('[data-easyedu-guide-slide="3"] [data-guide-live]');
            await expect(live.locator('[data-guide-live-complete]')).toBeVisible();
            const finish = await live.evaluate(node => {
                const s = getComputedStyle(node);
                return {weight: s.fontWeight, color: s.color, border: s.borderColor, width: s.borderWidth};
            });
            expect(Number(finish.weight)).toBeGreaterThanOrEqual(700);
            expect(finish.color).toEqual(finish.border);
            expect(finish.width).toEqual('2px');
            await modal.locator('[data-easyedu-guide-slide="3"] [data-guide-scene-command="reset"]').click();
            await expect(live.locator('[data-guide-live-complete]')).toBeHidden();
            await expect(live).not.toHaveAttribute('data-guide-live-state', 'finished');
            rows.push({width, motion, header, finish, resetHidesCheck: true});
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g10-chrome-result.json'), JSON.stringify({rows, errors, blocked,
            fixtureRequested: false, businessTransactionConfirmed: false}, null, 2));
    }
});
