// Local-supervised SM integration surface. Upgrade is an explicitly selected test;
// no course mutation, external-function writes, auth-state export or synthetic timers.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const crypto=require('node:crypto');

async function login(page,path){
    const base=new URL(process.env.EASYEDU_MOODLE_URL);
    if(!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Local Moodle only');
    const url=new URL(path,base);url.searchParams.set('lang','fr');
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

test('SM schema upgrade through the native Moodle admin page',async({page},info)=>{
    test.setTimeout(180000);
    await login(page,'/admin/index.php');
    const stages=[];
    // Follow only the native upgrade controls; never install optional updates or
    // save unrelated settings. PHP preflight must have named only local_groupimport.
    for(let step=0;step<5;step++){
        const form=page.locator('form').filter({has:page.locator('input[name="confirmrelease"],input[name="confirmplugincheck"]')});
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
