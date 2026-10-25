const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Served entity dialogs keyboard geometry and relation pills',async({page},info)=>{
 test.setTimeout(480000);page.setDefaultTimeout(25000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 only');url.searchParams.set('lang','fr');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('entity.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_/.test(c.methodname)&&!/^local_groupimport_(?:sm_)?(?:get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded',timeout:60000});}
 const root=page.locator('#local-groupimport-easystud');
 const settle=async n=>n.evaluate(async e=>{await document.fonts.ready;await Promise.all(e.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
 try{
  for(const width of [1600,1280,390]){
   await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   for(const kind of ['participant','group','grouping']){
    if(width<=1024)await root.locator('[data-easystud-mobile-view="'+({participant:'participants',group:'groups',grouping:'groupings'})[kind]+'"]').click();
    else await root.locator('[data-easystud-layout-mode="'+(kind==='participant'?'participants':'structure')+'"]:visible').click();await settle(root);
    let opener;
    if(kind==='participant'){opener=root.locator('[data-easystud-open-user]:visible').first();await opener.click();}
    else{
     const item=root.locator(kind==='group'?'[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible':'[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible').first();
     const direct=item.locator(':scope > .local-groupimport-easystud-group__header > [data-easystud-open-advanced-settings]:visible,:scope > .local-groupimport-easystud-grouping__header > [data-easystud-open-advanced-settings]:visible');
     if(await direct.count()){opener=direct.first();await opener.click();}else{opener=item.locator(':scope > [data-easystud-card-menu]:visible,:scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]:visible,:scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first();await opener.click();await root.locator('[data-easystud-context-menu]:visible [data-easystud-context-action="'+kind+'-open-advanced-settings"]').click();}
    }
    const modal=root.locator(kind==='participant'?'[data-easystud-user-modal]':'[data-easystud-advanced-settings-modal]');await expect(modal).toBeVisible();
    const close=modal.locator(kind==='participant'?'.easyedu-entity-dialog__header [data-easystud-close-user-modal]':'.easyedu-entity-dialog__header [data-easystud-close-advanced-settings]');await expect(close).toBeFocused();
    if(kind==='participant')await expect(modal.locator('[data-easystud-user-profile-link]')).toBeVisible();else await expect(modal.locator('[name="name"]')).toBeVisible();await settle(modal);
    const row=await modal.evaluate(n=>{const frame=n.querySelector('.easyedu-entity-dialog'),footer=n.querySelector('.easyedu-entity-dialog__actions'),r=frame.getBoundingClientRect(),f=footer.getBoundingClientRect();return {inside:n.contains(document.activeElement),left:r.left,right:r.right,footerBottom:f.bottom,viewport:innerWidth,viewportHeight:innerHeight,overflow:frame.scrollWidth-frame.clientWidth,pills:[...n.querySelectorAll('.local-groupimport-easystud-entity__relation-count')].map(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height}))};});
    rows.push({width,kind,...row});save();expect(row.inside).toBe(true);expect(row.left).toBeGreaterThanOrEqual(0);expect(row.right).toBeLessThanOrEqual(width+1);expect(row.footerBottom).toBeLessThanOrEqual(1001);expect(row.overflow).toBeLessThanOrEqual(1);expect(row.pills.length).toBeGreaterThan(0);for(const pill of row.pills)expect(Math.abs(pill.height-22)).toBeLessThanOrEqual(1);
    await page.keyboard.press('Tab');expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
    if((width===1280&&kind==='grouping')||(width===390&&kind==='participant'))await page.screenshot({path:info.outputPath('entity-'+width+'-'+kind+'.png')});
    await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(opener).toBeFocused();
   }
  }
  await page.setViewportSize({width:1280,height:1000});await page.goto(new URL('/local/groupimport/index.php?id=5&lang=fr',url).href,{waitUntil:'domcontentloaded',timeout:60000});
  const open=page.locator('[data-local-groupimport-history-open]:visible,[data-easyedu-navigation-action="mass-import-history"]:visible').first();await open.click();const history=page.locator('[data-local-groupimport-history-modal]');await expect(history).toBeVisible();await settle(history);await expect(history.locator('.easyedu-entity-dialog')).toBeVisible();await expect(history.locator('[data-local-groupimport-history-dismiss]')).toBeVisible();await page.screenshot({path:info.outputPath('history-1280.png')});await page.keyboard.press('Escape');await expect(history).toBeHidden();rows.push({kind:'history',width:1280,opened:true,escapeClosed:true});save();
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
