const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised; open/hover/keyboard/close only. No course/settings writes.
test('Guide Light tooltips expose truncated labels in native portal', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
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
        const root = page.locator('[data-easyedu-guide-root]');
        await page.setViewportSize({width:1280,height:1000});
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal = page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toHaveCount(1);
        const tip = page.locator('.easyedu-guide-label-tooltip');
        for (const width of [1280,768,390]) {
            await page.setViewportSize({width,height:1000});
            const candidate = await modal.locator('[data-easyedu-guide-nav-item]').evaluateAll(buttons => {
                const button = buttons.find(button => {
                    const label = button.querySelector('.easyedu-guide-nav-copy > span');
                    return label && label.scrollWidth > label.clientWidth + 1;
                });
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
            rows.push({width, candidate,paint,portal:await root.getAttribute('data-easyedu-guide-portal-theme')});
            await page.mouse.move(width-5,995); await expect(tip).toHaveCount(0);
            let focused = false;
            for (let index=0;index<50;index++) {
                await page.keyboard.press('Tab');
                if (await button.evaluate(node=>node===document.activeElement)) { focused=true;break; }
            }
            expect(focused,'Reach the real control through Tab').toBe(true);
            await expect(tip).toBeVisible(); await expect(tip).toHaveText(candidate.text);
            await page.keyboard.press('Tab'); await expect(tip).toHaveCount(0);
        }
        await modal.locator('[data-easyedu-guide-close]').first().click();
        await expect(modal).toHaveCount(0); await expect(tip).toHaveCount(0);
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-light-tooltips-result.json'), JSON.stringify({rows,errors,blocked,
            settingsWrites:false,businessWrites:false,actualTouchDevice:false,nativeFullscreen:false},null,2));
    }
});
