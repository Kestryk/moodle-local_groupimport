const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Complement5 K15-28 actual student native Participants no EasyStud',async({page},info)=>{
 test.setTimeout(360000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||''),course=Number(base.searchParams.get('id'));
 if(base.origin!=='http://localhost:8051'||course<=5||process.env.EASYEDU_MOODLE_USERNAME!=='eed-guide-write-student-'+course)throw Error('Actual disposable student credentials required');
 const report={course,identity:'owned manual-auth student, no managegroups',errors:[],rows:[]};
 const save=()=>fs.writeFileSync(info.outputPath('student-k15-28.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
 await page.addInitScript(()=>{
  const visible=n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!n.closest('[hidden]');};
  const sample=()=>({pluginLinks:[...document.querySelectorAll('a[href*="/local/groupimport/"]')].map(n=>({text:n.textContent.trim(),href:n.getAttribute('href')})),pluginRoots:document.querySelectorAll('#local-groupimport-easystud,.local-groupimport-easystud-easyedu-guide[data-easyedu-guide-root],[data-easystud-navigation]').length,pluginTours:[...document.querySelectorAll('.popover,[role="dialog"],[data-flexitour],.tour')].filter(visible).filter(n=>/EasyStud|Gestion simplifiée des étudiants/i.test(n.textContent)).map(n=>n.textContent.slice(0,200))});
  window.qaStudentObservation={observations:0,failures:[]};const check=()=>{const row=sample();window.qaStudentObservation.observations++;if((row.pluginLinks.length||row.pluginRoots||row.pluginTours.length)&&window.qaStudentObservation.failures.length<20)window.qaStudentObservation.failures.push({ms:performance.now(),...row});};
  const observer=new MutationObserver(check);observer.observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});window.qaStudentStop=()=>{check();observer.disconnect();return {...window.qaStudentObservation,final:sample()};};check();
 });
 try{
  for(const width of [1280,390])for(const [name,path] of [['course','/course/view.php?id='+course+'&lang=fr'],['participants','/user/index.php?id='+course+'&lang=fr'],['dashboard','/my/?lang=fr']]){
   await page.setViewportSize({width,height:1000});await page.goto(new URL(path,base).href,{waitUntil:'load'});await expect(page.locator('#page')).toBeVisible();
   if(name==='participants'){await expect(page).toHaveURL(/\/user\/index\.php\?/);await expect(page.locator('#participantsform,[data-region="participant-list"],.userlist').first()).toBeVisible();}
   // Bounded observation catches deferred Tour startup; no product tour is forced or dismissed.
   const observed=await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,5000));return window.qaStudentStop();});
   const css=await page.evaluate(()=>{const pluginStyles=[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.href).filter(h=>h.includes('/local/groupimport/'));const rules=[];const walk=rs=>{for(const r of rs){if(r.cssRules)walk(r.cssRules);else if(r.selectorText&&/local-groupimport|data-easystud/.test(r.selectorText))rules.push(r.selectorText);}};for(const s of document.styleSheets){try{walk(s.cssRules);}catch(e){throw Error('Unreadable student CSS '+s.href);}}return {pluginStyles,rules};});
   report.rows.push({width,name,path:page.url(),...observed,css});save();await page.screenshot({path:info.outputPath('student-'+name+'-'+width+'.png')});expect(observed.failures).toEqual([]);expect(css.pluginStyles).toEqual([]);expect(css.rules).toEqual([]);
  }
  expect(report.errors).toEqual([]);
 }finally{save();await page.screenshot({path:info.outputPath('student-last-state.png')}).catch(()=>{});}
});
