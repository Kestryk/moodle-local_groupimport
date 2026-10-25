const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// Local-supervised reading only, never apply a selection/course command.
test('Guide card identifier panel availability',async({page},info)=>{
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

    const openLesson=async index=>{
        if(!await page.locator('[data-easyedu-guide-open]:visible').count()) {
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
        }
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal=page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toBeVisible();
        await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
        await modal.locator('[data-easyedu-guide-show-target]:visible').first().click();
        await expect(modal).toBeHidden();
    };
    const returnAndClose=async()=>{
        await page.locator('[data-easyedu-guide-interface-return-button]:visible').click();
        const modal=page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toBeVisible();
        await modal.locator('[data-easyedu-guide-close]').click();
        await expect(modal).toBeHidden();
        if(await page.locator('[data-easyedu-navigation-backdrop]:visible').count()) {
            await page.locator('[data-easyedu-navigation-close]:visible').first().click();
        }
    };
    try {
        for(const width of [1280,768,390]) {
            await page.setViewportSize({width,height:900});
            // Current native text-add lesson opens the exact Group destination.
            await openLesson(13);
            const groupField=page.locator('[data-easystud-group-email-box]:visible').first();
            await expect(groupField).toBeVisible();
            rows.push({width,type:'group',field:await groupField.evaluate(node=>({
                visible:!!node.getClientRects().length,empty:node.value==='',font:getComputedStyle(node).fontFamily,
                groupId:node.closest('[data-easystud-group-id]')?.getAttribute('data-easystud-group-id')}))});
            await returnAndClose();
            // The Grouping card lesson uses its existing real view/expand opener.
            await openLesson(10);
            const grouping=page.locator('.local-groupimport-easystud-tree__section[data-easystud-grouping-id]:visible').first();
            await expect(grouping).toBeVisible();
            const toggle=grouping.locator('[data-easystud-toggle-grouping-groups]').first();
            let route='header';
            if(await toggle.isVisible()) await toggle.click();
            else {
                route='card-menu';
                await grouping.locator('[data-easystud-card-menu]:visible').first().click();
                await page.locator('[data-easystud-context-action="grouping-paste-groups"]:visible').click();
            }
            const groupingField=grouping.locator('[data-easystud-grouping-groups-box]:visible');
            await expect(groupingField).toBeVisible();
            rows.push({width,type:'grouping',route,field:await groupingField.evaluate(node=>({
                visible:!!node.getClientRects().length,empty:node.value==='',font:getComputedStyle(node).fontFamily}))});
            await returnAndClose();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
        expect(rows.every(row=>row.field.empty)).toBe(true);
    }finally {
        fs.writeFileSync(info.outputPath('guide-card-identifier-availability.json'),JSON.stringify({rows,errors,blocked,
            scope:'Native read/open/return only; no input, submission, generated chips, membership or fixture'},null,2));
    }
});

