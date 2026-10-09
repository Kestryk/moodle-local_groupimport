const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Presentation only: never submit the global welcome reset or course commands.
test('Guide G11 reset modality and Organisation paragraph presentation', async({page}, info) => {
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
        for (const width of [1280,768,390]) {
            await page.setViewportSize({width,height:900});
            await page.goto(origin+'/admin/settings.php?section=local_groupimport',{waitUntil:'domcontentloaded'});
            const launcher=page.locator('a[href*="reset_guide_welcome.php"]');
            await launcher.hover();
            expect(await launcher.evaluate(n=>getComputedStyle(n).textDecorationLine)).toBe('none');
            await launcher.click();
            const dialog=page.locator('#easyedu-welcome-reset');
            await expect(dialog).toHaveAttribute('data-easyedu-dialog-modal','true');
            const geometry=await dialog.evaluate(n=>{
                const r=n.getBoundingClientRect(),a=n.querySelector('[data-easyedu-dialog-cancel]'),b=n.querySelector('button[type="submit"]');
                return {native:n.matches(':modal'),centreX:Math.abs(r.x+r.width/2-innerWidth/2),
                    centreY:Math.abs(r.y+r.height/2-innerHeight/2),overflow:n.scrollWidth>n.clientWidth,
                    pair:Math.abs(a.getBoundingClientRect().height-b.getBoundingClientRect().height),cancelFocus:document.activeElement===a};
            });
            expect(geometry.native && geometry.cancelFocus && !geometry.overflow).toBeTruthy();
            expect(geometry.centreX).toBeLessThan(1); expect(geometry.centreY).toBeLessThan(1);expect(geometry.pair).toBeLessThan(.1);
            await page.screenshot({path:info.outputPath('reset-modal-'+width+'.png')});
            await page.keyboard.press('Escape');
            await page.waitForURL(url=>url.pathname.endsWith('/admin/settings.php'));
            await page.goto(origin+'/local/groupimport/reset_guide_welcome.php',{waitUntil:'domcontentloaded'});
            await expect(dialog).toHaveAttribute('data-easyedu-dialog-modal','true');
            await dialog.locator('[data-easyedu-dialog-cancel]').click();
            await page.waitForURL(url=>url.pathname.endsWith('/admin/settings.php'));
            rows.push({width,reset:geometry,escapeAndCancel:true});
            await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await modal.locator('[data-easyedu-guide-nav-item="2"]').click();
            const paragraph=modal.locator('[data-easyedu-guide-slide="2"] .easyedu-guide-slide__content p');
            await expect(paragraph).toBeVisible();
            const copy=await paragraph.evaluate(n=>{
                const r=n.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);
                return {whiteSpace:getComputedStyle(n).whiteSpace,overflow:n.scrollWidth>n.clientWidth+1,
                    inside:r.left>=p.left-1 && r.right<=p.right+1,
                    paintFits:[...range.getClientRects()].every(t=>t.left>=p.left-1 && t.right<=p.right+1)};
            });
            expect(copy.whiteSpace).toBe('normal');expect(copy.inside && copy.paintFits && !copy.overflow).toBeTruthy();
            rows.at(-1).organisation=copy;
            await page.screenshot({path:info.outputPath('organisation-'+width+'.png')});
            await modal.locator('[data-easyedu-guide-close]').first().click();
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g11-result.json'),JSON.stringify({rows,errors,blocked,
            resetConfirmed:false,courseWrites:false,fixtures:false},null,2));
    }
});
