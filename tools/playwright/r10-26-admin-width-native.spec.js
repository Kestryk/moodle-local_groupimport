const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('R10 26 admin choice width FR1280 FR390',async({page},info)=>{
 test.setTimeout(240000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const url=new URL('/admin/settings.php?section=local_groupimport&lang=fr',base);const rows=[],errors=[],writes=[];
 const save=()=>fs.writeFileSync(info.outputPath('r10-26.json'),JSON.stringify({rows,errors,writes},null,2));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/admin/settings.php*',r=>{if(r.request().method()!=='GET'){writes.push('settings');return r.abort();}return r.continue();});
 const settle=loc=>loc.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
 try{
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});await page.goto(url.href,{waitUntil:'domcontentloaded'});}
 const choices=page.locator('#adminsettings .easyedu-searchable-choice');await expect(choices.first()).toBeVisible({timeout:60000});
 for(const width of [1280,390]){
 await page.setViewportSize({width,height:1000});
 for(const choice of await choices.all()){
 await choice.scrollIntoViewIfNeeded();await settle(choice);
 const metric=await choice.evaluate(n=>{const b=n.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect();return {setting:n.closest('.form-item')?.id,width:b.width,parent:p.width,left:b.left,right:b.right,rem:parseFloat(getComputedStyle(document.documentElement).fontSize)};});
 rows.push({viewport:width,...metric});save();expect(metric.width).toBeGreaterThanOrEqual(Math.min(metric.parent,12*metric.rem)-1);expect(metric.right).toBeLessThanOrEqual(width+1);expect(metric.left).toBeGreaterThanOrEqual(-1);
 if(width===1280)expect(metric.width).toBeLessThanOrEqual(28*metric.rem+1);else expect(Math.abs(metric.width-metric.parent)).toBeLessThan(1);
 const trigger=choice.locator('.easyedu-searchable-choice__trigger');await trigger.click();const search=choice.getByRole('searchbox');await expect(search).toBeVisible();await search.fill('zzR10NoMatch');await search.fill('');await search.press('Escape');await expect(search).not.toBeVisible();await settle(choice);
 const after=await choice.evaluate(n=>n.getBoundingClientRect().width);expect(Math.abs(after-metric.width)).toBeLessThan(1);
 }
 await choices.first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('admin-width-'+width+'.png')});
 }
 expect(writes).toEqual([]);expect(errors).toEqual([]);
 }finally{save();}
});
