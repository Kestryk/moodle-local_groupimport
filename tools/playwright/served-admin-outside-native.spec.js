const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Served admin outside CSS remaining native8051',async({page},info)=>{
 test.setTimeout(480000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');const course=Number(base.searchParams.get('id'));
 if(base.origin!=='http://localhost:8051'||course===5||!course)throw Error('Dedicated manifested course required');
 const report={course,errors:[],blocked:[],rows:[]};const save=()=>fs.writeFileSync(info.outputPath('polish-security.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()!=='GET'){report.blocked.push(r.request().url());save();return r.abort();}return r.continue();});
 await page.goto(base.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});}
 await page.addInitScript(()=>{
  window.qaColumnFrames=[];const start=performance.now();
  const sample=()=>{const root=document.querySelector('#local-groupimport-easystud');if(root){const shown=s=>{const n=root.querySelector(s);if(!n)return false;const c=getComputedStyle(n),r=n.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity)>0&&r.width>0&&r.height>0;};window.qaColumnFrames.push({ms:performance.now()-start,participants:shown('[data-easystud-participant-list]'),groups:shown('[data-easystud-participant-groups-panel]'),ready:root.dataset.easystudLoadingState});if(root.dataset.easystudLoadingState==='ready')return;}if(performance.now()-start<15000)requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 const root=page.locator('#local-groupimport-easystud');
 try{
 for(const [name,path,selector] of [['admin','/admin/settings.php?section=local_groupimport&lang=fr','#adminsettings'],['outside','/my/?lang=fr','#page']]){
  await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});await expect(page.locator(selector).first()).toBeVisible({timeout:60000});
  for(const width of [1280,390]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);
   const row=await page.evaluate(({name,width,selector})=>{const rules=[];for(const sheet of document.styleSheets){try{for(const r of sheet.cssRules){if(/local-groupimport|data-easystud/.test(r.cssText))rules.push(r.cssText.slice(0,120));}}catch(e){throw Error('Unreadable CSS '+sheet.href);}}return {name,width,rules:rules.length,viewportOverflow:document.documentElement.scrollWidth-innerWidth,font:getComputedStyle(document.querySelector(selector)).fontSize,styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.href).filter(s=>s.includes('/local/groupimport/'))};},{name,width,selector});
   report.rows.push(row);save();expect(row.viewportOverflow).toBeLessThanOrEqual(1);if(name==='outside')expect(row.rules).toBe(0);if(name==='mass')expect(row.font).toBe('16px');await page.screenshot({path:info.outputPath(name+'-'+width+'.png')});
  }
 }
 expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
 }finally{await page.screenshot({path:info.outputPath('last-state.png')}).catch(()=>{});save();}
});



