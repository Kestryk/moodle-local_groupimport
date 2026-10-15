const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('Claude complement4-8 Alt selection and unified dropdown',async({page},info)=>{
 test.setTimeout(180000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('integration.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_/.test(c.methodname)&&!/^local_groupimport_(?:sm_)?(?:get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 await page.setViewportSize({width:1280,height:1000});await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});}
 const root=page.locator('#local-groupimport-easystud');
 const settle=async()=>{await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);};
 try{
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await root.locator('[data-easystud-layout-mode="participants"]:visible').click();await settle();
  const api=await page.evaluate(()=>new Promise((resolve,reject)=>require(['local_groupimport/motion'],m=>resolve(Object.fromEntries(['getLevel','reveal','showMenu','hideMenu'].map(k=>[k,typeof m[k]]))),reject)));rows.push({stage:'motion-public-api',...api});save();for(const type of Object.values(api))expect(type).toBe('function');
  const cards=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');expect(await cards.count()).toBeGreaterThan(1);
  const selected=()=>cards.evaluateAll(nodes=>nodes.filter(n=>n.classList.contains('is-selected')).length);
  await cards.nth(0).locator('.local-groupimport-easystud-user__name').click();expect(await selected()).toBe(1);
  await cards.nth(1).locator('.local-groupimport-easystud-user__name').click({modifiers:['Alt']});expect(await selected()).toBe(2);
  await cards.nth(1).locator('.local-groupimport-easystud-user__name').click({modifiers:['Alt']});expect(await selected()).toBe(1);rows.push({stage:'alt-toggle',added:true,removed:true});save();
  await root.locator('[data-easystud-advanced-filters-toggle="participants"]').click();await settle();
  const trigger=root.locator('.easyedu-searchable-choice__trigger:visible').first();await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');const panel=page.locator('#'+await trigger.getAttribute('aria-controls'));await expect(panel).toBeVisible();await settle();
  await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(panel).toBeHidden();rows.push({stage:'dropdown',opened:true,closed:true});save();
  await page.screenshot({path:info.outputPath('integration-1280.png')});expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
