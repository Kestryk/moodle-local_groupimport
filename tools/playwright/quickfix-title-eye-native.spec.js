const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Quick fixes participant title eye and panel Motion ownership',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('quickfix.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_/.test(c.methodname)&&!/^local_groupimport_(?:sm_)?(?:get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 const root=page.locator('#local-groupimport-easystud');
 const settle=async()=>{await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);};
 try{
  for(const lang of ['fr','en'])for(const width of [1280,390]){
   await page.setViewportSize({width,height:1000});base.searchParams.set('lang',lang);await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   if(width>1024){await root.locator('[data-easystud-layout-mode="structure"]:visible').click();await settle();await root.locator('[data-easystud-layout-mode="participants"]:visible').click();}else await root.locator('[data-easystud-mobile-view="participants"]').click();await settle();
   const row=await root.evaluate(n=>({headings:[...n.querySelectorAll('[data-easystud-participants-panel] h3,.local-groupimport-easystud-column-heading--participants .local-groupimport-easystud-column-heading__title')].map(e=>e.textContent.trim()),selector:n.querySelector('[data-easystud-layout-mode="participants"]').textContent.replace(/\s+/g,' ').trim(),transition:getComputedStyle(n.querySelector('[data-easystud-participants-panel]')).transitionProperty,overflow:document.documentElement.scrollWidth-innerWidth}));
   rows.push({stage:'title-panel',lang,width,...row});save();expect(row.headings).toEqual(['Participants','Participants']);expect(row.selector).toContain(lang==='fr'?'Participants & groupes':'Participants & groups');expect(row.transition).toBe('box-shadow');expect(row.overflow).toBeLessThanOrEqual(1);
   await page.screenshot({path:info.outputPath('title-'+lang+'-'+width+'.png')});
  }
  for(const width of [390,768]){
   await page.setViewportSize({width,height:1000});base.searchParams.set('lang','fr');await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await root.locator('[data-easystud-mobile-view="participants"]').click();await settle();
   const cards=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');
   for(const state of ['compact','selected-expanded']){
    if(state==='selected-expanded'){await cards.first().locator('.local-groupimport-easystud-user__name').click();await settle();}
    const metrics=await cards.evaluateAll((nodes,state)=>nodes.slice(0,state==='compact'?3:1).map(n=>{const name=n.querySelector('.local-groupimport-easystud-user__name'),eye=n.querySelector('.fa-eye'),button=eye.closest('button'),range=document.createRange();range.selectNodeContents(name);const text=range.getClientRects()[0],glyph=eye.getBoundingClientRect(),b=button.getBoundingClientRect();return {id:n.dataset.userId,state,selected:n.classList.contains('is-selected'),name:name.textContent,nameRect:{top:text.top,height:text.height},eyeRect:{top:glyph.top,height:glyph.height},buttonRect:{top:b.top,height:b.height},delta:glyph.top+glyph.height/2-text.top-text.height/2,alignSelf:getComputedStyle(button).alignSelf,grid:getComputedStyle(n.querySelector('.local-groupimport-easystud-user__headline')).gridTemplateAreas};}),state);
    rows.push({stage:'eye',width,state,metrics});save();await cards.first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('eye-'+width+'-'+state+'.png')});
   }
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
  for(const row of rows.filter(r=>r.stage==='eye'))for(const metric of row.metrics)expect(Math.abs(metric.delta),'eye first-line centre '+row.width+' '+row.state+' '+metric.id).toBeLessThanOrEqual(2);
 }finally{save();}
});
