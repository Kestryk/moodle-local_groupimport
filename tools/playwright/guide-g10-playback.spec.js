const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// One playback surface, actual Moodle assets, no business writes.
// QA command injection covers retained legacy Reset/mode handlers;
// it does not claim the current manual-start template exposes Reset.
test('Guide playback interruption reading and close lifecycle', async ({page}, info) => {
    test.setTimeout(720000);
    const rows=[], errors=[], blocked=[];
    page.on('pageerror',error=>errors.push(error.message));
    const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang','fr');
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
    }
    page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push('plugin write');return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();
        const calls=route.request().postDataJSON(), methods=calls.map(call=>call.methodname);
        if(methods.every(method=>method==='core_message_get_unsent_message'))return route.fulfill({
            contentType:'application/json',body:JSON.stringify(calls.map(()=>({error:false,data:{}})))});
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(areSafeAjaxReads(methods, reads))return route.continue();
        blocked.push(methods);return route.abort('blockedbyclient');
    });
    const workspace=page.locator('#local-groupimport-easystud');
    const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
    const baseline=process.env.EASYEDU_GUIDE_PLAYBACK_BASELINE==='1';
    const scenarios=baseline?[{width:1280,motion:'reduce'}]:
        [1600,1280,390].flatMap(width=>['no-preference','reduce'].map(motion=>({width,motion})));
    const command=async(scene,name)=>scene.evaluate((scene,name)=>{
        const control=document.createElement('button');
        control.type='button';control.setAttribute('data-guide-scene-command',name);
        control.hidden=true;control.setAttribute('aria-hidden','true');scene.appendChild(control);
        try{control.click();}finally{control.remove();}
    },name);
    const assertIdle=async(scene,row,label)=>{
        await expect(scene.locator('[data-guide-scene-header]')).toHaveAttribute('data-guide-playback-state','idle');
        await page.waitForTimeout(100); // drain stopped async continuations, no Motion override.
        const state=await scene.evaluate(scene=>({
            phase:scene.dataset.guidePhase||null,
            state:scene.querySelector('[data-guide-scene-header]').dataset.guidePlaybackState,
            checked:scene.querySelectorAll('[data-guide-stage] input:checked').length,
            selected:scene.querySelectorAll('[data-guide-stage] .is-selected').length,
            ghost:scene.querySelectorAll('[data-guide-ghost]').length,
            current:scene.querySelectorAll('[data-guide-phase][aria-current]').length,
            started:scene.querySelector('[data-guide-scene-command="start"]').getAttribute('aria-busy')}));
        row.samples[label]=state;
        expect(state).toEqual({phase:null,state:'idle',checked:0,selected:0,ghost:0,current:0,started:'false'});
        row.checks[label]=true;
    };
    try{
        for(const {width,motion} of scenarios){
            const row={width,motion,language:'fr',checks:{},samples:{}};rows.push(row);
            await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:motion});
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await expect(page.locator('html')).toHaveAttribute('lang','fr');
            expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion==='reduce');
            await page.evaluate(async({width,motion})=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,
                    storageKey:'playback-lifecycle-qa-'+width+'-'+motion});
            },{width,motion});
            if(!await page.locator('[data-easyedu-guide-open]:visible').count())
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();await expect(modal).toBeVisible();
            const scene=modal.locator('[data-easyedu-guide-scene="membership"]');
            const index=await scene.evaluate(scene=>scene.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
            await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();await expect(scene).toBeVisible();
            await scene.locator('[data-guide-scene-command="move"]').click();
            const start=scene.locator('[data-guide-scene-command="start"]'),live=scene.locator('[data-guide-live]');
            const pause=scene.locator('[data-guide-playback="pause"]'),next=scene.locator('[data-guide-playback="next-phase"]');
            await start.click();await page.waitForTimeout(300);
            row.samples.reading=await scene.evaluate(scene=>({phase:scene.dataset.guidePhase,
                finished:scene.dataset.guideSceneFinished==='true',copy:scene.querySelector('[data-guide-live-copy]').textContent}));
            expect(row.samples.reading.finished,'Reduced motion must not collapse all narration').toBe(false);
            await expect(scene).toHaveAttribute('data-guide-phase','select',{timeout:20000});
            const copy=await live.locator('[data-guide-live-copy]').textContent();
            await page.waitForTimeout(2200);
            await expect(scene).toHaveAttribute('data-guide-phase','select');
            await expect(live.locator('[data-guide-live-copy]')).toHaveText(copy);row.checks.readingMinimumPreserved=true;
            await pause.click();await expect(pause).toHaveAttribute('aria-label','Reprendre la démonstration');
            await expect(live).toHaveAttribute('data-guide-playback-state','paused');row.checks.pauseResumeLabel=true;
            row.samples.close=await modal.evaluate(async modal=>{
                const live=modal.querySelector('[data-easyedu-guide-slide].is-active [data-guide-live]');
                const before=live.dataset.guidePlaybackState;
                modal.querySelector('[data-easyedu-guide-close]').click();
                const immediate=live.dataset.guidePlaybackState,hidden=modal.hidden;
                await new Promise(resolve=>requestAnimationFrame(resolve));return {before,immediate,hidden};
            });
            if(motion==='no-preference'){expect(row.samples.close.hidden).toBe(false);expect(row.samples.close.immediate).toBe('paused');}
            await expect(modal).toBeHidden();
            expect(await page.evaluate(()=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideScenePlayback)).toBeNull();
            row.checks.closeStopsAfterFade=true;
            await page.locator('[data-easyedu-guide-open]:visible').first().click();await expect(modal).toBeVisible();
            await assertIdle(scene,row,'reopenIdle');
            for(const phase of ['initial','select','menu','confirm','validate']){
                // Reset intentionally restores Add. Select Move explicitly
                // before exercising its confirmation phases on each cycle.
                await scene.locator('[data-guide-scene-command="move"]').click();
                await start.click();
                if(phase!=='initial'){
                    await expect(scene).toHaveAttribute('data-guide-phase','select',{timeout:20000});await pause.click();
                    for(const step of ['menu','confirm','validate']){
                        if(phase==='select')break;
                        await next.click();await expect(scene).toHaveAttribute('data-guide-phase',step);
                        if(step===phase)break;
                    }
                }
                await command(scene,'reset');await assertIdle(scene,row,'reset-'+phase);
            }
            await start.click();await expect(scene).toHaveAttribute('data-guide-phase','select',{timeout:20000});
            await pause.click();await command(scene,'add');await assertIdle(scene,row,'modeChangeIdle');
            await expect(scene).toHaveAttribute('data-guide-mode','add');
            await scene.locator('[data-guide-scene-command="move"]').click();
            await start.click();await expect(scene).toHaveAttribute('data-guide-phase','select',{timeout:20000});await pause.click();
            for(const phase of ['menu','confirm','validate']){
                await next.click();await expect(scene).toHaveAttribute('data-guide-phase',phase);
            }
            await next.click();await expect(scene).toHaveAttribute('data-guide-scene-finished','true',{timeout:20000});
            await expect(pause).toBeDisabled();await expect(next).toBeDisabled();
            await expect(start).toBeEnabled();await expect(start).toHaveAttribute('aria-busy','false');
            await expect(scene.locator('[data-guide-recap]')).toBeVisible();
            expect(await scene.locator('[data-guide-ghost]').count()).toBe(0);row.checks.lastAdvanceSettlesAndReplayEnabled=true;
            await modal.locator('[data-easyedu-guide-close]').first().click();await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        fs.writeFileSync(info.outputPath('guide-g10-playback-result.json'),JSON.stringify({
            surface:'guide-playback',level:2,rows,errors,blocked,businessWrites:false,qaLegacyCommands:true,baseline
        },null,2));
    }
});

test('Guide highlight honors instance Motion policy without affecting foreign controls',async({page},info)=>{
    test.setTimeout(180000);
    await page.setViewportSize({width:1280,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
    const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang','fr');
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
    }
    const workspace=page.locator('#local-groupimport-easystud');
    await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await page.route('**/local/groupimport/**',route=>route.request().method()==='GET'?
        route.continue():route.abort('blockedbyclient'));
    await page.evaluate(async()=>{
        const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
        const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
        const key='guide-motion-portal-native-qa';Guide.destroy(root);
        localStorage.setItem(key+'.checklist',JSON.stringify({path:'try-actions',activeIndex:1,
            presentationKey:config.presentationKey,completed:{'try-actions':['try-drag']}}));
        Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:key});
        const foreign=document.createElement('div');foreign.id='qa-foreign-motion';
        foreign.setAttribute('data-easyedu-motion-policy','disabled');
        foreign.style.transition='opacity 7s linear';foreign.textContent='QA foreign control';
        document.body.appendChild(foreign);
    });
    await page.locator('[data-easyedu-guide-resume-path]:visible').click();
    const frame=page.locator('[data-easyedu-guide-highlight]:visible'),panel=page.locator('[data-easyedu-guide-checklist]');
    const rows=[];
    const policy=async(value)=>{
        await page.evaluate(value=>{
            const root=document.querySelector('[data-easyedu-guide-root]');
            root.setAttribute('data-easyedu-motion-policy',value);
            document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight',{detail:{root,dock:true}}));
        },value);
        await expect(frame).toHaveAttribute('data-easyedu-motion-policy',value);
        return frame.evaluate(node=>{const css=getComputedStyle(node);return {
            policy:node.getAttribute('data-easyedu-motion-policy'),animation:css.animationName,
            transition:css.transitionDuration,foreignTransition:getComputedStyle(document.querySelector('#qa-foreign-motion')).transitionDuration,
            pointer:css.pointerEvents,frameParent:node.parentElement.tagName};});
    };
    try{
        await expect(frame).toBeVisible();
        const enabled=await policy('enabled');rows.push(enabled);expect(enabled.animation).toBe('easyedu-guide-highlight-pulse');
        const disabled=await policy('disabled');rows.push(disabled);expect(disabled.animation).toBe('none');
        expect(disabled.transition).toBe('0s');expect(disabled.foreignTransition).toBe('7s');
        expect(disabled.pointer).toBe('none');expect(disabled.frameParent).toBe('BODY');
        const restored=await policy('enabled');rows.push(restored);expect(restored.animation).toBe(enabled.animation);
        await panel.locator('[data-easyedu-guide-checklist-close]').click();await expect(panel).toBeHidden();
        expect(await page.locator('[data-easyedu-guide-highlight]').getAttribute('data-easyedu-motion-policy')).toBeNull();
    }finally{
        await page.evaluate(()=>{document.querySelector('#qa-foreign-motion')?.remove();
            document.querySelector('[data-easyedu-guide-root]')?.removeAttribute('data-easyedu-motion-policy');});
        fs.writeFileSync(info.outputPath('guide-motion-policy.json'),JSON.stringify({surface:'guide-motion',
            level:1,rows,adminConfigurationChanged:false,businessWrites:false},null,2));
    }
});
