const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised. Existing memberships, real checkbox/search/open/Cancel only.
// No group creation, transfer confirmation, settings Save or fixture mutation.
test('Source member guide uses real member modal targets and prior-step review',async({page},info)=>{
    test.setTimeout(360000);
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
    const workspace=page.locator('#local-groupimport-easystud');
    const panel=page.locator('[data-easyedu-guide-checklist]');
    const highlight=page.locator('[data-easyedu-guide-highlight]');
    const dialog=page.locator('[data-easystud-move-modal]');
    const aligned=async target=>{
        await expect(highlight).toBeVisible();await expect(target).toBeVisible();
        await expect.poll(async()=>{
            const h=await highlight.boundingBox(),t=await target.boundingBox();
            return h&&t?Math.max(Math.abs(h.x-t.x),Math.abs(h.y-t.y),
                Math.abs(h.width-t.width),Math.abs(h.height-t.height)):Infinity;
        },{timeout:15000}).toBeLessThan(2);
    };
    try{
        await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await page.emulateMedia({reducedMotion:'no-preference'});
        for(const width of [1280,768,390]){
            await page.setViewportSize({width,height:1000});
            const index=await page.evaluate(async width=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
                const steps=config.paths['reorganise-source-members'];
                if(steps?.length!==4)throw new Error('Actual four-stage source-member path required');
                const index=config.slideIds.indexOf('add-or-move-members');
                if(index<0)throw new Error('Current Organisation lesson required');
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);
                // Only an ephemeral QA reading store; actual native steps/targets unchanged.
                Guide.init(root,{...config,firstVisit:false,storageKey:'source-member-native-qa-'+width});
                return index;
            },width);
            if(!await page.locator('[data-easyedu-guide-open]:visible').count()){
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await guide.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
            const start=guide.locator('[data-easyedu-guide-start-path="reorganise-source-members"]');
            await expect(start).toBeVisible();await start.click();await expect(guide).toBeHidden();
            await expect(panel).toBeVisible();
            const selector=workspace.locator('[data-easystud-structure-groups] '+
                '[data-easystud-member-id]:visible > .local-groupimport-easystud-selector:visible').first();
            await aligned(selector);
            const sourceId=await selector.evaluate(node=>node.closest('[data-easystud-group-id]').dataset.easystudGroupId);
            const checkbox=selector.locator('input');await selector.click();await expect(checkbox).toBeChecked();
            await expect(panel.locator('[data-easyedu-guide-step-id="select-source-member"]')).toHaveClass(/is-complete/);
            const move=workspace.locator('[data-easystud-move-selected-members]:visible, '+
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]:visible').first();
            await aligned(move);
            await expect(move).toBeEnabled();await move.click();
            await expect(dialog).toBeVisible();await expect(dialog).toHaveAttribute('data-easystud-move-context','member');
            await expect(panel.locator('[data-easyedu-guide-step-id="choose-member-destination"]')).toHaveClass(/is-active/);
            const destination=dialog.locator('.easyedu-searchable-choice');await aligned(destination);
            const select=dialog.locator('[data-easystud-move-destination]');
            const options=await select.locator('option').evaluateAll(nodes=>nodes.map(option=>({
                value:option.value,label:option.textContent,disabled:option.disabled
            })));
            const target=options.find(option=>option.value && !option.disabled && option.value!==sourceId);
            expect(target,'Existing distinct destination required; do not create one').toBeTruthy();
            await destination.locator('.easyedu-searchable-choice__trigger').click();
            const search=destination.locator('input[type="search"]');
            await expect(search).toBeVisible();await search.fill(target.label);
            const option=destination.locator('.easyedu-searchable-choice__option:visible')
                .filter({hasText:target.label}).first();await expect(option).toBeVisible();await option.click();
            await expect(select).toHaveValue(target.value);
            await expect(panel.locator('[data-easyedu-guide-step-id="confirm-member-move"]')).toHaveClass(/is-active/);
            await aligned(dialog.locator('[data-easystud-confirm-move]'));
            await expect(panel.locator('[data-easyedu-guide-step-id="confirm-member-move"]')).not.toHaveClass(/is-complete/);
            // Previous-step review closes the member modal with its original Motion,
            // retains selected memberships, and never submits or advances completion.
            const previous=panel.locator('[data-easyedu-guide-step-id="select-source-member"]');
            await expect(previous).toBeVisible();await previous.click();
            await expect(dialog).toBeHidden();await expect(checkbox).toBeChecked();await aligned(selector);
            await panel.locator('[data-easyedu-guide-step-id="choose-member-destination"]').click();
            await expect(dialog).toBeVisible();await expect(dialog).toHaveAttribute('data-easystud-move-context','member');
            await aligned(destination);
            await expect(panel.locator('[data-easyedu-guide-step-id="confirm-member-move"]')).not.toHaveClass(/is-complete/);
            await dialog.locator('[data-easystud-close-move-modal]').first().click();
            await expect(dialog).toBeHidden();await expect(dialog).not.toHaveAttribute('data-easystud-move-context',/.+/);
            if(await checkbox.isChecked())await selector.click();
            await panel.locator('[data-easyedu-guide-checklist-close]').click();await expect(panel).toBeHidden();
            rows.push({width,sourceMemberSelected:true,typedMemberDialog:true,searchAndDestination:true,
                destinationAndConfirmAligned:true,priorReviewRetainsSelection:true,reopenAndCancel:true,confirmationUncompleted:true});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        const diagnostic=await page.evaluate(()=>{
            const root=document.querySelector('[data-easyedu-guide-root]');
            return {activeStep:root?.querySelector('[data-easyedu-guide-step-index].is-active')?.dataset.easyeduGuideStepId,
                currentTargetConnected:root?.easyeduGuideCurrentTarget?.isConnected||false,
                context:document.querySelector('[data-easystud-move-modal]')?.dataset.easystudMoveContext||null};
        }).catch(()=>null);
        fs.writeFileSync(info.outputPath('guide-source-member-targets-native.json'),JSON.stringify({rows,errors,blocked,
            diagnostic,fixtureRequested:false,courseTransactionConfirmed:false},null,2));
    }
});
