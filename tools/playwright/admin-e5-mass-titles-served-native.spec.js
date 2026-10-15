const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('E5 served Mass Import title parity FR EN',async({page},info)=>{
 test.setTimeout(600000);const base=new URL(process.env.EASYEDU_MOODLE_URL);
 if(base.origin!=='http://localhost')throw Error('Principal localhost only');
 const rows=[],errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/index.php*',r=>{if(r.request().method()==='POST'){writes.push(r.request().url());return r.abort();}return r.continue();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded'});
 }
 try{for(const lang of ['fr','en'])for(const width of [1600,1280,768,390]){
  await page.setViewportSize({width,height:1000});
  await page.goto(new URL('/local/groupimport/index.php?id=5&lang='+lang,base).href,{waitUntil:'domcontentloaded',timeout:60000});
  const root=page.locator('#local-groupimport-import');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  const titles=await root.locator('.local-groupimport-import-card__title.easyedu-panel__title').evaluateAll(ns=>ns.map(n=>{const s=getComputedStyle(n);return {font:s.fontSize,weight:s.fontWeight,color:s.color};}));
  rows.push({lang,width,titles});expect(titles.length).toBeGreaterThan(0);for(const t of titles){expect(t.font).toBe('20px');expect(t.weight).toBe('700');expect(t.color).toBe('rgb(18, 54, 77)');}
  if(lang==='fr'&&width===390)await page.screenshot({path:info.outputPath('E5-Mass-Import-FR390.png')});
 }expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{fs.writeFileSync(info.outputPath('e5-mass-titles.json'),JSON.stringify({rows,errors,writes,humanAccepted:false},null,2));}
});
