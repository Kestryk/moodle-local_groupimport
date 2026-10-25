const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('K21 served separate localized model counts',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('counts.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_/.test(c.methodname)&&!/^local_groupimport_(?:sm_)?(?:get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 const expected=JSON.parse(execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'k21-course-counts.php'),'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle'],{encoding:'utf8',timeout:30000}));
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 try{for(const lang of ['fr','en'])for(const width of [1280,390]){
  await page.setViewportSize({width,height:1000});base.searchParams.set('lang',lang);const response=await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});const html=await response.text();
  const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  if(width===1280)await root.locator('[data-easystud-layout-mode="structure"]:visible').click();else await root.locator('[data-easystud-mobile-view="groups"]').click();
  await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
  const counts=root.locator('[data-easystud-structure-count]');await expect(counts).toHaveCount(2);for(const badge of await counts.all())await expect(badge).toBeVisible();
  const row=await root.evaluate((n,html)=>{const read=e=>({type:e.getAttribute('data-easystud-structure-count'),text:e.textContent.trim(),template:e.getAttribute('data-count-template')});const ssr=new DOMParser().parseFromString(html,'text/html');return {ssr:[...ssr.querySelectorAll('[data-easystud-structure-count]')].map(read),badges:[...n.querySelectorAll('[data-easystud-structure-count]')].map(e=>({...read(e),height:e.getBoundingClientRect().height,overflow:e.scrollWidth-e.clientWidth})),overflow:document.documentElement.scrollWidth-innerWidth};},html);
  rows.push({lang,width,expected,...row});save();expect(row.overflow).toBeLessThanOrEqual(1);
  const labels=lang==='fr'?{groups:'groupes',groupings:'groupements'}:{groups:'groups',groupings:'groupings'};
  expect(expected.groups).toBeGreaterThan(1);expect(expected.groupings).toBeGreaterThan(1);
  for(const badge of [...row.ssr,...row.badges]){expect(badge.text).toBe(expected[badge.type]+' '+labels[badge.type]);expect(badge.template).toContain('__count__');expect(badge.template).toContain('|');}
  for(const badge of row.badges)expect(badge.overflow).toBeLessThanOrEqual(1);expect(Math.abs(row.badges[0].height-row.badges[1].height)).toBeLessThanOrEqual(1);
  await counts.first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('counts-'+lang+'-'+width+'.png')});
 }expect(errors).toEqual([]);expect(writes).toEqual([]);}finally{save();}
});
