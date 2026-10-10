const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// Local-supervised presentation only. No fixture, course mutation or reset.
test('Guide regular fullscreen glyph preserves native lifecycle',async({page},info)=>{
    test.setTimeout(180000);
    const errors=[],blocked=[],result={courseWrites:false,fixtures:false,nativeFullscreen:false};
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push('Unexpected plugin write');return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();
        const calls=route.request().postDataJSON().map(call=>call.methodname);
        if(calls.every(name=>name==='core_message_get_unsent_message'))return route.fulfill({contentType:'application/json',
            body:JSON.stringify(calls.map(()=>({error:false,data:{}})))});
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(calls.every(name=>reads.has(name)))return route.continue();
        blocked.push(calls);return route.abort('blockedbyclient');
    });
    try{
        await page.setViewportSize({width:1280,height:900});
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        // The bounded welcome predecessor already acknowledged this QA account.
        expect(await page.evaluate(()=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig.welcomeOffer)).toBe(false);
        const launcher=page.locator('[data-easyedu-guide-open]:visible').first();
        const modal=page.locator('[data-easyedu-guide-modal]');
        const fullscreen=modal.locator('[data-easyedu-guide-fullscreen]');
        const glyph=fullscreen.locator('[data-easyedu-guide-fullscreen-glyph]');
        const assertGlyph=async active=>{
            await expect(glyph).toHaveCount(1);
            await expect(glyph).toHaveAttribute('d',await glyph.getAttribute(active?'data-exit-path':'data-enter-path'));
            const paint=await fullscreen.evaluate(button=>{
                const svg=button.querySelector('svg'),path=svg.querySelector('path');
                const box=button.getBoundingClientRect(),ink=path.getBoundingClientRect(),style=getComputedStyle(svg);
                return {width:box.width,height:box.height,iconWidth:svg.getBoundingClientRect().width,
                    fontSize:parseFloat(style.fontSize),strokeWidth:parseFloat(getComputedStyle(path).strokeWidth),
                    stroke:getComputedStyle(path).stroke,color:getComputedStyle(button).color,
                    dx:ink.x+ink.width/2-box.x-box.width/2,dy:ink.y+ink.height/2-box.y-box.height/2,
                    focusable:svg.getAttribute('focusable'),decorative:svg.getAttribute('aria-hidden')};
            });
            expect(paint.width).toBeCloseTo(30.4,1);expect(paint.height).toBeCloseTo(30.4,1);
            expect(paint.iconWidth).toBeCloseTo(paint.fontSize,1);
            expect(paint.strokeWidth).toBe(1.25);expect(paint.stroke).toBe(paint.color);
            expect(Math.abs(paint.dx)).toBeLessThan(1);expect(Math.abs(paint.dy)).toBeLessThan(1);
            expect(paint.decorative).toBe('true');expect(paint.focusable).toBe('false');
            result.glyphPaint ||= [];result.glyphPaint.push({active,...paint});
        };
        const course=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('id');
        const storageKey='local_groupimport.easyedu_guide.'+course+'.checklist';
        const completed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').completed||{},storageKey);
        for(const reducedMotion of ['no-preference','reduce']){
            await page.emulateMedia({reducedMotion});
            await launcher.click();
            await expect(modal).toBeVisible();
            const slide=await modal.locator('[data-easyedu-guide-slide]:visible').first().getAttribute('data-easyedu-guide-slide');
            await expect(fullscreen).toBeVisible();
            await assertGlyph(false);
            await fullscreen.click();
            await page.waitForFunction(()=>document.fullscreenElement?.matches('[data-easyedu-guide-modal]'));
            await expect(fullscreen).toHaveAttribute('aria-pressed','true');
            await assertGlyph(true);
            await modal.evaluate(async element=>{
                const finite=element.getAnimations({subtree:true}).filter(animation=>
                    Number.isFinite(animation.effect?.getComputedTiming().iterations));
                await Promise.all(finite.map(animation=>animation.finished.catch(()=>{})));
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
            });
            const geometry=await modal.locator('.easyedu-guide-modal__dialog').evaluate(element=>{
                const rect=element.getBoundingClientRect();
                return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,viewportWidth:innerWidth,viewportHeight:innerHeight};
            });
            result.geometryDiagnostic=await modal.evaluate(element=>{
                const nodes=[element,element.querySelector('.easyedu-guide-modal__dialog'),document.documentElement];
                return nodes.map(node=>{
                    const style=getComputedStyle(node),rect=node.getBoundingClientRect();
                    return {classes:node.className,x:rect.x,y:rect.y,width:rect.width,height:rect.height,
                        cssWidth:style.width,maxWidth:style.maxWidth,padding:style.padding,margin:style.margin,
                        overflow:style.overflow,scrollbarGutter:style.scrollbarGutter,transform:style.transform,
                        boxSizing:style.boxSizing,clientWidth:node.clientWidth,viewportWidth:innerWidth};
                });
            });
            expect(Math.abs(geometry.x)).toBeLessThan(1);expect(Math.abs(geometry.y)).toBeLessThan(1);
            expect(Math.abs(geometry.width-geometry.viewportWidth)).toBeLessThan(1);
            expect(Math.abs(geometry.height-geometry.viewportHeight)).toBeLessThan(1);
            await page.keyboard.press('Escape');
            await page.waitForFunction(()=>document.fullscreenElement===null);
            await expect(modal).toBeVisible();
            await assertGlyph(false);
            expect(await modal.locator('[data-easyedu-guide-slide]:visible').first().getAttribute('data-easyedu-guide-slide')).toBe(slide);
            await fullscreen.click();
            await page.waitForFunction(()=>document.fullscreenElement!==null);
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();
            expect(await page.evaluate(()=>document.fullscreenElement===null)).toBe(true);
            await expect(launcher).toBeFocused();
            result[reducedMotion]={geometry,escapeKeepsSlide:true,closeExitsAndReturnsFocus:true};
        }
        await launcher.click();await expect(modal).toBeVisible();
        await fullscreen.click();await page.waitForFunction(()=>document.fullscreenElement!==null);
        await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
        await expect(page.locator('[data-easyedu-guide-root]')).toHaveAttribute('data-easyedu-guide-current-slide','3');
        await modal.locator('[data-easyedu-guide-show-target]:visible').first().click();
        await expect(modal).toBeHidden();
        expect(await page.evaluate(()=>document.fullscreenElement===null)).toBe(true);
        result.showInInterfaceExits=true;
        await page.setViewportSize({width:390,height:900});
        await expect(fullscreen).toBeHidden();
        result.mobileControlSuppressed=true;result.nativeFullscreen=true;
        expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').completed||{},storageKey)).toEqual(completed);
        result.pathCompletionUnchanged=true;
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        fs.writeFileSync(info.outputPath('guide-fullscreen-glyph-result.json'),JSON.stringify({...result,errors,blocked},null,2));
    }
});
