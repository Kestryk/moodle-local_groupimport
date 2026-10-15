const {test,expect}=require('@playwright/test');const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('Claude complete alignment lift diagnosis',async({page},info)=>{
 test.setTimeout(360000);page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const config=(action,saved)=>JSON.parse(execFileSync((process.env.EASYEDU_PHP_EXECUTABLE||'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe'),[path.join(__dirname,'t020-complete-view-config.php'),(process.env.EASYEDU_MOODLE_ROOT||'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle'),action,...(saved?[JSON.stringify(saved)]:[])],{encoding:'utf8',timeout:30000}));
 const rows=[],errors=[],writes=[];let saved,restored;const save=()=>fs.writeFileSync(info.outputPath('integration.json'),JSON.stringify({rows,errors,writes,saved,restored},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 const root=page.locator('#local-groupimport-easystud');
 const settle=async()=>{await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);};
 const open=async()=>{await page.goto(base.href,{waitUntil:'domcontentloaded'});if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(base.href,{waitUntil:'domcontentloaded'});}await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle();};
 try{
  saved=config('read');save();config('enable');
  for(const width of [1600,1920]){
   await page.setViewportSize({width,height:1000});await open();await root.locator('[data-easystud-layout-mode="both"]:visible').click();await settle();
   const measure=()=>root.evaluate(n=>{
    const selectors={list:'[data-easystud-participant-list]',tree:'[data-easystud-tree]',participant:'[data-easystud-user]',structure:'.local-groupimport-easystud-tree__section--ungrouped',filters:'[data-easystud-filters]',create:'.local-groupimport-easystud-create-row'};
    const read=e=>{if(!e)return null;const c=getComputedStyle(e),r=e.getBoundingClientRect();return {class:e.className,hidden:e.hidden,ancestorHidden:!!e.closest('[hidden]'),offsetParent:!!e.offsetParent,style:e.getAttribute('style'),top:r.top,height:r.height,width:r.width,display:c.display,gap:c.gap,padding:c.padding,margin:c.margin,boxSizing:c.boxSizing,transform:c.transform};};
    const parts=Object.fromEntries(Object.entries(selectors).map(([key,sel])=>[key,read(n.querySelector(sel))]));
    const tree=n.querySelector(selectors.tree),list=n.querySelector(selectors.list);
    const first=(parent,sel)=>[...parent.querySelectorAll(sel)].filter(e=>!e.hidden&&e.offsetParent!==null).slice(0,3).map(read);
    return {classes:n.className,layoutWidth:n.querySelector('.local-groupimport-easystud__layout').clientWidth,parts,controllerParticipants:first(list,'[data-easystud-user], [data-easystud-empty-state]'),controllerStructure:first(tree,'.local-groupimport-easystud-tree__section--ungrouped,.local-groupimport-easystud-tree__section[data-easystud-grouping-id],[data-easystud-empty-state]'),bars:[...n.querySelectorAll('[data-easystud-pagination="top"]')].map(read)};
   });
   rows.push({width,baseline:await measure()});save();
   await root.locator('[data-easystud-participant-list] > [data-easystud-user]').first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('complete-diagnostic-'+width+'.png')});
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{if(saved){restored=config('restore',saved);save();expect(restored).toEqual(saved);}else save();}
});