const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised; open/hover/keyboard/close only. No course/settings writes.
test('French Guide Light tooltips remain readable in native fullscreen and compact portal', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
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
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status:200, contentType:'application/json', body:JSON.stringify(methods.map(() => ({error:false,data:{}})))
        });
        const reads = new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: 'no-preference'});
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
        await page.evaluate(async() => {
            const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root);
            root.tooltipQaConfig = config;
            Guide.init(root, {...config, firstVisit: false, welcomeOffer: false, storageKey: 'guide-tooltip-localized-qa'});
        });
        const root = page.locator('[data-easyedu-guide-root]');
        await page.setViewportSize({width:1280,height:1000});
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal = page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toHaveCount(1);
        const tip = page.locator('.easyedu-guide-label-tooltip');
        for (const profile of [{width:1280, fullscreen:false}, {width:1280, fullscreen:true},
            {width:768, fullscreen:false}, {width:390, fullscreen:false}]) {
            const width = profile.width;
            await page.setViewportSize({width,height:1000});
            if (profile.fullscreen) {
                await modal.locator('[data-easyedu-guide-fullscreen]').click();
                await page.waitForFunction(() => document.fullscreenElement?.matches('[data-easyedu-guide-modal]'));
            }
            await modal.evaluate(async node => {
                const finite = node.getAnimations({subtree:true}).filter(animation =>
                    Number.isFinite(animation.effect?.getComputedTiming().iterations));
                await Promise.all(finite.map(animation => animation.finished.catch(() => {})));
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            });
            const candidate = await modal.locator('[data-easyedu-guide-nav-item]').evaluateAll(buttons => {
                const button = buttons.filter(button => {
                    const label = button.querySelector('.easyedu-guide-nav-copy > span');
                    return label && label.scrollWidth > label.clientWidth + 1;
                }).sort((a,b) => b.querySelector('.easyedu-guide-nav-copy > span').textContent.length -
                    a.querySelector('.easyedu-guide-nav-copy > span').textContent.length)[0];
                return button ? {index:button.dataset.easyeduGuideNavItem,
                    text:button.querySelector('.easyedu-guide-nav-copy > span').textContent.trim()} : null;
            });
            expect(candidate, 'A real truncated title exists').not.toBeNull();
            const button = modal.locator('[data-easyedu-guide-nav-item="' + candidate.index + '"]');
            await button.scrollIntoViewIfNeeded();
            await button.hover();
            await expect(tip).toBeVisible();
            await expect(tip).toHaveText(candidate.text);
            const paint = await tip.evaluate(node => {
                const style = getComputedStyle(node), rect = node.getBoundingClientRect();
                return {bg:style.backgroundColor,fg:style.color,radius:style.borderRadius,
                    weight:style.fontWeight,size:style.fontSize,long:node.classList.contains('is-multiline'),
                    x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom,
                    owned:node.parentElement.hasAttribute('data-easyedu-guide-modal')};
            });
            expect(paint.bg).toBe('rgb(248, 251, 253)'); expect(paint.fg).toBe('rgb(49, 72, 95)');
            expect(paint.radius).toBe('10.24px'); expect(paint.weight).toBe(paint.long ? '600' : '700');
            expect(paint.size).toBe(paint.long ? '12.16px' : '11.84px'); expect(paint.owned).toBe(true);
            expect(paint.x).toBeGreaterThanOrEqual(11);expect(paint.right).toBeLessThanOrEqual(width-11);
            expect(paint.y).toBeGreaterThanOrEqual(11);expect(paint.bottom).toBeLessThanOrEqual(989);
            rows.push({width, language, nativeFullscreen:profile.fullscreen, candidate,paint,portal:await root.getAttribute('data-easyedu-guide-portal-theme')});
            await page.mouse.move(width-5,995); await expect(tip).toHaveCount(0);
            let focused = false;
            for (let index=0;index<50;index++) {
                await page.keyboard.press('Tab');
                if (await button.evaluate(node=>node===document.activeElement)) { focused=true;break; }
            }
            expect(focused,'Reach the real control through Tab').toBe(true);
            await expect(tip).toBeVisible(); await expect(tip).toHaveText(candidate.text);
            await page.keyboard.press('Tab'); await expect(tip).toHaveCount(0);
            if (profile.fullscreen) {
                await page.keyboard.press('Escape');
                await page.waitForFunction(() => document.fullscreenElement === null);
                await expect(modal).toBeVisible();
                await expect(tip).toHaveCount(0);
            }
        }
        await modal.locator('[data-easyedu-guide-close]').first().click();
        await expect(modal).toHaveCount(0); await expect(tip).toHaveCount(0);
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(async() => {
            const root = document.querySelector('[data-easyedu-guide-root]');
            if (!root?.tooltipQaConfig) return;
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root);
            localStorage.removeItem('guide-tooltip-localized-qa.checklist');
            localStorage.removeItem('guide-tooltip-localized-qa.checklist.before-' + root.tooltipQaConfig.presentationKey);
        }).catch(() => {});
        fs.writeFileSync(info.outputPath('guide-light-tooltips-localized-result.json'), JSON.stringify({rows,errors,blocked,
            settingsWrites:false,businessWrites:false,actualTouchDevice:false,nativeFullscreen:rows.some(row=>row.nativeFullscreen),realUserProgressWritten:false},null,2));
    }
});
