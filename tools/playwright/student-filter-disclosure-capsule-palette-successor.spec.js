const {test,expect} = require('@playwright/test');
const fs = require('node:fs');

// Actual native availability, including intentionally hidden desktop Groupings.
test('More Filters capsule preserves native Motion and nested closure',async({page},testInfo)=>{
    test.setTimeout(300000);
    const records=[],errors=[],blocked=[],root=page.locator('#local-groupimport-easystud');
    const guard=async r=>{if(r.request().method()==='GET')await r.continue();else{blocked.push(r.request().method());await r.abort('blockedbyclient');}};
    page.on('pageerror',e=>errors.push(e.message));
    // Native core template/string bootstrap is read-only. This getter consumes
    // a session draft, so return empty without touching the real user's draft.
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods=[];
        try { methods=route.request().postDataJSON().map(c=>c.methodname); } catch (_) {}
        if(methods.length&&methods.every(m=>m==='core_message_get_unsent_message')) {
            return route.fulfill({status:200,contentType:'application/json',
                body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
        }
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies']);
        if(methods.length&&methods.every(m=>reads.has(m)))return route.continue();
        blocked.push({coreMethods:methods});return route.abort();
    });
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
                    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
                    const context=canvas.getContext('2d'),capsule=getComputedStyle(n.firstElementChild).backgroundColor;
                    context.fillStyle=capsule;context.fillRect(0,0,1,1);
                    const rgba=[...context.getImageData(0,0,1,1).data];
                    const chosen=getComputedStyle(n.closest('.easyedu-ui')).getPropertyValue('--easyedu-primary-chosen').trim();
                    return {width:r.width,parentWidth:p.width,height:r.height,font:s.fontSize,gap:s.gap,background:s.backgroundColor,border:s.borderTopColor,
                        decoration:getComputedStyle(n.querySelector('span')).textDecorationLine,
                        capsule,rgba,chosen,
                        capsuleWidth:n.firstElementChild.getBoundingClientRect().width,
                        centreError:Math.abs((n.firstElementChild.getBoundingClientRect().left+n.firstElementChild.getBoundingClientRect().right-r.left-r.right)/2)};});
                expect(paint.font).toBe('12.16px');expect(paint.gap).toBe('6.72px');
                expect(Math.abs(paint.width-paint.parentWidth)).toBeLessThan(.1);
                expect(paint.height).toBeGreaterThanOrEqual(width>1024?33.5:44);
                expect(paint.background).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\)$/);
                expect(paint.border).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\)$/);expect(paint.decoration).toBe('none');
                expect(paint.chosen).toMatch(/^#[0-9a-f]{6}$/i);
                const expected=[1,3,5].map(i=>Math.round(parseInt(paint.chosen.slice(i,i+2),16)*.1+255*.9));
                expect(paint.rgba).toEqual([...expected,255]);expect(paint.capsuleWidth).toBeLessThan(paint.width);
                expect(paint.centreError).toBeLessThan(.2);
                await panel.evaluate(n=>{
                    window.__footerMotion=[];window.__footerFrames=[];window.__footerSampling=true;
                    const sample=()=>{if(!window.__footerSampling)return;const r=n.getBoundingClientRect();
                        window.__footerFrames.push({time:performance.now(),height:r.height,opacity:getComputedStyle(n).opacity,
                            disclosing:n.classList.contains('is-easyedu-disclosing'),hidden:n.getAttribute('aria-hidden')});requestAnimationFrame(sample);};requestAnimationFrame(sample);
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
                const transitions=await page.evaluate(()=>{window.__footerObserver.disconnect();window.__footerSampling=false;return {phases:window.__footerMotion,frames:window.__footerFrames};});
                expect(transitions.phases).toContain('false');expect(transitions.phases).toContain('true');
                for(const hidden of ['false','true']){
                    const frames=transitions.frames.filter(f=>f.disclosing&&f.hidden===hidden);
                    expect(frames.length).toBeGreaterThanOrEqual(2);
                    expect(new Set(frames.map(f=>Math.round(f.height))).size).toBeGreaterThanOrEqual(2);
                }
                records.push({width,mode,key,paint,geometry,transitions});
            }
        }
            // Genuine nested choice: one parent click must close both layers.
        for(const width of [1600,768,390]){
            await page.setViewportSize({width,height:1100});
            await root.locator(width>1024?'[data-easystud-layout-mode="participants"]:visible':'[data-easystud-mobile-view="participants"]:visible').click();
            const button=root.locator('[data-easystud-advanced-filters-toggle="participants"]'),
                panel=root.locator('[data-easystud-advanced-filters="participants"]');
            await button.click();await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            const choice=panel.locator('[data-easystud-group-filter]').first().locator('xpath=following-sibling::*[1]'),
                trigger=choice.locator('.easyedu-searchable-choice__trigger'),child=choice.locator('.easyedu-searchable-choice__panel');
            await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');
            await button.click();await expect(button).toHaveAttribute('aria-expanded','false');
            await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(child).toBeHidden();
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);expect(await panel.evaluate(n=>n.inert)).toBe(true);
            records.push({width,nestedClosedInOneClick:true});
            await page.emulateMedia({reducedMotion:'reduce'});
            await button.click();await expect(button).toHaveAttribute('aria-expanded','true');
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);expect(await panel.evaluate(n=>n.inert)).toBe(false);
            await button.click();await expect(button).toHaveAttribute('aria-expanded','false');
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);expect(await panel.evaluate(n=>n.inert)).toBe(true);
            records.push({width,reducedEndpoints:true});
            await page.emulateMedia({reducedMotion:'no-preference'});
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{fs.writeFileSync(testInfo.outputPath('filter-footer-native-successor.json'),JSON.stringify({records,errors,blocked},null,2));}
});
