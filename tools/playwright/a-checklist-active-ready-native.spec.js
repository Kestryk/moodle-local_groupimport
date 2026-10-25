const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const settle=locator=>locator.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true})
    .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});

// Presentation/API proof with owned QA storage; no guided business-action proof.
test('A CHECKLIST ready active row scroll reduced instruction compact fold FR',async({page},info)=>{
    test.setTimeout(360000);page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);
    const url=new URL(process.env.EASYEDU_MOODLE_URL);
    if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 required');
    url.searchParams.set('lang','fr');url.searchParams.set('easystudloadingdiagnostics','1');
    const rows=[],errors=[],writes=[],startup={};
    const save=()=>fs.writeFileSync(info.outputPath('a-checklist.json'),JSON.stringify({rows,errors,writes,startup},null,2));
    page.on('pageerror',e=>{errors.push(e.message);save();});
    await page.addInitScript(()=>{
        window.qaChecklistStartup=[];let observed=false;
        const attach=()=>{const root=document.getElementById('local-groupimport-easystud');if(!root||observed)return;observed=true;
            const record=()=>window.qaChecklistStartup.push({state:root.dataset.easystudLoadingState,at:performance.now()});record();
            new MutationObserver(record).observe(root,{attributes:true,attributeFilter:['data-easystud-loading-state']});};
        new MutationObserver(attach).observe(document,{childList:true,subtree:true});attach();
    });
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()!=='GET'){writes.push(new URL(route.request().url()).pathname);return route.abort('blockedbyclient');}
        return route.continue();
    });
    await page.route('**/lib/ajax/service.php*',route=>{
        let calls;try{calls=route.request().postDataJSON()||[];}catch{calls=[];}
        const mutations=calls.map(c=>c.methodname||'').filter(n=>n.startsWith('local_groupimport_')&&!/_(get|list)_/.test(n));
        if(mutations.length){writes.push(mutations);return route.abort('blockedbyclient');}return route.continue();
    });
    let initialized=false;
    try{
        await page.setViewportSize({width:1600,height:1000});
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
        }
        const workspace=page.locator('#local-groupimport-easystud');
        await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(workspace).toHaveAttribute('data-easystud-rendering-mode','reactive',{timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);
        startup.states=await page.evaluate(()=>window.qaChecklistStartup);save();
        const guide=page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
        await guide.evaluate(root=>{window.qaChecklistOriginalConfig=root.easyeduGuideConfig;
            window.qaChecklistOriginalStorage=Object.fromEntries(Object.entries(localStorage));});initialized=true;
        for(const width of [1600,1280,390]){
            const row={width,lang:'fr',stage:'starting',scope:'owned presentation path / public completion events, native SM targets'};rows.push(row);save();
            await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
            const nativeTarget=workspace.locator('.local-groupimport-easystud-column-heading__title:visible, h3:visible, [data-easystud-search]:visible').first();
            await expect(nativeTarget).toBeVisible({timeout:60000});
            await nativeTarget.scrollIntoViewIfNeeded();
            await nativeTarget.evaluate(n=>{document.querySelectorAll('[data-qa-checklist-target]').forEach(e=>e.removeAttribute('data-qa-checklist-target'));
                n.setAttribute('data-qa-checklist-target','1');});
            row.stage='target-prepared';save();
            row.instructions=await guide.evaluate(async(root,width)=>{
                const config=window.qaChecklistOriginalConfig;
                const original=Object.values(config.paths).sort((a,b)=>b.length-a.length)[0];
                if(!original?.length)throw Error('Existing path instructions required');
                const steps=Array.from({length:12},(_,index)=>({id:'qa-step-'+index,title:original[index%original.length].title,
                    description:original[index%original.length].description||original[index%original.length].title,
                    target:'qaChecklistNativeTarget',highlightTarget:'qaChecklistNativeTarget',waitForCompletion:true,
                    completeOn:'qa-a-checklist-next-'+index}));
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,{...config,firstVisit:false,storageKey:'qa-a-checklist-'+width,
                    paths:{...config.paths,'practice-membership':steps},targets:{...config.targets,qaChecklistNativeTarget:'[data-qa-checklist-target="1"]'}});
                return steps.map(s=>({title:s.title,description:s.description}));
            },width);save();
            if(!(await page.locator('[data-easyedu-guide-open]:visible').count()))await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal=guide.locator('[data-easyedu-guide-modal]');await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="1"]').click();
            await modal.locator('[data-easyedu-guide-start-path="practice-membership"]').click();await expect(modal).toBeHidden();
            const panel=guide.locator('[data-easyedu-guide-checklist]'),list=panel.locator('[data-easyedu-guide-checklist-items]');
            await expect(panel).toBeVisible();await expect(list.locator('[data-easyedu-guide-step-index]')).toHaveCount(12);
            if(width===390){await expect(panel).toHaveClass(/is-minimized/);await expect(list.locator('.is-active')).toBeVisible();}
            // Public completion events move the active row; no locator click can auto-scroll the list for this oracle.
            for(let index=0;index<11;index++){
                await page.evaluate(index=>document.dispatchEvent(new CustomEvent('qa-a-checklist-next-'+index)),index);
                await expect(list.locator('[data-easyedu-guide-step-index="'+(index+1)+'"]')).toHaveClass(/is-active/);
            }
            const active=list.locator('[data-easyedu-guide-step-index="11"]');
            await expect(active).toBeVisible();await expect(active.locator('.easyedu-guided-panel__index')).toHaveText('12');
            await expect(active.locator('strong')).toHaveText(row.instructions[11].title);
            await expect(panel.locator('[data-easyedu-guide-checklist-title]')).toContainText(row.instructions[11].title);
            await expect(active.locator('small').first()).toHaveText(row.instructions[11].description);
            await expect(active.locator('small').first()).toBeVisible();
            if(width!==390){
                await expect.poll(()=>list.evaluate(n=>{const a=n.querySelector('.is-active'),b=n.getBoundingClientRect(),r=a.getBoundingClientRect();
                    return Math.max(b.top+n.clientTop-r.top,r.bottom-(b.top+n.clientTop+n.clientHeight));}),{timeout:15000}).toBeLessThanOrEqual(1);
                row.list=await list.evaluate(n=>({scrollTop:n.scrollTop,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight}));save();
                expect(row.list.scrollHeight).toBeGreaterThan(row.list.clientHeight);expect(row.list.scrollTop).toBeGreaterThan(0);
                await panel.locator('[data-easyedu-guide-checklist-minimize]:visible').click();
            }
            await expect(panel).toHaveClass(/is-minimized/);await expect(active).toBeVisible();await settle(panel);
            row.reduced=await panel.evaluate(n=>({visibleSteps:[...n.querySelectorAll('[data-easyedu-guide-step-index]')].filter(e=>e.getClientRects().length).length,
                panel:n.getBoundingClientRect().toJSON(),overflow:n.scrollWidth-n.clientWidth}));save();expect(row.reduced.visibleSteps).toBe(1);expect(row.reduced.overflow).toBeLessThanOrEqual(1);
            await page.screenshot({path:info.outputPath('fr-'+width+'-reduced.png')});
            if(width===390){
                await panel.locator('[data-easyedu-guide-checklist-restore]:visible').click();await expect(panel).not.toHaveClass(/is-minimized/);
                await panel.locator('[data-easyedu-guide-checklist-minimize]:visible').focus();
                row.overlap=await panel.evaluate(n=>{const p=n.getBoundingClientRect();const card=[...document.querySelectorAll('[data-easystud-participant-list] [data-easystud-user]')]
                    .find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.left<p.right&&r.right>p.left&&r.top<p.bottom&&r.bottom>p.top;});
                    if(!card)throw Error('Actual participant card must overlap expanded panel');
                    const target='[data-easystud-participant-list] [data-easystud-user="'+card.dataset.easystudUser+'"]';
                    const result={target,card:card.getBoundingClientRect().toJSON(),panel:p.toJSON()};
                    document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight',{detail:{root:n.closest('[data-easyedu-guide-root]'),target,dock:true}}));return result;
                });save();await expect(panel).toHaveClass(/is-minimized/);
                await expect(panel.locator('[data-easyedu-guide-checklist-restore]:visible')).toBeFocused();await expect(active).toBeVisible();
                row.autoFold=true;await page.screenshot({path:info.outputPath('fr-390-auto-fold.png')});
            }
            await page.evaluate(()=>document.dispatchEvent(new CustomEvent('qa-a-checklist-next-11')));
            await expect(panel).toHaveClass(/is-complete/);await expect(panel.locator('[data-easyedu-guide-checklist-message]')).toBeVisible();
            await expect(panel.locator('[data-easyedu-guide-checklist-return]')).toBeVisible();await expect(list).toBeHidden();
            row.complete=true;row.stage='complete';save();await panel.locator('[data-easyedu-guide-checklist-close]:visible').click();await expect(panel).toBeHidden();
        }
        expect(errors).toEqual([]);expect(writes).toEqual([]);
    }finally{
        if(initialized)await guideCleanup(page);
        save();
    }
});
async function guideCleanup(page){
    await page.evaluate(async()=>{const root=document.querySelector('[data-easyedu-guide-root]');
        const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));Guide.destroy(root);
        for(const key of Object.keys(localStorage))if(key.startsWith('qa-a-checklist-'))localStorage.removeItem(key);
        document.querySelectorAll('[data-qa-checklist-target]').forEach(n=>n.removeAttribute('data-qa-checklist-target'));
        const expected=window.qaChecklistOriginalStorage;
        if(JSON.stringify(Object.fromEntries(Object.entries(localStorage)))!==JSON.stringify(expected))throw Error('Original Guide storage changed');
        Guide.init(root,window.qaChecklistOriginalConfig);delete window.qaChecklistOriginalConfig;delete window.qaChecklistOriginalStorage;
    });
}
