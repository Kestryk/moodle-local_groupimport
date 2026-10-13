// Local-supervised SM integration surface. Upgrade is an explicitly selected test;
// No business writes except the explicitly selected SM3a test's single owned
// synthetic-user/group pair, always restored under runtime/fixture leases.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');

async function login(page,path,language='fr'){
    const base=new URL(process.env.EASYEDU_MOODLE_URL);
    if(!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Local Moodle only');
    const url=new URL(path,base);url.searchParams.set('lang',language);
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
    }
}

async function pageProof(page,info){
    await page.setViewportSize({width:1280,height:900});
    const errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        writes.push(route.request().method());return route.abort();
    });
    await login(page,'/local/groupimport/manage.php?id=5');
    const root=page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await expect(page.locator('html')).toHaveAttribute('lang','fr');
    await root.evaluate(node=>Promise.all(node.getAnimations({subtree:true})
        .filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{}))));
    const raw=await root.evaluate(root=>{
        const rect=node=>{const r=node.getBoundingClientRect();const s=getComputedStyle(node);
            return {x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,color:s.color};};
        const nodes=[...root.querySelectorAll('.easyedu-workspace-panel,.local-groupimport-easystud-create-card')]
            .filter(node=>node.getClientRects().length);
        return {text:root.innerText.replace(/\s+/g,' ').trim(),geometry:nodes.map(rect),
            counts:{users:root.querySelectorAll('[data-user-id]').length,groups:root.querySelectorAll('[data-easystud-group-id]').length,
                groupings:root.querySelectorAll('[data-easystud-grouping-id]').length}};
    });
    const {text,...layout}=raw;
    const report={surface:'SM-legacy-page',niveau:1,viewport:1280,lang:'fr',...layout,
        textHash:crypto.createHash('sha256').update(text).digest('hex'),errors,writes};
    fs.writeFileSync(info.outputPath('sm-legacy-page.json'),JSON.stringify(report,null,2));
    await page.screenshot({path:info.outputPath('sm-legacy-page.png')});
    expect(errors).toEqual([]);expect(writes).toEqual([]);expect(layout.geometry.length).toBeGreaterThan(0);
    return report;
}

test('T053 T058 native CSS bundle and neutral text contract',async({page},info)=>{
    test.setTimeout(240000);
    const cssResponses=[],pending=[],samples=[];
    page.on('response',response=>{
        if(/text\/css/.test(response.headers()['content-type']||''))pending.push(response.body().then(body=>{
            const text=body.toString('utf8');
            cssResponses.push({path:new URL(response.url()).pathname,status:response.status(),bytes:body.length,
                sha256:crypto.createHash('sha256').update(body).digest('hex'),
                containsConsumer:text.includes('.local-groupimport-easystud-column-heading__title'),
                embeddedBom:text.includes('\uFEFF'),contentEncoding:response.headers()['content-encoding']||null});
        }));
    });
    const pageContract=await pageProof(page,info);
    const root=page.locator('#local-groupimport-easystud');
    const settle=async locator=>locator.evaluate(n=>Promise.all(n.getAnimations({subtree:true})
        .filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{}))));
    const capture=async(scope,selector)=>{
        const rows=await scope.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{
            const s=getComputedStyle(n),r=n.getBoundingClientRect();
            const rgb=v=>(v.match(/[\d.]+/g)||[]).map(Number);
            let background=[255,255,255];
            const ancestors=[];for(let p=n;p;p=p.parentElement)ancestors.unshift(p);
            for(const p of ancestors){const c=rgb(getComputedStyle(p).backgroundColor),a=c.length===4?c[3]:1;
                if(c.length>=3)background=background.map((v,i)=>c[i]*a+v*(1-a));}
            const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
                .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
            const l=[lum(rgb(s.color).slice(0,3)),lum(background)].sort((a,b)=>b-a);
            return {text:n.textContent.trim(),className:n.className,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,
                color:s.color,background,contrast:(l[0]+.05)/(l[1]+.05),
                rect:{x:r.x,y:r.y,width:r.width,height:r.height},transition:s.transition,animation:s.animation};
        }));
        samples.push({selector,rows});
    };
    await capture(root,'.local-groupimport-easystud-column-heading__title');
    const eye=root.locator('[data-easystud-open-user]:visible').first();await eye.click();
    const user=root.locator('[data-easystud-user-modal]');await expect(user).toBeVisible();await settle(user);
    await capture(user,'.local-groupimport-easystud-detail__field-label,.local-groupimport-easystud-detail__field-value.is-empty');
    await user.locator('[data-easystud-close-user-modal]').click();await expect(user).toBeHidden();
    await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();await settle(root);
    for(const kind of ['group','grouping']){
        const area=kind==='group'?'[data-easystud-structure-groups]':'[data-easystud-tree]';
        await root.locator(area+' [data-easystud-open-advanced-settings][data-easystud-advanced-target="'+kind+'"]:visible').first().click();
        const modal=root.locator('[data-easystud-advanced-settings-modal]');await expect(modal).toBeVisible();await settle(modal);
        await capture(modal,'.local-groupimport-easystud-settings-modal__field-label,.local-groupimport-easystud-settings-modal__field--readonly > span,.local-groupimport-easystud-settings-modal__list-empty');
        await modal.locator('[data-easystud-close-advanced-settings]').click();await expect(modal).toBeHidden();
    }
    await Promise.all(pending);
    const report={surface:'T053-T058-native',niveau:1,viewport:1280,lang:'fr',pageContract,samples,cssResponses,
        writes:false,humanAccepted:false};
    fs.writeFileSync(info.outputPath('css-neutral-contract.json'),JSON.stringify(report,null,2));
    expect(cssResponses.some(row=>row.containsConsumer&&row.status===200&&!row.embeddedBom)).toBe(true);
    expect(samples.flatMap(s=>s.rows).length).toBeGreaterThan(5);
    if(process.env.EASYEDU_CSS_BASELINE){
        const before=JSON.parse(fs.readFileSync(process.env.EASYEDU_CSS_BASELINE,'utf8'));
        expect(pageContract.textHash).toBe(before.pageContract.textHash);
        expect(pageContract.counts).toEqual(before.pageContract.counts);
        expect(pageContract.geometry).toEqual(before.pageContract.geometry);
        expect(samples.length).toBe(before.samples.length);
        samples.forEach((sample,i)=>{
            expect(sample.rows.length).toBe(before.samples[i].rows.length);
            sample.rows.forEach((row,j)=>{
                const old=before.samples[i].rows[j];
                for(const key of ['text','className','font','size','weight','rect','transition','animation','background'])expect(row[key]).toEqual(old[key]);
                expect(row.contrast).toBeGreaterThanOrEqual(4.5);
            });
        });
    }
});

test('SM legacy page baseline before server integration',async({page},info)=>{
    test.setTimeout(180000);await pageProof(page,info);
});

test('SM registered server integration preserves legacy page',async({page},info)=>{
    test.setTimeout(180000);
    if(!process.env.EASYEDU_SM_BASELINE)throw Error('Explicit external baseline JSON required');
    const baseline=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_BASELINE,'utf8'));
    const actual=await pageProof(page,info);
    expect(actual.counts).toEqual(baseline.counts);expect(actual.textHash).toBe(baseline.textHash);
    expect(actual.geometry.length).toBe(baseline.geometry.length);
    actual.geometry.forEach((row,index)=>{
        for(const key of ['x','y','width','height'])expect(Math.abs(row[key]-baseline.geometry[index][key])).toBeLessThanOrEqual(1);
        for(const key of ['font','size','color'])expect(row[key]).toBe(baseline.geometry[index][key]);
    });
});

async function sm2bNative(page,info,settledPage=false){
    test.setTimeout(300000);
    const controls={},errors=[],blocked=[];
    let restored=false,baseline;
    const mode=value=>{
        for(const name of ['EASYEDU_SM_PHP','EASYEDU_SM_MODE_HELPER','EASYEDU_SM_MOODLE_ROOT']) {
            if(!process.env[name])throw Error('Explicit supervised mode helper required: '+name);
        }
        const result=JSON.parse(execFileSync(process.env.EASYEDU_SM_PHP,
            [process.env.EASYEDU_SM_MODE_HELPER,process.env.EASYEDU_SM_MOODLE_ROOT,value],
            {encoding:'utf8',timeout:60000}));
        expect(result.mode).toBe(value==='get'?'legacy':value);
        return result;
    };
    const settle=async root=>root.evaluate(node=>Promise.all(node.getAnimations({subtree:true})
        .filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{}))));
    const cards=root=>root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');
    const ids=async root=>cards(root).evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-user-id')));
    const paint=async root=>cards(root).evaluateAll(nodes=>nodes.map(node=>{
        const r=node.getBoundingClientRect(),s=getComputedStyle(node);
        const text=n=>n.textContent.replace(/\s+/g,' ').trim();
        const title=node.querySelector('.local-groupimport-easystud-user__name');
        const t=getComputedStyle(title);
        return {id:node.dataset.userId,text:node.innerText.replace(/\s+/g,' ').trim(),title:text(title),
            width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,color:s.color,
            titleFont:t.fontFamily,titleSize:t.fontSize,titleColor:t.color};
    }));
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    try{
        mode('get');
        if(!process.env.EASYEDU_SM_BASELINE)throw Error('Explicit legacy baseline required');
        baseline=await pageProof(page,info);
        const prior=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_BASELINE,'utf8'));
        expect(baseline.counts).toEqual(prior.counts);expect(baseline.textHash).toBe(prior.textHash);
        baseline.geometry.forEach((row,i)=>{
            for(const k of ['x','y','width','height'])expect(Math.abs(row[k]-prior.geometry[i][k])).toBeLessThanOrEqual(1);
            for(const k of ['font','size','color'])expect(row[k]).toBe(prior.geometry[i][k]);
        });
        controls.legacy1280FR=true;
        if(settledPage){
            await page.unroute('**/local/groupimport/**');
            await page.route('**/local/groupimport/**',route=>{
                if(route.request().method()==='GET')return route.continue();
                blocked.push({method:route.request().method(),path:new URL(route.request().url()).pathname});
                return route.abort();
            });
        }
        let root=page.locator('#local-groupimport-easystud');
        const legacy=await paint(root),firstIds=await ids(root);
        expect(firstIds).toHaveLength(20);
        mode('reactive');
        await login(page,'/local/groupimport/manage.php?id=5');
        root=page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-sm-ready','1',{timeout:60000});
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang','fr');await settle(root);
        await expect(cards(root)).toHaveCount(20);
        const reactive=await paint(root);
        fs.writeFileSync(info.outputPath('sm2b-page1-paint.json'),JSON.stringify({legacy,reactive},null,2));
        expect(await ids(root)).toEqual(firstIds);
        reactive.forEach((row,i)=>{
            for(const k of ['text','title','font','size','color','titleFont','titleSize','titleColor'])expect(row[k]).toBe(legacy[i][k]);
            for(const k of ['width','height'])expect(Math.abs(row[k]-legacy[i][k])).toBeLessThanOrEqual(1);
        });
        controls.page1Same=true;
        if(settledPage)await cards(root).first().scrollIntoViewIfNeeded();
        await page.screenshot({path:info.outputPath('sm2b-reactive-fr1280.png')});
        const pager=root.locator('[data-easystud-participant-list] > [data-easystud-pagination="top"]');
        await pager.locator('[data-easystud-page-next]').click();
        await expect(cards(root)).toHaveCount(4);expect(await ids(root)).not.toEqual(firstIds);
        await pager.locator('[data-easystud-page-prev]').click();
        if(settledPage)await expect.poll(()=>ids(root)).toEqual(firstIds);
        expect(await ids(root)).toEqual(firstIds);controls.pagination=true;
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selected.size)).toBe(24);
        await expect(cards(root).locator('[data-easystud-selector-input]:checked')).toHaveCount(20);
        await pager.locator('[data-easystud-page-next]').click();
        await expect(cards(root).locator('[data-easystud-selector-input]:checked')).toHaveCount(4);
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selected.size)).toBe(0);
        controls.selectAllCrossPage=true;
        const search=root.locator('[data-easystud-search]');
        await search.fill(legacy[0].title);
        await expect(cards(root)).toHaveCount(1);expect(await ids(root)).toEqual([firstIds[0]]);
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selected.size)).toBe(1);
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selected.size)).toBe(0);
        await search.fill('no-such-student-sm2b-qa');
        await expect(cards(root)).toHaveCount(0);
        await expect(root.locator('[data-easystud-empty-state="participants"]')).toBeVisible();
        await search.fill('');await expect(cards(root)).toHaveCount(20);
        controls.searchAndFilteredSelection=true;
        await cards(root).first().locator('[data-easystud-open-user]').click();
        const modal=root.locator('[data-easystud-user-modal]');
        await expect(modal).toBeVisible();
        await expect(modal.locator('.local-groupimport-easystud-detail__identity h4')).toHaveText(legacy[0].title);
        await modal.locator('[data-easystud-close-user-modal]').click();await expect(modal).toBeHidden();
        if(settledPage)await expect(cards(root).first().locator('[data-easystud-open-user]')).toBeFocused();
        controls.participantDetails=true;
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        mode('legacy');restored=true;
        fs.writeFileSync(info.outputPath('sm2b-native.json'),JSON.stringify({surface:'SM2b-principal',niveau:1,
            viewport:1280,language:'fr',controls,restoredLegacy:restored,errors,blocked,courseWrite:false},null,2));
    }
}

// Preserve the predecessor's immediate-page-read oracle and source in Git.
test('SM2b current and on-demand participants preserve native behavior',async({page},info)=>sm2bNative(page,info));
test('SM2b settled pagination preserves current and on-demand native behavior',async({page},info)=>sm2bNative(page,info,true));

async function participantDetailParity(page,info,deferredReady=false){
    test.setTimeout(300000);
    const report={surface:'SM2b-participant-detail-parity',niveau:1,viewport:1280,language:'fr',
        fields:{},errors:[],detailsRequests:0,restoredLegacy:false,courseWrite:false};
    const mode=value=>{
        if(!process.env.EASYEDU_SM_PHP||!process.env.EASYEDU_SM_MODE_HELPER||!process.env.EASYEDU_SM_MOODLE_ROOT)
            throw Error('Explicit supervised mode helper required');
        const r=JSON.parse(execFileSync(process.env.EASYEDU_SM_PHP,
            [process.env.EASYEDU_SM_MODE_HELPER,process.env.EASYEDU_SM_MOODLE_ROOT,value],{encoding:'utf8',timeout:60000}));
        expect(r.mode).toBe(value);return r;
    };
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
    page.on('request',r=>{if(r.url().includes('local_groupimport_get_details'))report.detailsRequests++;});
    await page.route('**/local/groupimport/**',r=>r.request().method()==='GET'?r.continue():r.abort());
    await page.setViewportSize({width:1280,height:900});
    try{
        for(const renderingmode of ['legacy','reactive']){
            mode(renderingmode);await login(page,'/local/groupimport/manage.php?id=5');
            const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            if(renderingmode==='reactive')await expect(root).toHaveAttribute('data-easystud-sm-ready','1',{timeout:60000});
            const card=root.locator('[data-easystud-participant-list] > [data-easystud-user]')
                .filter({has:page.locator('.local-groupimport-easystud-user__name',{hasText:'Test15 Etudiant'})});
            await expect(card).toHaveCount(1);
            await card.locator('[data-easystud-open-user]').click();
            const modal=root.locator('[data-easystud-user-modal]');await expect(modal).toBeVisible();
            await expect(modal.locator('.local-groupimport-easystud-detail__identity h4')).toHaveText('Test15 Etudiant');
            await modal.evaluate(n=>Promise.all(n.getAnimations({subtree:true})
                .filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{}))));
            if(deferredReady)await expect(modal.locator('[data-easystud-user-modal-body]')).not.toHaveAttribute('aria-busy','true',{timeout:30000});
            report.fields[renderingmode]=await modal.locator('.local-groupimport-easystud-detail__field').evaluateAll(nodes=>
                nodes.map(n=>({label:n.querySelector('span').textContent,value:n.querySelector('strong').textContent})));
            await page.screenshot({path:info.outputPath('sm2b-details-'+renderingmode+'-fr1280.png')});
            await modal.locator('[data-easystud-close-user-modal]').click();await expect(modal).toBeHidden();
            if(deferredReady&&renderingmode==='reactive'){
                expect(report.detailsRequests).toBe(1);
                await card.locator('[data-easystud-open-user]').click();await expect(modal).toBeVisible();
                await expect(modal.locator('[data-easystud-user-modal-body]')).not.toHaveAttribute('aria-busy','true');
                const again=await modal.locator('.local-groupimport-easystud-detail__field').evaluateAll(nodes=>
                    nodes.map(n=>({label:n.querySelector('span').textContent,value:n.querySelector('strong').textContent})));
                expect(again).toEqual(report.fields.legacy);expect(report.detailsRequests).toBe(1);report.cachedReopen=true;
                await modal.locator('[data-easystud-close-user-modal]').click();await expect(modal).toBeHidden();
                await expect(card.locator('[data-easystud-open-user]')).toBeFocused();
            }
        }
        expect(report.errors).toEqual([]);
        expect(report.fields.reactive).toEqual(report.fields.legacy);
    }finally{
        mode('legacy');report.restoredLegacy=true;
        fs.writeFileSync(info.outputPath('sm2b-details-parity.json'),JSON.stringify(report,null,2));
    }
}
test('SM2b participant detail fields match the current mode',async({page},info)=>participantDetailParity(page,info));
test('SM2b completed deferred details match Current and reopen from cache',async({page},info)=>participantDetailParity(page,info,true));

async function sm3aNative(page,info,pinnedGroup=false){
    test.setTimeout(360000);
    if(!process.env.EASYEDU_SM_MEMBERSHIP_MANIFEST||!process.env.EASYEDU_SM_MEMBERSHIP_HELPER)
        throw Error('Explicit owned membership baseline and cleanup helper required');
    const pair=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_MEMBERSHIP_MANIFEST,'utf8'));
    expect(pair.courseid).toBe(5);expect(pair.userid).toBe(29);expect(pair.groupid).toBe(342);
    expect(pair.pairInitiallyAbsent).toBe(true);
    const report={surface:'SM3a-native',niveau:1,viewport:1280,language:'fr',pair:{userid:pair.userid,groupid:pair.groupid},
        controls:{},actions:[],blocked:[],errors:[],versions:[],stateLoads:0,restoredLegacy:false,cleanup:null};
    const mode=value=>{
        const result=JSON.parse(execFileSync(process.env.EASYEDU_SM_PHP,
            [process.env.EASYEDU_SM_MODE_HELPER,process.env.EASYEDU_SM_MOODLE_ROOT,value],{encoding:'utf8',timeout:60000}));
        expect(result.mode).toBe(value==='get'?'legacy':value);
    };
    const pairCheck=phase=>JSON.parse(execFileSync(process.env.EASYEDU_SM_PHP,
        [process.env.EASYEDU_SM_MEMBERSHIP_HELPER,process.env.EASYEDU_SM_MOODLE_ROOT,phase,
            process.env.EASYEDU_SM_MEMBERSHIP_MANIFEST],{encoding:'utf8',timeout:60000}));
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
    page.on('response',r=>{if(r.url().includes('local_groupimport_get_state'))report.stateLoads++;});
    try{
        mode('get');expect(pairCheck('verify').passed).toBe(true);
        const actual=await pageProof(page,info);
        const prior=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_BASELINE,'utf8'));
        expect(actual.counts).toEqual(prior.counts);expect(actual.textHash).toBe(prior.textHash);
        actual.geometry.forEach((row,i)=>{
            for(const k of ['x','y','width','height'])expect(Math.abs(row[k]-prior.geometry[i][k])).toBeLessThanOrEqual(1);
            for(const k of ['font','size','color'])expect(row[k]).toBe(prior.geometry[i][k]);
        });
        report.controls.legacy1280FR=true;
        let root=page.locator('#local-groupimport-easystud');
        let group=root.locator('[data-easystud-group-id]:visible')
            .filter({has:page.locator('[data-easystud-member-id]:visible')}).first();
        if(pinnedGroup){
            const groupid=await group.getAttribute('data-easystud-group-id');
            group=root.locator('[data-easystud-group-id="'+groupid+'"]:visible').first();
        }
        const member=group.locator('[data-easystud-member-id]:visible').first();
        const memberid=await member.getAttribute('data-easystud-member-id');
        const name=await member.locator('.local-groupimport-easystud-member__name').innerText();
        await group.locator('[data-easystud-group-member-search-toggle]').click();
        const query=group.locator('[data-easystud-group-member-search]');
        await query.fill(name);
        await expect(group.locator('[data-easystud-member-id="'+memberid+'"]')).toBeVisible();
        await query.fill('sm3a-no-such-member');await expect(group.locator('[data-easystud-member-id]:visible')).toHaveCount(0);
        await query.fill('');await expect(group.locator('[data-easystud-member-id="'+memberid+'"]')).toBeVisible();
        await group.locator('[data-easystud-group-member-search-cancel]').click();
        report.controls.legacyMemberSearch=true;
        mode('reactive');await login(page,'/local/groupimport/manage.php?id=5');
        root=page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-sm-ready','1',{timeout:60000});
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await page.unroute('**/local/groupimport/**');
        await page.route('**/local/groupimport/**',route=>{
            const request=route.request();if(request.method()==='GET')return route.continue();
            const p=new URLSearchParams(request.postData()||''),action=p.get('action');
            const allowed=request.method()==='POST'&&new URL(request.url()).pathname==='/local/groupimport/ajax.php'
                &&p.get('courseid')==='5'&&p.get('groupid')===String(pair.groupid)&&!!p.get('sesskey')
                &&((action==='addusers'&&p.getAll('userids[]').join(',')===String(pair.userid))
                    ||(action==='removeuser'&&p.get('userid')===String(pair.userid)))
                &&!report.actions.includes(action);
            if(!allowed){report.blocked.push({method:request.method(),action});return route.abort();}
            report.actions.push(action);return route.continue();
        });
        const userCard=()=>root.locator('[data-easystud-participant-list] > [data-user-id="'+pair.userid+'"]');
        // Locator evaluation supplies the canonical root, never a synthetic state.
        const hasMembership=()=>root.evaluate((n,p)=>n.easystudSm.model.byId.get(p.userid).groupids.includes(p.groupid),pair);
        const version=()=>root.evaluate(n=>Number(n.easystudSm.raw.meta.version));
        expect(await hasMembership()).toBe(false);report.versions.push(await version());
        await userCard().locator('[data-easystud-selector-input]').check();
        await root.locator('[data-easystud-move-selected-participants]:visible').click();
        const modal=root.locator('[data-easystud-move-modal]');await expect(modal).toBeVisible();
        await modal.locator('.easyedu-searchable-choice__trigger').click();
        await modal.locator('.easyedu-searchable-choice__search input').fill(pair.groupname);
        await modal.locator('.easyedu-searchable-choice__option').filter({hasText:new RegExp('^'+pair.groupname+'$')}).click();
        await expect(modal.locator('[data-easystud-move-destination]')).toHaveValue(String(pair.groupid));
        await modal.locator('[data-easystud-confirm-move]').click();await expect(modal).toBeHidden();
        await expect.poll(hasMembership,{timeout:30000}).toBe(true);report.versions.push(await version());
        const density=root.locator('[data-easystud-density-toggle]');
        if(await density.getAttribute('aria-pressed')==='true')await density.click();
        await expect(userCard().locator('[data-easystud-participant-memberships="groups"]')).toContainText(pair.groupname);
        await expect(userCard().locator('[data-easystud-participant-memberships="groups"]')).toBeVisible();
        report.controls.addModelAndCard=true;
        await root.locator('[data-easystud-catalog-search="participants"]').fill(pair.groupname);
        const targetGroup=root.locator('[data-easystud-group-id="'+pair.groupid+'"]:visible').first();
        const newMember=targetGroup.locator('[data-easystud-member-id="'+pair.userid+'"]');
        await expect(newMember).toBeVisible();await newMember.locator('[data-easystud-remove-member]').click();
        await expect.poll(hasMembership,{timeout:30000}).toBe(false);report.versions.push(await version());
        await expect(userCard().locator('[data-easystud-participant-memberships="groups"]')).not.toContainText(pair.groupname);
        report.controls.removeModelAndCard=true;
        expect(report.versions[1]).toBeGreaterThan(report.versions[0]);
        expect(report.versions[2]).toBeGreaterThan(report.versions[1]);report.controls.serverVersionRefresh=true;
        expect(report.actions).toEqual(['addusers','removeuser']);expect(report.blocked).toEqual([]);expect(report.errors).toEqual([]);
    }finally{
        try{report.cleanup=pairCheck('cleanup');expect(report.cleanup.passed).toBe(true);}
        finally{mode('legacy');report.restoredLegacy=true;
            fs.writeFileSync(info.outputPath('sm3a-native.json'),JSON.stringify(report,null,2));}
    }
}

test('SM3a legacy member search and reactive Add Remove refresh the state',async({page},info)=>sm3aNative(page,info));
test('SM3a pinned group search and reactive Add Remove refresh the state',async({page},info)=>sm3aNative(page,info,true));

async function sm3bViews(page,info,retainText=false){
    const errors=[],blocked=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push({method:route.request().method(),path:new URL(route.request().url()).pathname});return route.abort();
    });
    await page.setViewportSize({width:1280,height:900});
    await login(page,'/local/groupimport/manage.php?id=5');
    const root=page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await expect(page.locator('html')).toHaveAttribute('lang','fr');
    await page.evaluate(()=>document.fonts.ready);
    const views={};
    for(const view of ['participants','both','structure']){
        const toggle=root.locator('[data-easystud-layout-mode="'+view+'"]');
        await expect(toggle).toBeVisible();await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','true');
        await root.evaluate(async n=>{
            await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime))
                .map(a=>a.finished.catch(()=>{})));
            await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        });
        views[view]=await root.evaluate(n=>{
            const active=node=>node.getClientRects().length&&node.getBoundingClientRect().width>10;
            const geometry=[...n.querySelectorAll('.easyedu-workspace-panel,.local-groupimport-easystud-create-card')]
                .filter(active).map(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);
                    return {x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,color:s.color};});
            const cards=selector=>[...n.querySelectorAll(selector+' > [data-easystud-group-id]')]
                .filter(active).map(node=>{
                    const r=node.getBoundingClientRect(),s=getComputedStyle(node);
                    const title=node.querySelector('.local-groupimport-easystud-group__name'),t=getComputedStyle(title);
                    return {id:node.dataset.easystudGroupId,text:node.innerText.replace(/\s+/g,' ').trim(),
                        width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,color:s.color,
                        background:s.backgroundColor,titleFont:t.fontFamily,titleSize:t.fontSize,titleColor:t.color};
                });
            return {text:n.innerText.replace(/\s+/g,' ').trim(),geometry,
                participantCatalog:cards('.local-groupimport-easystud-participant-groups__list'),
                structureCatalog:cards('.local-groupimport-easystud-structure-groups__list')};
        });
        views[view].textHash=crypto.createHash('sha256').update(views[view].text).digest('hex');
        if(!retainText)delete views[view].text;
        await page.screenshot({path:info.outputPath('sm3b-legacy-'+view+'-fr1280.png')});
    }
    const catalog=await root.locator('.local-groupimport-easystud-structure-groups__list').evaluate(list=>
        [...list.querySelectorAll(':scope > [data-easystud-group-id]')].map(n=>({id:n.dataset.easystudGroupId,
            search:n.dataset.searchText||'',ungrouped:n.dataset.hasNoGrouping==='1'})));
    return {surface:'SM3b-legacy-three-views',niveau:1,viewport:1280,language:'fr',views,catalog,errors,blocked};
}

test('SM3b legacy three-view baseline before catalog integration',async({page},info)=>{
    test.setTimeout(240000);
    const report=await sm3bViews(page,info);
    fs.writeFileSync(info.outputPath('sm3b-views.json'),JSON.stringify(report,null,2));
    expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);expect(report.catalog).toHaveLength(54);
    expect(report.views.participants.participantCatalog).toHaveLength(10);
    expect(report.views.structure.structureCatalog).toHaveLength(10);
});

async function sm3bNative(page,info,t057Aware=false){
    test.setTimeout(420000);
    if(!process.env.EASYEDU_SM_CATALOG_BASELINE)throw Error('Explicit pre3b legacy three-view baseline required');
    const before=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_CATALOG_BASELINE,'utf8'));
    if(t057Aware){
        const changes=approvedLanguageChanges();
        for(const view of Object.values(before.views)){
            if(typeof view.text!=='string')throw Error('Explicit pre-T057 retained-text baseline required');
            view.text=translateApprovedCopy(view.text,changes);
            view.textHash=crypto.createHash('sha256').update(view.text).digest('hex');
            for(const key of ['participantCatalog','structureCatalog'])view[key].forEach(card=>card.text=translateApprovedCopy(card.text,changes));
        }
    }
    const report={surface:'SM3b-native',niveau:1,controls:{},errors:[],blocked:[],restoredLegacy:false};
    const mode=value=>{
        const r=JSON.parse(execFileSync(process.env.EASYEDU_SM_PHP,
            [process.env.EASYEDU_SM_MODE_HELPER,process.env.EASYEDU_SM_MOODLE_ROOT,value],{encoding:'utf8',timeout:60000}));
        expect(r.mode).toBe(value);
    };
    const compareCards=(actual,prior)=>{
        expect(actual.length).toBe(prior.length);
        actual.forEach((row,i)=>{
            for(const key of ['id','text','font','size','color','background','titleFont','titleSize','titleColor'])expect(row[key]).toBe(prior[i][key]);
            for(const key of ['width','height'])expect(Math.abs(row[key]-prior[i][key])).toBeLessThanOrEqual(1);
        });
    };
    try{
        const actual=await sm3bViews(page,info);
        fs.writeFileSync(info.outputPath('sm3b-views.json'),JSON.stringify(actual,null,2));
        for(const view of ['participants','both','structure']){
            const a=actual.views[view],b=before.views[view];
            expect(a.textHash).toBe(b.textHash);expect(a.geometry.length).toBe(b.geometry.length);
            a.geometry.forEach((row,i)=>{
                for(const key of ['x','y','width','height'])expect(Math.abs(row[key]-b.geometry[i][key])).toBeLessThanOrEqual(1);
                for(const key of ['font','size','color'])expect(row[key]).toBe(b.geometry[i][key]);
            });
            compareCards(a.participantCatalog,b.participantCatalog);compareCards(a.structureCatalog,b.structureCatalog);
        }
        expect(actual.errors).toEqual([]);expect(actual.blocked).toEqual([]);report.controls.legacyThreeViews=true;
        mode('reactive');await login(page,'/local/groupimport/manage.php?id=5');
        const root=page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-sm-ready','1',{timeout:60000});
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
        const structure=root.locator('[data-easystud-layout-mode="structure"]');await structure.click();
        await expect(structure).toHaveAttribute('aria-pressed','true');
        const list=root.locator('.local-groupimport-easystud-structure-groups__list');
        const cards=()=>list.locator(':scope > [data-easystud-group-id]:visible');
        const ids=()=>cards().evaluateAll(nodes=>nodes.map(n=>n.dataset.easystudGroupId));
        const pager=list.locator(':scope > [data-easystud-pagination="top"]');
        await expect(cards()).toHaveCount(10);
        const first=before.views.structure.structureCatalog.map(c=>c.id);
        await expect.poll(ids).toEqual(first);
        await root.evaluate(n=>Promise.all(n.getAnimations({subtree:true})
            .filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{}))));
        const painted=await cards().evaluateAll(nodes=>nodes.map(node=>{
            const r=node.getBoundingClientRect(),s=getComputedStyle(node),title=node.querySelector('.local-groupimport-easystud-group__name'),t=getComputedStyle(title);
            return {id:node.dataset.easystudGroupId,text:node.innerText.replace(/\s+/g,' ').trim(),width:r.width,height:r.height,
                font:s.fontFamily,size:s.fontSize,color:s.color,background:s.backgroundColor,
                titleFont:t.fontFamily,titleSize:t.fontSize,titleColor:t.color};
        }));
        fs.writeFileSync(info.outputPath('sm3b-page1-paint.json'),JSON.stringify({before:before.views.structure.structureCatalog,reactive:painted},null,2));
        compareCards(painted,before.views.structure.structureCatalog);report.controls.reactivePage1=true;
        await cards().first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('sm3b-reactive-structure-fr1280.png')});
        await pager.locator('[data-easystud-page-next]').click();await expect.poll(ids).not.toEqual(first);
        await expect(cards()).toHaveCount(10);await pager.locator('[data-easystud-page-prev]').click();await expect.poll(ids).toEqual(first);
        report.controls.pagination=true;
        const search=root.locator('[data-easystud-structure-group-search]');
        const expected=before.catalog.filter(c=>c.search.toLowerCase().includes('group 1')).map(c=>c.id).sort();
        await search.fill('group 1');await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.catalogs.structure.filteredIds.map(String).sort())).toEqual(expected);
        expect((await ids()).every(id=>expected.includes(id))).toBe(true);
        await search.fill('sm3b-no-such-group');await expect(cards()).toHaveCount(0);
        await search.fill('');await expect.poll(ids).toEqual(first);report.controls.searchAndEmpty=true;
        await root.locator('[data-easystud-advanced-filters-toggle="structure-groups"]').click();
        await expect(root.locator('[data-easystud-advanced-filters-toggle="structure-groups"]')).toHaveAttribute('aria-expanded','true');
        const toggle=root.locator('[data-easystud-catalog-show-ungrouped="structure"]');await toggle.locator('..').click();await expect(toggle).toBeChecked();
        const ungrouped=before.catalog.filter(c=>c.ungrouped).map(c=>c.id).sort();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.catalogs.structure.filteredIds.map(String).sort())).toEqual(ungrouped);
        expect((await ids()).every(id=>ungrouped.includes(id))).toBe(true);report.controls.ungroupedFilter=true;
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selectedGroups.size)).toBe(ungrouped.length);
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selectedGroups.size)).toBe(0);
        await toggle.locator('..').click();await expect(toggle).not.toBeChecked();await expect.poll(ids).toEqual(first);
        await pager.locator('[data-easystud-select-results]').click();
        await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selectedGroups.size)).toBe(before.catalog.length);
        await pager.locator('[data-easystud-page-next]').click();await expect.poll(ids).not.toEqual(first);
        await expect(cards().locator(':scope > label [data-easystud-selector-input]:checked')).toHaveCount(10);
        await pager.locator('[data-easystud-select-results]').click();await expect.poll(()=>root.evaluate(n=>n.easystudSm.model.selectedGroups.size)).toBe(0);
        report.controls.selectAllAndFilteredCrossPage=true;report.counts={total:before.catalog.length,ungrouped:ungrouped.length,search:expected.length};
        report.blocked=actual.blocked;expect(report.blocked).toEqual([]);expect(report.errors).toEqual([]);
        if(t057Aware){
            mode('legacy');const index=await indexReference(page,true);
            report.index={actual:index,prior:before.index,nativePickerReady:index.picker.coreInstances>0};
            expect(index.text).toBe(before.index.text);expect(index.cards.length).toBe(before.index.cards.length);
            index.cards.forEach((row,i)=>{
                for(const key of ['width','height'])expect(Math.abs(row[key]-before.index.cards[i][key])).toBeLessThanOrEqual(1);
                for(const key of ['font','size','color'])expect(row[key]).toBe(before.index.cards[i][key]);
            });
            report.controls.indexStaticRender=true;
        }
    }finally{
        mode('legacy');report.restoredLegacy=true;fs.writeFileSync(info.outputPath('sm3b-native.json'),JSON.stringify(report,null,2));
    }
}
test('SM3b legacy views and on-demand Structure catalog preserve native behavior',async({page},info)=>sm3bNative(page,info));
test('Grouped T057 copy-aware legacy views and reactive catalog remain equivalent',async({page},info)=>sm3bNative(page,info,true));

function approvedLanguageChanges(){
    const path=require('node:path'),cp=require('node:child_process');
    const repo=path.resolve(__dirname,'../..'),{languages}=require('../release/audit-texts.cjs');
    const old=new Map(languages(cp.execFileSync('git',['show','15c8203:lang/fr/local_groupimport.php'],{cwd:repo,encoding:'utf8'})).map(r=>[r.key,r.value]));
    return languages(fs.readFileSync(path.join(repo,'lang/fr/local_groupimport.php'),'utf8'))
        .filter(r=>old.has(r.key)&&old.get(r.key)!==r.value).map(r=>({key:r.key,old:old.get(r.key),value:r.value}))
        .sort((a,b)=>b.old.length-a.old.length);
}

function translateApprovedCopy(text,changes){
    const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    for(const entry of changes){
        for(const upper of [false,true]){
            const from=upper?entry.old.toLocaleUpperCase('fr'):entry.old,to=upper?entry.value.toLocaleUpperCase('fr'):entry.value;
            const tokens=[...from.matchAll(/\{\$[aA](?:->[\w]+)?\}|__[a-zA-Z_]+__/g)].map(m=>m[0]);
            let pattern=escape(from);tokens.forEach(token=>pattern=pattern.replace(escape(token),'(\\d+)'));
            text=text.replace(new RegExp(pattern,'g'),(...matches)=>{
                let result=to;tokens.forEach((token,i)=>result=result.split(token).join(matches[i+1]));return result;
            });
        }
    }
    return text;
}

async function indexReference(page,diagnostic=false){
    await login(page,'/local/groupimport/index.php?id=5');
    const root=page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    if(diagnostic)await expect(root.locator('.fp-btn-choose')).toBeAttached();
    else await expect(root.locator('.fp-btn-choose')).toBeVisible({timeout:30000});
    return root.evaluate(n=>({text:n.innerText.replace(/\s+/g,' ').trim(),picker:{
        wrapper:n.querySelector('.filepicker')?.className,
        buttonDisplay:getComputedStyle(n.querySelector('.fp-btn-choose')).display,
        coreInstances:Object.keys(window.M?.core_filepicker?.instances||{}).length,
        formInstances:Object.keys(window.M?.form_filepicker?.instances||{}).length},cards:[...n.querySelectorAll('.local-groupimport-import-card')]
        .filter(e=>e.getBoundingClientRect().width>10).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);
            return {width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,color:s.color};})}));
}

test('Grouped validated lots pre-publication legacy and Mass Import reference',async({page},info)=>{
    test.setTimeout(360000);
    const report=await sm3bViews(page,info,true);report.index=await indexReference(page);
    fs.writeFileSync(info.outputPath('grouped-legacy-reference.json'),JSON.stringify(report,null,2));
    expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
});
test('Grouped references record native filepicker initialization separately',async({page},info)=>{
    test.setTimeout(360000);const report=await sm3bViews(page,info,true);
    fs.writeFileSync(info.outputPath('grouped-legacy-reference.json'),JSON.stringify(report,null,2));
    report.index=await indexReference(page,true);
    fs.writeFileSync(info.outputPath('grouped-legacy-reference.json'),JSON.stringify(report,null,2));
    expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
});

test('Grouped Mass Import remains unchanged and French plurals are rendered',async({page},info)=>{
    test.setTimeout(240000);await page.setViewportSize({width:1280,height:900});
    const errors=[],blocked=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route('**/local/groupimport/**',r=>r.request().method()==='GET'?r.continue():(blocked.push(r.request().method()),r.abort()));
    const prior=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_CATALOG_BASELINE,'utf8')).index;
    const actual=await indexReference(page,true);
    fs.writeFileSync(info.outputPath('grouped-index-fr1280.json'),JSON.stringify({actual,prior,errors,blocked},null,2));
    expect(actual).toEqual(prior);expect(errors).toEqual([]);expect(blocked).toEqual([]);
    await login(page,'/local/groupimport/manage.php?id=5');
    const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await expect(root.locator('.local-groupimport-easystud__panel-badge').first()).toContainText('24 participants');
    expect((await root.innerText()).includes('membre(s)')).toBe(false);
});

test('SM schema upgrade through the native Moodle admin page',async({page},info)=>{
    test.setTimeout(180000);
    await login(page,'/admin/index.php');
    const stages=[];
    // Follow only the native upgrade controls; never install optional updates or
    // save unrelated settings. PHP preflight must have named only local_groupimport.
    for(let step=0;step<5;step++){
        // The update-search form also carries current confirmation flags.
        // Only value=1 on the native continuation form authorizes this upgrade.
        const pluginForm=page.locator('form').filter({has:page.locator('input[name="confirmplugincheck"][value="1"]')})
            .filter({hasNot:page.locator('input[name="fetchupdates"]')});
        const form=await pluginForm.count()?pluginForm:page.locator('form')
            .filter({has:page.locator('input[name="confirmrelease"][value="1"]')})
            .filter({hasNot:page.locator('input[name="fetchupdates"]')});
        if(!await form.count())break;
        const flags=await form.locator('input[type="hidden"]').evaluateAll(nodes=>nodes.map(n=>n.name));
        stages.push({flags});
        await form.locator('button[type="submit"],input[type="submit"]').click();
        await page.waitForLoadState('domcontentloaded');
    }
    const body=await page.locator('body').innerText();
    fs.writeFileSync(info.outputPath('sm-web-upgrade.json'),JSON.stringify({surface:'SM-web-upgrade',stages,
        path:new URL(page.url()).pathname,successVisible:/Success|Succès|succès|succ[eè]s|Mise à jour terminée/.test(body)},null,2));
    await page.screenshot({path:info.outputPath('sm-web-upgrade.png')});
    expect(stages.length).toBeGreaterThan(0);
    expect(body).not.toMatch(/Exception -|Coding error detected|Erreur de programmation|DDL sql execution error/);
    // Persisted version/table/function checks are verified read-only in PHP after this test.
});

test('Grouped server lots preserve legacy view settings and CSV preview',async({page},info)=>{
    test.setTimeout(240000);
    if(!process.env.EASYEDU_SM_BASELINE)throw Error('Explicit external baseline JSON required');
    const before=JSON.parse(fs.readFileSync(process.env.EASYEDU_SM_BASELINE,'utf8'));
    const actual=await pageProof(page,info);
    expect(actual.counts).toEqual(before.counts);expect(actual.textHash).toBe(before.textHash);
    expect(actual.geometry.length).toBe(before.geometry.length);
    actual.geometry.forEach((row,index)=>{
        for(const key of ['x','y','width','height'])expect(Math.abs(row[key]-before.geometry[index][key])).toBeLessThanOrEqual(1);
        for(const key of ['font','size','color'])expect(row[key]).toBe(before.geometry[index][key]);
    });
    const writes=[],errors=[],settings=[];let csvPreview=false,freshPickerEmpty=false,draftId=null;
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    try{
        for(const language of ['fr','en']){
            await login(page,'/admin/settings.php?section=local_groupimport',language);
            await expect(page.locator('html')).toHaveAttribute('lang',language);
            const field=page.locator('select[name="s_local_groupimport_renderingmode"]');
            await expect(field).toHaveValue('legacy');
            const options=await field.locator('option').allTextContents();
            expect(options).toEqual(language==='fr'?['Actuel','À la demande (aperçu)']:['Current','On demand (preview)']);
            settings.push({language,value:await field.inputValue(),options});
        }
        // Replace the read-only page guard only for the owned picker upload and
        // preview POST. A confirmed import/rollback stays blocked absolutely.
        await page.unroute('**/local/groupimport/**');
        await page.route('**/local/groupimport/**',route=>{
            const request=route.request(),data=request.postData()||'';
            if(request.method()!=='GET'){
                if(/(?:confirmimport|rollbackhistoryid|action)=/.test(data)){writes.push('blocked course command');return route.abort();}
                writes.push({path:new URL(request.url()).pathname,kind:'draft-or-preview'});
            }
            return route.continue();
        });
        await login(page,'/local/groupimport/index.php?id=5');
        const root=page.locator('#local-groupimport-import');
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await root.locator('.fp-btn-choose').click();
        await page.locator('.fp-upload-form input[type="file"]').waitFor({state:'attached'}).catch(async()=>{
            await page.getByText(/^(Déposer un fichier|Upload a file)$/).click();
        });
        await page.locator('.fp-upload-form input[type="file"]').setInputFiles({name:'server-integration-qa.csv',mimeType:'text/csv',
            buffer:Buffer.from('student;group;grouping\ntest.etudiant.01@example.com;Integration QA;Integration QA\nunknown.integration@example.invalid;Integration QA;Integration QA')});
        await page.locator('.fp-upload-btn').click();
        await expect(root.locator('.filepicker-filename')).toContainText('server-integration-qa.csv',{timeout:30000});
        draftId=await root.locator('input[name="importfile"]').inputValue();
        await root.locator('.local-groupimport-import-card--upload [type="submit"]').click();
        await expect(root).toHaveClass(/has-preview/,{timeout:60000});
        await expect(root.locator('.local-groupimport-import-preview__table')).toBeVisible();
        csvPreview=true;
        await page.screenshot({path:info.outputPath('csv-preview-fr1280.png')});
        await root.locator('[data-local-groupimport-upload-toggle]').click();
        // Preview returns a new empty upload form. Its previous draft is not a
        // selected file in this form; exact external draft cleanup follows the run.
        await expect(root.locator('.filepicker-filename a')).toHaveCount(0);
        freshPickerEmpty=true;
        expect(errors).toEqual([]);expect(writes).not.toContain('blocked course command');
    }finally{
        fs.writeFileSync(info.outputPath('grouped-server-native.json'),JSON.stringify({surface:'grouped-server-preview',niveau:1,
            legacyViewCompared:true,settings,csvPreview,freshPickerEmpty,draftId,
            draftCleanup:'exact owned-draft external verification required',errors,writes,importConfirmed:false},null,2));
    }
});
