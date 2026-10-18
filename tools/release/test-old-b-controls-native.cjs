// OLD-B native candidate: real Moodle controls, no membership writes or admin submit.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [playwrightModule,leaseFile,secretFile,out,phase='candidate',...flags]=process.argv.slice(2);
assert.ok(playwrightModule&&leaseFile&&secretFile&&out,'Usage: <playwright-module> <lease-json> <admin-secret-file> <artifact-directory> [candidate|baseline] [--pilot] [--final]');
const {chromium,request}=require(path.resolve(playwrightModule));
const pilot=flags.includes('--pilot'),prefix=flags.includes('--final')?'final-':'';
const lease=JSON.parse(fs.readFileSync(leaseFile,'utf8').replace(/^\uFEFF/,''));
const pool={8052:'C:/dev/Moodle 51 Claude',8054:'C:/dev/Moodle 51 Claude 2',8055:'C:/dev/Moodle 51 Claude 3'};
assert.ok(pool[lease.port],'Only a Claude pool port is allowed');assert.equal(path.resolve(lease.root),path.resolve(pool[lease.port]));
assert.equal(fs.readFileSync(lease.lock+'/owner.txt','utf8').replace(/^\uFEFF/,'').trim(),lease.run);
const base='http://localhost:'+lease.port,secret=fs.readFileSync(secretFile,'utf8').trim();
fs.mkdirSync(out,{recursive:true});
const report={phase,pilot,passed:false,errors:[],rows:[],pins:[]};
for(const file of ['styles/student-management.css','styles/administration.css','templates/admin_setting_switch.mustache','amd/build/local/cm/entity_dialog.min.js']){
 const p=lease.root+'/moodle/local/groupimport/'+file;
 if(fs.existsSync(p))report.pins.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')});
}
function measure(n){
 const rect=x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
 const b=rect(n),p=rect(n.parentElement),s=getComputedStyle(n),range=document.createRange();range.selectNodeContents(n);const t=range.getBoundingClientRect();
 return{box:b,parent:p,bottomOverflow:Math.max(0,b.bottom-p.bottom),rightOverflow:Math.max(0,b.right-p.right),display:s.display,align:s.alignItems,justify:s.justifyContent,boxSizing:s.boxSizing,font:s.fontSize,fontFamily:s.fontFamily,lineHeight:s.lineHeight,padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],radius:s.borderRadius,background:s.backgroundColor,border:s.borderWidth,borderColor:s.borderColor,color:s.color,shadow:s.boxShadow,opacity:s.opacity,range:{width:t.width,height:t.height,dx:t.x+t.width/2-b.x-b.width/2,dy:t.y+t.height/2-b.y-b.height/2},label:n.getAttribute('aria-label'),text:n.textContent.trim(),cls:n.className};
}
async function settle(page){
 await page.waitForFunction(()=>!window.M?.util?.pending_js?.length,null,{timeout:120000});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
}
async function pseudo(page,locator,name='before'){
 const mark='oldb-'+Math.random().toString(36).slice(2);await locator.evaluate((n,m)=>n.setAttribute('data-oldb-probe',m),mark);
 const client=await page.context().newCDPSession(page);await client.send('DOM.enable');const {root}=await client.send('DOM.getDocument');const {nodeId}=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector:'[data-oldb-probe="'+mark+'"]'});
 const {node}=await client.send('DOM.describeNode',{nodeId,depth:1});const p=node.pseudoElements?.find(n=>n.pseudoType===name);let result=null;
 if(p){const {model}=await client.send('DOM.getBoxModel',{backendNodeId:p.backendNodeId});const q=model.border;const host=await locator.boundingBox();result={width:Math.hypot(q[2]-q[0],q[3]-q[1]),height:Math.hypot(q[6]-q[0],q[7]-q[1]),dx:(q[0]+q[4])/2-host.x-host.width/2,dy:(q[1]+q[5])/2-host.y-host.height/2};}
 await client.detach();await locator.evaluate(n=>n.removeAttribute('data-oldb-probe'));return result;
}
async function ax(page,selector){
 const c=await page.context().newCDPSession(page);await c.send('DOM.enable');const {root}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:root.nodeId,selector});const r=await c.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false});await c.detach();return r.nodes.filter(n=>!n.ignored).map(n=>({role:n.role?.value,name:n.name?.value,properties:n.properties?.map(p=>({name:p.name,value:p.value.value}))}));
}
function near(a,b,message,tolerance=0.05){assert.ok(Math.abs(a-b)<=tolerance,message+': '+a+' != '+b);}
function contained(m,name){near(m.bottomOverflow,0,name+' vertical containment');near(m.rightOverflow,0,name+' horizontal containment');}
(async()=>{let browser,page;try{
 const api=await request.newContext({baseURL:base});let r=await api.get('/login/index.php',{timeout:120000});const token=(await r.text()).match(/name="logintoken" value="([^"]+)"/)[1];r=await api.post('/login/index.php',{form:{username:'admin',password:secret,logintoken:token},timeout:120000});assert.ok(!r.url().includes('/login/'),'admin login');const storageState=await api.storageState();await api.dispose();
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const cases=pilot?[['en',1600],['fr',390]]:['fr','en'].flatMap(lang=>[1600,1280,768,390].map(width=>[lang,width]));
 for(const [lang,width]of cases){
  let stage='context-create';
  const context=await browser.newContext({storageState,viewport:{width,height:width===390?844:width===768?1024:1000},hasTouch:width<=768,locale:lang==='fr'?'fr-FR':'en-GB'});page=await context.newPage();page.on('pageerror',e=>report.errors.push({lang,width,stage,type:'pageerror',message:e.message,stack:e.stack,url:page.url()}));page.on('console',m=>{if(m.type()==='error')report.errors.push({lang,width,stage,type:'console',message:m.text(),url:page.url()});});
  const row={lang,width};report.rows.push(row);
  stage='manage-loading';await page.goto(base+'/local/groupimport/manage.php?id=71&lang='+lang,{waitUntil:'load',timeout:180000});stage='manage-controls';
  await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.getAttribute('data-easystud-loading-state')==='ready',null,{timeout:120000});await settle(page);
  const root=page.locator('#local-groupimport-easystud');
  const participants=root.locator('[data-easystud-mobile-view="participants"]:visible');if(await participants.count())await participants.click();else await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
  const disclosure=root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible');if(await disclosure.getAttribute('aria-expanded')!=='true')await disclosure.click();await settle(page);
  if(phase==='candidate'){
   const filter=root.locator('select[data-easystud-grouping-filter]');const value=await filter.evaluate(n=>[...n.options].find(o=>Number(o.value)>0)?.value);assert.ok(value,'real grouping filter option');await filter.selectOption(value,{force:true});await settle(page);
  }
  const reset=root.locator('[data-easystud-reset-filters]:visible');await reset.waitFor();row.reset=await reset.evaluate(measure);
  if(phase==='candidate'){assert.equal(await reset.isDisabled(),false,'active Reset');await reset.click();await settle(page);}
  const mobile=root.locator('[data-easystud-mobile-view="groups"]:visible');if(await mobile.count())await mobile.click();else await root.locator('[data-easystud-layout-mode="structure"]:visible').click();await settle(page);
  const card=root.locator('[data-easystud-group-id]:visible').filter({has:page.locator('[data-easystud-remove-member]')}).first();await card.waitFor({timeout:60000});row.group=await card.getAttribute('data-easystud-advanced-name');
  const toggle=card.locator('[data-easystud-group-members-toggle]:visible');if(await toggle.count()&&await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await settle(page);
  const remove=card.locator('[data-easystud-remove-member]:visible').first();await remove.scrollIntoViewIfNeeded();await remove.locator('..').hover();await settle(page);row.remove=await remove.evaluate(measure);row.stroke=await pseudo(page,remove);row.memberName=await remove.locator('..').locator('.easyedu-related-person-row__name').innerText();
  if(phase==='candidate'){
   await page.mouse.move(0,0);await settle(page);row.removeRestOpacity=await remove.evaluate(n=>getComputedStyle(n).opacity);assert.equal(row.removeRestOpacity,width<=768?'1':'0','pointer-specific resting visibility');await remove.focus();await settle(page);row.removeFocusOpacity=await remove.evaluate(n=>getComputedStyle(n).opacity);assert.equal(row.removeFocusOpacity,'1','focus reveals remove');await remove.evaluate(n=>n.blur());
  }
  if(phase==='candidate'){
   near(row.remove.box.width,width<=768?44:32,'remove width');near(row.remove.box.height,width<=768?44:32,'remove height');contained(row.remove,'member remove');assert.ok(row.stroke,'decorative stroke present');near(row.stroke.width,12,'stroke width');near(row.stroke.height,1.5,'stroke height');near(row.stroke.dx,0,'stroke centre X',0.000001);near(row.stroke.dy,0,'stroke centre Y',0.000001);assert.equal(row.remove.background,'rgba(0, 0, 0, 0)');assert.equal(row.remove.border,'0px');assert.equal(row.remove.shadow,'none');assert.ok(row.remove.label.includes(row.memberName)&&row.remove.label.includes(row.group),'named member and group');
  }
  const eye=card.locator('[data-easystud-open-advanced-settings]:visible');if(await eye.count())await eye.first().click();else{await card.locator('[data-easystud-card-menu]:visible').first().click();await root.locator('[data-easystud-context-action="group-open-advanced-settings"]:visible').click();}
  const dialog=root.locator('[data-easystud-advanced-settings-modal]:visible');await dialog.waitFor();const dialogRemove=dialog.locator('[data-easystud-entity-remove]:visible').first();await dialogRemove.waitFor();await dialogRemove.locator('..').hover();await settle(page);row.dialogRemove=await dialogRemove.evaluate(measure);row.dialogStroke=await pseudo(page,dialogRemove);
  const cancel=dialog.locator('.easyedu-button--secondary:visible').first();await cancel.waitFor();row.cancel=await cancel.evaluate(measure);
  if(phase==='candidate'){
   near(row.dialogRemove.box.width,width<=768?44:32,'dialog remove width');contained(row.dialogRemove,'dialog remove');near(row.dialogStroke.dx,0,'dialog stroke X',0.000001);near(row.dialogStroke.dy,0,'dialog stroke Y',0.000001);
   for(const [name,m]of [['reset',row.reset],['cancel',row.cancel]]){near(m.box.height,width<=768?44:37.6,name+' height');near(parseFloat(m.font),14.08,name+' font');near(parseFloat(m.padding[1]),12,name+' right padding');near(parseFloat(m.padding[3]),12,name+' left padding');near(parseFloat(m.radius),11.52,name+' radius');near(m.range.dx,0,name+' text centre X',0.5);near(m.range.dy,0,name+' text centre Y',0.5);contained(m,name);assert.equal(m.color,'rgb(31, 42, 55)',name+' secondary ink');assert.equal(m.background,'rgb(255, 255, 255)',name+' secondary surface');}
   near(row.reset.box.height,row.cancel.box.height,'Reset Cancel equal height',0.000001);
  }
  await dialog.locator('[data-easystud-close-advanced-settings], [data-action="hide"]').first().click();
  stage='admin-loading';await page.goto(base+'/admin/settings.php?section=local_groupimport&lang='+lang,{waitUntil:'load',timeout:180000});stage='admin-controls';await settle(page);row.switches=[];
  for(const id of ['enablesimplifiedview','showcompleteview']){
   const selector='#id_s_local_groupimport_'+id,input=page.locator(selector);await input.waitFor();await input.scrollIntoViewIfNeeded();
   const m={id,input:await input.evaluate(measure),checked:await input.isChecked(),axBefore:await ax(page,selector)};
   if(phase==='candidate'){
    const label=input.locator('..');m.target=await label.evaluate(measure);m.track=await pseudo(page,label.locator('span'),'before');m.nearbyText=(await label.innerText()).trim();
    near(m.target.box.width,44,'switch width');near(m.target.box.height,44,'switch height');contained(m.target,'switch');near(m.track.width,36,'track width');near(m.track.height,20,'track height');near(m.track.dx,0,'track centre X',0.000001);near(m.track.dy,0,'track centre Y',0.000001);assert.equal(m.nearbyText,'','no visible state text');
    assert.equal(m.axBefore[0].role,'switch');assert.ok(m.axBefore[0].name.trim().length>0,'named switch');assert.equal(m.axBefore[0].properties.find(p=>p.name==='checked').value,String(m.checked));
    if(width<=768)await label.tap();else await label.click();assert.equal(await input.isChecked(),!m.checked);m.axAfter=await ax(page,selector);assert.equal(m.axAfter[0].properties.find(p=>p.name==='checked').value,String(!m.checked));
    if(width<=768)await label.tap();else await label.click();assert.equal(await input.isChecked(),m.checked);m.restored=true;
   }
   row.switches.push(m);
  }
  row.horizontalOverflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));if(phase==='candidate')near(row.horizontalOverflow,0,'page horizontal overflow');
  for(const pin of report.pins)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(lease.root+'/moodle/local/groupimport/'+pin.file)).digest('hex'),pin.sha256,'served pin stable '+pin.file);
  row.passed=true;stage='context-close';await context.close();fs.writeFileSync(out+'/'+prefix+phase+(pilot?'-pilot':'')+'.json',JSON.stringify(report,null,2));
 }
 assert.equal(report.errors.length,0,'console/page errors');report.passed=true;
 }catch(e){report.failure=e.stack;if(page&&!page.isClosed())report.diagnostic=await page.evaluate(()=>({url:location.pathname,state:document.querySelector('#local-groupimport-easystud')?.getAttribute('data-easystud-loading-state'),groups:[...document.querySelectorAll('[data-easystud-group-id]')].slice(0,5).map(n=>({id:n.dataset.easystudGroupId,visible:!!n.getBoundingClientRect().width,members:n.querySelectorAll('[data-easystud-remove-member]').length})),modals:[...document.querySelectorAll('[data-easystud-advanced-settings-modal]')].map(n=>({visible:!!n.getBoundingClientRect().width,buttons:[...n.querySelectorAll('button')].map(n=>({text:n.innerText,cls:n.className,attrs:[...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])}))}))})).catch(()=>null);}
 finally{if(browser)await browser.close();fs.writeFileSync(out+'/'+prefix+phase+(pilot?'-pilot':'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,rows:report.rows.length,errors:report.errors.length,failure:report.failure}));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.log(e.message);process.exitCode=1;});
