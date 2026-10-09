const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Presentation only: never submit the global welcome reset or course commands.
test('Guide G11 Compare copy contained after canonical wrapping', async({page}, info) => {
    test.setTimeout(240000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil:'commit',timeout:60000});
    }
    const origin = new URL(process.env.EASYEDU_MOODLE_URL).origin;
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        // Existing actual-open acknowledgement is not a global reset/course write.
        if (new URL(route.request().url()).pathname.endsWith('/guide_welcome.php')) return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const calls=route.request().postDataJSON().map(call=>call.methodname);
        if (calls.every(name=>name==='core_message_get_unsent_message')) return route.fulfill({contentType:'application/json',
            body:JSON.stringify(calls.map(()=>({error:false,data:{}})))});
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if (calls.every(name=>reads.has(name))) return route.continue();
        blocked.push(calls); return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        for (const width of [1280,768,390]) {
            await page.setViewportSize({width,height:900});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="2"]').click();
            const compare=guide.locator('[data-easyedu-guide-slide="2"] .easyedu-guide-scene__context p').last();
            await compare.scrollIntoViewIfNeeded();
            const copy=await compare.evaluate(node=>{
                const bounds=node.getBoundingClientRect(),parent=node.parentElement.getBoundingClientRect(),
                    range=document.createRange();range.selectNodeContents(node);
                return {whiteSpace:getComputedStyle(node).whiteSpace,overflow:node.scrollWidth>node.clientWidth+1,
                    inside:bounds.left>=parent.left-1 && bounds.right<=parent.right+1,
                    paintFits:[...range.getClientRects()].every(r=>r.left>=bounds.left-1 && r.right<=bounds.right+1)};
            });
            rows.push({width,copy});
            expect(copy.whiteSpace).toBe('normal');
            expect(copy.inside && copy.paintFits && !copy.overflow).toBeTruthy();
            await page.screenshot({path:info.outputPath('compare-copy-'+width+'.png')});
            await guide.locator('[data-easyedu-guide-close]').first().click();
            await expect(guide).toBeHidden();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g11-compare-result.json'),JSON.stringify({rows,errors,blocked,
            courseWrites:false,fixtures:false},null,2));
    }
});
