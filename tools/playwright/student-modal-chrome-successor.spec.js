// Local-supervised SM-44 successor; preserve the immutable compact baseline.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Canonical History and Message chrome preserves native open and cancel',async({page},testInfo)=>{
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
    const inspect=async(modal,headerSelector,titleSelector,closeSelector,footerSelector)=>modal.evaluate((n,q)=>{
        const rect=s=>{const b=s.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};
        const h=n.querySelector(q.headerSelector),t=n.querySelector(q.titleSelector),c=n.querySelector(q.closeSelector),
            hs=getComputedStyle(h),ts=getComputedStyle(t),f=q.footerSelector?n.querySelector(q.footerSelector):null;
        const hit=b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));};
        return {header:{...rect(h),background:hs.backgroundColor,image:hs.backgroundImage,padding:hs.padding},
            title:{...rect(t),font:ts.fontSize,weight:ts.fontWeight,family:ts.fontFamily,color:ts.color},
            close:{...rect(c),radius:getComputedStyle(c).borderRadius,hit:hit(c)},
            footer:f?{...rect(f),paddingRight:parseFloat(getComputedStyle(f).paddingRight),justify:getComputedStyle(f).justifyContent}:null,
            buttons:f?[...f.querySelectorAll('button')].map(b=>({...rect(b),font:getComputedStyle(b).fontSize,
                weight:getComputedStyle(b).fontWeight,radius:getComputedStyle(b).borderRadius,hit:hit(b),
                color:getComputedStyle(b).color,background:getComputedStyle(b).backgroundColor,
                action:b.getAttribute('data-action')})):[]};
    },{headerSelector,titleSelector,closeSelector,footerSelector});
    const assertHeader=p=>{
        expect(Math.abs(p.header.h-64)).toBeLessThanOrEqual(1);
        expect(p.header.padding).toBe('12px 20px');expect(p.header.image).not.toBe('none');
        expect(p.title.font).toBe('16px');expect(p.title.weight).toBe('700');expect(p.title.family).toContain('Inter');
        expect(Math.abs(p.close.w-30.4)).toBeLessThanOrEqual(1);expect(Math.abs(p.close.h-30.4)).toBeLessThanOrEqual(1);
        expect(Math.abs(p.close.y+p.close.h/2-p.header.y-p.header.h/2)).toBeLessThanOrEqual(1);expect(p.close.hit).toBe(true);
        expect(p.title.right).toBeLessThanOrEqual(p.close.x);expect(p.title.y).toBeGreaterThanOrEqual(p.header.y);
        expect(p.title.bottom).toBeLessThanOrEqual(p.header.bottom);
    };
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
            await expect(modal.locator('#bulk-message')).toHaveCSS('resize','none');
            const message=await inspect(modal,'.modal-header','.modal-title','[data-action="hide"]','.modal-footer');
            assertHeader(message);expect(message.footer.justify).toBe('flex-end');expect(message.buttons).toHaveLength(2);
            for(const b of message.buttons){expect(b.font).toBe('14.08px');expect(b.weight).toBe('600');
                expect(Math.abs(b.h-37.6)).toBeLessThanOrEqual(1);expect(b.radius).toBe('11.52px');expect(b.hit).toBe(true);}
            expect(Math.abs(message.buttons[0].h-message.buttons[1].h)).toBeLessThanOrEqual(1);
            expect(Math.abs(message.buttons[1].right-message.footer.right+message.footer.paddingRight)).toBeLessThanOrEqual(1);
            expect(message.buttons[0].right).toBeLessThan(message.buttons[1].x);
            await modal.locator('.modal-content').screenshot({path:testInfo.outputPath(`message-chrome-${width}.png`)});
            await modal.locator('.modal-footer [data-action="cancel"]').click();await expect(modal).toBeHidden();
            const messageFocusRestored=await trigger.evaluate(n=>n===document.activeElement);expect(messageFocusRestored).toBe(true);
            await selection.evaluate(n=>n.click());
            const url=new URL(process.env.EASYEDU_MOODLE_URL);url.pathname=url.pathname.replace(/manage\.php$/,'index.php');
            await openPage(url.toString());const mass=page.locator('#local-groupimport-import');
            await expect(mass).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.route('**/*',guard);
            const navigation=page.locator('#local-groupimport-import-navigation');
            let history=navigation.locator('[data-easyedu-navigation-item-id="mass-import-history"] button:visible').first();
            if(await history.count()===0){await navigation.locator('[data-easyedu-navigation-open]:visible').click();
                history=navigation.locator('[data-easyedu-navigation-panel] [data-easyedu-navigation-item-id="mass-import-history"] button');}
            await history.click();const historyModal=mass.locator('[data-local-groupimport-history-modal]');
            await expect(historyModal).toBeVisible();await page.waitForTimeout(500);
            const historyPaint=await inspect(historyModal,'.easyedu-dialog-header',
                '#local-groupimport-import-history-title','[data-local-groupimport-history-close]',null);
            assertHeader(historyPaint);expect(historyPaint.header.image).toBe(message.header.image);
            expect(historyPaint.title.color).toBe(message.title.color);
            await historyModal.locator('.local-groupimport-import-modal__dialog').screenshot({path:testInfo.outputPath(`history-chrome-${width}.png`)});
            await historyModal.locator('[data-local-groupimport-history-close]').click();await expect(historyModal).toBeHidden();
            records.push({width,message,history:historyPaint,messageFocusRestored,openCancelOnly:true});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('modal-chrome-successor.json'),JSON.stringify({records,errors,blocked},null,2));}
});
