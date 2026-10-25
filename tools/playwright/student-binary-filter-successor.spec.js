const {test,expect}=require('@playwright/test'),fs=require('node:fs');

// local-supervised: existing course, client-side checkbox + Reset only.
test('Trailing catalogue filter preserves native checkbox and responsive Reset',async({page},testInfo)=>{
    test.setTimeout(240000);
    const root=page.locator('#local-groupimport-easystud'),records=[],errors=[],blocked=[];
    const guard=async route=>{
        if(route.request().method()==='GET')await route.continue();
        else{blocked.push(route.request().method());await route.abort('blockedbyclient');}
    };
    page.on('pageerror',error=>errors.push(error.message));
    await page.emulateMedia({reducedMotion:'no-preference'});
    try{
        for(const width of [1600,768,390]){
            await page.unroute('**/local/groupimport/**',guard).catch(()=>undefined);
            await page.setViewportSize({width,height:1100});await page.goto(process.env.EASYEDU_MOODLE_URL);
            if(page.url().includes('/login/')){
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL);
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await page.route('**/local/groupimport/**',guard);
            for(const [mode,key,catalogue]of width>1024?
                [['participants','participant-groups','participants'],['structure','structure-groups','structure']]:
                [['groups','structure-groups','structure']]){
                await root.locator(width>1024?`[data-easystud-layout-mode="${mode}"]:visible`:
                    `[data-easystud-mobile-view="${mode}"]:visible`).click();
                const more=root.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
                const panel=root.locator(`[data-easystud-advanced-filters="${key}"]`);
                if(await more.getAttribute('aria-expanded')!=='true')await more.click();
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                const input=panel.locator(`[data-easystud-catalog-show-ungrouped="${catalogue}"]`),
                    label=input.locator('..'),reset=panel.locator(`[data-easystud-reset-catalog-filters="${catalogue}"]`);
                await expect(input).not.toBeChecked();await label.click();await expect(input).toBeChecked();
                await expect(reset).toBeVisible();await page.waitForTimeout(220);
                const paint=await label.evaluate(n=>{
                    const s=getComputedStyle(n),r=n.getBoundingClientRect(),span=n.querySelector('span'),
                        track=getComputedStyle(span,'::before'),thumb=getComputedStyle(span,'::after'),
                        b=n.parentElement.querySelector('[data-easystud-reset-catalog-filters]').getBoundingClientRect(),
                        p=n.parentElement.getBoundingClientRect();
                    return {font:s.fontSize,weight:s.fontWeight,width:r.width,height:r.height,
                        trackWidth:track.width,trackHeight:track.height,thumbWidth:thumb.width,
                        labelStart:getComputedStyle(span).paddingInlineStart,labelEnd:getComputedStyle(span).paddingInlineEnd,
                        trackEnd:track.insetInlineEnd,resetGap:b.left-r.right,resetDeltaY:b.top-r.top,
                        resetHeight:b.height,resetRight:b.right,laneRight:p.right};
                });
                expect(paint.font).toBe('12.16px');expect(paint.weight).toBe('600');
                expect(paint.height).toBe(44);expect(paint.trackWidth).toBe('36px');
                expect(paint.trackHeight).toBe('20px');expect(paint.thumbWidth).toBe('14px');
                expect(paint.labelStart).toBe('0px');expect(paint.labelEnd).toBe('44px');
                expect(paint.trackEnd).toBe('0px');expect(paint.resetGap).toBeCloseTo(12,1);
                expect(paint.resetRight).toBeLessThanOrEqual(paint.laneRight+.1);
                expect(Math.abs(paint.resetHeight-(width>832?30.4:44))).toBeLessThan(.1);
                expect(Math.abs(paint.resetDeltaY-(44-paint.resetHeight)/2)).toBeLessThan(.1);
                await input.focus();await page.keyboard.press('Space');await expect(input).not.toBeChecked();
                expect(await label.evaluate(n=>getComputedStyle(n).boxShadow)).not.toBe('none');
                await page.keyboard.press('Space');await expect(input).toBeChecked();
                await panel.locator('..').screenshot({path:testInfo.outputPath(`trailing-filter-${width}-${catalogue}.png`)});
                await reset.click();await expect(input).not.toBeChecked();
                await expect(more).toHaveAttribute('aria-expanded',width>1024?'true':'false');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                records.push({width,mode,key,catalogue,paint,keyboard:true,resetWorks:true,resetClosesPanel:width<=1024});
                if(width>1024)await more.click();
                await expect(more).toHaveAttribute('aria-expanded','false');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            }
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        fs.writeFileSync(testInfo.outputPath('binary-filter-native-successor.json'),JSON.stringify({records,errors,blocked},null,2));
    }
});
