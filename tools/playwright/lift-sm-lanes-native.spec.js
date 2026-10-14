const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Lift SM lanes FR three views and widths',async({page},info)=>{
 test.setTimeout(420000);page.setDefaultTimeout(25000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);
 if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];
 const save=()=>fs.writeFileSync(info.outputPath('lanes.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{
  const calls=r.request().postDataJSON()||[];
  if(calls.some(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}
  return r.continue();
 });
 await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
 }
 const root=page.locator('#local-groupimport-easystud');
 const settle=async()=>{
  await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
  await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);
 };
 try{
 for(const width of [1600,1280,390]){
  await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle();
  for(const view of width===390?['participants','groups','groupings']:['participants','structure','both']){
   const key=width===390?'mobile-view':'layout-mode';
   const control=root.locator('[data-easystud-'+key+'="'+view+'"]:visible').first();
   if(view==='both'&&!await control.count()){
    rows.push({width,view,available:false,reason:'Complete view disabled in current administration configuration'});save();continue;
   }
   await control.click();await expect(control).toHaveAttribute('aria-pressed','true');await settle();
   await page.mouse.move(0,0);
   const data=await root.evaluate(n=>{
    const prefix='.local-groupimport-easystud';
    const painted=e=>{if(!e.getClientRects().length||e.getBoundingClientRect().width<2)return false;for(let a=e;a;a=a.parentElement)if(getComputedStyle(a).opacity==='0'||getComputedStyle(a).visibility==='hidden')return false;return true;};
    const measure=selector=>[...n.querySelectorAll(selector)].filter(painted).map(e=>{
     const s=getComputedStyle(e),b=e.getBoundingClientRect();return {cls:e.className,x:b.x,y:b.y,width:b.width,height:b.height,background:s.backgroundColor,border:s.borderTopWidth,radius:s.borderRadius,gap:s.columnGap,columns:s.gridTemplateColumns,inset:s.paddingInlineStart,shadow:s.boxShadow};
    });
    return {rootWidth:n.clientWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,
     scrollers:[...n.querySelectorAll(prefix+'__panel,'+prefix+'-tree,'+prefix+'__participant-list,'+prefix+'-participant-groups__list,'+prefix+'-structure-groups__list,'+prefix+'-tree__groupings')].filter(e=>painted(e)&&/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2).map(e=>e.className),
     grids:measure(prefix+'__participant-content,'+prefix+'-create-row,'+prefix+'-tree,'+prefix+'__layout'),
     lanes:measure(prefix+'__filters,'+prefix+'-participant-groups__create,'+prefix+'-create-card'),
     cards:measure(prefix+'-user,'+prefix+'-group,'+prefix+'-tree__section').slice(0,25)};
   });rows.push({width,view,...data});save();
   expect(data.overflow,'horizontal overflow '+width+'/'+view).toBe(false);
   expect(data.scrollers,'intrinsic lane flow '+width+'/'+view).toEqual([]);
   expect(data.cards.length).toBeGreaterThan(0);
   for(const card of data.cards)expect(card.radius).toBe('12.8px');
   const relevant=data.grids.find(g=>view==='participants'?g.cls.includes('__participant-content'):view==='structure'?g.cls.includes('-create-row'):g.cls.endsWith('__layout'));
   if(width>1024)expect(relevant.gap).toBe('24px');
   await page.screenshot({path:info.outputPath(view+'-'+width+'.png')});
  }
 }
 expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
