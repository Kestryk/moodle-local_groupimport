const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// Local-supervised reading only, never apply a selection/course command.
test('Guide identifier route updated copy containment',async({page},info)=>{
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
            if(!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            const opener=page.locator('[data-easyedu-guide-open]:visible').first();
            await opener.click();
            const modal=page.locator('[data-easyedu-guide-modal]:visible');
            await expect(modal).toBeVisible();
            expect(await modal.locator('[data-easyedu-guide-slide]').count()).toBe(24);
            // reference-3,7,9,10,11,19, after the
            // introduction-first migration; keep historical identities intact.
            for(const index of [13]) {
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const slide=modal.locator(`[data-easyedu-guide-slide="${index}"]:visible`);
                await expect(slide).toBeVisible();
                const copy=slide.locator('.easyedu-guide-introduction');
                await expect(copy).toBeVisible();
                await expect(copy.locator('.easyedu-guide-introduction__topic')).toHaveCount(3);
                const result=await copy.evaluate(node=>{
                    const texts=[...node.querySelectorAll('p,dd,dt > span:last-child')].map(text=>{
                        const range=document.createRange();range.selectNodeContents(text);
                        const ink=range.getBoundingClientRect(),box=text.getBoundingClientRect();
                        return {text:text.textContent,font:getComputedStyle(text).fontFamily,
                            contained:ink.left>=box.left-1 && ink.right<=box.right+1 && ink.bottom<=box.bottom+1};
                    });
                    return {texts,overflow:node.scrollWidth>node.clientWidth+1};
                });
                const paragraph=slide.locator('.easyedu-guide-slide__content p');
                await expect(paragraph).toContainText('existing group names or IDs');
                await expect(copy).toContainText('For a single destination card, open More actions');
                const main=await paragraph.evaluate(node=>{
                    const range=document.createRange();range.selectNodeContents(node);
                    const ink=range.getBoundingClientRect(),box=node.getBoundingClientRect();
                    return {text:node.textContent,font:getComputedStyle(node).fontFamily,
                        contained:ink.left>=box.left-1 && ink.right<=box.right+1 && ink.bottom<=box.bottom+1,
                        overflow:node.scrollWidth>node.clientWidth+1};
                });
                expect(main.contained).toBe(true);expect(main.overflow).toBe(false);
                expect(main.font.includes('Inter')).toBe(true);
                rows.push({width,index,...result,main});
                expect(result.texts).toHaveLength(7);
                expect(result.overflow).toBe(false);
                expect(result.texts.every(text=>text.contained)).toBe(true);
                expect(result.texts.every(text=>text.font.includes('Inter'))).toBe(true);
            }
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();await expect(opener).toBeFocused();
            if(await page.locator('[data-easyedu-navigation-backdrop]:visible').count()) {
                await page.locator('[data-easyedu-navigation-close]:visible').first().click();
            }
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally {
        fs.writeFileSync(info.outputPath('guide-identifier-route-copy.json'),JSON.stringify({rows,errors,blocked,
            scope:'Native reading/containment only; availability and business commands not exercised'},null,2));
    }
});
