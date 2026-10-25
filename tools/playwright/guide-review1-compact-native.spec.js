const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised: actual Moodle route, original user storage untouched, no business commands.
test('Claude review1 Guide compact header and visible phase outcomes in Moodle',async({page},info)=>{
    test.setTimeout(360000);
    const rows=[],errors=[],blocked=[];const qaKey='guide-review1-compact-native-qa';
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
    }
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();blocked.push('plugin write');return route.abort();
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();
        const calls=route.request().postDataJSON(),methods=calls.map(c=>c.methodname);
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(methods.every(m=>reads.has(m)))return route.continue();
        if(methods.every(m=>m==='core_message_get_unsent_message'))return route.fulfill({contentType:'application/json',body:JSON.stringify(calls.map(()=>({error:false,data:[]})))});
        blocked.push(methods);return route.abort();
    });
    try{
        for(const language of ['en','fr'])for(const width of [1600,1280,390]){
            const height=width===1600?900:width===1280?800:844;
            await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'no-preference'});
            const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang',language);
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language));
            await page.evaluate(async key=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                root.review1OriginalConfig=config;Guide.destroy(root);Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:key});
            },qaKey);
            if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]'),scene=modal.locator('[data-easyedu-guide-scene="membership"]');
            await expect(modal).toBeVisible();
            const index=await scene.evaluate(n=>n.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
            await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
            const header=scene.locator('[data-guide-scene-header]');await expect(header).toBeVisible();
            await header.locator('[data-guide-scene-command="move"]').click();
            await expect.poll(()=>header.evaluate(h=>h.querySelector('[data-guide-memberships]').getBoundingClientRect().bottom<=h.closest('.easyedu-guide-modal__body').getBoundingClientRect().bottom+1)).toBe(true);
            const ready=await header.evaluate(h=>{
                const r=e=>{const b=e.getBoundingClientRect();return{top:b.top,bottom:b.bottom,height:b.height,width:b.width};};
                const modes=h.querySelector('.easyedu-guide-scene__modes'),active=modes.querySelector('[aria-pressed="true"]'),start=h.querySelector('[data-guide-scene-command="start"]');
                return{position:getComputedStyle(h).position,modes:[...modes.querySelectorAll('button')].map(r),start:r(start),
                    activePaint:getComputedStyle(active).backgroundColor,startPaint:getComputedStyle(start).backgroundColor,
                    expected:r(h.querySelector('[data-guide-memberships]')),body:r(h.closest('.easyedu-guide-modal__body')),accessibleName:modes.getAttribute('aria-label')};
            });
            rows.push({language,width,state:'ready',...ready});expect(ready.position).toBe('relative');expect(ready.activePaint).not.toBe(ready.startPaint);expect(ready.accessibleName).toBeTruthy();
            if(width===390){expect(Math.abs(ready.modes[0].top-ready.modes[1].top)).toBeLessThan(1);expect(Math.abs(ready.modes[0].width-ready.modes[1].width)).toBeLessThan(1);expect(ready.start.top).toBeGreaterThanOrEqual(ready.modes[0].bottom);}
            await page.screenshot({path:info.outputPath(`${language}-${width}-ready.png`)});
            await header.locator('[data-guide-scene-command="start"]').click();
            for(const phase of ['select','menu','confirm','validate']){
                await expect(scene).toHaveAttribute('data-guide-phase',phase);
                await expect.poll(()=>header.locator('.easyedu-guide-scene__header-controls').evaluate(n=>n.getBoundingClientRect().height)).toBeLessThan(1);
                const sample=()=>scene.evaluate(n=>{
                    const h=n.querySelector('[data-guide-scene-header]'),hr=h.getBoundingClientRect(),body=n.closest('.easyedu-guide-modal__body');
                    const selectors={select:'[data-guide-person]',menu:'[data-guide-menu]',confirm:'[data-guide-confirm]',validate:'[data-guide-simulated-submit]'};
                    const target=n.querySelector(selectors[n.dataset.guidePhase]),tr=target.getBoundingClientRect(),copy=h.querySelector('[data-guide-live-copy]');
                    const ready=copy.getAnimations().length===0&&tr.top>=hr.bottom-1;
                    return{phase:n.dataset.guidePhase,height:hr.height,headerBottom:hr.bottom,targetTop:tr.top,targetBottom:tr.bottom,bodyBottom:body.getBoundingClientRect().bottom,ready,
                        padding:parseFloat(getComputedStyle(body).scrollPaddingTop),membershipOutside:!h.contains(n.querySelector('[data-guide-memberships]')),copy:copy.textContent,title:copy.title,ariaLive:copy.getAttribute('aria-live')};
                });
                await expect.poll(async()=>{const s=await sample();return s.ready;}).toBe(true);
                await header.locator('[data-guide-playback="pause"]').click();await expect(header).toHaveAttribute('data-guide-playback-state','paused');
                const reading=await sample();rows.push({language,width,state:'paused',...reading});
                expect(reading.height).toBeLessThanOrEqual(width===390?96:84);expect(reading.targetTop).toBeGreaterThanOrEqual(reading.headerBottom-1);
                expect(Math.abs(reading.padding-reading.height-8)).toBeLessThan(1);expect(reading.membershipOutside).toBe(true);expect(reading.title).toBe(reading.copy);expect(reading.ariaLive).toBe('polite');
                await page.screenshot({path:info.outputPath(`${language}-${width}-${phase}.png`)});
                await header.locator('[data-guide-playback="pause"]').click();await header.locator('[data-guide-playback="next-phase"]').click();
            }
            await expect(scene).toHaveAttribute('data-guide-scene-finished','true');
            const final=await scene.evaluate(n=>{
                const r=e=>{const b=e.getBoundingClientRect();return{top:b.top,bottom:b.bottom};};const body=n.closest('.easyedu-guide-modal__body');
                return{body:r(body),memberships:r(n.querySelector('[data-guide-memberships]')),recap:r(n.querySelector('[data-guide-recap]')),padding:body.style.getPropertyValue('scroll-padding-top')};
            });
            rows.push({language,width,state:'finished',...final});expect(final.memberships.top).toBeGreaterThanOrEqual(final.body.top-1);expect(final.recap.bottom).toBeLessThanOrEqual(final.body.bottom+1);expect(final.padding).toBe('');
            await page.screenshot({path:info.outputPath(`${language}-${width}-finished.png`)});
            await scene.locator('[data-guide-scene-command="reset"]').click();await expect(header.locator('[data-guide-memberships]')).toBeVisible();
            await page.keyboard.press('Escape');await expect(modal).toBeHidden();
            await page.evaluate(async key=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,root.review1OriginalConfig);delete root.review1OriginalConfig;localStorage.removeItem(key);localStorage.removeItem(key+'.checklist');
            },qaKey);
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        await page.evaluate(async key=>{
            const root=document.querySelector('[data-easyedu-guide-root]');
            if(root?.review1OriginalConfig){const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));Guide.destroy(root);Guide.init(root,root.review1OriginalConfig);delete root.review1OriginalConfig;}
            localStorage.removeItem(key);localStorage.removeItem(key+'.checklist');
        },qaKey).catch(()=>{});
        fs.writeFileSync(info.outputPath('review1-native.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false},null,2));
    }
});
