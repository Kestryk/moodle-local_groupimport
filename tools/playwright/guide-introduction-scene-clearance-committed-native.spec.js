// T006 auth successor: wait committed login, keep every strict geometry/locale/media assertion.
const {test,expect}=require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs=require('node:fs');
test('T006 canonical24px clearance after committed authentication',async({page},info)=>{
 test.setTimeout(360000);const records=[],errors=[],blocked=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
 }
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()==='GET')return route.continue();blocked.push('plugin write');return route.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  if(route.request().method()!=='POST')return route.continue();const methods=route.request().postDataJSON().map(call=>call.methodname);
  if(methods.every(method=>method==='core_message_get_unsent_message'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
  if(areSafeAjaxReads(methods, ['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']))return route.continue();
  blocked.push(methods);return route.abort('blockedbyclient');
 });
 try{
  for(const language of ['en','fr'])for(const width of [1280,768,390]){
   const reduced=language==='fr';await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
   const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang',language);
   await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await expect(page.locator('html')).toHaveAttribute('lang',language);
   expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(reduced);
   await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
   await page.locator('[data-easyedu-guide-open]:visible').first().click();
   const modal=page.locator('[data-easyedu-guide-modal]:visible');await expect(modal).toBeVisible();
   const ids=await modal.locator('[data-easyedu-guide-slide]').evaluateAll(slides=>slides.filter(slide=>slide.querySelector('.easyedu-guide-introduction__note')&&slide.querySelector('.easyedu-guide-scene__live')).map(slide=>slide.getAttribute('data-easyedu-guide-slide')));
   expect(ids).toHaveLength(3);
   for(const id of ids){
    await modal.locator('[data-easyedu-guide-nav-item="'+id+'"]').click();
    const slide=modal.locator('[data-easyedu-guide-slide="'+id+'"]');await expect(slide).toBeVisible();
    await expect(page.locator('[data-easyedu-guide-root]')).toHaveAttribute('data-easyedu-guide-current-slide',id);
    await slide.evaluate(async node=>{await document.fonts.ready;await Promise.all(node.getAnimations({subtree:true}).filter(animation=>Number.isFinite(animation.effect?.getComputedTiming().iterations)).map(animation=>animation.finished.catch(()=>{})));});
    const geometry=await slide.evaluate(node=>{
     const note=node.querySelector('.easyedu-guide-introduction__note'),intro=note.parentElement,status=node.querySelector('.easyedu-guide-scene__live');
     const rect=element=>{const r=element.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     const noteBox=rect(note),statusBox=rect(status);
     return {note:noteBox,status:statusBox,gap:statusBox.top-noteBox.bottom,
      padding:getComputedStyle(intro).paddingBlockEnd,token:getComputedStyle(intro).getPropertyValue('--easyedu-guide-introduction-trailing-clearance').trim(),
      statusSticky:getComputedStyle(status).position,noteMargin:getComputedStyle(note).marginBlockEnd,
      mode:node.querySelector('[data-easyedu-guide-scene]')?.getAttribute('data-easyedu-guide-scene')};
    });
    records.push({language,width,reduced,id,...geometry});
    expect(geometry.note.height).toBeGreaterThan(0);expect(geometry.status.height).toBeGreaterThan(0);
    expect(geometry.token).toBe('1.5rem');expect(geometry.padding).toBe('24px');expect(Math.abs(geometry.gap-24)).toBeLessThanOrEqual(1);
    expect(geometry.noteMargin).toBe('0px');expect(geometry.statusSticky).toBe('sticky');
   }
   await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();
  }
  expect(records).toHaveLength(18);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('guide-introduction-scene-clearance-committed-native.json'),JSON.stringify({records,errors,blocked,
  injectedStyles:false,demoStarted:false,settingsSaved:false,fixtureRequested:false,humanAccepted:false},null,2));}
});
