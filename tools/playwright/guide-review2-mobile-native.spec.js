const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');
test('review2 approved compact expected outcome in actual Moodle', async ({page}, info) => {
    test.setTimeout(360000);
    const rows=[],errors=[],blocked=[],qaKey='guide-review2-mobile-native-qa';
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
    }
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();blocked.push('plugin write');return route.abort();
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();const calls=route.request().postDataJSON();
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(areSafeAjaxReads(calls, reads))return route.continue();
        if(calls.every(call=>call.methodname==='core_message_get_unsent_message'))return route.fulfill({contentType:'application/json',body:JSON.stringify(calls.map(()=>({error:false,data:[]})))});
        blocked.push(calls.map(call=>call.methodname));return route.abort();
    });
    const restore=()=>page.evaluate(async key=>{
        const root=document.querySelector('[data-easyedu-guide-root]');
        if(root?.review2MobileOriginalConfig){const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));Guide.destroy(root);Guide.init(root,root.review2MobileOriginalConfig);delete root.review2MobileOriginalConfig;}
        localStorage.removeItem(key);localStorage.removeItem(key+'.checklist');
    },qaKey);
    try{
        for(const language of ['en','fr'])for(const width of [1600,1280,390,320]){
            await page.setViewportSize({width,height:width===1600?900:width===1280?800:844});await page.emulateMedia({reducedMotion:'no-preference'});
            const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang',language);await page.goto(url.href,{waitUntil:'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language));
            await page.evaluate(async key=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                root.review2MobileOriginalConfig=root.easyeduGuideConfig;Guide.destroy(root);Guide.init(root,{...root.review2MobileOriginalConfig,firstVisit:false,welcomeOffer:false,storageKey:key});
            },qaKey);
            if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="6"]').click();const scene=modal.locator('[data-easyedu-guide-scene="membership"]');await expect(scene).toBeVisible();
            await expect.poll(()=>modal.evaluate(node=>node.getAnimations({subtree:true}).filter(animation=>animation.effect.getComputedTiming().iterations!==Infinity&&['running','paused'].includes(animation.playState)).length)).toBe(0);
            const measure=()=>scene.evaluate(node=>{
                const h=node.querySelector('[data-guide-scene-header]'),m=node.querySelector('[data-guide-memberships]'),origin=m.querySelector('[data-guide-membership-origin]'),target=m.querySelector('[data-guide-membership-target]');
                const rect=e=>{const r=e.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width};};
                return {header:rect(h),preview:m.hasAttribute('data-guide-membership-preview'),origin:rect(origin),target:rect(target),
                    compactLabelDisplay:getComputedStyle(m.querySelector('.easyedu-guide-scene__unchanged-label--compact')).display,
                    compactLabel:m.querySelector('.easyedu-guide-scene__unchanged-label--compact').textContent,
                    pills:[...m.querySelectorAll(':scope > span')].map(span=>({border:parseFloat(getComputedStyle(span).borderTopWidth),rect:rect(span),width:span.clientWidth,scroll:span.scrollWidth})),
                    font:getComputedStyle(m).fontFamily};
            });
            for(const mode of ['add','move']){
                await scene.locator(`[data-guide-scene-command="${mode}"]`).click();const row={language,width,mode,...await measure()};rows.push(row);
                expect(row.preview).toBe(true);expect(row.font).toContain('Inter');
                if(width<=640){
                    expect(row.compactLabelDisplay).toBe('inline');expect(row.compactLabel).toBe(language==='fr'?'inchangé':'unchanged');
                    expect(row.pills.every(pill=>pill.border===0&&pill.scroll<=pill.width)).toBe(true);
                    if(width===390){expect(row.header.height).toBeLessThanOrEqual(200);expect(Math.abs(row.origin.top-row.target.top)).toBeLessThan(1);}
                }else{expect(row.compactLabelDisplay).toBe('none');expect(row.pills.every(pill=>pill.border===1)).toBe(true);}
                if(width===390)await page.screenshot({path:info.outputPath(`${language}-${mode}-compact-ready.png`)});
            }
            if(width===390){
                await scene.locator('[data-guide-scene-command="start"]').click();await expect(scene).toHaveAttribute('data-guide-phase','select');
                await expect(scene.locator('[data-guide-memberships]')).not.toHaveAttribute('data-guide-membership-preview');
                await expect(scene.locator('.easyedu-guide-scene__unchanged-label--compact')).toBeHidden();
                await scene.locator('[data-guide-scene-command="reset"]').click();
                await expect(scene.locator('[data-guide-memberships]')).toHaveAttribute('data-guide-membership-preview','');
                await expect.poll(()=>scene.evaluate(node=>node.getAnimations({subtree:true})
                    .filter(animation=>animation.effect.getComputedTiming().iterations!==Infinity&&['running','paused'].includes(animation.playState)).length)).toBe(0);
                const reset={language,width,mode:'reset',...await measure()};rows.push(reset);expect(reset.header.height).toBeLessThanOrEqual(200);
            }
            await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();await restore();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        await restore().catch(()=>{});fs.writeFileSync(info.outputPath('guide-review2-mobile-native.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false},null,2));
    }
});
