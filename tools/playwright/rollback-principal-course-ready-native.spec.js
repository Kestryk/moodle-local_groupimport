const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const setMode=mode=>execFileSync(process.env.EASYEDU_PHP_EXECUTABLE,['-r',
    "define('CLI_SCRIPT',true); require $argv[1].'/config.php'; set_config('renderingmode',$argv[2],'local_groupimport'); echo get_config('local_groupimport','renderingmode');",
    process.env.EASYEDU_MOODLE_ROOT,mode],{encoding:'utf8',timeout:30000}).trim();
const settle=locator=>locator.evaluate(async node=>{
    await document.fonts.ready;
    await Promise.all(node.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations))
        .map(a=>a.finished.catch(()=>{})));
});
const paint=locator=>locator.evaluate(node=>{
    const s=getComputedStyle(node),b=node.getBoundingClientRect();
    return {height:b.height,width:b.width,background:s.backgroundColor,border:s.borderColor,borderWidth:s.borderWidth,
        shadow:s.boxShadow,outline:s.outlineStyle,outlineWidth:s.outlineWidth,radius:s.borderRadius,text:node.textContent.trim()};
});
const alpha=color=>color==='transparent'?0:Number(color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1]??1);


// Prepared after retained integration failure; correct course5 URL, not yet run.
test('Rollback principal course5 ready FR1280 390',async({page},info)=>{
    test.setTimeout(300000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
    const url=new URL(process.env.EASYEDU_MOODLE_URL);if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 required');url.searchParams.set('lang','fr');
    const rollbackRows=[],errors=[],writes=[];
    const saveN2=()=>fs.writeFileSync(info.outputPath('rollback-principal.json'),JSON.stringify({rollbackRows,errors,writes},null,2));
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/local/groupimport/**',route=>{if(route.request().method()!=='GET'){writes.push(route.request().postData());return route.abort('blockedbyclient');}return route.continue();});
    const checkRollback=async()=>{
        for(const mode of ['legacy','reactive'])for(const width of [1280,390]){
            expect(setMode(mode)).toBe(mode);await page.setViewportSize({width,height:1000});
            await page.goto(new URL('/local/groupimport/index.php?id=5&lang=fr',url).href,{waitUntil:'domcontentloaded'});
            const history=page.locator('[data-local-groupimport-history-modal]');await expect(history).toHaveAttribute('data-local-groupimport-history-bound','1',{timeout:60000});
            const trigger=page.locator('[data-local-groupimport-history-open]:visible, [data-easyedu-navigation-action="mass-import-history"]:visible').first();
            await expect(trigger.or(page.locator('[data-easyedu-navigation-open]:visible')).first()).toBeVisible();
            if(!(await trigger.count()))await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await trigger.click();await expect(history).toBeVisible();await settle(page.locator('body'));
            const opener=history.locator('[data-local-groupimport-rollback-open]:visible').first();await expect(opener).toBeVisible();
            const modal=page.locator('[data-local-groupimport-rollback-modal]');await expect(modal).toHaveAttribute('data-local-groupimport-rollback-bound','1');
            for(const exit of ['Escape','cancel','backdrop']){
                const row={mode,width,exit,stage:'opening'};rollbackRows.push(row);saveN2();
                await opener.focus();await page.keyboard.press('Enter');await expect(modal).toBeVisible();await settle(modal);
                expect(await modal.evaluate(n=>n.contains(document.activeElement)&&document.activeElement.matches('[data-local-groupimport-rollback-close]'))).toBe(true);
                const stops=modal.locator('button:visible, a[href]:visible, input:not([type="hidden"]):visible');
                await stops.last().focus();await page.keyboard.press('Tab');await expect(stops.first()).toBeFocused();
                await page.keyboard.press('Shift+Tab');await expect(stops.last()).toBeFocused();
                if(exit==='Escape')await page.keyboard.press('Escape');
                else if(exit==='cancel')await modal.locator('[data-local-groupimport-rollback-close]').last().click();
                else await modal.click({position:{x:2,y:2}});
                await expect(modal).toBeHidden();await settle(page.locator('body'));await expect(history).toBeVisible();await expect(opener).toBeFocused();
                row.stage='complete';saveN2();
            }
            await page.screenshot({path:info.outputPath(mode+'-'+width+'-rollback.png')});
        }
    };


    try{
        expect(setMode('legacy')).toBe('legacy');await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
        if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
        await checkRollback();expect(errors).toEqual([]);expect(writes).toEqual([]);
    }finally{setMode('legacy');saveN2();}
});
