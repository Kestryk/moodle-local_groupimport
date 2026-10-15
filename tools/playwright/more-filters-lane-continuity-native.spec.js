const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');

test('More Filters continuous paired desktop lanes',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);
 if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];
 const save=()=>fs.writeFileSync(info.outputPath('filters.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 const root=page.locator('#local-groupimport-easystud');
 const settle=async()=>{await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);};
 await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
 }
 await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
 const originalStyle=await root.getAttribute('style');
 const defaults=JSON.parse(execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'palette-native-default-roles.php'),'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle'],{encoding:'utf8',timeout:30000}));
 const setOpen=async(name,open)=>{const toggle=root.locator('[data-easystud-advanced-filters-toggle="'+name+'"]');if((await toggle.getAttribute('aria-expanded'))!==String(open)){await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded',String(open));await settle();}};
 const sample=async(view)=>root.evaluate((n,view)=>{
  const read=selector=>{const e=n.querySelector(selector),c=getComputedStyle(e),r=e.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY,height:r.height,width:r.width,padding:c.padding,margin:c.margin,marginStart:c.marginBlockStart,align:c.alignSelf,display:c.display,background:c.backgroundImage};};
  const p=view==='participants';const h1=p?'.local-groupimport-easystud__filters':'.local-groupimport-easystud-create-card--group';
  const h2=p?'.local-groupimport-easystud-participant-groups__create':'.local-groupimport-easystud-create-card--grouping';
  const l1=p?'[data-easystud-participant-list]':'.local-groupimport-easystud-structure-groups';
  const l2=p?'.local-groupimport-easystud-participant-groups__list':'.local-groupimport-easystud-tree__groupings';
  return {classes:n.className,headers:[read(h1),read(h2)],lists:[read(l1),read(l2)],controls:[read(h1+' > .local-groupimport-easystud-advanced-filters__control'),read(h2+' > .local-groupimport-easystud-advanced-filters__control')],horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
 },view);
 try{
  for(const width of [1600,1280])for(const palette of ['default','configured-test']){
   await page.setViewportSize({width,height:1000});
   await root.evaluate((n,{style,palette,roles})=>{n.setAttribute('style',style||'');if(palette==='default'){Object.entries(roles).forEach(([key,value])=>n.style.setProperty(key,value));for(const [role,hex]of Object.entries({participant:'#4873ad',group:'#29724d',grouping:'#6a7f98'})){n.style.setProperty('--easyedu-'+role+'-rail',hex);}}},{style:originalStyle,palette,roles:defaults});
   for(const view of ['participants','structure']){
    await root.locator('[data-easystud-layout-mode="'+view+'"]:visible').click();await settle();
    const left=view==='participants'?'participants':'structure-groups',right='participant-groups';
    if(view==='participants'){await setOpen(right,false);}await setOpen(left,false);
    const states=view==='participants'?[[false,false],[true,false],[true,true],[false,true],[false,false]]:[[false,false],[true,false],[false,false]];
    let baselineControls;
    for(const [leftOpen,rightOpen]of states){
     await setOpen(left,leftOpen);if(view==='participants')await setOpen(right,rightOpen);await settle();
     const row={width,palette,view,leftOpen,rightOpen,...await sample(view)};rows.push(row);save();
     expect(row.horizontalOverflow).toBe(false);
     expect(Math.abs(row.lists[0].top-row.lists[1].top)).toBeLessThanOrEqual(2);
     for(let i=0;i<2;i++){expect(Math.abs(row.headers[i].bottom-row.lists[i].top)).toBeLessThanOrEqual(2);}
     if(!baselineControls)baselineControls=row.controls.map(c=>c.top);
     if(leftOpen!==rightOpen){for(const control of row.controls)expect(parseFloat(control.marginStart)).toBe(0);const closed=leftOpen?1:0;expect(row.controls[closed].top-baselineControls[closed]).toBeLessThanOrEqual(2);}
     if(!leftOpen&&!rightOpen&&view==='participants')expect(Math.abs(row.controls[0].top-row.controls[1].top)).toBeLessThanOrEqual(2);
     if(leftOpen&&!rightOpen){await root.locator(view==='participants'?'[data-easystud-search]':'.local-groupimport-easystud-create-card--group input').first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('filters-'+view+'-'+palette+'-'+width+'.png')});}
    }
   }
  }
  const previousCss=execFileSync('git',['show','532cb0bb:styles/student-management.css'],{cwd:path.join(__dirname,'../..'),encoding:'utf8',maxBuffer:4000000});
  const compactPaint=()=>root.evaluate(n=>[...n.querySelectorAll('.local-groupimport-easystud__filters,.local-groupimport-easystud-create-card,.local-groupimport-easystud-advanced-filters__control,[data-easystud-role-toggle-wrap],.local-groupimport-easystud-user,.local-groupimport-easystud-group')].filter(e=>!e.hidden&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>1).map(e=>{const c=getComputedStyle(e);return {class:e.className,properties:Object.fromEntries(['display','padding','margin','align-self','height','width','background','border-radius','font-size'].map(p=>[p,c.getPropertyValue(p)]))};}));
  for(const width of [768,390]){
   await page.setViewportSize({width,height:1000});
   for(const view of ['participants','groups','groupings']){
    await root.locator('[data-easystud-mobile-view="'+view+'"]').click();await settle();await page.mouse.move(0,0);
    const current=await compactPaint();
    await page.evaluate(css=>{const link=document.querySelector('link[href*="/local/groupimport/styles/student-management.css"]');if(!link?.sheet)throw Error('Missing page stylesheet');const style=document.createElement('style');style.id='qa-more-filters-baseline';style.textContent=css;link.before(style);link.sheet.disabled=true;},previousCss);
    try{await settle();const previous=await compactPaint();rows.push({stage:'compact-css-parity',width,view,nodes:current.length,matched:JSON.stringify(current)===JSON.stringify(previous)});save();expect(current).toEqual(previous);}finally{await page.evaluate(()=>{document.getElementById('qa-more-filters-baseline')?.remove();document.querySelector('link[href*="/local/groupimport/styles/student-management.css"]').sheet.disabled=false;});}
   }
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{await root.evaluate((n,value)=>{if(value===null)n.removeAttribute('style');else n.setAttribute('style',value);},originalStyle);save();}
});
