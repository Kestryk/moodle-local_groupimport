const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised: current course read-only; retained native selection only.
test('Mobile compact optional profile follows existing participant disclosure',async({page},info)=>{
 test.setTimeout(180000);const rows=[],errors=[],blocked=[];
 const language=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
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
 page.setDefaultTimeout(15000);
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()==='GET')return r.continue();blocked.push('plugin write');return r.abort('blockedbyclient');});
 await page.route('**/lib/ajax/service.php*',r=>{
  if(r.request().method()!=='POST')return r.continue();const names=r.request().postDataJSON().map(c=>c.methodname);
  if(names.every(n=>n==='core_message_get_unsent_message'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(names.map(()=>({error:false,data:{}})))});
  if(names.every(n=>['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state'].includes(n)))return r.continue();
  blocked.push(names);return r.abort('blockedbyclient');
 });
 try{
  const root=page.locator('#local-groupimport-easystud');
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  await expect(page.locator('html')).toHaveAttribute('lang',language);
  const cards=root.locator('[data-easystud-participant-list] [data-easystud-user]');
  expect(await cards.count()).toBeGreaterThan(1);
  const toggle=root.locator('[data-easystud-mobile-membership-toggle]');
  const settle=()=>root.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await document.fonts.ready;});
  const check=async(width,state,hidden)=>{
   await settle();const observed=[];
   for(let i=0;i<2;i++){
    const card=cards.nth(i);await expect(card).toBeVisible();
    const data=await card.evaluate(n=>{
     const slots=[...n.querySelectorAll('[data-easystud-participant-profile]')];
     const eye=n.querySelector('[data-easystud-open-user]'),name=n.querySelector('.local-groupimport-easystud-user__name');
     const range=document.createRange();range.selectNodeContents(name);const ink=range.getBoundingClientRect(),e=eye.getBoundingClientRect();
     return {profiles:slots.map(s=>({kind:s.dataset.easystudParticipantProfile,hidden:s.hidden,painted:s.getClientRects().length>0})),memberships:[...n.querySelectorAll('[data-easystud-participant-memberships]')].map(s=>s.hidden),roleHidden:[...n.querySelectorAll('.local-groupimport-easystud-user__meta-group')].filter(s=>!s.hasAttribute('data-easystud-participant-memberships')&&!s.hasAttribute('data-easystud-participant-profile')).map(s=>s.hidden),eyeTitleDelta:e.y+e.height/2-(ink.y+ink.height/2)};
    });observed.push(data);
    data.profiles.forEach(s=>{expect(s.hidden).toBe(hidden[i]);expect(s.painted).toBe(!hidden[i]);});
    data.memberships.forEach(v=>expect(v).toBe(hidden[i]));data.roleHidden.forEach(v=>expect(v).toBe(false));
   }
   rows.push({width,state,observed});
  };
  expect(await root.locator('[data-easystud-participant-profile]').count()).toBeGreaterThan(0);
  for(const width of [390,768,1024]){
   await page.setViewportSize({width,height:1000});await expect(toggle).toBeVisible();
   if(await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();
   await check(width,'compact',[true,true]);
   await cards.nth(0).locator(':scope > .local-groupimport-easystud-selector').click();await check(width,'sole',[false,true]);
   await cards.nth(1).locator(':scope > .local-groupimport-easystud-selector').click();await check(width,'two',[true,true]);
   await cards.nth(0).locator(':scope > .local-groupimport-easystud-selector').click();await check(width,'second sole',[true,false]);
   await cards.nth(1).locator(':scope > .local-groupimport-easystud-selector').click();await check(width,'none',[true,true]);
   await toggle.click();await check(width,'manual full',[false,false]);
   await toggle.click();await check(width,'manual compact',[true,true]);
   if(width===390)await page.screenshot({path:info.outputPath('compact-profile-390.png')});
  }
  await page.setViewportSize({width:1280,height:1000});
  const desktop=root.locator('[data-easystud-layout-mode="participants"]');
  if(await desktop.isVisible()&&await desktop.getAttribute('aria-pressed')!=='true')await desktop.click();
  await settle();
  expect(await root.locator('[data-easystud-participant-profile]').evaluateAll(ns=>ns.every(n=>!n.hidden))).toBe(true);
  expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('mobile-compact-profile-native.json'),JSON.stringify({language,rows,errors,blocked,businessWrites:false,eyeAlignmentDiagnosticOnly:true},null,2));}
});
