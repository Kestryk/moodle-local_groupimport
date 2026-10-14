const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('SM component frame immediately visible held state FR widths motion',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(60000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);
 if(url.hostname!=='localhost'||url.port!=='8051'||url.searchParams.get('id')!=='5')throw Error('Own8051 course5 only');
 url.searchParams.set('lang','fr');url.searchParams.set('easystudloadingdiagnostics','1');
 const rows=[],errors=[],writes=[];let hold=false,arrived,release,gate;
 const save=()=>fs.writeFileSync(info.outputPath('component-frame.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/lib/ajax/service.php*',async route=>{
  const names=(route.request().postDataJSON()||[]).map(c=>c.methodname||'');
  const mutation=names.filter(n=>n.startsWith('local_groupimport_')&&!/_(get|list)_/.test(n));
  if(mutation.length){writes.push(mutation);return route.abort('blockedbyclient');}
  if(hold&&names.includes('local_groupimport_get_state')){arrived();await gate;}return route.continue();
 });
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()!=='GET'){writes.push(new URL(route.request().url()).pathname);return route.abort('blockedbyclient');}
  return route.continue();
 });
 try{
  await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
  if(await page.locator('#username').count()){
   await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
   await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});
   await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
  }
  const root=page.locator('#local-groupimport-easystud');
  if(page.url().includes('/local/groupimport/manage.php'))await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  for(const width of [1600,1280,390]){
   await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:width===390?'reduce':'no-preference'});
   const request=new Promise(resolve=>{arrived=resolve;});gate=new Promise(resolve=>{release=resolve;});hold=true;
   await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await Promise.race([request,new Promise((_,reject)=>setTimeout(()=>reject(Error('Native state request absent')),60000))]);
   const row=await root.evaluate(n=>({width:innerWidth,state:n.dataset.easystudLoadingState,
    pageSkeletonCount:n.querySelectorAll('[data-easystud-loading-skeleton]').length,
    componentSkeletonCount:n.querySelectorAll('[data-easystud-sm-loading]').length,
    componentSkeletonsPainted:[...n.querySelectorAll('[data-easystud-sm-loading]')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden';}).length,
    frame:n.easystudLoadingDiagnostics.snapshot().find(e=>e.name==='manager-frame'),
    responsive:n.classList.contains('local-groupimport-easystud--responsive-workspace'),
    busy:n.getAttribute('aria-busy'),inert:n.querySelector('[data-easystud-real-content]').inert,
    participants:n.querySelectorAll('[data-easystud-user]').length}));rows.push(row);save();
   expect(row.pageSkeletonCount).toBe(0);expect(row.componentSkeletonCount).toBeGreaterThan(0);expect(row.componentSkeletonsPainted).toBeGreaterThan(0);
   expect(row.state).toBe('loading');expect(row.frame.elapsedMs).toBeLessThan(250);expect(row.responsive).toBe(width<=1024);
   expect(row.busy).toBe('true');expect(row.inert).toBe(true);expect(row.participants).toBe(0);
   await root.screenshot({path:info.outputPath('frame-'+width+'.png')});hold=false;release();
   await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   await expect(root.locator('[data-easystud-user]').first()).toBeVisible();row.ready=true;save();
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{hold=false;release?.();save();}
});
