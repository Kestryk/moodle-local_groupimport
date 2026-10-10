const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised inventory: actual current-width entry, inspect and Cancel only.
// No resize of a desktop-opened dialog masquerades as a native mobile entry.
test('Advanced editors are reachable natively at every responsive width',async({page},info)=>{
    test.setTimeout(300000);
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

    const root=page.locator('#local-groupimport-easystud');
    try{
        for(const width of [1280,768,390])for(const kind of ['group','grouping']){
            await page.setViewportSize({width,height:1000});
            await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            if(width<1024){
                await root.locator('[data-easystud-mobile-view="'+(kind==='group'?'groups':'groupings')+'"]:visible').click();
            }else{
                await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
            }
            const item=root.locator(kind==='group'?
                '[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible':
                '[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible').first();
            await expect(item).toBeVisible();
            const header=item.locator(':scope > .local-groupimport-easystud-group__header, '+
                ':scope > .local-groupimport-easystud-grouping__header');
            const direct=header.locator(':scope > [data-easystud-open-advanced-settings]:visible');
            let opener=direct,entry='direct';
            if(!await direct.count()){
                opener=item.locator(':scope > [data-easystud-card-menu]:visible, '+
                    ':scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]:visible, '+
                    ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first();
                if(!await opener.count()){
                    throw new Error('No native editor or card menu at '+width+' for '+kind);
                }
                await opener.click();
                const menu=root.locator('[data-easystud-context-menu]:visible');
                await expect(menu).toBeVisible();
                const action=menu.locator('[data-easystud-context-action="'+kind+'-open-advanced-settings"]:visible');
                if(!await action.count()){
                    throw new Error('Native card menu is missing advanced edit at '+width+' for '+kind);
                }
                await action.click();entry='context-menu';
            }else{
                await opener.click();
            }
            const modal=root.locator('[data-easystud-advanced-settings-modal]');
            await expect(modal).toBeVisible();
            const action=kind==='group'?'updategroupadvanced':'updategroupingadvanced';
            await expect(modal.locator('[name="action"]')).toHaveValue(action);
            await expect(modal.locator('[name="'+(kind==='group'?'groupid':'groupingid')+'"]')).toHaveCount(1);
            for(const name of ['name','idnumber','description']){
                await expect(modal.locator('[name="'+name+'"]')).toBeVisible();
            }
            const lists=modal.locator('[data-easystud-settings-list-section]');
            await expect(lists).toHaveCount(kind==='group'?2:1);
            await expect(lists.locator('select,input[type="checkbox"]')).toHaveCount(0);
            for(const list of await lists.all()){
                if(await list.getAttribute('open')===null)await list.locator('summary').click();
                await expect(list).toHaveAttribute('open','');
            }
            const fields=await modal.locator('[name="name"],[name="idnumber"],[name="description"]').evaluateAll(nodes=>
                nodes.map(node=>({name:node.name,tag:node.tagName,fontFamily:getComputedStyle(node).fontFamily,
                    fontSize:getComputedStyle(node).fontSize})));
            // Record semantic targets without copying personal field values.
            const nativeTargetSelectors={
                name:'[data-easystud-advanced-settings-modal]:has([name="'+(kind==='group'?'groupid':'groupingid')+'"]) [name="name"]',
                description:'[data-easystud-advanced-settings-modal]:has([name="'+(kind==='group'?'groupid':'groupingid')+'"]) [name="description"]'
            };
            const cancel=modal.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]');
            await cancel.scrollIntoViewIfNeeded();await expect(cancel).toBeVisible();await cancel.click();
            await expect(modal).toHaveCount(0);await expect(opener).toBeFocused();
            rows.push({width,kind,entryAvailable:true,entry,fields,nativeTargetSelectors,
                readOnlyListsVerified:true,cancelRemovesDialog:true,focusReturns:true});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        fs.writeFileSync(info.outputPath('guide-advanced-edit-inventory-native.json'),JSON.stringify({
            rows,errors,blocked,fixtureRequested:false,settingsSaved:false,
            scope:'Actual current-width entry and open/read-only disclosure/Cancel inventory; no Guide target or path completion claim.'
        },null,2));
    }
});
