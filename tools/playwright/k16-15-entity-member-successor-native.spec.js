// Successor preserving the six failed native oracles.
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
test.use({hasTouch:true});
test('K16-15 pool checkbox click touch and stable focus FR EN',async({page},info)=>{
 test.setTimeout(600000);page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(120000);
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL);if(!['8052','8054','8055'].includes(url.port)||url.hostname!=='localhost'||url.searchParams.get('id')!=='71')throw Error('Locked pool course71 only');
 const report={checks:[],pageErrors:[],consoleErrors:[]},save=()=>fs.writeFileSync(info.outputPath('entity-member.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
 const fixture=action=>JSON.parse(cp.execFileSync(process.env.EASYEDU_PHP,[path.resolve(__dirname,'../release/fixtures/k16-15-pool.php'),'--root',process.env.EASYEDU_POOL_ROOT,'--manifest',process.env.EASYEDU_FIXTURE_MANIFEST,'--action',action],{encoding:'utf8'}));
 const settle=node=>node.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
 await page.goto(url.href,{waitUntil:'domcontentloaded'});if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'}),page.locator('#loginbtn').click({noWaitAfter:true})]);}
 try{
 for(const lang of ['fr','en'])for(const width of [1600,768,390]){
  const data=fixture('reset'),row={lang,width,status:'RUNNING',data};report.checks.push(row);save();
  try{
   await page.setViewportSize({width,height:1000});url.searchParams.set('lang',lang);await page.goto(url.href,{waitUntil:'domcontentloaded'});
   const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:120000});await expect(root).toHaveAttribute('data-easystud-manager-initialised','1',{timeout:120000});
   await page.locator('.easyedu-guide--discovery[data-easyedu-guide-root]').evaluate(async n=>{const G=await new Promise(r=>require(['local_groupimport/easyedu_guide'],r));const config=n.easyeduGuideConfig;G.destroy(n);G.init(n,{...config,firstVisit:false,welcomeOffer:false});});
   const mobile=root.locator('[data-easystud-mobile-view="groups"]:visible');if(await mobile.count())await mobile.click();else await root.locator('[data-easystud-layout-mode="structure"]:visible').click();await settle(root);
   const card=root.locator('[data-easystud-group-id="'+data.groupId+'"]:visible').first();await expect(card).toBeVisible();const eye=card.locator('[data-easystud-open-advanced-settings]:visible');if(await eye.count())await eye.first().click();else{await card.locator('[data-easystud-card-menu]:visible').first().click();await root.locator('[data-easystud-context-action="group-open-advanced-settings"]:visible').click();}
   const modal=root.locator('[data-easystud-advanced-settings-modal]');await expect(modal).toBeVisible();const input=modal.locator('[data-easystud-entity-select="'+data.userId+'"]');await expect(input).toBeAttached();await settle(modal);
   await input.evaluate(n=>{window.k16Events=[];for(const key of ['click','input','change'])n.parentElement.addEventListener(key,e=>{const state={key,target:e.target.tagName,checked:n.checked,defaultPrevented:e.defaultPrevented};window.k16Events.push(state);queueMicrotask(()=>{state.after=n.checked;});});});
   const label=input.locator('..');await label.click();await expect(input).toBeChecked({timeout:5000});row.click=true;await label.click();await expect(input).not.toBeChecked();await label.tap();await expect(input).toBeChecked();row.touch=true;await label.tap();await expect(input).not.toBeChecked();
   const receipt=page.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&r.request().method()==='POST');await modal.locator('[data-easystud-entity-remove="'+data.userId+'"]').click();const confirm=root.locator('[data-easystud-confirm-modal-submit]:visible');if(await confirm.count())await confirm.click();row.response=await(await receipt).json();expect(row.response.success).toBe(true);await expect(input).toHaveCount(0);await settle(modal);
   row.focus=await modal.evaluate(n=>({inside:n.contains(document.activeElement),element:document.activeElement.outerHTML.slice(0,250)}));expect(row.focus.inside).toBe(true);await page.keyboard.press('Escape');await expect(modal).toBeHidden();row.after=fixture('snapshot');expect(row.after.member).toBe(false);row.status='PASS';
  }catch(e){row.status='FAIL';row.error=e.message;row.events=await page.evaluate(()=>window.k16Events||[]);row.focus=await page.evaluate(()=>document.activeElement.outerHTML.slice(0,250));await page.keyboard.press('Escape').catch(()=>{});}save();
 }
 }finally{report.restore=fixture('reset');save();}
 expect(report.checks.filter(r=>r.status!=='PASS')).toEqual([]);expect(report.pageErrors).toEqual([]);expect(report.consoleErrors).toEqual([]);
});
