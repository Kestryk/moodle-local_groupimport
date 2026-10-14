const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const settle=node=>node.evaluate(async root=>{await document.fonts.ready;
 return Promise.all(root.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
test('T058 group magnifier Enter Escape three native focus samples',async({page},info)=>{
 test.setTimeout(240000);page.setDefaultTimeout(60000);
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 if(url.hostname!=='localhost'||url.port!=='8051'||!Number(url.searchParams.get('id'))||url.searchParams.get('id')==='5')throw Error('Owned8051 disposable fixture required');
 const report={mode:'on-demand-only',language:'fr',width:1280,course:Number(url.searchParams.get('id')),cases:[],pageErrors:[],blockedWrites:0};
 const save=()=>fs.writeFileSync(info.outputPath('focus-parity.json'),JSON.stringify(report,null,2));
 page.on('pageerror',error=>{report.pageErrors.push(error.message);save();});
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()==='GET')return route.continue();report.blockedWrites++;save();return route.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  const calls=route.request().postDataJSON()||[],writes=calls.filter(c=>(c.methodname||'').startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname));
  if(writes.length){report.blockedWrites+=writes.length;save();return route.abort('blockedbyclient');}return route.continue();
 });
 await page.setViewportSize({width:1280,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
 }
 try{
  // Three predefined observations per version expose intermittence; no test retry.
  for(let cycle=1;cycle<=3;cycle++){
   await page.goto(url.href,{waitUntil:'domcontentloaded'});
   const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready');await settle(root);
   await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);
   await root.locator('[data-easystud-layout-mode="structure"]:visible').click();await settle(root);
   const group=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first();
   const opener=group.locator('[data-easystud-group-member-search-toggle]'),panel=group.locator(':scope > [data-easystud-group-member-search-panel]'),input=panel.locator('[data-easystud-group-member-search]');
   await expect(opener).toBeVisible();await opener.focus();await expect(opener).toBeFocused();await page.keyboard.press('Enter');
   await expect(panel).toBeVisible();await expect(input).toBeFocused();
   const current={cycle,samples:[]};report.cases.push(current);save();
   await opener.evaluate(button=>{
    window.qaEscapeFocusEvents=[];window.qaEscapeFocusPromises={};
    const panel=button.closest('[data-easystud-group-id]').querySelector(':scope > [data-easystud-group-member-search-panel]');
    const describe=node=>node?{tag:node.tagName,id:node.id,classes:node.className,role:node.getAttribute('role'),label:node.getAttribute('aria-label'),group:node.closest('[data-easystud-group-id]')?.getAttribute('data-easystud-group-id'),connected:node.isConnected}:null;
    document.addEventListener('keydown',event=>{
     if(event.key!=='Escape')return;const at=performance.now();
     for(const delay of [100,500])window.qaEscapeFocusPromises[delay]=new Promise(resolve=>setTimeout(()=>{
      const active=document.activeElement,rect=button.getBoundingClientRect();resolve({requestedMs:delay,elapsedMs:performance.now()-at,isOpener:active===button,active:describe(active),opener:describe(button),openerRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},panel:{hidden:panel.hidden,inert:panel.inert,classes:panel.className},events:window.qaEscapeFocusEvents.slice()});
     },delay));
    },{capture:true,once:true});
    for(const name of ['focusin','focusout'])document.addEventListener(name,event=>window.qaEscapeFocusEvents.push({name,target:describe(event.target),related:describe(event.relatedTarget),at:performance.now()}),{capture:true});
   });
   await page.keyboard.press('Escape');
   for(const delay of [100,500]){
    const sample=await page.evaluate(delay=>window.qaEscapeFocusPromises[delay],delay);current.samples.push(sample);save();
    await page.screenshot({path:info.outputPath('focus-cycle'+cycle+'-'+delay+'ms.png')});
   }
   current.returned=current.samples.find(s=>s.requestedMs===500).isOpener;save();await expect(panel).toBeHidden();
  }
  report.returned=report.cases.filter(c=>c.returned).length;save();
  expect(report.pageErrors).toEqual([]);expect(report.blockedWrites).toBe(0);expect(report.returned).toBe(3);
 }finally{save();}
});
