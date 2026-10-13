const {test,expect}=require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs=require('node:fs');

// Local-supervised R10-11 successor: preserve geometry/timing and actual lists.
test('More Filters avoids unrelated tag scans and keeps transitional frames',async({page},info)=>{
 test.setTimeout(240000);const records=[],errors=[],blocked=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 await page.setViewportSize({width:1280,height:1000});
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
  await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 }
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()==='GET')return r.continue();blocked.push('plugin write');return r.abort('blockedbyclient');});
 await page.route('**/lib/ajax/service.php*',r=>{
  if(r.request().method()!=='POST')return r.continue();const names=r.request().postDataJSON().map(c=>c.methodname);
  if(names.every(n=>n==='core_message_get_unsent_message'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(names.map(()=>({error:false,data:{}})))});
  if(areSafeAjaxReads(names, ['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']))return r.continue();
  blocked.push(names);return r.abort('blockedbyclient');
 });
 const root=page.locator('#local-groupimport-easystud');
 const settle=()=>root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const sample=async(key,action)=>{
  const toggle=root.locator('[data-easystud-advanced-filters-toggle="'+key+'"]:visible'),panel=root.locator('[data-easystud-advanced-filters="'+key+'"]');
  await toggle.scrollIntoViewIfNeeded();await settle();
  await panel.evaluate(n=>{
   const root=n.closest('#local-groupimport-easystud'),lists=[...root.querySelectorAll('[data-easystud-participant-list], [data-easystud-tree], [data-easystud-participant-groups-list], [data-easystud-structure-groups]')];
   const frames=[],mutations=[];let stopped=false,raf;const observer=new MutationObserver(ms=>mutations.push(...ms.map(m=>({removed:m.removedNodes.length,added:m.addedNodes.length}))));lists.forEach(l=>observer.observe(l,{childList:true}));
   const start=performance.now();const tick=()=>{const s=getComputedStyle(n),rect=n.getBoundingClientRect(),parent=n.parentElement.getBoundingClientRect();
    frames.push({time:performance.now()-start,height:rect.height,parentHeight:parent.height,opacity:Number(s.opacity),display:s.display,phase:n.classList.contains('is-easyedu-disclosing'),windowY:scrollY,animationDurations:n.getAnimations().map(a=>a.effect.getComputedTiming().duration)});if(!stopped)raf=requestAnimationFrame(tick);};
   window.filterFrameDone=new Promise(resolve=>{window.stopFilterFrames=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);observer.disconnect();resolve({frames,mutations});};tick();setTimeout(window.stopFilterFrames,700);});
  });
  await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded',action==='open'?'true':'false');
  const data=await page.evaluate(()=>window.filterFrameDone);await settle();
  const terminal=await panel.evaluate(n=>({hidden:n.hidden,inert:n.inert,ariaHidden:n.getAttribute('aria-hidden'),height:n.getBoundingClientRect().height,inline:n.getAttribute('style')||'',phase:n.classList.contains('is-easyedu-disclosing')}));
  const record={width:page.viewportSize().width,key,action,...data,terminal};records.push(record);
  fs.writeFileSync(info.outputPath('filter-disclosure-live-frame-native.json'),JSON.stringify({records,errors,blocked,businessWrites:false,strictSuccessor:true},null,2));
  expect(terminal.inert).toBe(action==='close');expect(terminal.phase).toBe(false);
  expect(data.mutations).toEqual([]);
  const maximum=Math.max(...data.frames.map(f=>f.height));
  const intermediate=data.frames.filter(f=>f.phase&&f.height>1&&f.height<maximum-1);
  expect(intermediate.length,'Real intermediate heights, not only endpoint paint').toBeGreaterThan(0);
  expect(data.frames.some(f=>f.phase)).toBe(true);
  return {key,action,...data,terminal};
 };
 try{
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  const locale=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');await expect(page.locator('html')).toHaveAttribute('lang',locale);
  for(const width of [1280,768,390]){
   await page.setViewportSize({width,height:1000});await settle();
   const routes=width>1024?[['participants','participants'],['participants','participant-groups'],['structure','structure-groups']]:[['participants','participants'],['groups','structure-groups']];
   for(const [mode,key]of routes){
    await root.locator(width>1024?'[data-easystud-layout-mode="'+mode+'"]:visible':'[data-easystud-mobile-view="'+mode+'"]:visible').click();await settle();
    const toggle=root.locator('[data-easystud-advanced-filters-toggle="'+key+'"]:visible');if(await toggle.getAttribute('aria-expanded')==='true'){await toggle.click();await settle();}
    await sample(key,'open');await sample(key,'close');
   }
  }
  expect(records).toHaveLength(14);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{
  await page.evaluate(()=>window.stopFilterFrames?.()).catch(()=>{});
  fs.writeFileSync(info.outputPath('filter-disclosure-live-frame-native.json'),JSON.stringify({records,errors,blocked,businessWrites:false,strictSuccessor:true},null,2));
 }
});
