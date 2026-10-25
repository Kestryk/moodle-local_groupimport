const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('M1 M2 served server roots and live three levels',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('motion.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_/.test(c.methodname)&&!/^local_groupimport_(?:sm_)?(?:get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1280,height:1000});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded',timeout:60000});}
 try{
  for(const [name,location,selector,sheet]of [
   ['sm','/local/groupimport/manage.php?id=5&lang=fr','#local-groupimport-easystud','student-management.css'],
   ['import','/local/groupimport/index.php?id=5&lang=fr','#local-groupimport-import','mass-import.css'],
   ['admin','/admin/settings.php?section=local_groupimport&lang=fr','.easyedu-ui[data-easyedu-motion-level]','administration.css'],
  ]){
   const response=await page.goto(new URL(location,base).href,{waitUntil:'domcontentloaded',timeout:60000});expect(response.status()).toBe(200);const html=await response.text();const root=page.locator(selector).first();await expect(root).toBeVisible({timeout:60000});if(name==='sm')await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.evaluate(()=>document.fonts.ready);
   const initial=await root.evaluate(n=>({level:n.getAttribute('data-easyedu-motion-level'),policy:n.getAttribute('data-easyedu-motion-policy'),classes:document.body.className,sheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.href),osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
   rows.push({name,initial});save();expect(initial.level).toBe('full');expect(initial.osReduced).toBe(true);expect(html).toContain('data-easyedu-motion-level="full"');expect(initial.sheets.some(s=>s.includes('/styles/'+sheet))).toBe(true);
   const levels=await root.evaluate(async n=>{
    const Motion=await new Promise((resolve,reject)=>require(['local_groupimport/motion'],resolve,reject));const results=[];
    try{for(const level of ['full','reduced','minimal']){Motion.setLevel(n,level);results.push({level,actual:Motion.getLevel(n),policy:n.getAttribute('data-easyedu-motion-policy'),scroll:Motion.scrollBehavior(n),reducedClass:document.body.classList.contains('easyedu-motion-reduced'),minimalClass:document.body.classList.contains('easyedu-motion-disabled')});}}finally{Motion.setLevel(n,'full');}return results;
   });rows.push({name,levels});save();for(const r of levels){expect(r.actual).toBe(r.level);expect(r.policy).toBe(r.level==='minimal'?'disabled':'enabled');expect(r.scroll).toBe(r.level==='full'?'smooth':'auto');expect(r.reducedClass).toBe(r.level==='reduced');expect(r.minimalClass).toBe(r.level==='minimal');}
   await page.screenshot({path:info.outputPath(name+'-full-1280.png')});
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
