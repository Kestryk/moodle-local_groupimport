const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
// Local-supervised illustration-only playback. No course, settings or fixtures.
test('Guide activity dots keep equal spacing through native playback and pause',async({page},info)=>{
 test.setTimeout(180000);const rows=[],errors=[],blocked=[];
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
  await page.setViewportSize({width:1280,height:1000});await page.locator('[data-easyedu-guide-open]:visible').first().click();
  const modal=page.locator('[data-easyedu-guide-modal]:visible');await expect(modal).toHaveCount(1);
  for(const width of [1280,768,390]){
   await page.setViewportSize({width,height:1000});await modal.locator('[data-easyedu-guide-nav-item="6"]').click();
   const slide=modal.locator('[data-easyedu-guide-slide="6"]');await expect(slide).toBeVisible();
   await slide.locator('[data-guide-scene-command="add"]').click();
   const live=slide.locator('[data-guide-live]'),activity=live.locator('[data-guide-activity]');
   await expect(live).toHaveAttribute('data-guide-playback-state','playing');await expect(activity).toBeVisible();
   const samples=await activity.evaluate(async node=>{
    const samples=[];for(let i=0;i<8;i++){
     const rects=[...node.children].map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
     samples.push(rects);await new Promise(resolve=>setTimeout(resolve,90));
    }return samples;
   });
   for(const sample of samples){for(const dot of sample){expect(dot.w).toBeCloseTo(4,3);expect(dot.h).toBeCloseTo(4,3);}
    expect(sample[1].x-sample[0].x-sample[0].w).toBeCloseTo(3,3);expect(sample[2].x-sample[1].x-sample[1].w).toBeCloseTo(3,3);}
   expect(samples.some(s=>Math.abs(s[0].y-s[1].y)>.1||Math.abs(s[1].y-s[2].y)>.1),'Actual staggered vertical movement').toBe(true);
   await live.locator('[data-guide-playback="pause"]').click();await expect(live).toHaveAttribute('data-guide-playback-state','paused');
   expect(await activity.evaluate(n=>[...n.children].every(c=>getComputedStyle(c).animationName==='none'))).toBe(true);
   rows.push({width,samples,pausedStatic:true});
   await modal.locator('[data-easyedu-guide-nav-item="0"]').click();await expect(activity).toBeHidden();
  }
  await modal.locator('[data-easyedu-guide-close]').first().click();await expect(modal).toHaveCount(0);
  expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('guide-activity-dots-result.json'),JSON.stringify({rows,errors,blocked,settingsWrites:false,businessWrites:false},null,2));}
});
