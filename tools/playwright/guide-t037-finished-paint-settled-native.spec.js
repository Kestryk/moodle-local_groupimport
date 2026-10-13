const {test,expect}=require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs=require('node:fs');

test('T037 settled palette finished narration preserves actual Guide lifecycle and metrics',async({page},info)=>{
 test.setTimeout(1200000);
 const rows=[],errors=[],blocked=[],qaKey='guide-t037-finished-paint-qa';
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
 }
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()==='GET')return r.continue();blocked.push('plugin write');return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{
  if(r.request().method()!=='POST')return r.continue();const calls=r.request().postDataJSON();
  if(areSafeAjaxReads(calls, ['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']))return r.continue();
  if(calls.every(c=>c.methodname==='core_message_get_unsent_message'))return r.fulfill({contentType:'application/json',body:JSON.stringify(calls.map(()=>({error:false,data:[]})))});
  blocked.push(calls.map(c=>c.methodname));return r.abort();
 });
 const restore=()=>page.evaluate(async key=>{
  const root=document.querySelector('[data-easyedu-guide-root]');
  if(root?.t037OriginalConfig){const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));Guide.destroy(root);Guide.init(root,root.t037OriginalConfig);delete root.t037OriginalConfig;}
  for(const k of Object.keys(localStorage))if(k===key||k.startsWith(key+'.'))localStorage.removeItem(k);
 },qaKey);
 const settle=modal=>expect.poll(()=>modal.evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.effect.getComputedTiming().iterations!==Infinity&&['running','paused'].includes(a.playState)).length),{timeout:10000}).toBe(0);
 const paint=locator=>locator.evaluate(n=>{const s=getComputedStyle(n);return{color:s.color,weight:s.fontWeight,font:s.fontFamily,size:s.fontSize,line:s.lineHeight};});
 try{
  for(const language of ['en','fr'])for(const motion of ['no-preference','reduce']){
   await page.setViewportSize({width:1280,height:800});await page.emulateMedia({reducedMotion:motion});
   const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang',language);await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language));
   expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion==='reduce');
   await page.evaluate(async key=>{const root=document.querySelector('[data-easyedu-guide-root]'),Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));root.t037OriginalConfig=root.easyeduGuideConfig;Guide.destroy(root);Guide.init(root,{...root.t037OriginalConfig,firstVisit:false,welcomeOffer:false,storageKey:key});},qaKey);
   await page.locator('[data-easyedu-guide-open]:visible').first().click();
   const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');await expect(modal).toBeVisible();
   const entries=await modal.locator('[data-easyedu-guide-slide]').evaluateAll(ns=>ns.filter(n=>n.querySelector('[data-guide-scene-command="start"]')).map(n=>({index:n.getAttribute('data-easyedu-guide-slide'),kind:n.querySelector('[data-easyedu-guide-scene]').dataset.easyeduGuideScene})));
   expect(entries).toHaveLength(4);
   for(const width of [1600,768,390]){
    await page.setViewportSize({width,height:width===1600?900:width===768?1024:844});
    for(const entry of entries)for(const mode of entry.kind==='membership'?['add','move']:['default']){
     await modal.locator('[data-easyedu-guide-nav-item="0"]').click();await settle(modal);
     await modal.locator(`[data-easyedu-guide-nav-item="${entry.index}"]`).click();await settle(modal);
     const scene=modal.locator(`[data-easyedu-guide-slide="${entry.index}"] [data-easyedu-guide-scene]`),live=scene.locator('[data-guide-live]'),copy=live.locator('[data-guide-live-copy]');
     if(mode!=='default')await scene.locator(`[data-guide-scene-command="${mode}"]`).click();
     const idle=await paint(copy),start=scene.locator('[data-guide-scene-command="start"]');await start.click();
     if(motion==='no-preference'){
      await expect(live).toHaveAttribute('data-guide-playback-state','playing');
      const active=await paint(copy);expect(active).toEqual(idle);
      for(let phase=0;phase<14&&await live.getAttribute('data-guide-playback-state')!=='finished';phase++){
       await page.waitForFunction(n=>n.dataset.guidePlaybackState==='finished'||!n.querySelector('[data-guide-playback="next-phase"]').disabled,await live.elementHandle());
       if(await live.getAttribute('data-guide-playback-state')==='finished')break;
       await live.locator('[data-guide-playback="next-phase"]').click();
      }
     }
     await expect(live).toHaveAttribute('data-guide-playback-state','finished');await expect(scene.locator('[data-guide-recap]')).toBeVisible();await settle(modal);
     const finished=await paint(copy),icon=live.locator('[data-guide-live-complete]');await expect(icon).toBeVisible();
     const accent=await live.evaluate(n=>{const probe=document.createElement('span');probe.style.color='var(--easyedu-accent)';n.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color;});
     expect(finished.weight).toBe('700');expect(finished.color).toBe(accent);expect((await paint(icon)).color).toBe(accent);
     for(const key of ['font','size','line'])expect(finished[key]).toBe(idle[key]);
     const root=page.locator('[data-easyedu-guide-root]');
     const previous=await root.evaluate(n=>{const p={value:n.style.getPropertyValue('--easyedu-accent'),priority:n.style.getPropertyPriority('--easyedu-accent')};n.style.setProperty('--easyedu-accent','#8b3470');return p;});
     // The original immutable probe sampled the inherited icon's colour
     // transition mid-flight. Await actual finite effects, retaining exact
     // endpoint colours, all metrics and the unchanged product Motion.
     await settle(modal);
     const custom=await paint(copy);expect(custom.color).toBe('rgb(139, 52, 112)');expect((await paint(icon)).color).toBe(custom.color);
     await root.evaluate((n,p)=>{if(p.value)n.style.setProperty('--easyedu-accent',p.value,p.priority);else n.style.removeProperty('--easyedu-accent');},previous);
     await settle(modal);
     if(language==='en'&&mode==='add'&&width===1600&&motion==='no-preference')await page.screenshot({path:info.outputPath('t037-finished-desktop.png')});
     if(language==='fr'&&mode==='move'&&width===390&&motion==='no-preference')await page.screenshot({path:info.outputPath('t037-finished-phone.png')});
     await scene.locator('[data-guide-scene-command="reset"]').click();await expect(live).toHaveAttribute('data-guide-playback-state','idle');await settle(modal);
     expect(await paint(copy)).toEqual(idle);await expect(icon).toBeHidden();await expect(scene.locator('[data-guide-recap]')).toBeHidden();
     rows.push({language,motion,width,...entry,mode,idle,finished,custom,accent,resetPreserved:true});
     fs.writeFileSync(info.outputPath('guide-t037-finished-partial.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false},null,2));
    }
   }
   await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();await restore();
  }
  expect(rows).toHaveLength(60);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{await restore().catch(()=>{});fs.writeFileSync(info.outputPath('guide-t037-finished-native.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false,businessWrites:false,persistedSettingsVerified:false},null,2));}
});
