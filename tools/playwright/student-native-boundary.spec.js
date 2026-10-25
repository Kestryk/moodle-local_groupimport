const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('Student stays in native Moodle without EasyStud tour or CSS',async({page},info)=>{
 test.setTimeout(240000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const context=JSON.parse(execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'student-native-context.php'),'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle'],{encoding:'utf8',timeout:30000}));
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('student.json'),JSON.stringify({context,rows,errors,writes},null,2));
 expect(context.student).not.toBeNull();expect(context.version).toBe('2026101500');expect(context.pendingUpgrades).toEqual([]);expect(context.roleMatches.student).toEqual([false]);expect(context.roleMatches.admin).toEqual([true]);
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/**',r=>{writes.push(r.request().url());return r.abort();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 try{
  const loginas=new URL('/course/loginas.php',base);loginas.searchParams.set('id','5');loginas.searchParams.set('user',String(context.student.id));loginas.searchParams.set('sesskey',await page.evaluate(()=>M.cfg.sesskey));
  await page.goto(loginas.href,{waitUntil:'domcontentloaded',timeout:60000});
  await expect(page.locator('.continuebutton a')).toHaveAttribute('href',/\/course\/view.php\?id=5/);await page.locator('.continuebutton a').click({noWaitAfter:true});await page.waitForURL(u=>u.pathname==='/course/view.php',{waitUntil:'domcontentloaded',timeout:60000});
  // Login-as state is visible in Moodle's own user menu, not inferred from an absent plugin.
  await expect(page.locator('a[href*="loginas.php"]').first()).toHaveAttribute('href',/loginas.php/);
  for(const width of [1280,390])for(const pathname of ['/course/view.php','/user/index.php']){
   await page.setViewportSize({width,height:1000});const url=new URL(pathname,base);url.searchParams.set('id','5');url.searchParams.set('lang','fr');const response=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});expect(response.status()).toBe(200);await page.evaluate(()=>document.fonts.ready);
   const html=await response.text();
   const row=await page.evaluate(()=>{
    const selectors=[],unreadable=[];const walk=rules=>{for(const rule of rules){if(rule.selectorText&&/(?:local-groupimport|easystud)/i.test(rule.selectorText))selectors.push(rule.selectorText);if(rule.cssRules)walk(rule.cssRules);}};
    for(const sheet of document.styleSheets){try{walk(sheet.cssRules);}catch(e){unreadable.push(sheet.href);}}
    return {bodyId:document.body.id,pluginLinks:[...document.querySelectorAll('a[href*="/local/groupimport/"]')].map(a=>a.getAttribute('href')),dedicatedSheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.href).filter(h=>/local\/groupimport|easyedu-guide/i.test(h)),pluginRoots:document.querySelectorAll('[data-easyedu-guide-root],#local-groupimport-easystud,#local_groupimport-page').length,selectors,unreadable,participantLinks:[...document.querySelectorAll('a[href*="/user/index.php?id=5"]')].map(a=>a.getAttribute('href')),overflow:document.documentElement.scrollWidth-innerWidth};
   });
   row.tourInitIds=context.tours.filter(t=>new RegExp('"tourId"\\s*:\\s*'+t.id+'(?:,|\\s|})').test(html)).map(t=>t.id);
   rows.push({width,pathname,...row});save();expect(row.pluginLinks).toEqual([]);expect(row.dedicatedSheets).toEqual([]);expect(row.pluginRoots).toBe(0);expect(row.selectors).toEqual([]);expect(row.unreadable).toEqual([]);expect(row.tourInitIds).toEqual([]);expect(row.overflow).toBeLessThanOrEqual(1);
   if(pathname==='/user/index.php'){expect(row.bodyId).toBe('page-user-index');await expect(page.locator('#participantsform')).toBeVisible();}else expect(row.participantLinks.length).toBeGreaterThan(0);
   await page.screenshot({path:info.outputPath('student-'+width+'-'+(pathname.includes('course')?'course':'participants')+'.png')});
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
