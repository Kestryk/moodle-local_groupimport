const {test, expect}=require('@playwright/test');
const fs=require('node:fs');

// Read-only diagnostic; no presentation change, selection, Save or fixture.
test('Diagnose More Filters pointer lifecycle and reduced reopening',async({page},info)=>{
    test.setTimeout(180000);
    const records=[],blocked=[],errors=[],root=page.locator('#local-groupimport-easystud');
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/lib/ajax/service.php*',async route=>{
        if(route.request().method()!=='POST')return route.continue();
        let calls=[];try{calls=route.request().postDataJSON().map(c=>c.methodname);}catch(_){}
        if(calls.length&&calls.every(c=>c==='core_message_get_unsent_message'))return route.fulfill({status:200,
            contentType:'application/json',body:JSON.stringify(calls.map(()=>({error:false,data:{}})))});
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(calls.length&&calls.every(c=>reads.has(c)))return route.continue();
        blocked.push({calls});return route.abort();
    });
    try{
        await page.setViewportSize({width:390,height:1100});await page.emulateMedia({reducedMotion:'no-preference'});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await page.route('**/local/groupimport/**',r=>r.request().method()==='GET'?r.continue():
            (blocked.push({pluginWrite:true}),r.abort()));
        await page.evaluate(()=>{
            window.__filterPointerTrace=[];
            for(const type of ['pointerdown','pointerup','pointercancel','click'])document.addEventListener(type,e=>{
                const b=document.querySelector('[data-easystud-advanced-filters-toggle="participants"]');
                window.__filterPointerTrace.push({type,time:e.timeStamp,tag:e.target.tagName,
                    class:e.target.className,insideButton:b.contains(e.target),expanded:b.getAttribute('aria-expanded')});
            },true);
        });
        const button=root.locator('[data-easystud-advanced-filters-toggle="participants"]'),
            panel=root.locator('[data-easystud-advanced-filters="participants"]');
        const snapshot=async label=>records.push({label,state:await button.evaluate(n=>({expanded:n.getAttribute('aria-expanded'),
            events:window.__filterPointerTrace.slice(),rect:n.getBoundingClientRect().toJSON(),
            reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}))});
        for(const width of [1600,768,390]){
            await page.setViewportSize({width,height:1100});await page.emulateMedia({reducedMotion:'no-preference'});
            await root.locator(width>1024?'[data-easystud-layout-mode="participants"]:visible':
                '[data-easystud-mobile-view="participants"]:visible').click();
            if(await button.getAttribute('aria-expanded')!=='true')await button.click();
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            const choice=panel.locator('[data-easystud-group-filter]').first().locator('xpath=following-sibling::*[1]');
            await choice.locator('.easyedu-searchable-choice__trigger').click();
            await button.click();await expect(button).toHaveAttribute('aria-expanded','false');
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);await snapshot(width+'-nested-closed');
            await page.emulateMedia({reducedMotion:'reduce'});await button.click();
            await snapshot(width+'-first-reduced-click');
            if(await button.getAttribute('aria-expanded')!=='true'){
                await button.focus();await button.press('Enter');await snapshot(width+'-keyboard-recovery');
            }
            if(await button.getAttribute('aria-expanded')==='true')await button.click();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(info.outputPath('pointer-lifecycle-diagnostic.json'),JSON.stringify({records,errors,blocked},null,2));}
});
