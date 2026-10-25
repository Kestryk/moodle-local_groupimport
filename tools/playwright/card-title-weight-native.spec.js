// Local-supervised: identity weight and retained title lanes, no business writes.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Approved600 card identity titles retain size paint and lanes at three widths',async({page},info)=>{
 test.setTimeout(300000);const records=[],errors=[],blocked=[];
 page.on('pageerror',error=>errors.push(error.message));
 const url=new URL(process.env.EASYEDU_MOODLE_URL);
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{timeout:60000});
 }
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()==='GET')return route.continue();blocked.push('plugin write');return route.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  if(route.request().method()!=='POST')return route.continue();const methods=route.request().postDataJSON().map(call=>call.methodname);
  if(methods.every(method=>method==='core_message_get_unsent_message'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
  if(methods.every(method=>['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state'].includes(method)))return route.continue();
  blocked.push(methods);return route.abort('blockedbyclient');
 });
 const root=page.locator('#local-groupimport-easystud');
 const settle=()=>root.evaluate(async element=>{
  await document.fonts.ready;await Promise.all(element.getAnimations({subtree:true}).filter(animation=>Number.isFinite(animation.effect?.getComputedTiming().iterations)).map(animation=>animation.finished.catch(()=>{})));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 });
 const measure=async(title,kind,language,width,state)=>{
  await title.scrollIntoViewIfNeeded();await settle();
  const paint=await title.evaluate(node=>{
   const style=getComputedStyle(node),box=node.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);const ink=range.getBoundingClientRect();
   return {text:node.textContent,font:style.fontFamily,size:style.fontSize,weight:style.fontWeight,color:style.color,lineHeight:style.lineHeight,
    frame:{x:box.x,y:box.y,width:box.width,height:box.height},ink:{x:ink.x,y:ink.y,width:ink.width,height:ink.height},
    nativeHostFont:getComputedStyle(document.querySelector('#local-groupimport-easystud')).fontFamily};
  });
  records.push({kind,language,width,state,paint});
  expect(paint.weight).toBe('600');expect(parseFloat(paint.size)).toBeCloseTo(14,1);
  expect(paint.color).toBe('rgb(38, 72, 97)');expect(paint.font).toBe(paint.nativeHostFont);
  expect(paint.ink.x).toBeGreaterThanOrEqual(paint.frame.x-1);expect(paint.ink.x+paint.ink.width).toBeLessThanOrEqual(paint.frame.x+paint.frame.width+1);
  expect(paint.ink.y).toBeGreaterThanOrEqual(paint.frame.y-1);expect(paint.ink.y+paint.ink.height).toBeLessThanOrEqual(paint.frame.y+paint.frame.height+1);
 };
 try{
  for(const language of ['en','fr'])for(const width of [1280,768,390]){
   url.searchParams.set('lang',language);await page.emulateMedia({reducedMotion:language==='fr'?'reduce':'no-preference'});
   await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   for(const kind of ['participant','group','grouping']){
    const view=width<1024?root.locator('[data-easystud-mobile-view="'+({participant:'participants',group:'groups',grouping:'groupings'})[kind]+'"]:visible'):
     root.locator('[data-easystud-layout-mode="'+(kind==='participant'?'participants':'structure')+'"]:visible');
    if(await view.getAttribute('aria-pressed')!=='true')await view.click();await settle();
    const selector=({participant:'.local-groupimport-easystud-user__name',group:'.local-groupimport-easystud-group__name',grouping:'.local-groupimport-easystud-grouping__name'})[kind];
    const title=root.locator(selector+':visible').first();await expect(title).toBeVisible();
    const card=title.locator('xpath=ancestor::*[@data-easystud-user or @data-easystud-group-id or @data-easystud-grouping-id][1]');
    const selection=card.locator(':scope > .local-groupimport-easystud-selector');await expect(selection).toBeVisible();
    await page.mouse.move(0,0);await measure(title,kind,language,width,'rest');
    await title.hover();await measure(title,kind,language,width,'hover');
    await selection.locator('input').focus();await measure(title,kind,language,width,'focus-within');
    await selection.click();await expect(selection.locator('input')).toBeChecked();await measure(title,kind,language,width,'selected');
    await selection.click();await expect(selection.locator('input')).not.toBeChecked();await settle();
   }
  }
  expect(records).toHaveLength(72);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('card-title-weight-native.json'),JSON.stringify({records,errors,blocked,
  businessWrites:0,fixtureRequested:false,keyboardSequenceProof:false,humanAccepted:false},null,2));}
});
