const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised: native filter state only; no fixtures, upload or business POST.
test('Searchable multiple filters preserve native selections and reset across workspaces',async({page},testInfo)=>{
    test.setTimeout(180000);
    const records=[],blocked=[],errors=[];
    const root=page.locator('#local-groupimport-easystud');
    page.on('pageerror',e=>errors.push(e.message));
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.route('**/local/groupimport/**',async route=>{
        if(route.request().method()!=='GET'){blocked.push(route.request().method());await route.abort('blockedbyclient');}
        else await route.continue();
    });
    const save=()=>fs.writeFileSync(testInfo.outputPath('searchable-filters-native.json'),JSON.stringify({records,blocked,errors},null,2));
    const openFilters=async key=>{
        const toggle=root.locator('[data-easystud-advanced-filters-toggle="'+key+'"]:visible').first();
        await expect(toggle).toBeVisible();
        if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
        await expect(root.locator('[data-easystud-advanced-filters="'+key+'"]:visible')).toBeVisible();
        await expect(root.locator('[data-easystud-advanced-filters="'+key+'"]').first()).not.toHaveClass(/is-easyedu-disclosing/);
    };
    const exercise=async(hook,width,kind)=>{
        const select=root.locator(hook).first();
        const options=await select.evaluate(n=>[...n.options].filter(o=>!o.disabled&&o.value).slice(0,2).map(o=>({value:o.value,text:o.textContent})));
        expect(options.length,'Existing native catalogue needs two choices; never create data').toBe(2);
        const host=select.locator('xpath=following-sibling::*[1]');
        const trigger=host.locator('.easyedu-searchable-choice__trigger');
        await expect(select).toBeHidden();await trigger.click();
        const search=host.getByRole('searchbox');
        for(const option of options){await search.fill(option.text);await host.getByRole('button',{name:option.text,exact:true}).click();}
        await expect(trigger).toHaveAttribute('aria-expanded','true');
        expect(await select.evaluate(n=>[...n.selectedOptions].map(o=>o.value))).toEqual(options.map(o=>o.value));
        await search.fill('__no_native_match__');await expect(host.getByRole('status')).toBeVisible();
        expect(await select.evaluate(n=>[...n.selectedOptions].map(o=>o.value))).toEqual(options.map(o=>o.value));
        await search.press('Escape');await expect(trigger).toBeFocused();
        await trigger.click();await search.fill('');
        await expect(host.locator('[aria-pressed="true"]')).toHaveCount(2);
        const geometry=await trigger.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);
            return {h:r.height,font:s.fontSize,x:r.x,right:r.right,viewport:innerWidth};});
        expect(geometry.font).toBe('14px');expect(geometry.h).toBeGreaterThanOrEqual(width<=768?44:38);
        expect(geometry.x).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
        await host.screenshot({path:testInfo.outputPath(kind+'-'+width+'.png')});
        if(kind==='participant-groups'){
            const parity=await root.locator('[data-easystud-user]').evaluateAll((nodes,values)=>nodes.every(n=>{
                const matched=values.some(v=>(n.getAttribute('data-group-ids')||'').split(',').includes(v));
                return n.hasAttribute('data-easystud-filter-hidden')===!matched;
            }),options.map(o=>o.value));expect(parity,'Original native OR group predicate is unchanged').toBe(true);
        }
        await search.press('Escape');records.push({width,kind,geometry,selectionsPreserved:true});save();
        return {select,trigger};
    };
    for(const width of [1600,768,390]){
        await page.setViewportSize({width,height:1100});await page.goto(process.env.EASYEDU_MOODLE_URL);
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        if(width>1024)await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
        else await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
        await openFilters('participants');
        const groups=await exercise('[data-easystud-group-filter]',width,'participant-groups');
        await root.locator('[data-easystud-reset-filters]:visible').first().click();
        expect(await groups.select.evaluate(n=>n.selectedOptions.length)).toBe(0);
        await expect(groups.trigger).toContainText('Any');
        await openFilters('participants');
        if(width>1024){
            const groupings=await exercise('[data-easystud-grouping-filter]',width,'participant-groupings');
            await root.locator('[data-easystud-reset-filters]:visible').first().click();
            expect(await groupings.select.evaluate(n=>n.selectedOptions.length)).toBe(0);
            for(const [mode,key,filterKey] of [['participants','participants','participant-groups'],['structure','structure','structure-groups']]){
                await root.locator('[data-easystud-layout-mode="'+mode+'"]:visible').click();await openFilters(filterKey);
                const catalog=await exercise('[data-easystud-catalog-grouping-filter="'+key+'"]',width,'catalog-'+key);
                await root.locator('[data-easystud-reset-catalog-filters="'+key+'"]:visible').first().click();
                expect(await catalog.select.evaluate(n=>n.selectedOptions.length)).toBe(0);await expect(catalog.trigger).toContainText('Any');
            }
        }else{
            await expect(root.locator('[data-easystud-grouping-filter]')).toBeHidden();
            if(width<768){
                const roles=root.locator('[data-easystud-role-filter]');const host=roles.locator('xpath=following-sibling::*[1]');
                await expect(host).toBeVisible();await expect(root.locator('[data-easystud-role-toggle]')).toBeHidden();
                await host.locator('button').first().click();await host.getByRole('searchbox').fill('__none__');
                await expect(host.getByRole('status')).toBeVisible();await host.getByRole('searchbox').press('Escape');
                records.push({width,kind:'roles-native-mobile-fallback',search:true});save();
            }
        }
    }
    expect(errors).toEqual([]);expect(blocked).toEqual([]);save();
});
