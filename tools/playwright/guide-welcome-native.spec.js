const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// Local-supervised. Only the current QA user's guide-seen preference may be
// acknowledged. No global reset, fixtures, course edits, messages or transfers.
test('Guide welcome actual opening persistence and admin cancel',async({page},info)=>{
    test.setTimeout(240000);
    const errors=[],blocked=[];
    const result={firstInvitationOffered:false,actualOpeningAcknowledged:false,resetConfirmed:false,
        courseWrites:false,fixtureRequested:false};
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        if(page.url()!==process.env.EASYEDU_MOODLE_URL)await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**',route=>{
        const request=route.request();
        if(request.method()==='GET')return route.continue();
        if(new URL(request.url()).pathname.endsWith('/guide_welcome.php') && request.method()==='POST'){
            const keys=[...new URLSearchParams(request.postData()).keys()].sort();
            if(JSON.stringify(keys)===JSON.stringify(['courseid','generation','sesskey']))return route.continue();
        }
        blocked.push('Unexpected plugin write');return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        if(route.request().method()!=='POST')return route.continue();
        const calls=route.request().postDataJSON().map(call=>call.methodname);
        if(calls.every(name=>name==='core_message_get_unsent_message'))return route.fulfill({contentType:'application/json',
            body:JSON.stringify(calls.map(()=>({error:false,data:{}})))});
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template',
            'core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if(calls.every(name=>reads.has(name)))return route.continue();
        blocked.push(calls);return route.abort('blockedbyclient');
    });
    try{
        await page.setViewportSize({width:1280,height:900});
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        const welcome=page.locator('[data-easyedu-guide-welcome]');
        const eligible=await page.evaluate(()=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig.welcomeOffer);
        result.firstInvitationOffered=eligible;
        if(eligible){
            await expect(welcome).toBeVisible();
            const ack=page.waitForResponse(r=>r.url().endsWith('/guide_welcome.php') && r.request().method()==='POST');
            await welcome.locator('[data-easyedu-guide-open]').click();
            const response=await ack;
            expect(await response.json()).toEqual({acknowledged:true});
            await expect(page.locator('[data-easyedu-guide-root]')).toHaveAttribute('data-easyedu-welcome-acknowledged','1');
            result.actualOpeningAcknowledged=true;
        }else{
            await expect(welcome).toBeHidden();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        }
        await page.locator('[data-easyedu-guide-modal] [data-easyedu-guide-close]').click();
        await page.reload({waitUntil:'domcontentloaded'});
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(page.locator('[data-easyedu-guide-welcome]')).toBeHidden();
        expect(await page.evaluate(()=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig.welcomeOffer)).toBe(false);
        result.reloadKeepsWelcomeSeen=true;
        const origin=new URL(page.url()).origin;
        const get=await page.request.get(origin+'/local/groupimport/guide_welcome.php?courseid=5&generation=initial');
        expect((await get.json()).acknowledged).not.toBe(true);
        const forged=await page.request.post(origin+'/local/groupimport/guide_welcome.php',{
            form:{courseid:'5',generation:'initial',sesskey:'invalid-test-key'}
        });
        expect((await forged.json()).acknowledged).not.toBe(true);
        result.getAndInvalidSesskeyRejected=true;
        await page.goto(origin+'/local/groupimport/reset_guide_welcome.php',{waitUntil:'domcontentloaded'});
        const confirmation=page.locator('.easyedu-confirmation-dialog');
        await expect(confirmation).toBeVisible();
        const cancel=confirmation.locator('.easyedu-button--secondary'),confirm=confirmation.locator('button[type=submit]');
        const a=await cancel.boundingBox(),b=await confirm.boundingBox();
        expect(Math.abs(a.height-b.height)).toBeLessThan(0.1);
        result.resetPairSameHeight=true;
        await cancel.click();
        await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        expect(await page.evaluate(()=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig.welcomeOffer)).toBe(false);
        result.adminCancelDoesNotReset=true;
        await page.setViewportSize({width:390,height:900});
        await expect(page.locator('[data-easyedu-guide-welcome]')).toBeHidden();
        result.mobileSuppressed=true;
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        result.presentationDiagnostic=await page.evaluate(()=>{
            const root=document.querySelector('[data-easyedu-guide-root]');
            const launcher=root?.querySelector('[data-easyedu-guide-open]');
            const ancestors=[];
            for(let node=launcher;node && ancestors.length<9;node=node.parentElement){
                const style=getComputedStyle(node),rect=node.getBoundingClientRect();
                ancestors.push({tag:node.tagName,classes:node.className,hidden:node.hidden,
                    display:style.display,visibility:style.visibility,width:rect.width,height:rect.height});
            }
            return {width:innerWidth,dismissed:root?.easyeduGuideWelcomeDismissed===true,
                invitationHidden:root?.querySelector('[data-easyedu-guide-welcome]')?.hidden,
                modalHidden:root?.querySelector('[data-easyedu-guide-modal]')?.hidden,ancestors};
        }).catch(()=>null);
        fs.writeFileSync(info.outputPath('guide-welcome-result.json'),JSON.stringify({...result,errors,blocked},null,2));
    }
});
