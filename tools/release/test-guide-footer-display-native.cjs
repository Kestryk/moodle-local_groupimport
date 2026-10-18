// K17-62/69 native geometry, real Guide opening and restored checklist; no business actions.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const path=require('node:path'),{execFileSync}=require('node:child_process');
const sourceRoot=path.resolve(__dirname,'../..');
const [playwrightModule,leaseFile,passwordFile,outputDirectory]=process.argv.slice(2);
assert.ok(outputDirectory,'Usage: <playwright-module> <lease.json> <password-file> <output-dir> [--pilot] [--baseline=ref]');
const {chromium,request}=require(path.resolve(playwrightModule));
const out=path.resolve(outputDirectory); fs.mkdirSync(out,{recursive:true}); const runPrefix='native-footer-'; const phase='candidate',pilot=process.argv.includes('--pilot');
const lease=JSON.parse(fs.readFileSync(path.resolve(leaseFile),'utf8').replace(/^\uFEFF/,''));assert.ok([8052,8054,8055].includes(lease.port),'Only a leased test-pool runtime is allowed'); const base='http://localhost:'+lease.port;
assert.equal(fs.readFileSync(lease.lock+'/owner.txt','utf8').replace(/^\uFEFF/,'').trim(),lease.run);
const secret=fs.readFileSync(path.resolve(passwordFile),'utf8').trim();
const baseline=process.argv.find(arg=>arg.startsWith('--baseline='))?.slice(11)||'e8a1b83a';
const baselineCss=execFileSync('git',['show',baseline+':styles/student-management.css'],{cwd:sourceRoot,encoding:'utf8',maxBuffer:32*1024*1024});
const stage=name=>fs.appendFileSync(out+'/'+runPrefix+phase+'-stages.jsonl',JSON.stringify({name,at:new Date().toISOString()})+'\n');
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await Promise.all([...document.querySelectorAll('[data-easyedu-guide-root], [data-easyedu-guide-root] *')].flatMap(n=>n.getAnimations()).filter(a=>a.playState==='running'&&Number.isFinite(a.effect.getComputedTiming().endTime)&&a.effect.target.getBoundingClientRect().width>0).map(a=>a.finished.catch(()=>{})));await new Promise(requestAnimationFrame);});}
function measure(){
 const root=document.querySelector('[data-easyedu-guide-root]');
 const rect=node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,centreY:r.y+r.height/2,padding:s.padding,radius:s.borderRadius,font:s.fontSize,lineHeight:s.lineHeight};};
 const footer=root.querySelector('.easyedu-guide-modal__footer'),trigger=footer.querySelector('[data-easyedu-display-open]');const nodes=[trigger,footer.querySelector('.easyedu-guide-modal__step-count'),footer.querySelector('[data-easyedu-guide-previous]'),footer.querySelector('[data-easyedu-guide-next]')];
 const boxes=nodes.map(n=>({...rect(n),label:n.innerText,tag:n.tagName}));const f=rect(footer),centres=boxes.map(b=>b.centreY);
 const glyph=trigger.querySelector('.fa');const g=rect(glyph),t=rect(trigger);
 return {footer:f,controls:boxes,trigger:t,glyph:g,glyphDx:g.x+g.width/2-t.x-t.width/2,glyphDy:g.centreY-t.centreY,centreSpread:Math.max(...centres)-Math.min(...centres),bottomOverflow:Math.max(0,...boxes.map(b=>b.bottom-f.bottom)),horizontalOverflow:Math.max(0,...boxes.map(b=>b.right-f.right)),documentOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),wrap:getComputedStyle(footer).flexWrap,slide:root.querySelector('[data-easyedu-guide-slide][aria-hidden="false"]')?.dataset.easyeduGuideSlide,buttons:boxes.slice(2).map((b,i)=>({...b,hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===nodes[i+2]||nodes[i+2].contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}))};
}
(async()=>{const report={phase,base,rows:[],errors:[],passed:false};
const proofFiles=['styles/student-management.css','styles/guide.css','templates/easyedu_guide.mustache'];
report.filePins=proofFiles.map(file=>{const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const source=hash(sourceRoot+'/'+file),served=hash(lease.root+'/moodle/local/groupimport/'+file);assert.equal(source,served);return{file,sha256:served};});let browser,page;try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const api=await request.newContext({baseURL:base});const response=await api.get('/login/index.php',{timeout:90000});const token=(await response.text()).match(/name="logintoken" value="([^"]+)"/)[1];const logged=await api.post('/login/index.php',{form:{username:'claude-sm-test',password:secret,logintoken:token},timeout:90000});assert.ok(!logged.url().includes('/login/'));const state=await api.storageState();await api.dispose();stage('login');
 for(const lang of pilot?['fr']:['fr','en'])for(const width of pilot?[390]:[1600,1280,768,390]){
 const context=await browser.newContext({storageState:state,viewport:{width,height:width===1280?800:width===768?1024:width===390?844:1000},hasTouch:width<1024});page=await context.newPage();page.setDefaultTimeout(25000);stage(lang+'/'+width);
 page.on('pageerror',e=>report.errors.push({lang,width,kind:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')report.errors.push({lang,width,kind:'console',message:m.text()});});
 await page.goto(base+'/local/groupimport/manage.php?id=71&lang='+lang,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState==='ready'&&document.querySelector('[data-easyedu-guide-root]')?.easyeduGuideConfig,null,{timeout:120000});
 // Keep writes out of this layout recipe, including per-user preferences and tours.
 await page.route('**/local/groupimport/ajax.php**',async route=>{const req=route.request();const action=new URL(req.url()).searchParams.get('action')||new URLSearchParams(req.postData()||'').get('action');if(req.method()==='POST'&&!['get_state','guide_progress','get_course_state'].includes(action)){report.blockedWrites=report.blockedWrites||[];report.blockedWrites.push(action);await route.abort();}else await route.continue();});
 if(!await page.locator('[data-easyedu-guide-open="1"]:visible').count()) {
     await page.locator('[data-easyedu-navigation-open]:visible').first().click();
 }
 await page.locator('[data-easyedu-guide-open="1"]:visible').first().click();await page.locator('[data-easyedu-guide-modal]:visible').waitFor();
 const dot=page.locator('[data-easyedu-guide-nav-item="2"]');if(await dot.count())await dot.click();else {await page.locator('[data-easyedu-guide-next="1"]:visible').click();await page.locator('[data-easyedu-guide-next="1"]:visible').click();}
 await settle(page);
 const row={lang,width};
 const oldStyle=await page.addStyleTag({content:baselineCss.replaceAll('../fonts/',base+'/local/groupimport/fonts/')});
 await page.evaluate(()=>{document.querySelectorAll('link[rel=stylesheet]').forEach(n=>{if(/local\/groupimport\/styles\/student-management\.css/.test(n.href))n.disabled=true;});});
 await settle(page);row.beforeCssOnly=await page.evaluate(measure);
 await oldStyle.evaluate(n=>n.remove());await page.evaluate(()=>{document.querySelectorAll('link[rel=stylesheet]').forEach(n=>{if(/local\/groupimport\/styles\/student-management\.css/.test(n.href))n.disabled=false;});});
 await settle(page);row.guide=await page.evaluate(measure);report.rows.push(row);
 row.labels=await page.locator('.easyedu-guide-modal__footer-actions button').evaluateAll(nodes=>nodes.map(node=>{const range=document.createRange();range.selectNodeContents(node);return {text:node.innerText,rangeCount:range.getClientRects().length,height:range.getBoundingClientRect().height,rect:{width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}};}));
 if(phase==='candidate'){
  const m=row.guide;assert.equal(m.trigger.width,width<1024?44:32);assert.equal(m.trigger.height,width<1024?44:32);assert.equal(m.centreSpread,0,'four footer centres share one axis');assert.equal(m.bottomOverflow,0);assert.equal(m.horizontalOverflow,0);assert.equal(m.documentOverflow,0);assert.equal(m.glyphDx,0);assert.equal(m.glyphDy,0);if(width===390){assert.equal(m.footer.height,64);assert.ok(m.controls.slice(2).every(b=>b.height>=44),'touch navigation >=44');}assert.ok(m.buttons.every(b=>b.hit),'footer buttons are hit-testable');
 }
 if(width===1600||width===390)await page.screenshot({path:out+'/'+phase+'-'+lang+'-'+width+'.png',fullPage:false});
 // Render an actual configured path through its normal Start control, without performing its steps.
 const starts=page.locator('[data-easyedu-guide-slide]:visible [data-easyedu-guide-start-path]');
 row.pathStarts=await starts.count();if(row.pathStarts){await starts.last().click();await page.locator('[data-easyedu-guide-checklist]:visible').waitFor();await settle(page);const restore=page.locator('[data-easyedu-guide-checklist-restore]:visible');if(await restore.count()){await restore.click();await settle(page);}
 row.checklist=await page.locator('[data-easyedu-guide-checklist] [data-easyedu-display-open]').evaluate(n=>{const r=n.getBoundingClientRect(),g=n.querySelector('.fa').getBoundingClientRect();return{width:r.width,height:r.height,glyphDx:g.x+g.width/2-r.x-r.width/2,glyphDy:g.y+g.height/2-r.y-r.height/2,footerDisplay:getComputedStyle(n.parentElement).display,panelClasses:n.closest('[data-easyedu-guide-checklist]').className};});if(phase==='candidate'&&row.checklist.width>0){assert.equal(row.checklist.width,width<1024?44:32);assert.equal(row.checklist.height,width<1024?44:32);}}
 for(const pin of report.filePins)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(lease.root+'/moodle/local/groupimport/'+pin.file)).digest('hex'),pin.sha256,'file pin stable '+pin.file);
 await context.close();
 }
 assert.equal(report.errors.length,0);report.passed=true;
 }catch(e){report.failure=e.stack;if(page&&!page.isClosed())report.diagnostic=await page.evaluate(()=>({title:document.title,visibleGuide:!!document.querySelector('[data-easyedu-guide-modal]:not([hidden])'),guideDom:document.querySelector('[data-easyedu-guide-root]')?.innerHTML.slice(-13000)})).catch(()=>null);}
 finally{if(browser)await browser.close();fs.writeFileSync(out+'/native-footer-'+phase+(pilot?'-pilot':'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,rows:report.rows.length,errors:report.errors.length,failure:report.failure}));if(!report.passed)process.exitCode=1;}
})();
