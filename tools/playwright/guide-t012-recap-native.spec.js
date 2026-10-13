const {test,expect}=require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs=require('node:fs');

// Whole existing scene lifecycle; no real course command or user progress.
test('T012 shared recap disclosure preserves all current scene lifecycles',async({page},info)=>{
 test.setTimeout(1800000);
 const rows=[],errors=[],blocked=[],qaKey='guide-t012-recap-native-qa';
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
 const restore=()=>page.evaluate(async key=>{const root=document.querySelector('[data-easyedu-guide-root]');
  if(root?.t015OriginalConfig){const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));Guide.destroy(root);Guide.init(root,root.t015OriginalConfig);delete root.t015OriginalConfig;}
  for(const k of Object.keys(localStorage))if(k===key||k.startsWith(key+'.'))localStorage.removeItem(k);
 },qaKey);
 const settle=modal=>expect.poll(()=>modal.evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.effect.getComputedTiming().iterations!==Infinity&&['running','paused'].includes(a.playState)).length),{timeout:10000}).toBe(0);
 try{
  for(const language of ['en','fr'])for(const motion of ['no-preference','reduce']){
   await page.setViewportSize({width:1280,height:800});await page.emulateMedia({reducedMotion:motion});
   const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang',language);await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language));
   expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion==='reduce');
   await page.evaluate(async key=>{const root=document.querySelector('[data-easyedu-guide-root]'),Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));root.t015OriginalConfig=root.easyeduGuideConfig;Guide.destroy(root);Guide.init(root,{...root.t015OriginalConfig,firstVisit:false,welcomeOffer:false,storageKey:key});},qaKey);
   await page.locator('[data-easyedu-guide-open]:visible').first().click();
   const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');await expect(modal).toBeVisible();
   const entries=await modal.locator('[data-easyedu-guide-slide]').evaluateAll(ns=>ns.filter(n=>n.querySelector('[data-guide-scene-command="start"]')).map(n=>({index:n.getAttribute('data-easyedu-guide-slide'),kind:n.querySelector('[data-easyedu-guide-scene]').dataset.easyeduGuideScene})));
   expect(entries).toHaveLength(4);expect(entries.filter(e=>e.kind==='inspection')).toHaveLength(2);
   for(const width of [1280,768,390]){
    await page.setViewportSize({width,height:width===1280?800:width===768?1024:844});
    for(const entry of entries)for(const mode of entry.kind==='membership'?['add','move']:['default']){
     const started=Date.now();await modal.locator('[data-easyedu-guide-nav-item="0"]').click();await settle(modal);
     await modal.locator(`[data-easyedu-guide-nav-item="${entry.index}"]`).click();await settle(modal);
     const slide=modal.locator(`[data-easyedu-guide-slide="${entry.index}"]`),scene=slide.locator('[data-easyedu-guide-scene]'),live=scene.locator('[data-guide-live]');
     const start=scene.locator('[data-guide-scene-command="start"]');await expect(start).toBeVisible();await expect(start).toBeEnabled();await expect(live).toHaveAttribute('data-guide-playback-state','idle');
     if(mode!=='default'){const choice=scene.locator(`[data-guide-scene-command="${mode}"]`);await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');await expect(scene).toHaveAttribute('data-guide-mode',mode);}
     const idle=await start.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {height:r.height,font:s.fontSize,gap:s.columnGap,right:r.right,parentRight:n.parentElement.getBoundingClientRect().right};});
     expect(idle.height).toBeCloseTo(30.4,1);expect(idle.font).toBe('12.48px');expect(idle.gap).toBe('5.6px');expect(idle.right).toBeLessThanOrEqual(idle.parentRight+.1);
     const label=await start.getAttribute('data-start-label');await expect(start).toHaveText(label);await start.click();
     if(motion==='no-preference'){
      await expect(live).toHaveAttribute('data-guide-playback-state','playing');await expect(start).toBeDisabled();await expect(start).toHaveText(await start.getAttribute('data-running-label'));
      const pause=live.locator('[data-guide-playback="pause"]');await pause.click();await expect(live).toHaveAttribute('data-guide-playback-state','paused');await pause.click();await expect(live).toHaveAttribute('data-guide-playback-state','playing');
      for(let phase=0;phase<14&&await live.getAttribute('data-guide-playback-state')!=='finished';phase++){
       await page.waitForFunction(n=>n.dataset.guidePlaybackState==='finished'||!n.querySelector('[data-guide-playback="next-phase"]').disabled,await live.elementHandle());
       if(await live.getAttribute('data-guide-playback-state')==='finished')break;
       await live.locator('[data-guide-playback="next-phase"]').click();
      }
     }
     await expect(live).toHaveAttribute('data-guide-playback-state','finished');await expect(scene.locator('[data-guide-recap]')).toBeVisible();await settle(modal);
     let finalMemberships=null;
     if(entry.kind==='membership'){
      finalMemberships=await scene.locator('[data-guide-memberships]').evaluate(n=>{const r=n.getBoundingClientRect(),body=n.closest('.easyedu-guide-modal__body').getBoundingClientRect();return{top:r.top,bottom:r.bottom,bodyTop:body.top,bodyBottom:body.bottom,height:r.height};});
      if(width===1280){expect(finalMemberships.top).toBeGreaterThanOrEqual(finalMemberships.bodyTop-1);expect(finalMemberships.bottom).toBeLessThanOrEqual(finalMemberships.bodyBottom+1);}
     }
     const recap=scene.locator('[data-guide-recap]'),recapToggle=recap.locator('[data-guide-recap-toggle]'),recapBody=recap.locator('[data-guide-recap-body]');
     await expect(recapToggle).toHaveAttribute('aria-expanded','true');await expect(recapBody).toBeVisible();
     expect(await recapToggle.getAttribute('aria-controls')).toBe(await recapBody.getAttribute('id'));
     const initialHeight=await recapBody.evaluate(n=>n.getBoundingClientRect().height);expect(initialHeight).toBeGreaterThan(20);
     await recapToggle.click();
     if(motion==='no-preference')await expect(recapBody).toHaveClass(/is-easyedu-disclosing/);
     await expect(recapBody).toBeHidden();await expect(recapToggle).toHaveAttribute('aria-expanded','false');
     await recapToggle.press('Enter');await expect(recapBody).toBeVisible();await settle(recapBody);await expect(recapToggle).toHaveAttribute('aria-expanded','true');
     if(motion==='no-preference'){
      await recapToggle.click();await page.waitForTimeout(100);await recapToggle.click();await settle(recapBody);await expect(recapToggle).toHaveAttribute('aria-expanded','true');
     }
     const disclosure={initialHeight,openCloseKeyboard:true,reversal:motion==='no-preference',...await recapBody.evaluate(n=>({effects:n.getAnimations().length,styles:n.style.cssText}))};
     expect(disclosure.effects).toBe(0);expect(disclosure.styles).toBe('');
     await expect(start).toBeEnabled();await expect(start).toHaveText(await start.getAttribute('data-replay-label'));await start.click();await expect(live).toHaveAttribute('data-guide-playback-state',motion==='reduce'?'finished':'playing');
     await scene.locator('[data-guide-scene-command="reset"]').click();await expect(live).toHaveAttribute('data-guide-playback-state','idle');await expect(start).toHaveText(label);await settle(modal);
     expect(await recapBody.evaluate(n=>n.getAnimations().length)).toBe(0);await expect(recap).toBeHidden();
     rows.push({language,motion,width,...entry,mode,idle,finalMemberships,disclosure,elapsedMs:Date.now()-started,ready:true,explicitStart:true,pauseResume:motion==='no-preference',staticOutcome:motion==='reduce',replayReset:true});
     fs.writeFileSync(info.outputPath('guide-t012-recap-partial.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false},null,2));
    }
   }
   await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();await restore();
  }
  expect(rows).toHaveLength(60);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{await restore().catch(()=>{});fs.writeFileSync(info.outputPath('guide-t012-recap-native.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false,businessWrites:false},null,2));}
});
