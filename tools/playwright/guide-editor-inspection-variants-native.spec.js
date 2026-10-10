const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised: actual editor Guide, field focus and Cancel; never Save.
test('Editor inspection preserves French and reduced-motion native review',async({page},info)=>{
    test.setTimeout(720000);
    const rows=[],errors=[],blocked=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    }
    page.setDefaultTimeout(15000);
    // Cold Moodle navigation has its own bounded budget; widget deadlines unchanged.
    page.setDefaultNavigationTimeout(60000);
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push('plugin write');return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();
        const methods=route.request().postDataJSON().map(call=>call.methodname);
        if(methods.every(method=>method==='core_message_get_unsent_message'))return route.fulfill({
            status:200,contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))
        });
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(methods.every(method=>reads.has(method)))return route.continue();
        blocked.push(methods);return route.abort('blockedbyclient');
    });


    await page.emulateMedia({reducedMotion:'no-preference'});
    const workspace=page.locator('#local-groupimport-easystud');
    const panel=page.locator('[data-easyedu-guide-checklist]');
    const highlight=page.locator('[data-easyedu-guide-highlight]');
    const aligned=async target=>{
        await expect(highlight).toBeVisible();await expect(target).toBeVisible();
        await expect.poll(async()=>{
            const h=await highlight.boundingBox(),t=await target.boundingBox();
            return h&&t?Math.max(Math.abs(h.x-t.x),Math.abs(h.y-t.y),
                Math.abs(h.width-t.width),Math.abs(h.height-t.height)):Infinity;
        },{timeout:15000}).toBeLessThan(2);
    };
    try{
        for(const scenario of [{language:'fr',motion:'no-preference'},{language:'en',motion:'reduce'}])
        for(const width of [1280,768,390])for(const type of ['group','grouping']){
            await page.setViewportSize({width,height:1000});
            await page.emulateMedia({reducedMotion:scenario.motion});
            const scenarioUrl=new URL(process.env.EASYEDU_MOODLE_URL);
            scenarioUrl.searchParams.set('lang',scenario.language);
            await page.goto(scenarioUrl.href,{waitUntil:'domcontentloaded'});
            await expect(page.locator('html')).toHaveAttribute('lang',scenario.language);
            await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            const path='inspect-'+type+'-settings';
            const index=await page.evaluate(async({width,type,path,scenario})=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
                if(config.paths[path]?.length!==4)throw new Error('Actual four-step editor path missing');
                const index=config.slideIds.indexOf('read-'+type+'-card');
                if(index<0)throw new Error('Actual card lesson missing');
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);
                Guide.init(root,{...config,firstVisit:false,storageKey:'editor-guide-variants-qa-'+scenario.language+'-'+scenario.motion+'-'+type+'-'+width});
                return index;
            },{width,type,path,scenario});
            if(!await page.locator('[data-easyedu-guide-open]:visible').count()){
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
            await guide.locator('[data-easyedu-guide-start-path="'+path+'"]').click();
            await expect(guide).toBeHidden();await expect(panel).toBeVisible();
            const entry=workspace.locator(type==='group'?
                '[data-easystud-structure-groups] [data-easystud-open-advanced-settings]:visible, '+
                    '[data-easystud-context-action="group-open-advanced-settings"]:visible':
                '[data-easystud-tree] [data-easystud-open-advanced-settings][data-easystud-advanced-target="grouping"]:visible, '+
                    '[data-easystud-context-action="grouping-open-advanced-settings"]:visible').first();
            await aligned(entry);await entry.click();
            const modal=workspace.locator('[data-easystud-editor-context="'+type+'"]');
            await expect(modal).toBeVisible();
            await expect(panel.locator('[data-easyedu-guide-step-id="open-editor"]')).toHaveClass(/is-complete/);
            const name=modal.locator('input[name="name"]'),description=modal.locator('textarea[name="description"]');
            await aligned(name);await name.click();
            await expect(panel.locator('[data-easyedu-guide-step-id="inspect-name"]')).toHaveClass(/is-complete/);
            await aligned(description);await description.click();
            await expect(panel.locator('[data-easyedu-guide-step-id="inspect-description"]')).toHaveClass(/is-complete/);
            const cancel=modal.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]');
            await aligned(cancel);
            const final=panel.locator('[data-easyedu-guide-step-id="cancel-editor"]');
            await expect(final).not.toHaveClass(/is-complete/);
            const restore=panel.locator('[data-easyedu-guide-checklist-restore]:visible');
            if(await restore.count())await restore.click();
            const previous=panel.locator('[data-easyedu-guide-step-id="open-editor"]');
            await previous.scrollIntoViewIfNeeded();await previous.click();
            await expect(modal).toHaveCount(0);
            await expect(final).not.toHaveClass(/is-complete/);
            await aligned(entry);
            const review=panel.locator('[data-easyedu-guide-step-id="inspect-name"]');
            await review.scrollIntoViewIfNeeded();await review.click();
            await expect(modal).toBeVisible();await aligned(name);
            await expect(final).not.toHaveClass(/is-complete/);
            await final.scrollIntoViewIfNeeded();await final.click();await aligned(cancel);
            await expect(final).not.toHaveClass(/is-complete/);
            await cancel.scrollIntoViewIfNeeded();await cancel.click();await expect(modal).toHaveCount(0);
            await expect(final).toHaveClass(/is-complete/);await expect(panel).toHaveClass(/is-complete/);
            await panel.locator('[data-easyedu-guide-checklist-close]').click();await expect(panel).toBeHidden();
            rows.push({...scenario,width,type,entryAndFieldsAligned:true,focusMilestones:true,
                reviewDoesNotCompleteCancel:true,reopen:true,userCancelCompletesAfterExit:true});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        const diagnostic=await page.evaluate(()=>({
            currentTargetConnected:document.querySelector('[data-easyedu-guide-root]')?.easyeduGuideCurrentTarget?.isConnected||false,
            context:document.querySelector('[data-easystud-editor-context]')?.dataset.easystudEditorContext||null
        })).catch(()=>null);
        fs.writeFileSync(info.outputPath('guide-editor-inspection-variants-native.json'),JSON.stringify({
            rows,errors,blocked,diagnostic,settingsSaved:false,fixtureRequested:false
        },null,2));
    }
});
