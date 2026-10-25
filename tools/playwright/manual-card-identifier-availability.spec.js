const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// Local-supervised reading only, never apply a selection/course command.
test('Manual card identifier panel availability',async({page},info)=>{
    test.setTimeout(150000);
    const rows=[],errors=[],blocked=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    }
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();
        const methods=route.request().postDataJSON().map(call=>call.methodname);
        const reads=['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state'];
        if(methods.every(method=>reads.includes(method)))return route.continue();
        blocked.push(methods);return route.abort('blockedbyclient');
    });

    try {
        for(const width of [1280,768,390]) {
            await page.setViewportSize({width,height:900});
            for(const type of ['group','grouping']) {
                const view=type==='group'?'groups':'groupings';
                const mobile=page.locator('[data-easystud-mobile-view="'+view+'"]:visible');
                if(await mobile.count()) {
                    await mobile.click({timeout:8000});
                    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-mobile-view-active',view);
                }else {
                    const desktop=page.locator('[data-easystud-layout-mode="structure"]:visible');
                    if(await desktop.getAttribute('aria-pressed')!=='true') await desktop.click({timeout:8000});
                }
                const card=page.locator(type==='group'
                    ? '[data-easystud-structure-groups] [data-easystud-group-id]:visible'
                    : '.local-groupimport-easystud-tree__section[data-easystud-grouping-id]:visible').first();
                await expect(card).toBeVisible();
                const toggle=card.locator(type==='group'?'[data-easystud-toggle-group-email]':'[data-easystud-toggle-grouping-groups]').first();
                let route='header';
                if(await toggle.isVisible()) await toggle.click({timeout:8000});
                else {
                    route='card-menu';
                    await card.locator('[data-easystud-card-menu]:visible').first().click({timeout:8000});
                    const action=page.locator('[data-easystud-context-action="'+(type==='group'?'group-paste-emails':'grouping-paste-groups')+'"]:visible');
                    await expect(action).toBeVisible();
                    await action.click({timeout:8000});
                }
                const field=card.locator(type==='group'?'[data-easystud-group-email-box]:visible':'[data-easystud-grouping-groups-box]:visible');
                await expect(field).toBeVisible();
                await expect(field).toBeFocused();
                rows.push({width,type,route,field:await field.evaluate(node=>({empty:node.value==='',font:getComputedStyle(node).fontFamily}))});
                const cancel=card.locator(type==='group'?'[data-easystud-cancel-group-email]:visible':'[data-easystud-cancel-grouping-groups]:visible');
                await cancel.click({timeout:8000});
                await expect(field).toBeHidden();
            }
        }
        expect(rows).toHaveLength(6);expect(errors).toEqual([]);expect(blocked).toEqual([]);
        expect(rows.every(row=>row.field.empty)).toBe(true);
    }finally {
        fs.writeFileSync(info.outputPath('manual-card-identifier-availability.json'),JSON.stringify({rows,errors,blocked,
            scope:'Native manual view/header/card-menu/open/Cancel only; no input, submission, generated chips, membership or fixture'},null,2));
    }
});
