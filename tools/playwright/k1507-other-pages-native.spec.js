const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('K15-07 Mass Import admin delivery remains isolated',async({page},info)=>{
 test.setTimeout(240000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('pages.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 try{
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:1000});await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   if(width===1280)await root.locator('[data-easystud-layout-mode="participants"]:visible').click();else await root.locator('[data-easystud-mobile-view="participants"]').click();
   await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
   const eye=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible [data-easystud-open-user]').first();await eye.focus();await page.keyboard.press('Shift+Tab');
   await eye.evaluate(e=>new Promise((resolve,reject)=>{const parents=[];for(let n=e;n;n=n.parentElement)parents.push(n);parents.push(document.scrollingElement);let last='',stable=0;const deadline=setTimeout(()=>reject(Error('Ancestor scrolling did not settle')),5000);const tick=()=>{const value=parents.map(n=>n.scrollTop+':'+n.scrollLeft).join('|');stable=value===last?stable+1:0;last=value;if(stable>=8){clearTimeout(deadline);resolve();}else requestAnimationFrame(tick);};requestAnimationFrame(tick);}));
   await page.keyboard.press('Tab');await expect(eye).toBeFocused();await expect(page.locator('.local-groupimport-easystud-hover-popover')).toBeVisible();rows.push({name:'sm-keyboard-focus',width,focused:true,popover:true});save();await page.screenshot({path:info.outputPath('sm-keyboard-'+width+'.png')});
  }
  for(const width of [1280,390])for(const name of ['import','admin']){
   await page.setViewportSize({width,height:1000});
   await page.goto(new URL(name==='import'?'/local/groupimport/index.php?id=5&lang=fr':'/admin/settings.php?section=local_groupimport&lang=fr',base).href,{waitUntil:'domcontentloaded',timeout:60000});
   const host=page.locator(name==='import'?'.local-groupimport-import':'#adminsettings');
   if(name==='import')await expect(host).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});else await expect(host.locator('.easyedu-searchable-choice').first()).toBeVisible();
   await host.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
   const row=await host.evaluate(n=>({horizontalOverflow:document.documentElement.scrollWidth>innerWidth,choices:n.querySelectorAll('.easyedu-searchable-choice').length,bundles:[...document.querySelectorAll('link[href*="/local/groupimport/styles/"]')].map(e=>new URL(e.href).pathname)}));
   rows.push({width,name,...row});save();expect(row.horizontalOverflow).toBe(false);expect(row.bundles).toEqual(['/local/groupimport/styles/'+(name==='import'?'mass-import':'administration')+'.css']);if(name==='admin')expect(row.choices).toBe(5);
   await page.screenshot({path:info.outputPath(name+'-'+width+'.png')});
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
