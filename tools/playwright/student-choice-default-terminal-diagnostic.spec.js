// SM55 remaining consumer gate. Existing selection/Search/Escape/Cancel only.
// No destination Move, form Save, fixture or Guide action.
const {test, expect}=require('@playwright/test');
const fs=require('node:fs');

test('Native default and framed choices diagnose terminal layout continuity',async({page},testInfo)=>{
    test.setTimeout(300000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
    const records=[],errors=[],blocked=[];
    const save=()=>fs.writeFileSync(testInfo.outputPath('choice-consumer-terminal.json'),JSON.stringify({records,errors,blocked},null,2));
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/lib/ajax/service.php*',async route=>{
        if(route.request().method()!=='POST')return route.continue();let methods=[];
        try{methods=route.request().postDataJSON().map(c=>c.methodname)}catch(_){}
        if(methods.length&&methods.every(n=>n==='core_message_get_unsent_message'))return route.fulfill({status:200,
            contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(methods.length&&methods.every(n=>reads.has(n)))return route.continue();
        blocked.push({scope:'core',methods});return route.abort('blockedbyclient');
    });
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push({scope:'plugin',method:route.request().method()});return route.abort('blockedbyclient');
    });
    const root=page.locator('#local-groupimport-easystud');
    const settle=async locator=>locator.evaluate(async n=>{await document.fonts.ready;
        await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a=>a.finished.catch(()=>undefined)));
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    const navigate=async width=>{
        await page.setViewportSize({width,height:1100});await page.emulateMedia({reducedMotion:'no-preference'});
        await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded'});
            await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
    };
    const mode=async(kind,width)=>{await root.locator(width<=1024?
        `[data-easystud-mobile-view="${kind==='participants'?'participants':'groups'}"]:visible`:
        `[data-easystud-layout-mode="${kind==='participants'?'participants':'structure'}"]:visible`).click();await settle(root);};
    const terminal=async(host,scope,width)=>{
        const trigger=host.locator('.easyedu-searchable-choice__trigger'),panel=host.locator('.easyedu-searchable-choice__panel');
        const framed=await host.evaluate(n=>n.classList.contains('easyedu-searchable-choice--framed'));
        if(scope.startsWith('destination-')) expect(framed).toBe(true);
        await trigger.click();await settle(host);
        const search=host.locator('input[type="search"]');await expect(search).toBeFocused();
        await search.press('Escape');
        // Deliberately sample the real closing effect's terminal rendered frame
        // before hidden cleanup, as in the preserved native Admin15-endpoint gate.
        // This is endpoint continuity, not natural perceptual smoothness proof.
        const geometry=await host.evaluate(async n=>{
            const p=n.querySelector('.easyedu-searchable-choice__panel');
            const animation=p.getAnimations().find(a=>a.effect?.target===p&&a.effect.getKeyframes().some(k=>k.height));
            if(!animation)throw Error('Native framed closing effect missing');
            animation.pause();animation.currentTime=animation.effect.getTiming().duration;
            const parent=n.parentElement;
            const siblings=[...parent.children].filter(x=>x!==n&&x.getClientRects().length&&getComputedStyle(x).display!=='none');
            const measure=()=>({hostBottom:n.getBoundingClientRect().bottom,parentHeight:parent.getBoundingClientRect().height,
                siblings:siblings.map(x=>({y:x.getBoundingClientRect().y,h:x.getBoundingClientRect().height}))});
            const before=measure(),margin=getComputedStyle(p).marginBlockStart;
            animation.finish();await animation.finished;await new Promise(requestAnimationFrame);
            return{before,after:measure(),margin,hidden:p.hidden,inert:p.inert,inline:p.getAttribute('style'),
                effects:p.getAnimations().length,focused:document.activeElement===n.querySelector('.easyedu-searchable-choice__trigger'),
                font:getComputedStyle(n.querySelector('.easyedu-searchable-choice__trigger')).fontFamily};
        });
        records.push({scope,width,framed,geometry});save();
        expect(Math.abs(geometry.before.hostBottom-geometry.after.hostBottom)).toBeLessThanOrEqual(1);
        expect(Math.abs(geometry.before.parentHeight-geometry.after.parentHeight)).toBeLessThanOrEqual(1);
        expect(geometry.before.siblings.length).toBe(geometry.after.siblings.length);
        for(let i=0;i<geometry.before.siblings.length;i++){
            expect(Math.abs(geometry.before.siblings[i].y-geometry.after.siblings[i].y)).toBeLessThanOrEqual(1);
            expect(Math.abs(geometry.before.siblings[i].h-geometry.after.siblings[i].h)).toBeLessThanOrEqual(1);
        }
        expect(geometry.margin).toBe('0px');expect(geometry.hidden).toBe(true);expect(geometry.inert).toBe(false);
        expect(geometry.inline||'').toBe('');expect(geometry.effects).toBe(0);expect(geometry.focused).toBe(true);
        expect(geometry.font).toContain('Inter');await expect(panel).toBeHidden();
    };
    try{for(const width of[1600,768,390]){
        for(const kind of['participants','groups']){
            await navigate(width);await mode(kind,width);
            const card=root.locator(kind==='participants'?'[data-easystud-participant-list] [data-easystud-user]:visible':'[data-easystud-group-id]:visible').first();
            await card.locator(':scope > .local-groupimport-easystud-selector').click();await settle(root);
            const action=`[data-easystud-move-selected-${kind}]`;
            let opener=root.locator(width<=1024?`[data-easystud-mobile-action-trigger="${action}"]:visible`:`${action}:visible`).first();
            if(width>1024&&await opener.count()===0){await root.locator('[data-easystud-panel-actions-toggle]:visible').first().click();
                opener=root.locator(`${action}:visible`).first();}
            await expect(opener).toBeEnabled();await opener.click();
            const dialog=root.locator('[data-easystud-move-modal]');await expect(dialog).toBeVisible();await settle(dialog);
            const host=dialog.locator('.easyedu-searchable-choice');await terminal(host,`destination-${kind}`,width);
            await dialog.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
            await expect(dialog).toBeHidden();await expect(opener).toBeFocused();
        }
        await navigate(width);await mode('participants',width);
        const more=root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first();
        await more.click();await expect(more).toHaveAttribute('aria-expanded','true');await settle(root);
        const select=root.locator('[data-easystud-group-filter]').first();
        const host=select.locator('xpath=following-sibling::div[contains(@class,"easyedu-searchable-choice")][1]');
        const before=await select.evaluate(n=>[...n.selectedOptions].map(o=>o.value));
        await terminal(host,'multiple-participant-group-filter',width);
        expect(await select.evaluate(n=>[...n.selectedOptions].map(o=>o.value))).toEqual(before);
        await more.click();await expect(more).toHaveAttribute('aria-expanded','false');
    }expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{save();}
});
