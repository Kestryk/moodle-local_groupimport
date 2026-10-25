const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
// local-supervised, actual titles only; no fixtures, Save or course writes.
test('Guide section titles preserve native hierarchy and mobile containment',async({page},info)=>{
 test.setTimeout(240000);const rows=[],errors=[],blocked=[];
 page.on('pageerror',e=>errors.push(e.message));
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
  if(r.request().method()!=='POST')return r.continue();const methods=r.request().postDataJSON().map(c=>c.methodname);
  if(methods.every(m=>m==='core_message_get_unsent_message'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(methods.map(()=>({error:false,data:{}})))});
  const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']);
  if(methods.every(m=>reads.has(m)))return r.continue();blocked.push(methods);return r.abort('blockedbyclient');
 });
 try{
  await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  const root=page.locator('[data-easyedu-guide-root]');
  await page.setViewportSize({width:1280,height:1000});await page.locator('[data-easyedu-guide-open]:visible').first().click();
  const modal=page.locator('[data-easyedu-guide-modal]:visible');await expect(modal).toHaveCount(1);
  for(const width of [1280,768,390]){
   await page.setViewportSize({width,height:1000});
   for(let index=0;index<12;index++){
    await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
    await expect(root).toHaveAttribute('data-easyedu-guide-current-slide',String(index));
    const title=modal.locator('[data-easyedu-guide-slide="'+index+'"] .easyedu-guide-slide__header > h3');await expect(title).toBeVisible();
    const paint=await title.evaluate(async n=>{
     await document.fonts.ready;const s=getComputedStyle(n),r=n.getBoundingClientRect(),h=n.parentElement.getBoundingClientRect();
     const range=document.createRange();range.selectNodeContents(n);
     return{text:n.textContent,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,color:s.color,
      contained:[...range.getClientRects()].every(b=>b.left>=r.left-1&&b.right<=r.right+1&&b.bottom<=r.bottom+1)&&r.left>=h.left-1&&r.right<=h.right+1};
    });
    rows.push({width,index,paint});expect(paint.size).toBe('16px');expect(paint.weight).toBe('600');expect(paint.line).toBe('19.2px');
    expect(paint.color).toBe('rgb(11, 94, 168)');expect(paint.contained).toBe(true);
   }
  }
  await modal.locator('[data-easyedu-guide-close]').first().click();await expect(modal).toHaveCount(0);
  expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('guide-slide-title-result.json'),JSON.stringify({rows,errors,blocked,businessWrites:false,settingsWrites:false},null,2));}
});
