const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('Mass Import root is 16px at desktop and phone widths',async({page},info)=>{
 test.setTimeout(180000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('root-font.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/index.php*',r=>{if(r.request().method()==='GET')return r.continue();writes.push(r.request().method());return r.abort();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 try{for(const width of [1280,390]){
  await page.setViewportSize({width,height:1000});await page.goto(new URL('/local/groupimport/index.php?id=5&lang=fr',base).href,{waitUntil:'domcontentloaded',timeout:60000});
  const root=page.locator('.local-groupimport-import');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
  const row=await root.evaluate(n=>{const r=n.getBoundingClientRect();return {font:getComputedStyle(n).fontSize,htmlFont:getComputedStyle(document.documentElement).fontSize,width:r.width,overflow:document.documentElement.scrollWidth-innerWidth,bundles:[...document.querySelectorAll('link[href*="/local/groupimport/styles/"]')].map(e=>new URL(e.href).pathname),controls:[...n.querySelectorAll('button,input,select')].filter(e=>!e.hidden&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>1).map(e=>({tag:e.tagName,font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width}))};});
  rows.push({width,...row});save();expect(row.font).toBe('16px');expect(row.htmlFont).toBe('16px');expect(row.overflow).toBeLessThanOrEqual(1);expect(row.bundles).toEqual(['/local/groupimport/styles/mass-import.css']);expect(row.controls.length).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath('mass-root-'+width+'.png')});
 }expect(errors).toEqual([]);expect(writes).toEqual([]);}finally{save();}
});
