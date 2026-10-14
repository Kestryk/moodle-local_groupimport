const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

test('Component loading and inline admin reset FR1280 FR390',async({page},info)=>{
    test.setTimeout(300000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
    const url=new URL(process.env.EASYEDU_MOODLE_URL);
    if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 required');
    url.searchParams.set('lang','fr');
    const rows=[],errors=[],writes=[];
    const save=()=>fs.writeFileSync(info.outputPath('component-admin.json'),JSON.stringify({rows,errors,writes},null,2));
    page.on('pageerror',e=>{errors.push(e.message);save();});
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()!=='GET'){writes.push(new URL(route.request().url()).pathname);return route.abort();}
        return route.continue();
    });
    let held=false,arrived,release;
    await page.route('**/lib/ajax/service.php*',async route=>{
        let calls;try{calls=route.request().postDataJSON()||[];}catch{calls=[];}
        const names=calls.map(c=>c.methodname||'');
        if(names.some(n=>n.startsWith('local_groupimport_')&&!/_(get|list)_/.test(n))){writes.push(names);return route.abort();}
        if(held&&names.includes('local_groupimport_get_state')){held=false;arrived();await new Promise(r=>{release=r;});}
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
        for(const width of [1280,390]){
            const row={width,lang:'fr',stage:'loading'};rows.push(row);save();
            await page.setViewportSize({width,height:1000});
            const requested=new Promise(r=>{arrived=r;});held=true;
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            await Promise.race([requested,new Promise((_,reject)=>setTimeout(()=>reject(Error('State request missing')),60000))]);
            const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easyedu-loading-frame','1');
            await expect(root).toBeVisible();
            row.loading=await root.evaluate(n=>({
                pageSkeletons:n.querySelectorAll('.local-groupimport-easystud__loading-skeleton').length,
                avatars:n.querySelectorAll('[data-easystud-sm-loading="participants"] .local-groupimport-easystud__loading-card-avatar').length,
                groupLists:[...n.querySelectorAll('[data-easystud-sm-loading="groups"]')].map(x=>x.children.length),
                state:n.dataset.easystudLoadingState
            }));save();
            expect(row.loading.pageSkeletons).toBe(0);expect(row.loading.avatars).toBe(8);
            expect(row.loading.groupLists.length).toBeGreaterThan(0);
            expect(row.loading.groupLists.every(n=>n===3)).toBe(true);
            release();release=null;
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);
            row.stage='ready';save();
            await page.screenshot({path:info.outputPath(`sm-ready-${width}.png`)});
        }
        await page.goto(new URL('/admin/settings.php?section=local_groupimport&lang=fr',url).href,{waitUntil:'domcontentloaded'});
        const opener=page.locator('[data-local-groupimport-welcome-reset-open]');
        const dialog=page.locator('#easyedu-welcome-reset');
        await expect(opener).toBeVisible();
        const admin={stage:'admin',width:390};rows.push(admin);save();
        const original=page.url();
        await opener.click();await expect(dialog).toBeVisible();expect(page.url()).toBe(original);
        const cancel=dialog.locator('.easyedu-confirmation-dialog__actions [data-local-groupimport-welcome-reset-close]');
        await expect(cancel).toBeFocused();
        await page.screenshot({path:info.outputPath('admin-reset-390.png')});
        await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
        await opener.click();await cancel.click();await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
        admin.stage='cancel-escape-focus-pass';save();
        expect(writes).toEqual([]);expect(errors).toEqual([]);
    }finally{if(release)release();save();}
});
