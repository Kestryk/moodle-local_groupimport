// SM-45 local-supervised readback; no settings Save or fixture changes.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Administration section spacing records native layout',async({page},testInfo)=>{
    test.setTimeout(180000);
    const records=[],errors=[],blocked=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=new URL('/admin/settings.php?section=local_groupimport',process.env.EASYEDU_MOODLE_URL).toString();
    const guard=async r=>{if(r.request().method()==='GET')await r.continue();
        else{blocked.push(r.request().method());await r.abort('blockedbyclient');}};
    try{
        for(const width of [1600,768,390]){
            await page.setViewportSize({width,height:1100});await page.unroute('**/admin/settings.php*',guard).catch(()=>undefined);
            await page.goto(url);if(page.url().includes('/login/')){
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));await page.goto(url);
            }
            await page.route('**/admin/settings.php*',guard);
            await expect(page.locator('body')).not.toHaveClass(/local-groupimport-admin-settings-page--loading/,{timeout:60000});
            const form=page.locator('#adminsettings .settingsform');await expect(form.locator('h3.main').first()).toBeVisible();
            await page.evaluate(()=>document.fonts.ready);
            const headings=await form.locator('h3.main').evaluateAll(nodes=>nodes.map(n=>{
                const s=getComputedStyle(n),b=n.getBoundingClientRect(),prev=n.previousElementSibling?.getBoundingClientRect();
                return {title:n.textContent.trim(),parent:n.parentElement.tagName,font:s.fontSize,weight:s.fontWeight,
                    marginStart:s.marginBlockStart,marginEnd:s.marginBlockEnd,x:b.x,w:b.width,y:b.y,h:b.height,
                    gapBefore:prev?b.y-prev.bottom:null};
            }));
            const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
            records.push({width,headings,overflow});await page.screenshot({path:testInfo.outputPath(`admin-spacing-${width}.png`)});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('admin-section-spacing-baseline.json'),JSON.stringify({records,errors,blocked},null,2));}
});
