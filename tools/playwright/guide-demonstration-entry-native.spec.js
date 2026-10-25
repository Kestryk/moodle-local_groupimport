const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// Local-supervised, read-only: real template/AMD, fictional demonstrations only.
test('Guide demonstrations wait for Start and expose running replay and reset states',async({page},info)=>{
 test.setTimeout(240000);const rows=[],errors=[],blocked=[];
 const requestedLanguage=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
 const requestedMotion=process.env.EASYEDU_GUIDE_REVIEW_MOTION||'no-preference';
 expect(['no-preference','reduce']).toContain(requestedMotion);
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
  await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 }
 await page.route('**/local/groupimport/**',r=>{
  if(r.request().method()==='GET')return r.continue();blocked.push('plugin write');return r.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',r=>{
  if(r.request().method()!=='POST')return r.continue();const methods=r.request().postDataJSON().map(c=>c.methodname);
  if(methods.every(m=>m==='core_message_get_unsent_message'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
  const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']);
  if(methods.every(m=>reads.has(m)))return r.continue();blocked.push(methods);return r.abort('blockedbyclient');
 });
 try{
  await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  if(requestedLanguage)await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+requestedLanguage+'(?:-|$)'));
  await page.emulateMedia({reducedMotion:requestedMotion});
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(requestedMotion==='reduce');
  await page.setViewportSize({width:1280,height:1000});await page.locator('[data-easyedu-guide-open]:visible').first().click();
  const modal=page.locator('[data-easyedu-guide-modal]:visible');await expect(modal).toHaveCount(1);
  const slides=await modal.locator('[data-easyedu-guide-slide]').evaluateAll(ns=>ns.filter(n=>n.querySelector('[data-guide-scene-command="start"]')).map(n=>n.getAttribute('data-easyedu-guide-slide')));
  expect(slides).toHaveLength(4);
  for(const width of [1280,768,390]){
   await page.setViewportSize({width,height:1000});
   for(const index of slides){
    await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
    await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
    const slide=modal.locator(`[data-easyedu-guide-slide="${index}"]`),scene=slide.locator('[data-easyedu-guide-scene]');
    const start=scene.locator('[data-guide-scene-command="start"]'),live=slide.locator('[data-guide-live]');
    await expect(start).toBeVisible();await page.waitForTimeout(300);
    await expect(live).toHaveAttribute('data-guide-playback-state','idle');await expect(start).toBeEnabled();
    const label=await start.getAttribute('data-start-label');await expect(start).toHaveText(label);
    expect(await scene.getAttribute('data-guide-phase')).toBeNull();
    const paint=await start.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{height:r.height,font:s.fontSize,gap:s.columnGap,right:r.right,parentRight:n.parentElement.getBoundingClientRect().right};});
    expect(paint.height).toBeCloseTo(30.4,1);expect(paint.font).toBe('12.48px');expect(paint.gap).toBe('5.6px');expect(paint.right).toBeLessThanOrEqual(paint.parentRight+.1);
    if(await scene.locator('[data-guide-scene-command="move"]').count()){
     await scene.locator('[data-guide-scene-command="move"]').click();await expect(live).toHaveAttribute('data-guide-playback-state','idle');
     await expect(scene).toHaveAttribute('data-guide-mode','move');
    }
    await start.click();
    // Canonical reduced mode presents the static outcome immediately, without
    // a running clock or mouse animation. Normal lifecycle assertions stay strict.
    if(requestedMotion!=='reduce'){
     await expect(live).toHaveAttribute('data-guide-playback-state','playing');
     await expect(start).toBeDisabled();await expect(start).toHaveText(await start.getAttribute('data-running-label'));
     const pause=live.locator('[data-guide-playback="pause"]');await pause.click();await expect(live).toHaveAttribute('data-guide-playback-state','paused');
     await pause.click();await expect(live).toHaveAttribute('data-guide-playback-state','playing');
     for(let phase=0;phase<14&&await live.getAttribute('data-guide-playback-state')!=='finished';phase++){
      await page.waitForFunction(n=>n.dataset.guidePlaybackState==='finished'||!n.querySelector('[data-guide-playback="next-phase"]').disabled,await live.elementHandle());
      if(await live.getAttribute('data-guide-playback-state')==='finished')break;
      await live.locator('[data-guide-playback="next-phase"]').click();
     }
    }
    await expect(live).toHaveAttribute('data-guide-playback-state','finished');await expect(start).toBeEnabled();
    await expect(scene.locator('[data-guide-recap]')).toBeVisible();
    await expect(start).toHaveText(await start.getAttribute('data-replay-label'));
    await start.click();await expect(live).toHaveAttribute('data-guide-playback-state',requestedMotion==='reduce'?'finished':'playing');
    await scene.locator('[data-guide-scene-command="reset"]').click();await expect(live).toHaveAttribute('data-guide-playback-state','idle');await expect(start).toHaveText(label);
    rows.push({width,index,language:await page.locator('html').getAttribute('lang'),motion:requestedMotion,paint,ready:true,explicitStart:true,paused:requestedMotion!=='reduce',staticSummary:requestedMotion==='reduce',finished:true,replay:true,reset:true});
   }
  }
  await modal.locator('[data-easyedu-guide-close]').first().click();await expect(modal).toHaveCount(0);
  expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('guide-demonstration-entry-result.json'),JSON.stringify({rows,errors,blocked,businessWrites:false,settingsWrites:false},null,2));}
});
