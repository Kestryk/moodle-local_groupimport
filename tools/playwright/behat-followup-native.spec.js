const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
test('First visit workspace navigation and asynchronous density',async()=>{
 test.setTimeout(360000);
 const fixture=JSON.parse(fs.readFileSync(process.env.BEHAT_FOLLOWUP_FIXTURE,'utf8'));
 const lease=JSON.parse(fs.readFileSync(process.env.BEHAT_FOLLOWUP_LEASE,'utf8').replace(/^\uFEFF/,''));
 expect(fs.readFileSync(path.join(lease.lock,'owner.txt'),'utf8').trim()).toBe('behat-followup-25oct');
 const base='http://localhost:'+lease.port,dir=process.env.PLAYWRIGHT_OUTPUT_DIR,phase=process.env.BEHAT_FOLLOWUP_PHASE;
 const result={phase,rows:[],errors:[]};const save=()=>fs.writeFileSync(path.join(dir,'native.json'),JSON.stringify(result,null,2));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const width of [1366,1600]){for(const scenario of ['navigation','density']){
 const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();page.setDefaultTimeout(90000);page.on('pageerror',e=>result.errors.push(e.stack||e.message));
 const row={width,scenario};result.rows.push(row);save();
 try{
 await page.goto(base+'/login/index.php',{waitUntil:'domcontentloaded'});await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click();
 await page.goto(base+'/local/groupimport/manage.php?id='+fixture.course+'&lang=en',{waitUntil:'domcontentloaded'});
 row.document=await page.evaluate(()=>({url:location.href,title:document.title,root:document.querySelector('#local-groupimport-easystud')?.className,state:document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState,text:document.querySelector('#region-main')?.innerText.slice(0,300)}));save();
 await page.locator('#local-groupimport-easystud[data-easystud-loading-state="ready"]').waitFor({timeout:15000});await page.locator('[data-easyedu-guide-welcome]:visible').waitFor({timeout:15000});await page.evaluate(()=>document.fonts.ready);
 if(scenario==='navigation'){
 await page.locator('[data-easystud-layout-mode="participants"]').click();
 row.before=await page.locator('[data-easystud-layout-mode="structure"]').evaluate(e=>{const r=e.getBoundingClientRect(),w=document.querySelector('[data-easyedu-guide-welcome]'),b=w.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {button:{x:r.x,y:r.y,width:r.width,height:r.height},banner:{x:b.x,y:b.y,width:b.width,height:b.height},hit:hit?.className,overlapWidth:Math.max(0,Math.min(r.right,b.right)-Math.max(r.left,b.left)),overlapHeight:Math.max(0,Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)),covered:w.contains(hit)};});
 await page.screenshot({path:path.join(dir,'navigation-'+width+'.png')});
 try{await page.locator('[data-easystud-layout-mode="structure"]').click({timeout:2500});row.clicked=true;}catch(e){row.clicked=false;row.clickError=e.message.slice(0,250);}
 if(row.clicked){await expect(page.locator('.local-groupimport-easystud--structure-focus')).toHaveCount(1);await page.locator('[data-easystud-layout-mode="both"]').click();await expect(page.locator('.local-groupimport-easystud--structure-focus')).toHaveCount(0);}
 if(phase==='candidate'){expect(row.before.covered).toBe(false);expect(row.before.overlapHeight*row.before.overlapWidth).toBe(0);expect(row.clicked).toBe(true);}
 }else{
 expect(await page.locator('.local-groupimport-easystud--compact-users').count()).toBe(1);
 await page.evaluate(()=>{const button=document.querySelector('[data-easystud-density-toggle]');window.__densityTrace=[];button.addEventListener('click',()=>{const start=performance.now();const tick=()=>{const compact=document.querySelector('#local-groupimport-easystud').classList.contains('local-groupimport-easystud--compact-users');window.__densityTrace.push({ms:performance.now()-start,compact});if(compact&&performance.now()-start<2000)requestAnimationFrame(tick);};tick();},{once:true});});
 await page.locator('[data-easystud-density-toggle]').click();row.immediateCompact=await page.locator('.local-groupimport-easystud--compact-users').count();
 await expect(page.locator('.local-groupimport-easystud--compact-users')).toHaveCount(0,{timeout:5000});row.trace=await page.evaluate(()=>window.__densityTrace);row.finalCompact=0;
 const select=page.locator('[data-easystud-user][data-user-id] > .local-groupimport-easystud-selector').first();await select.click();await expect(page.locator('[data-easystud-user].is-selected')).toHaveCount(1);await page.locator('[data-easystud-clear-all-selection]:visible').click();await expect(page.locator('[data-easystud-user].is-selected')).toHaveCount(0);row.selectionPass=true;
 }
 }catch(e){row.failure=e.message;save();if(phase==='candidate')throw e;}finally{save();await context.close();}
 }}expect(result.errors).toEqual([]);}finally{save();await browser.close();}
});
