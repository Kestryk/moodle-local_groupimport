const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('T014 six inert introduction specimens in native Moodle',async({page},info)=>{
 test.setTimeout(360000);
 const rows=[],errors=[],blocked=[],qaKey='guide-t014-native-qa';
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
 }
 await page.route('**/local/groupimport/**',route=>{if(route.request().method()==='GET')return route.continue();blocked.push('plugin write');return route.abort();});
 await page.route('**/lib/ajax/service.php*',route=>{
  if(route.request().method()!=='POST')return route.continue();const calls=route.request().postDataJSON();
  const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']);
  if(calls.every(c=>reads.has(c.methodname)))return route.continue();
  if(calls.every(c=>c.methodname==='core_message_get_unsent_message'))return route.fulfill({contentType:'application/json',body:JSON.stringify(calls.map(()=>({error:false,data:[]})))});
  blocked.push(calls.map(c=>c.methodname));return route.abort();
 });
 const restore=()=>page.evaluate(async key=>{
  const root=document.querySelector('[data-easyedu-guide-root]');
  if(root?.t014OriginalConfig){const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));Guide.destroy(root);Guide.init(root,root.t014OriginalConfig);delete root.t014OriginalConfig;}
  for(const k of Object.keys(localStorage))if(k===key||k.startsWith(key+'.'))localStorage.removeItem(k);
 },qaKey);
 try{
  for(const language of ['en','fr'])for(const width of [1280,768,390,320])for(const motion of ['no-preference','reduce']){
   await page.setViewportSize({width,height:width===1280?800:844});await page.emulateMedia({reducedMotion:motion});
   const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang',language);
   await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language));
   await page.evaluate(async key=>{const root=document.querySelector('[data-easyedu-guide-root]'),Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));root.t014OriginalConfig=root.easyeduGuideConfig;Guide.destroy(root);Guide.init(root,{...root.t014OriginalConfig,firstVisit:false,welcomeOffer:false,storageKey:key});},qaKey);
   if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
   await page.locator('[data-easyedu-guide-open]:visible').first().click();
   const modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');await expect(modal).toBeVisible();
   await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
   const intro=modal.locator('[data-easyedu-guide-introduction]:visible');await expect(intro).toBeVisible();
   await expect.poll(()=>modal.evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.effect.getComputedTiming().iterations!==Infinity&&['running','paused'].includes(a.playState)).length)).toBe(0);
   const result=await intro.evaluate(node=>{
    const specimens=[...node.querySelectorAll('[data-easyedu-guide-specimen]')],path=node.querySelector('.easyedu-guide-introduction__action');
    const failures=[];
    for(const e of node.querySelectorAll('dt,dd,p,small,[role="img"],svg'))if(!e.closest('[hidden]')){const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();if(r.left<p.left-1||r.right>p.right+1||e.scrollWidth>e.clientWidth+1)failures.push({tag:e.tagName,text:e.textContent.slice(0,60)});}
    return {kinds:specimens.map(s=>s.dataset.easyeduGuideSpecimen),visible:specimens.filter(s=>!s.closest('[hidden]')).length,
     captions:specimens.map(s=>s.querySelector('small').textContent),failures,interactive:node.querySelectorAll('button,a,input,[tabindex],[data-guide-playback],[data-easyedu-guide-start-path],[data-easyedu-guide-fullscreen]').length,
     font:getComputedStyle(node.querySelector('dd')).fontFamily,labelSize:parseFloat(getComputedStyle(node.querySelector('dt')).fontSize),captionSize:parseFloat(getComputedStyle(node.querySelector('dd')).fontSize),
     pathBackground:getComputedStyle(path).backgroundColor,pathBorder:getComputedStyle(path).borderTopWidth,
     guidedPath:node.closest('.easyedu-guide-slide').querySelectorAll('.easyedu-guide-guided-card').length};
   });rows.push({language,width,motion,...result});
   expect(result.kinds).toEqual(['navigation','playback','highlight','path','checklist','fullscreen']);expect(result.visible).toBe(width>=1024?6:5);
   expect(result.captions.every(c=>c===(language==='fr'?'Aperçu':'Preview'))).toBe(true);expect(result.failures).toEqual([]);expect(result.interactive).toBe(0);expect(result.guidedPath).toBe(0);
   expect(result.font).toContain('Inter');expect(result.labelSize).toBeCloseTo(14.08,2);expect(result.captionSize).toBeCloseTo(12.16,2);
   expect(result.pathBackground).toBe('rgb(255, 255, 255)');expect(result.pathBorder).toBe('1px');
   await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();await restore();
  }
  expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{await restore().catch(()=>{});fs.writeFileSync(info.outputPath('guide-introduction-t014-native.json'),JSON.stringify({rows,errors,blocked,humanAccepted:false},null,2));}
});
