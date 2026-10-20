/* eslint-env node */
// Native presentation acceptance only. Requires an already owned Moodle test-pool lease.
// Starts a real Guide path without business writes; uses native persistence/reload.
const path=require('node:path');
const fs=require('node:fs'),assert=require('node:assert/strict');
const [,,base,modulePath,secretFile,output]=process.argv;
if(!base||!modulePath||!secretFile||!output)throw Error('Usage: node test-k20-guide-responsive-native.cjs <pool URL> <Playwright module> <admin secret file> <new absolute output directory>');
const address=new URL(base);
if(address.hostname!=='localhost'||!['8052','8054','8055'].includes(address.port))throw Error('Allocated pool copy only');
if(!path.isAbsolute(output)||fs.existsSync(output))throw Error('New absolute output directory required; preserve old evidence');
fs.mkdirSync(output,{recursive:true});
const {chromium}=require(path.resolve(modulePath));
const run='native';
const result={rows:[],errors:[],started:new Date().toISOString()};
const save=()=>fs.writeFileSync(output+'/'+run+'.json',JSON.stringify(result,null,2));
const stage=(step,lang,width)=>fs.appendFileSync(output+'/'+run+'-stages.jsonl',JSON.stringify({step,lang,width,at:new Date().toISOString()})+'\n');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const lang of ['fr','en'])for(const width of [768,390,1600,1280]){
  const context=await browser.newContext({viewport:{width:1600,height:1000},hasTouch:width<=768,reducedMotion:'no-preference'}),page=await context.newPage();page.setDefaultTimeout(30000);
  page.on('pageerror',e=>result.errors.push({lang,width,message:e.message}));page.on('console',m=>{if(m.type()==='error')result.errors.push({lang,width,message:m.text()});});
  try{
   stage('login',lang,width);
   const password=fs.readFileSync(secretFile,'utf8').trim();
   const login=await context.request.get(base+'/login/index.php',{timeout:180000}),token=(await login.text()).match(/name="logintoken" value="([^"]+)"/)[1];await context.request.post(base+'/login/index.php',{form:{username:'admin',password,logintoken:token},maxRedirects:0});
   await page.route('**/lib/ajax/service.php*',route=>{const calls=route.request().postDataJSON()||[];return calls.some(c=>/^local_groupimport_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))?route.abort():route.continue();});
   await page.route('**/local/groupimport/ajax.php*',route=>{
    const params=new URLSearchParams(route.request().postData()||new URL(route.request().url()).search);
    const action=params.get('action');
    // ajax.php movestatus (lines625–638 on the tested base) is a passive SELECT.
    // Abort only business writes; do not manufacture console errors on normal loading.
    return ['movestatus','userdetails'].includes(action)?route.continue():route.abort();
   });
   const address=base+'/local/groupimport/manage.php?id=71&lang='+lang;
   await page.goto(address,{waitUntil:'domcontentloaded',timeout:180000});
   const ready=()=>page.waitForFunction(()=>document.querySelector('[data-easyedu-guide-root]')?.easyeduGuideConfig&&document.querySelector('#local-groupimport-easystud')?.dataset.easystudSmReady==='1',null,{timeout:180000});await ready();
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
   const open=async()=>{
    const direct=page.locator('[data-easyedu-guide-open]:visible').first();
    if(await direct.count())return direct.click();
    await page.locator('[data-easyedu-navigation-open]:visible').first().click();
    await page.locator('[data-easyedu-responsive-guide-launcher]:visible').click();
   };
   const modal=page.locator('[data-easyedu-guide-modal]'),checklist=page.locator('[data-easyedu-guide-checklist]');
   await open();await modal.waitFor({state:'visible'});
   await page.setViewportSize({width,height:width===390?844:1024});await settle();
   await page.locator('[data-easyedu-guide-nav-item="2"]').first().click();await page.locator('[data-easyedu-guide-slide="2"]').waitFor({state:'visible'});await settle();
   await page.locator('[data-easyedu-guide-start-path="practice-membership"]:visible').click();await modal.waitFor({state:'hidden'});await checklist.waitFor({state:'visible'});await settle();stage('native-path-started',lang,width);
   const measure=selector=>page.locator(selector).evaluate(button=>{
    const r=button.getBoundingClientRect(),s=getComputedStyle(button),icon=button.querySelector('.fa'),ir=icon?.getBoundingClientRect(),pseudo=getComputedStyle(button,'::before');
    const parent=button.closest('[data-easyedu-guide-checklist]').getBoundingClientRect();
    return{width:r.width,height:r.height,padding:s.padding,radius:s.borderRadius,background:s.backgroundColor,color:s.color,border:s.border,name:button.getAttribute('aria-label')||button.textContent.trim(),glyphColor:icon?getComputedStyle(icon).color:pseudo.backgroundColor,
     centre:ir?[Math.abs(r.x+r.width/2-ir.x-ir.width/2),Math.abs(r.y+r.height/2-ir.y-ir.height/2)]:[Math.abs(parseFloat(pseudo.left)-r.width/2+parseFloat(s.borderLeftWidth)),Math.abs(parseFloat(pseudo.top)-r.height/2+parseFloat(s.borderTopWidth))],
     inside:r.bottom<=parent.bottom+.5&&r.right<=parent.right+.5,hit:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
   });
   const restoreButton=page.locator('[data-easyedu-guide-checklist-restore]');
   let restore;
   if(await restoreButton.isVisible()){await page.mouse.move(0,0);await settle();restore=await measure('[data-easyedu-guide-checklist-restore]');await restoreButton.click();await settle();}
   await page.mouse.move(0,0);await settle();const close=await measure('[data-easyedu-guide-checklist-close]');
   if(width===390&&lang==='en')await checklist.screenshot({path:output+'/'+run+'-checklist-expanded-en-390.png'});
   if(!restore){await page.locator('[data-easyedu-guide-checklist-minimize]:visible').click();await restoreButton.waitFor({state:'visible'});await page.mouse.move(0,0);await settle();restore=await measure('[data-easyedu-guide-checklist-restore]');}
   if(width===390&&lang==='en')await checklist.screenshot({path:output+'/'+run+'-checklist-folded-en-390.png'});
   const k2001=['width','height','padding','radius','background','color','border','glyphColor'].every(k=>close[k]===restore[k])&&close.centre.every(n=>Number.isFinite(n)&&n<=.5)&&restore.centre.every(n=>Number.isFinite(n)&&n<=.5)&&close.hit&&restore.hit&&close.inside&&restore.inside&&!!close.name&&!!restore.name;
   result.rows.push({case:'K20-01',lang,width,close,restore,pass:k2001});save();assert(k2001,'K20-01 '+JSON.stringify({lang,width,close,restore}));if(width<=768)assert.equal(close.height,44);
   // Genuine persistence: reload the state created by the native Start action;
   // do not seed a checklist or inject a fake Guide path.
   const actualState=await page.evaluate(()=>{const r=document.querySelector('[data-easyedu-guide-root]');return JSON.parse(localStorage.getItem(r.easyeduGuideConfig.storageKey+'.checklist'));});assert.equal(actualState.path,'practice-membership');
   await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();stage('native-path-reloaded',lang,width);
   const notice=page.locator('[data-easyedu-guide-resume]');await notice.waitFor({state:'visible',timeout:30000});
   await open();await modal.waitFor({state:'visible'});await settle();
   await page.locator('[data-easyedu-guide-nav-item="1"]').first().click();await page.locator('[data-easyedu-guide-slide="1"]').waitFor({state:'visible'});await settle();
   const stack=await page.evaluate(()=>{
    const box=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const notice=document.querySelector('[data-easyedu-guide-resume]'),footer=document.querySelector('.easyedu-guide-modal__footer'),n=box(notice),f=box(footer);
    const controls=scope=>[...scope.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(button=>{const r=box(button);return{...r,name:button.getAttribute('aria-label')||button.textContent.trim(),hit:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),enabled:!button.disabled};});
    return{notice:n,footer:f,insideDialog:!!notice.closest('.easyedu-guide-modal__dialog'),overlap:Math.max(0,Math.min(n.bottom,f.bottom)-Math.max(n.y,f.y)),buttons:controls(footer),actions:controls(notice),count:document.querySelectorAll('[data-easyedu-guide-resume]').length,horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
   });
   const k2002=stack.insideDialog&&stack.overlap===0&&stack.notice.bottom<=stack.footer.y+.5&&stack.buttons.every(b=>b.hit&&b.bottom<=stack.footer.bottom+.5&&b.right<=width+.5)&&stack.actions.every(b=>b.hit&&b.bottom<=stack.notice.bottom+.5&&b.right<=width+.5)&&stack.count===1&&stack.horizontalOverflow===0;
   result.rows.push({case:'K20-02',lang,width,stack,pass:k2002});save();assert(k2002,'K20-02 '+JSON.stringify(stack));
   if(width<=768&&lang==='en')await page.screenshot({path:output+'/'+run+'-stack-en-'+width+'.png'});
   await page.locator('[data-easyedu-guide-next]:visible').click();await page.waitForFunction(()=>document.querySelector('[data-easyedu-guide-root]').dataset.easyeduGuideCurrentSlide==='2');await settle();
   await page.locator('[data-easyedu-guide-previous]:visible').click();await page.waitForFunction(()=>document.querySelector('[data-easyedu-guide-root]').dataset.easyeduGuideCurrentSlide==='1');await settle();
   await modal.locator('[data-easyedu-guide-close]').click();await modal.waitFor({state:'hidden'});await notice.waitFor({state:'visible'});
   const outside=await notice.evaluate(n=>({root:n.parentElement.matches('[data-easyedu-guide-root]'),position:getComputedStyle(n).position}));assert(outside.root&&outside.position==='fixed');
   await open();await modal.waitFor({state:'visible'});await settle();assert.equal(await notice.count(),1);
   await notice.locator('[data-easyedu-guide-resume-path]').click();await checklist.waitFor({state:'visible'});await settle();assert.equal(await notice.isVisible(),false);
   result.rows.at(-1).navigationAndResume='PASS';save();stage('case-complete',lang,width);
  }catch(e){await page.screenshot({path:output+'/'+run+'-failure-'+lang+'-'+width+'.png'}).catch(()=>{});throw e;}finally{await context.close();}
 }
 assert.equal(result.errors.length,0,JSON.stringify(result.errors));result.status='PASS';save();console.log(JSON.stringify({status:'PASS',rows:result.rows.length,errors:result.errors.length}));
}catch(e){result.status='FAIL';result.failure=e.stack;save();throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
