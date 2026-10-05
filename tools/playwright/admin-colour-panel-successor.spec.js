// SM-46 local-supervised native popup proof. Draft edits only, no settings Save.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Administration shared colour panel preserves native settings',async({page},testInfo)=>{
    test.setTimeout(180000);
    const records=[],errors=[],blocked=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=new URL('/admin/settings.php?section=local_groupimport',process.env.EASYEDU_MOODLE_URL).toString();
    const guard=async route=>{if(route.request().method()==='GET')await route.continue();
        else{blocked.push(route.request().method());await route.abort('blockedbyclient');}};
    try{
        for(const width of [1600,768,390]){
            await page.setViewportSize({width,height:1100});await page.unroute('**/admin/settings.php*',guard).catch(()=>undefined);
            await page.goto(url);if(page.url().includes('/login/')){
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));await page.goto(url);
            }
            await page.route('**/admin/settings.php*',guard);
            await expect(page.locator('body')).not.toHaveClass(/local-groupimport-admin-settings-page--loading/,{timeout:60000});
            await expect(page.locator('[data-easyedu-color-picker]')).toHaveCount(7);
            await expect(page.locator('.easyedu-color-picker__trigger')).toHaveCount(7);
            const control=page.locator('[data-easyedu-color-picker]').first(),hex=control.locator('.easyedu-color-picker__hex'),
                trigger=control.locator('.easyedu-color-picker__trigger'),initial=await hex.inputValue();
            expect(await control.locator('input[type=color]').getAttribute('name')).toBeNull();
            const fieldNames=await page.locator('#adminsettings [name]').evaluateAll(ns=>ns.map(n=>n.name));
            await trigger.click();const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();
            const draft=dialog.locator('input[type=text]');await expect(draft).toBeFocused();
            await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
            const measure=await dialog.evaluate(n=>{
                const r=n.getBoundingClientRect(),s=getComputedStyle(n);
                const probe=document.createElement('div');
                probe.style.cssText='position:fixed;inset:0;visibility:hidden;pointer-events:none';document.body.appendChild(probe);
                const viewport=probe.getBoundingClientRect().width;probe.remove();
                return {w:r.width,h:r.height,x:r.x,right:r.right,viewport,rootClientWidth:document.documentElement.clientWidth,
                    rootRectWidth:document.documentElement.getBoundingClientRect().width,bodyWidth:document.body.getBoundingClientRect().width,
                    maxInlineSize:s.maxInlineSize,computedInlineSize:s.inlineSize,overflow:n.scrollWidth-n.clientWidth,
                    primary:s.getPropertyValue('--easyedu-primary').trim(),title:getComputedStyle(n.querySelector('h2')).fontSize,
                    actions:[...n.querySelectorAll('.easyedu-dialog-actions button')].map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);
                        return {h:r.height,font:s.fontSize,weight:s.fontWeight,right:r.right};})};
            });
            records.push({width,stage:'measured',measure});
            expect(measure.w).toBeCloseTo(Math.min(352,measure.viewport-32),1);
            expect(measure.x).toBeGreaterThanOrEqual(16);
            expect(measure.right).toBeLessThanOrEqual(measure.viewport-16);expect(measure.overflow).toBe(0);
            expect(measure.title).toBe('16px');expect(measure.actions[0].h).toBeCloseTo(measure.actions[1].h,2);
            expect(measure.actions[0].h).toBeCloseTo(37.6,1);expect(measure.actions[0].font).toBe('14.08px');
            await draft.fill('#bad');await expect(dialog.locator('.easyedu-button')).toBeDisabled();
            await expect(dialog.locator('[role=status]')).toBeVisible();expect(await hex.inputValue()).toBe(initial);
            await page.screenshot({path:testInfo.outputPath(`colour-panel-invalid-${width}.png`)});
            await draft.fill('#FADEAA');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
            expect(await hex.inputValue()).toBe(initial);
            await trigger.click();await draft.fill('#FADEAA');await dialog.locator('.easyedu-button').click();
            expect(await hex.inputValue()).toBe('#FADEAA');await expect(trigger).toBeFocused();
            await expect(control.locator('input[type=color]')).toHaveValue('#fadeaa');
            await expect(page.locator('#adminsettings [name]')).toHaveCount(fieldNames.length);
            // Restore only this unsaved draft, retaining saved settings and the configured palette.
            await hex.fill(initial);await hex.dispatchEvent('change');
            await page.emulateMedia({reducedMotion:'reduce'});await trigger.click();
            expect(await dialog.evaluate(n=>getComputedStyle(n).animationName)).toBe('none');
            await page.screenshot({path:testInfo.outputPath(`colour-panel-${width}.png`)});
            await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'no-preference'});
            records.push({width,measure,namedHexUnchanged:true,cancel:true,applyDraft:true,reducedMotion:true});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('admin-colour-panel-successor.json'),JSON.stringify({records,errors,blocked},null,2));}
});
