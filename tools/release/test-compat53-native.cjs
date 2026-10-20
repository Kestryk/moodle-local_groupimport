/* eslint-env node */
// Dedicated :8053; fixture must be provisioned and restored by the caller. No credentials are logged.
const fs = require('node:fs'), assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const [playwrightPath, secretPath, fixturePath, output] = process.argv.slice(2);
assert.ok([playwrightPath, secretPath, fixturePath, output].every(p => p && path.isAbsolute(p)));
assert.ok(!output.toLowerCase().startsWith(root.toLowerCase() + path.sep));
const {chromium} = require(playwrightPath);
const base = 'http://localhost:8053';
fs.mkdirSync(output,{recursive:true});
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const css = fs.readFileSync(path.join(root, 'styles/student-management.css'), 'utf8').replaceAll('../fonts/', base + '/local/groupimport/fonts/');
const report = {base, courseid: fixture.courseid, rows: [], errors: [], warnings: [], debug: [], failure: null};
const safe = value => value.replace(/([?&](?:sesskey|token|logintoken)=)[^&]+/gi, '$1[redacted]');
const save = () => fs.writeFileSync(output + '/native.json', JSON.stringify(report, null, 2));
(async() => {
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context = await browser.newContext({viewport:{width:1600,height:1000}});
 const page = await context.newPage(); let label = 'login';
 page.on('pageerror', error => {report.errors.push({label,text:error.message});save();});
 page.on('console', message => {if(['error','warning'].includes(message.type())) {
   report[message.type()==='error'?'errors':'warnings'].push({label,text:message.text()});save();
 }});
 page.on('response', response => {if(response.status()>=400){report.errors.push({label,status:response.status(),url:safe(response.url())});save();}});
 const notices = async() => {
  const messages = await page.locator('.debuggingmessage, .phpdebugmessage').allTextContents();
  messages.forEach(text=>report.debug.push({label,text}));
  const body = await page.locator('body').innerText();
  if(/Too much data passed|PHP (?:Warning|Notice|Deprecated)|Undefined (?:variable|property)/i.test(body)) report.debug.push({label,text:'Debugging pattern in body'});
 };
 const lanes = async() => page.evaluate(() => {
  const root = document.querySelector('#local-groupimport-easystud');
  const selectors = ['.local-groupimport-easystud__panel','.local-groupimport-easystud__filters',
   '.local-groupimport-easystud__participant-list','.local-groupimport-easystud-participant-groups__list',
   '.local-groupimport-easystud-create-card','.local-groupimport-easystud-structure-groups','.local-groupimport-easystud-tree__groupings'];
  return [...root.querySelectorAll(selectors.join(','))].filter(e=>e.getBoundingClientRect().height>0).map(e=>{
   const s=getComputedStyle(e), r=e.getBoundingClientRect();
   return {selector:e.className,x:r.x,y:r.y,width:r.width,height:r.height,padding:s.padding,radius:s.borderRadius,
    color:s.color,background:s.backgroundColor,shadow:s.boxShadow,boundary:s.getPropertyValue('--easyedu-lane-border-colour')};
  });
 });
 try {
  await page.waitForLoadState('networkidle',{timeout:90000});await page.goto(base+'/login/index.php',{waitUntil:'domcontentloaded',timeout:180000});
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill(fs.readFileSync(secretPath,'utf8').trim());
  await Promise.all([page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:180000}),page.locator('#loginbtn').click({noWaitAfter:true})]);
  for(const lang of ['fr','en']) for(const width of [1600,390]) {
   label=`manage-${lang}-${width}`;await page.setViewportSize({width,height:1000});const start=Date.now();
   await page.waitForLoadState('networkidle',{timeout:90000});await page.goto(`${base}/local/groupimport/manage.php?id=${fixture.courseid}&lang=${lang}`,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForLoadState('load',{timeout:240000});
   await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState==='ready',null,{timeout:180000});
   await notices(); await page.evaluate(()=>document.fonts.ready); const before=await lanes();
   await page.addStyleTag({content:css});await page.evaluate(()=>document.fonts.ready);const after=await lanes();
   assert.equal(after.length,before.length);
   for(let i=0;i<before.length;i++)for(const key of ['selector','x','y','width','height','padding','radius','color','background'])assert.equal(after[i][key],before[i][key],`${label} ${key}`);
   assert.ok(after.some((row,i)=>row.shadow!==before[i].shadow),'Visible native lane boundary changed');
   const config=await page.locator('#easystud-page-config').evaluate(e=>({type:e.type,bytes:e.textContent.length,guide:Array.isArray(JSON.parse(e.textContent).guide),manager:Array.isArray(JSON.parse(e.textContent).manager)}));
   assert.ok(config.bytes>1024 && config.guide && config.manager);
   const cards=await page.locator('[data-selectable-type="participant"]').count();assert.ok(cards>0);
   report.rows.push({label,ready:true,duration:Date.now()-start,cards,config,before,after});save();
   await page.screenshot({path:output+'/'+label+'.png'});
  }
  for(const width of [1600,390]) {
   label=`course-fr-${width}`;await page.setViewportSize({width,height:1000});
   await page.waitForLoadState('networkidle',{timeout:90000});await page.goto(`${base}/course/view.php?id=${fixture.courseid}&lang=fr`,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForLoadState('load',{timeout:240000});
   await page.waitForFunction(()=>[...document.querySelectorAll('.secondary-navigation a[href],.secondarynav-tabbar a[href]')].some(a=>a.href.includes('/local/groupimport/manage.php')),null,{timeout:90000});
   const toggles=page.locator('button[data-toggler="drawers"][data-action="toggle"][data-target="theme_boost-drawers-courseindex"]');
   let drawer=null;
   if(await toggles.count()) {
    const toggle=toggles.first();
     if(!await page.locator('#theme_boost-drawers-courseindex').evaluate(e=>e.classList.contains('show'))) {
      assert.ok(await toggle.isVisible());await toggle.click();
     }
     await page.waitForFunction(()=>document.querySelector('#theme_boost-drawers-courseindex').classList.contains('show'));
     drawer=await page.locator('#theme_boost-drawers-courseindex').evaluate(e=>{
      const r=e.getBoundingClientRect();return {width:r.width,height:r.height,hidden:e.hidden,links:e.querySelectorAll('a').length};
     });
     assert.ok(drawer.width>0 && drawer.height>0 && drawer.links>0);
   }
   await notices();report.rows.push({label,navigation:true,drawer});save();await page.screenshot({path:output+'/'+label+'.png'});
  }
  for(const [lang,width] of [['fr',1600],['en',390]]) {
   label=`settings-${lang}-${width}`;await page.setViewportSize({width,height:1000});
   await page.waitForLoadState('networkidle',{timeout:90000});await page.goto(`${base}/admin/settings.php?section=local_groupimport&lang=${lang}`,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForLoadState('load',{timeout:240000});await notices();
   assert.ok(await page.locator('form').count());report.rows.push({label,loaded:true});save();
  }
  await page.waitForLoadState('networkidle',{timeout:90000});assert.deepEqual(report.errors,[]);assert.deepEqual(report.debug,[]);assert.deepEqual(report.warnings,[]);
  report.status='PASS';save();console.log(JSON.stringify({status:report.status,cases:report.rows.length,errors:report.errors.length,warnings:report.warnings.length,debug:report.debug.length}));
 } catch(error) {report.failure={label,message:error.message,stack:error.stack};report.status='FAIL';save();throw error;}
 finally {await context.close();await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
