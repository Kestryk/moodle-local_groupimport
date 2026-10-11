const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised: existing course read-only; no settings/course mutations.
test('Participant panel heading keeps localized copy and compact navigation',async({page},info)=>{
 test.setTimeout(180000);
 const errors=[],blocked=[],rows=[];
 const language=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
 const heading=language==='fr'?'Participants & groupes':'Participants & groups';
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:1000});
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
  await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 }
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()==='GET')return route.continue();
  blocked.push('plugin write');return route.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  if(route.request().method()!=='POST')return route.continue();
  const methods=route.request().postDataJSON().map(c=>c.methodname);
  if(methods.every(m=>m==='core_message_get_unsent_message'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
  if(methods.every(m=>['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state'].includes(m)))return route.continue();
  blocked.push(methods);return route.abort('blockedbyclient');
 });
 try{
  const root=page.locator('#local-groupimport-easystud');
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  await expect(page.locator('html')).toHaveAttribute('lang',language);
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:1000});
   const desktopView=root.locator('[data-easystud-layout-mode="participants"]');
   if(await desktopView.isVisible()&&await desktopView.getAttribute('aria-pressed')!=='true')await desktopView.click();
   await root.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await document.fonts.ready;});
   const title=root.locator('h3.easyedu-workspace-panel-title').filter({hasText:heading});
   await expect(title).toHaveCount(1);await expect(title).toBeVisible();await expect(title).toHaveText(heading);
   const paint=await title.evaluate(n=>{const r=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);const b=range.getBoundingClientRect(),s=getComputedStyle(n);return {frame:{x:r.x,y:r.y,w:r.width,h:r.height},ink:{x:b.x,y:b.y,w:b.width,h:b.height},font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,colour:s.color};});
   rows.push({width,heading,paint});
   expect(paint.ink.x).toBeGreaterThanOrEqual(paint.frame.x-1);expect(paint.ink.x+paint.ink.w).toBeLessThanOrEqual(paint.frame.x+paint.frame.w+1);
   expect(paint.ink.y+paint.ink.h).toBeLessThanOrEqual(paint.frame.y+paint.frame.h+1);
   // Compact navigation stays concise; the panel copy must not rename it.
   const compact=root.locator('[data-easystud-mobile-view="participants"]');
   if(await compact.isVisible())await expect(compact).toContainText('Participants');
  }
  expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('participant-panel-title-native.json'),JSON.stringify({language,rows,errors,blocked,businessWrites:false},null,2));}
});
