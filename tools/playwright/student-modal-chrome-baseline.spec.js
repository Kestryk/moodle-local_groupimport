const {test,expect}=require('@playwright/test'),fs=require('node:fs');

// local-supervised: existing course, native modal read/open/Cancel only.
test('Native History and Message chrome baseline preserves open and cancel',async({page},testInfo)=>{
    test.setTimeout(240000);
    const records=[],errors=[],blocked=[];
    const guard=async route=>{
        const req=route.request(),body=req.postData()||'';
        if(req.method()!=='GET'&&(req.url().includes('/local/groupimport/')||/core_message_(send|delete)/.test(body))){
            blocked.push(req.method());await route.abort('blockedbyclient');
        }else await route.continue();
    };
    page.on('pageerror',e=>errors.push(e.message));
    const openPage=async url=>{
        await page.unroute('**/*',guard).catch(()=>undefined);await page.goto(url);
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
            await page.goto(url);
        }
    };
    const paint=(modal,header,title,close,footer)=>modal.evaluate((n,q)=>{
        const rect=s=>{const b=s.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};
        const h=n.querySelector(q.header),t=n.querySelector(q.title),c=n.querySelector(q.close),
            hs=getComputedStyle(h),ts=getComputedStyle(t),f=q.footer?n.querySelector(q.footer):null;
        return {header:{...rect(h),background:hs.backgroundColor,image:hs.backgroundImage,padding:hs.padding},
            title:{...rect(t),font:ts.fontSize,weight:ts.fontWeight,family:ts.fontFamily,color:ts.color},
            close:{...rect(c),radius:getComputedStyle(c).borderRadius},
            buttons:f?[...f.querySelectorAll('button')].map(b=>({...rect(b),font:getComputedStyle(b).fontSize,
                radius:getComputedStyle(b).borderRadius,action:b.getAttribute('data-action')})):[]};
    },{header,title,close,footer});
    await page.emulateMedia({reducedMotion:'no-preference'});
    try{
        for(const width of [1600,768,390]){
            await page.setViewportSize({width,height:1100});await openPage(process.env.EASYEDU_MOODLE_URL);
            const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.route('**/*',guard);
            if(width<=1024)await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
            const selection=root.locator('[data-easystud-user]:visible').first().locator('[data-easystud-selector-input]');
            await selection.evaluate(n=>n.click());
            const trigger=width>1024?root.locator('[data-easystud-message-selected-participants]:visible').first():
                root.locator('[data-easystud-mobile-action-trigger="[data-easystud-message-selected-participants]"]:visible').first();
            await expect(trigger).toBeEnabled();await trigger.click();
            const modal=page.locator('.local-groupimport-easystud-message-modal.show').last();
            await expect(modal.locator('#bulk-message')).toBeVisible({timeout:30000});
            await expect(modal).not.toHaveClass(/is-loading/);await page.waitForTimeout(500);
            const message=await paint(modal,'.modal-header','.modal-title','[data-action="hide"]','.modal-footer');
            await modal.locator('.modal-content').screenshot({path:testInfo.outputPath(`message-chrome-${width}.png`)});
            await modal.locator('.modal-footer [data-action="cancel"]').click();await expect(modal).toBeHidden();
            await selection.evaluate(n=>n.click());

            const importUrl=new URL(process.env.EASYEDU_MOODLE_URL);importUrl.pathname=importUrl.pathname.replace(/manage\.php$/,'index.php');
            await openPage(importUrl.toString());const mass=page.locator('#local-groupimport-import');
            await expect(mass).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.route('**/*',guard);
            const navigation=page.locator('#local-groupimport-import-navigation');
            let history=navigation.locator('[data-easyedu-navigation-item-id="mass-import-history"] button:visible').first();
            if(await history.count()===0){await navigation.locator('[data-easyedu-navigation-open]:visible').click();
                history=navigation.locator('[data-easyedu-navigation-panel] [data-easyedu-navigation-item-id="mass-import-history"] button');}
            await history.click();const historyModal=mass.locator('[data-local-groupimport-history-modal]');
            await expect(historyModal).toBeVisible();await page.waitForTimeout(500);
            const historyPaint=await paint(historyModal,'.local-groupimport-import-modal__header',
                '#local-groupimport-import-history-title','[data-local-groupimport-history-close]',null);
            await historyModal.locator('.local-groupimport-import-modal__dialog').screenshot({path:testInfo.outputPath(`history-chrome-${width}.png`)});
            await historyModal.locator('[data-local-groupimport-history-close]').click();await expect(historyModal).toBeHidden();
            records.push({width,message,history:historyPaint,openCancelOnly:true});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('modal-chrome-baseline.json'),JSON.stringify({records,errors,blocked},null,2));}
});
