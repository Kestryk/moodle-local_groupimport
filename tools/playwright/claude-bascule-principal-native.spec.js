const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const settle=locator=>locator.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true})
    .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
const metrics=locator=>locator.evaluate(n=>{const s=getComputedStyle(n),b=n.getBoundingClientRect();return {
    height:b.height,padding:s.padding,radius:s.borderRadius,font:s.font,minHeight:s.minHeight,border:s.borderWidth};});

test('Claude on demand only loading K16 Later principal FR EN',async({page},info)=>{
    test.setTimeout(480000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
    const url=new URL(process.env.EASYEDU_MOODLE_URL);
    if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 required');
    const rows=[],errors=[],writes=[],later={scope:'isolated adapter request, no persistent/session mutation'};
    const save=()=>fs.writeFileSync(info.outputPath('claude-bascule.json'),JSON.stringify({rows,errors,writes,later},null,2));
    page.on('pageerror',e=>{errors.push(e.message);save();});
    let hold=false,heldResolve,heldRequest,releaseState;
    await page.route('**/lib/ajax/service.php*',async route=>{
        let calls;try{calls=route.request().postDataJSON()||[];}catch{calls=[];}
        const names=calls.map(c=>c.methodname||'');
        const mutations=names.filter(n=>n.startsWith('local_groupimport_')&&!/_(get|list)_/.test(n));
        if(mutations.length){writes.push(mutations);return route.abort('blockedbyclient');}
        if(hold&&names.includes('local_groupimport_get_state')){heldResolve();await heldRequest;}
        return route.continue();
    });
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()!=='GET'){writes.push({url:new URL(route.request().url()).pathname});return route.abort('blockedbyclient');}
        return route.continue();
    });
    try{
        await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
        if(await page.locator('#username').count()){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        }
        for(const lang of ['fr','en'])for(const width of [1280,390]){
            const row={lang,width,stage:'starting'};rows.push(row);save();url.searchParams.set('lang',lang);
            await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
            const requestArrived=new Promise(resolve=>{heldResolve=resolve;});heldRequest=new Promise(resolve=>{releaseState=resolve;});hold=true;
            await page.goto(url.href,{waitUntil:'domcontentloaded'});const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-rendering-mode','reactive');
            await Promise.race([requestArrived,new Promise((_,reject)=>setTimeout(()=>reject(Error('State request not observed')),60000))]);
            row.loading=await root.evaluate(n=>({
                state:n.dataset.easystudLoadingState,
                skeletons:n.querySelectorAll('[data-easystud-sm-loading]').length,
                paintedEmpty:[...n.querySelectorAll('[data-easystud-empty-state],[data-easystud-managed-empty]')]
                    .filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>e.dataset.easystudEmptyState||e.dataset.easystudManagedEmpty),
                participantCards:n.querySelectorAll('[data-easystud-user]').length
            }));save();expect(row.loading.skeletons).toBeGreaterThan(0);expect(row.loading.paintedEmpty).toEqual([]);expect(row.loading.participantCards).toBe(0);
            hold=false;releaseState();await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
            await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+lang+'(?:-|$)'));
            row.ready=await root.evaluate(n=>({mode:n.dataset.easystudRenderingMode,participants:n.querySelectorAll('[data-easystud-user]').length}));save();
            expect(row.ready.participants).toBeGreaterThan(0);expect(row.ready.mode).toBe('reactive');
            const search=root.locator('[data-easystud-search]:visible');await search.fill('a');const reset=root.locator('[data-easystud-reset-filters]:visible');
            await expect(reset).toBeVisible();await settle(root);row.reset=await metrics(reset);expect(Math.abs(row.reset.height-38)).toBeLessThanOrEqual(1);
            await reset.focus();await page.keyboard.press('Enter');await expect(search).toHaveValue('');
            const groupingView=root.locator(width===390?'[data-easystud-mobile-view="groupings"]:visible':'[data-easystud-layout-mode="structure"]:visible').first();
            await groupingView.click();await settle(root);const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').first();await expect(grouping).toBeVisible();
            const id=await grouping.getAttribute('data-easystud-grouping-id');row.groupingId=id;
            let trigger;
            if(width===390){
                await grouping.locator(':scope > [data-easystud-card-menu]:visible, :scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first().click();
                const menu=root.locator('[data-easystud-context-menu].is-mobile-sheet');await expect(menu).toBeVisible();
                trigger=menu.locator('[data-easystud-context-action="grouping-search-groups"]');await expect(trigger).toBeVisible();
                await expect(trigger).toHaveText(lang==='fr'?'Rechercher des groupes':'Search groups');row.mobileSearchLabel=await trigger.textContent();
            }else{
                trigger=grouping.locator('[data-easystud-container-search-toggle]:visible').first();
                if(!(await trigger.count()))await grouping.locator(':scope > .local-groupimport-easystud-grouping__header > [data-easystud-group-actions-toggle]:visible').click();
            }
            await trigger.click();const panel=grouping.locator('[data-easystud-container-search-panel="'+id+'"]');await expect(panel).toBeVisible();await settle(panel);
            const field=panel.locator('[data-easystud-container-group-search]');await expect(field).toBeFocused();
            await expect(root.locator('[data-easystud-context-menu].is-mobile-sheet')).toBeHidden();
            const cancel=panel.locator('[data-easystud-container-search-cancel]');await expect(cancel).toBeVisible();row.cancel=await metrics(cancel);save();expect(row.reset).toEqual(row.cancel);
            await field.fill('qa-k16-does-not-match');await expect(field).toHaveValue('qa-k16-does-not-match');
            await cancel.click();await expect(panel).toBeHidden();await expect(field).toHaveValue('');await settle(root);
            row.closedFocusVisible=await page.evaluate(()=>{const n=document.activeElement;return !!n&&n!==document.body&&!!n.getClientRects().length&&!n.closest('[hidden]');});
            expect(row.closedFocusVisible).toBe(true);
            const clear=root.locator('[data-easystud-clear-all-selection]:visible, [data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();
            if(await clear.count())await clear.click();
            await page.screenshot({path:info.outputPath(lang+'-'+width+'-k16.png')});row.stage='complete';save();
        }
        await page.route('**/__easystud_later_adapter_qa',route=>{
            const data=new URLSearchParams(route.request().postData());later.fields=[...data.keys()].sort();later.action=data.get('action');later.method=route.request().method();save();
            return route.fulfill({contentType:'application/json',body:'{"acknowledged":true}'});
        });
        const response=page.waitForResponse(r=>r.url().endsWith('/__easystud_later_adapter_qa'));
        await page.evaluate(()=>new Promise((resolve,reject)=>require(['local_groupimport/guide_welcome'],Adapter=>{
            const root=document.createElement('div');root.id='qa-later-adapter';const button=document.createElement('button');button.dataset.easyeduGuideWelcomeDismiss='1';root.appendChild(button);document.body.appendChild(root);
            Adapter.init(root,{eligible:true,endpoint:'/__easystud_later_adapter_qa',courseid:5,generation:'isolated',sesskey:'qa-non-secret'});button.click();resolve();
        },reject)));
        await response;expect(later.action).toBe('later');expect(later.method).toBe('POST');expect(later.fields).toEqual(['action','courseid','generation','sesskey']);
        await page.evaluate(()=>new Promise(resolve=>require(['local_groupimport/guide_welcome'],Adapter=>{const root=document.getElementById('qa-later-adapter');Adapter.destroy(root);root.remove();resolve();})));
        later.adapterVerified=true;save();expect(errors).toEqual([]);expect(writes).toEqual([]);
    }finally{hold=false;releaseState?.();save();}
});
