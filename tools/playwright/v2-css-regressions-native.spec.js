const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
test('V2 regressions intrinsic cards mobile eye and import warning',async({page},info)=>{
 test.setTimeout(420000);page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);
 if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('regressions.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{
  const calls=r.request().postDataJSON()||[];
  if(calls.some(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}
  return r.continue();
 });
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
 }
 const settle=async locator=>locator.evaluate(async n=>{
  await document.fonts.ready;
  await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 });
 const inspect=card=>card.evaluate(n=>{
  const b=n.getBoundingClientRect();const box=e=>{const r=e.getBoundingClientRect();return {x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height};};
  const name=n.querySelector('.local-groupimport-easystud-user__name'),eye=n.querySelector('[data-easystud-open-user]');
  const scrollers=[...document.querySelectorAll('.local-groupimport-easystud__panel,.local-groupimport-easystud__participant-content,[data-easystud-participant-list],.local-groupimport-easystud-participant-groups__list,.local-groupimport-easystud-tree')].filter(e=>e.getClientRects().length&&e.clientWidth>1&&/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2).map(e=>({cls:e.className,height:e.clientHeight,scroll:e.scrollHeight}));
  return {height:b.height,width:b.width,name:box(name),eye:box(eye),eyeAlign:getComputedStyle(eye).alignSelf,
   scrollableColumns:scrollers,compressed:n.scrollHeight>n.clientHeight+2,
   horizontal:document.documentElement.scrollWidth>innerWidth+1,
   roleWrappers:[...document.querySelectorAll('[data-easystud-role-toggle-wrap]')].map(e=>({display:getComputedStyle(e).display,width:e.getBoundingClientRect().width})),
   tagPadding:[...n.querySelectorAll('.local-groupimport-easystud-tags-toggle.p-0')].map(e=>getComputedStyle(e).padding)};
 });
 try{
  for(const width of [1600,1280,390]){
   await page.setViewportSize({width,height:1000});await page.goto(base.href,{waitUntil:'domcontentloaded'});
   const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
   const view=root.locator(width===390?'[data-easystud-mobile-view="participants"]:visible':'[data-easystud-layout-mode="participants"]:visible').first();await view.click();await settle(root);
   const card=root.locator('[data-easystud-participant-list] [data-easystud-user]').first();
   for(const selected of [false,true]){
    const input=card.locator('[data-easystud-selector-input]');if(await input.isChecked()!==selected)await card.locator(':scope > .local-groupimport-easystud-selector').click();
    await settle(root);await card.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
    const sample=await inspect(card);rows.push({page:'sm',width,selected,...sample});save();
    expect(sample.scrollableColumns).toEqual([]);expect(sample.compressed).toBe(false);expect(sample.horizontal).toBe(false);
    expect(sample.eye.x+sample.eye.width).toBeLessThanOrEqual(sample.width+1);
    if(width===390){expect(sample.eyeAlign).toBe('start');expect(sample.eye.y).toBeLessThanOrEqual(sample.name.y+2);}
    for(const padding of sample.tagPadding)expect(padding).toBe('0px');
    await card.screenshot({path:info.outputPath('participant-'+width+'-'+(selected?'expanded':'collapsed')+'.png')});
   }
   await card.locator(':scope > .local-groupimport-easystud-selector').click();await settle(root);
  }
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:1000});await page.goto(new URL('/local/groupimport/index.php?id=5&lang=fr',base).href,{waitUntil:'domcontentloaded'});
   const root=page.locator('.local-groupimport-import').first();await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
   const button=root.locator('[type="submit"]').first();await button.click();
   const warning=root.locator('[data-local-groupimport-file-required]');await expect(warning).toBeVisible();await settle(root);
   const sample=await warning.evaluate((n)=>{const a=n.getBoundingClientRect(),button=n.closest('form').querySelector('[type="submit"]'),b=button.getBoundingClientRect(),s=getComputedStyle(button);return {gap:b.top-a.bottom,color:s.color,background:s.backgroundColor,primary:getComputedStyle(n.closest('.local-groupimport-import')).getPropertyValue('--easyedu-primary'),disabled:button.disabled};});
   const reference=fs.readFileSync(path.join(process.env.LOCALAPPDATA,'EasyEdu/artifacts/easystud/css-v2-20261014/3cbb03cf.css'),'utf8').replace(/\[\[font:local_groupimport\|([^\]]+)\]\]/g,base.origin+'/local/groupimport/fonts/$1');
   await page.evaluate(css=>{document.querySelectorAll('link[href*="/local/groupimport/styles/"]').forEach(n=>n.sheet.disabled=true);const s=document.createElement('style');s.id='qa-reference';s.textContent=css;document.querySelector('link[href*="/theme/styles"]').before(s);},reference);await settle(root);
   const original=await button.evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}));
   await page.evaluate(()=>{document.getElementById('qa-reference').remove();document.querySelectorAll('link[href*="/local/groupimport/styles/"]').forEach(n=>n.sheet.disabled=false);});await settle(root);
   rows.push({page:'import',width,...sample,original});save();expect(sample.gap).toBeGreaterThanOrEqual(16);expect(sample.background).toBe(original.background);expect(sample.color).toBe(original.color);
   await warning.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('import-warning-'+width+'.png')});
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
