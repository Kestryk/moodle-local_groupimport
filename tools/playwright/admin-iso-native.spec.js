const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

test('E5 establish SM admin Mass Import proportion reference',async({page},info)=>{
 test.setTimeout(900000);page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(180000);
 const manager=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||process.env.EASYEDU_MOODLE_URL||'');
 if(manager.origin!=='http://localhost:8051')throw Error('Own8051 only');
 const report={kind:'before E5 product edits',errors:[],blocked:[],rows:[]};
 const save=()=>fs.writeFileSync(info.outputPath('iso-reference.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',r=>r.request().method()==='GET'?r.continue():(report.blocked.push(r.request().url()),r.abort()));
 const go=async(url,root)=>{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(page.url().includes('/login/')){
   await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
   await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});
   await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
   await page.goto(url,{waitUntil:'domcontentloaded'});
  }
  await expect(page.locator(root)).toHaveAttribute('data-easystud-loading-state','ready',{timeout:180000});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect&&Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 };
 for(const width of [1600,1280,768,390]){
  await page.setViewportSize({width,height:width===768?1024:width===390?844:1000});
  for(const [surface,url,root] of [
   ['SM',manager.href,'#local-groupimport-easystud'],
   ['Admin',new URL('/admin/settings.php?section=local_groupimport&lang=fr',manager).href,'#page-admin-setting-local_groupimport'],
   ['Mass Import',new URL('/local/groupimport/index.php?id='+manager.searchParams.get('id')+'&lang=fr',manager).href,'.local-groupimport-import'],
  ]){
   await go(url,root);
   if(surface==='SM'&&width>1024){await page.locator('[data-easystud-layout-mode="participants"]:visible').click();await page.locator(root).evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>a.effect&&Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});}
   const row=await page.locator(root).evaluate((n,{surface,width})=>{
    const visible=e=>e&&!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    const box=e=>{if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,class:e.className,font:s.fontSize,lineHeight:s.lineHeight,weight:s.fontWeight,color:s.color,width:r.width,height:r.height,x:r.x,y:r.y,padding:s.padding,gap:s.gap,radius:s.borderRadius,border:s.borderColor,shadow:s.boxShadow};};
    const first=selector=>box([...n.querySelectorAll(selector)].find(visible));
    return {surface,width,root:box(n),headings:[...n.querySelectorAll('h1,h2,h3,h4')].filter(visible).slice(0,12).map(box),
     section:first('.local-groupimport-easystud__panel,.local-groupimport-admin-settings,.local-groupimport-import__panel,.card'),
     sectionBody:first('.local-groupimport-easystud__panel > .card-body'),
     search:first('[data-easystud-search],input[type="search"]'),
     field:first('input.form-control:not([type="hidden"]),.easyedu-searchable-choice__trigger,select:not([hidden])'),
     secondary:first('[data-easystud-reset-filters],.easyedu-color-picker__reset,button.btn-outline-secondary,button.btn-secondary'),
     primary:first('button.btn-primary,input.btn-primary'),label:first('.form-label label,label'),help:first('.form-description,.form-text,.local-groupimport-admin-settings__hero-copy p'),
     choices:[...n.querySelectorAll('.easyedu-searchable-choice__trigger')].filter(visible).map(box),
     pageHeadings:[...document.querySelectorAll('main h2,#region-main h2')].filter(visible).slice(0,4).map(box),
     overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
   },{surface,width});
   report.rows.push(row);save();
   if(width===1600&&surface!=='SM')await page.screenshot({path:info.outputPath('E5-before-'+surface.replace(' ','-')+'-1600.png')});
  }
 }
 expect(report.rows).toHaveLength(12);expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
});
