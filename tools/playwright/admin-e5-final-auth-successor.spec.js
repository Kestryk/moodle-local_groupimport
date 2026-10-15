const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('E5 final native chrome committed login successor',async({page},info)=>{
 test.setTimeout(600000);page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(180000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL||'');if(base.origin!=='http://localhost:8051')throw Error('Own8051 only');
 const url=new URL('/admin/settings.php?section=local_groupimport&lang=fr',base).href,report={rows:[],errors:[],blocked:[]};
 const save=()=>fs.writeFileSync(info.outputPath('e5-final-native.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/*',r=>r.request().method()==='GET'?r.continue():(report.blocked.push(new URL(r.request().url()).pathname),r.abort()));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  // The only permitted POST is authentication; Guide/setting writes remain blocked.
  await page.unroute('**/*');await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'}),page.locator('#loginbtn').click({noWaitAfter:true})]);
  await page.route('**/*',r=>r.request().method()==='GET'?r.continue():(report.blocked.push(new URL(r.request().url()).pathname),r.abort()));
 }
 for(const width of [1600,1280,768,390]){
  await page.setViewportSize({width,height:width===768?1024:1000});await page.goto(url,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#adminsettings')).toHaveAttribute('data-easyedu-admin-layout','ready');await expect(page.locator('body')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:180000});
  const row=await page.locator('#adminsettings').evaluate(n=>{
   const skeleton=[...n.querySelectorAll('.local-groupimport-admin-settings__loading-section')];
   const titles=[...n.querySelectorAll('.local-groupimport-admin-section__toggle')];
   const submit=n.querySelector('[type="submit"]'),action=submit.closest('.row'),f=n.getBoundingClientRect(),b=submit.getBoundingClientRect();
   const triggers=[...n.querySelectorAll('.easyedu-color-picker__trigger')].map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height};});
   return {skeletonSections:skeleton.length,skeletonControlCounts:skeleton.map(s=>s.querySelectorAll('.local-groupimport-admin-settings__loading-form-row').length),skeletonRadius:skeleton.map(s=>getComputedStyle(s).borderRadius),open:titles.map(t=>t.getAttribute('aria-expanded')),triggers,footer:{justify:getComputedStyle(action).justifyContent,rightDelta:f.right-b.right},overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  report.rows.push({width,...row});save();expect(row.skeletonSections).toBe(5);expect(row.skeletonControlCounts).toEqual([4,1,5,1,5]);for(const r of row.skeletonRadius)expect(r).toBe('13.44px');
  expect(row.footer.justify).toBe('flex-end');expect(Math.abs(row.footer.rightDelta)).toBeLessThanOrEqual(1);expect(row.overflow).toBeLessThanOrEqual(1);
  if(width>768)for(const t of row.triggers){expect(t.width).toBe(38);expect(t.height).toBe(38);}
  const opener=page.locator('[data-local-groupimport-welcome-reset-open]');await opener.click();const dialog=page.locator('#easyedu-welcome-reset');await expect(dialog).toBeVisible();await expect(dialog.locator('.easyedu-confirmation-dialog__actions [data-local-groupimport-welcome-reset-close]')).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 }
 expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
});
