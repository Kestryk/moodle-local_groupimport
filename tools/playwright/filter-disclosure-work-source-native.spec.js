const {test,expect}=require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs=require('node:fs');

// Local-supervised R10-11 diagnosis: no filtering, selection or Moodle writes.
test('Compact More Filters identifies blocking native callback',async({page},info)=>{
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
  const profiler=await page.context().newCDPSession(page);await profiler.send('Profiler.enable');await profiler.send('Profiler.start');
  await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded',action==='open'?'true':'false');
  const data=await page.evaluate(()=>window.filterFrameDone);await settle();
  const {profile}=await profiler.send('Profiler.stop');
  const weights=new Map();(profile.samples||[]).forEach((id,i)=>weights.set(id,(weights.get(id)||0)+(profile.timeDeltas?.[i]||0)));
  const candidates=profile.nodes.filter(n=>!n.callFrame.functionName&&n.callFrame.url.includes('first.js')).sort((a,b)=>(weights.get(b.id)||0)-(weights.get(a.id)||0)).slice(0,2);
  await profiler.send('Debugger.enable');data.callbackSources=[];
  for(const node of candidates){const f=node.callFrame,{scriptSource}=await profiler.send('Debugger.getScriptSource',{scriptId:f.scriptId});const line=scriptSource.split('\n')[f.lineNumber];
   data.callbackSources.push({line:f.lineNumber,column:f.columnNumber,microseconds:weights.get(node.id)||0,moduleStart:line.slice(0,180),snippet:line.slice(Math.max(0,f.columnNumber-120),f.columnNumber+700)});
  }
  await profiler.send('Debugger.disable');await profiler.send('Profiler.disable');await profiler.detach();
  const nodes=new Map(profile.nodes.map(n=>{const f=n.callFrame;let file='';try{file=new URL(f.url).pathname.split('/').at(-1);}catch(_){}return [n.id,(f.functionName||'(anonymous)')+'@'+file+':'+f.lineNumber+':'+f.columnNumber];})),work=new Map();
  (profile.samples||[]).forEach((id,i)=>{const name=nodes.get(id)||'(anonymous)';work.set(name,(work.get(name)||0)+(profile.timeDeltas?.[i]||0));});
  data.profileWork=[...work].map(([name,microseconds])=>({name,microseconds})).sort((a,b)=>b.microseconds-a.microseconds).slice(0,18);
  const terminal=await panel.evaluate(n=>({hidden:n.hidden,inert:n.inert,ariaHidden:n.getAttribute('aria-hidden'),height:n.getBoundingClientRect().height,inline:n.getAttribute('style')||'',phase:n.classList.contains('is-easyedu-disclosing')}));
  expect(terminal.inert).toBe(action==='close');expect(terminal.phase).toBe(false);
  return {key,action,...data,terminal};
 };
 try{
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  const locale=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');await expect(page.locator('html')).toHaveAttribute('lang',locale);
  for(const width of [390]){
   await page.setViewportSize({width,height:1000});await settle();
   const routes=width>1024?[['participants','participants'],['participants','participant-groups'],['structure','structure-groups']]:[['participants','participants'],['groups','structure-groups']];
   for(const [mode,key]of routes){
    await root.locator(width>1024?'[data-easystud-layout-mode="'+mode+'"]:visible':'[data-easystud-mobile-view="'+mode+'"]:visible').click();await settle();
    const toggle=root.locator('[data-easystud-advanced-filters-toggle="'+key+'"]:visible');if(await toggle.getAttribute('aria-expanded')==='true'){await toggle.click();await settle();}
    records.push({width,...await sample(key,'open')});records.push({width,...await sample(key,'close')});
   }
  }
  expect(records).toHaveLength(4);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{
  await page.evaluate(()=>window.stopFilterFrames?.()).catch(()=>{});
  fs.writeFileSync(info.outputPath('filter-disclosure-work-source-native.json'),JSON.stringify({records,errors,blocked,businessWrites:false,diagnosticOnly:true},null,2));
 }
});
