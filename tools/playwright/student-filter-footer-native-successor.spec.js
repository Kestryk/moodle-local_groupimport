const {test,expect} = require('@playwright/test');
const fs = require('node:fs');

// Actual native availability, including intentionally hidden desktop Groupings.
test('More Filters footer successor preserves native Motion and available-width spacing',async({page},testInfo)=>{
    test.setTimeout(240000);
    const records=[],errors=[],blocked=[],root=page.locator('#local-groupimport-easystud');
    const guard=async r=>{if(r.request().method()==='GET')await r.continue();else{blocked.push(r.request().method());await r.abort('blockedbyclient');}};
    page.on('pageerror',e=>errors.push(e.message));
    await page.emulateMedia({reducedMotion:'no-preference'});
    try{
        for(const width of [1600,768,390]){
            await page.unroute('**/local/groupimport/**',guard).catch(()=>undefined);
            await page.setViewportSize({width,height:1100});await page.goto(process.env.EASYEDU_MOODLE_URL);
            if(page.url().includes('/login/')){
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL);
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.route('**/local/groupimport/**',guard);
            const cases=width>1024?[['participants','participants'],['participants','participant-groups'],
                ['structure','structure-groups'],['structure','structure-groupings']]:
                [['participants','participants'],['groups','structure-groups'],['groupings','structure-groupings']];
            for(const [mode,key]of cases){
                await root.locator(width>1024?`[data-easystud-layout-mode="${mode}"]:visible`:`[data-easystud-mobile-view="${mode}"]:visible`).click();
                const raw=root.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
                await expect(raw).toHaveCount(1);
                if(width>1024&&key==='structure-groupings'){
                    await expect(raw).not.toBeVisible();records.push({width,mode,key,intentionallyUnavailable:true});continue;
                }
                const button=raw,panel=root.locator(`[data-easystud-advanced-filters="${key}"]`);
                await expect(button).toBeVisible();await button.hover();await page.waitForTimeout(180);
                const paint=await button.evaluate(n=>{const r=n.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect(),s=getComputedStyle(n);
                    return {width:r.width,parentWidth:p.width,height:r.height,font:s.fontSize,gap:s.gap,background:s.backgroundColor,border:s.borderTopColor,
                        decoration:getComputedStyle(n.querySelector('span')).textDecorationLine};});
                expect(paint.font).toBe('12.16px');expect(paint.gap).toBe('6.72px');
                expect(Math.abs(paint.width-paint.parentWidth)).toBeLessThan(.1);
                expect(paint.height).toBeGreaterThanOrEqual(width>1024?33.5:44);
                expect(paint.background).toBe('rgba(0, 0, 0, 0)');
                expect(paint.border).toBe('rgba(0, 0, 0, 0)');expect(paint.decoration).toBe('underline');
                await panel.evaluate(n=>{
                    window.__footerMotion=[];
                    window.__footerObserver=new MutationObserver(()=>{
                        if(n.classList.contains('is-easyedu-disclosing'))window.__footerMotion.push(n.getAttribute('aria-hidden'));
                    });
                    window.__footerObserver.observe(n,{attributes:true,attributeFilter:['class']});
                });
                if(await button.getAttribute('aria-expanded')!=='true')await button.click();
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);expect(await panel.evaluate(n=>n.inert)).toBe(false);
                const geometry=await panel.evaluate((n,key)=>{const b=document.querySelector(`[data-easystud-advanced-filters-toggle="${key}"]`).getBoundingClientRect(),r=n.getBoundingClientRect();
                    const rows=Array.from(n.querySelectorAll('.easyedu-searchable-choice__trigger,.easyedu-filter-toggle,.easyedu-filter-reset')).filter(c=>c.checkVisibility());
                    return {edgeGap:b.top-r.bottom,lastControlGap:rows.length?b.top-Math.max(...rows.map(c=>c.getBoundingClientRect().bottom)):null};},key);
                expect(geometry.edgeGap).toBeGreaterThanOrEqual(15.9);
                if(geometry.lastControlGap!==null)expect(geometry.lastControlGap).toBeGreaterThanOrEqual(15.9);
                await panel.locator('..').screenshot({path:testInfo.outputPath(`footer-${width}-${key}.png`)});
                await button.click();await expect(button).toHaveAttribute('aria-expanded','false');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);expect(await panel.evaluate(n=>n.inert)).toBe(true);
                const transitions=await page.evaluate(()=>{window.__footerObserver.disconnect();return window.__footerMotion;});
                expect(transitions).toContain('false');expect(transitions).toContain('true');
                records.push({width,mode,key,paint,geometry,transitions});
            }
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('filter-footer-native-successor.json'),JSON.stringify({records,errors,blocked},null,2));}
});
