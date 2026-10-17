const {expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {login,ready,settle}=require('./k16-sort-copy-helper.cjs');
module.exports=async({page,browser},info,cells,types=['group','grouping','actions'],levels=['full','reduced','minimal'])=>{
 info.setTimeout(1700000);const report={source:'64db2140+guide-fixes',checks:[],errors:[],consoleErrors:[],blockedWrites:[],receipts:[],restores:[]};
 const save=()=>fs.writeFileSync(info.outputPath('guide-paths.json'),JSON.stringify(report,null,2));
 const manifest=path.resolve(info.outputDir,'../..','fixture-manifest.json'),url=await login(page),cookies=await page.context().cookies();
 for(const [lang,width] of cells)for(const level of levels){
  const restored=cp.execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'guide-refonte-reset-fixture.php'),'--moodle-root','C:/dev/Moodle 51 Perf/moodle','--manifest',manifest],{encoding:'utf8'});report.restores.push(JSON.parse(restored));save();
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390,isMobile:width===390,locale:lang});await context.addCookies(cookies);const p=await context.newPage();const tag={lang,width,level};
  p.on('pageerror',e=>{report.errors.push({...tag,error:e.message});save();});p.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push({...tag,error:m.text()});save();}});
  const course=Number(url.searchParams.get('id'));await p.route('**/local/groupimport/ajax.php*',r=>{const data=new URLSearchParams(r.request().postData()||'');if(r.request().method()==='GET'||data.get('action')==='addusers'&&Number(data.get('courseid'))===course)return r.continue();report.blockedWrites.push({...tag,action:data.get('action')});save();return r.abort();});
  try{
   const root=await boundedReady(p,new URL(url),lang,width);p.setDefaultTimeout(12000);const guide=p.locator('.easyedu-guide--discovery[data-easyedu-guide-root]'),checklist=guide.locator('[data-easyedu-guide-checklist]');
   expect(await p.locator('html').getAttribute('lang')).toMatch(new RegExp('^'+lang));
   await root.evaluate(async(n,l)=>{const M=await new Promise(r=>require(['local_groupimport/motion'],r));M.setLevel(n,l);},level);
   const cue=async(target,stage,row)=>{
    await expect(target).toBeVisible();await expect.poll(()=>guide.evaluate(n=>(n.easyeduGuideStepOpenTimers?.size||0)+(n.easyeduGuideScrollers?.size||0)),{timeout:5000}).toBe(0);await settle(root);
    await expect.poll(()=>target.evaluate(n=>{const h=document.querySelector('[data-easyedu-guide-highlight]');if(!h||h.hidden||getComputedStyle(h).display==='none')return 9999;const a=n.getBoundingClientRect(),b=h.getBoundingClientRect();return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height));}),{timeout:5000}).toBeLessThanOrEqual(2);await settle(checklist);
    const state=await target.evaluate(n=>{const a=n.getBoundingClientRect(),g=document.querySelector('.easyedu-guide--discovery[data-easyedu-guide-root]'),panel=g.querySelector('[data-easyedu-guide-checklist]'),b=panel.getBoundingClientRect(),hit=document.elementFromPoint(a.x+a.width/2,a.y+a.height/2);return {target:{x:a.x,y:a.y,width:a.width,height:a.height},panel:{x:b.x,y:b.y,width:b.width,height:b.height},class:panel.className,overlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)),paintHit:!!hit&&(hit===n||n.contains(hit)),sameTarget:g.easyeduGuideCurrentTarget===n,
     numberPaint:(()=>{const step=panel.querySelector('[data-easyedu-guide-step-id].is-active'),index=step?.querySelector('.easyedu-guided-panel__index'),title=step?.querySelector('strong');if(!index||!title)return null;const nr=index.getBoundingClientRect(),tr=title.getBoundingClientRect();if(!nr.width||!tr.width)return null;return {width:nr.width,height:nr.height,firstLineCenterDeltaY:nr.y+nr.height/2-tr.y-parseFloat(getComputedStyle(title).lineHeight)/2};})(),
     number:panel.querySelector('.easyedu-guided-panel__index')?{width:getComputedStyle(panel.querySelector('.easyedu-guided-panel__index')).width,height:getComputedStyle(panel.querySelector('.easyedu-guided-panel__index')).height}:null,padding:getComputedStyle(panel).padding};});
    state.hitMarkup=await target.evaluate(n=>document.elementFromPoint(n.getBoundingClientRect().x+n.getBoundingClientRect().width/2,n.getBoundingClientRect().y+n.getBoundingClientRect().height/2)?.outerHTML.slice(0,650));
    row.measure.cues.push({stage,...state});save();if(state.overlap>0||!state.paintHit){row.measure.cueFailures.push({stage,...state});
     const file='C:/dev/Moodle 51 Perf/moodle/local/guide-fixes-20261017/captures.json',index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
     if(index.length<6&&!index.some(x=>x.lot==='J-G3-painted-target-settled')){row.capture=info.outputPath('failure-painted-target-'+lang+'-'+width+'-'+level+'.png');await p.screenshot({path:row.capture});index.push({lot:'J-G3-painted-target-settled',path:row.capture});fs.writeFileSync(file,JSON.stringify(index,null,2));}
    }
   };
   const recordBadge=async(modal,index)=>{
    if(width!==390)return;await settle(modal);
    const measure=await modal.locator('[data-easyedu-guide-slide="'+index+'"]').evaluate(n=>{const short=n.querySelector('.easyedu-guide-scene__caption-short'),full=n.querySelector('.easyedu-guide-scene__caption-full'),r=short?.getBoundingClientRect();return {text:short?.textContent.trim(),shortDisplay:short?getComputedStyle(short).display:null,fullDisplay:full?getComputedStyle(full).display:null,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};});
    const expected=lang==='fr'?'Exemple':'Example',ok=measure.text===expected&&measure.shortDisplay!=='none'&&measure.fullDisplay==='none';
    const row={...tag,lot:'C-G3',point:'short Example badge on action slide',status:ok?'PASS':'FAIL',measure:{...measure,expected},error:ok?undefined:'Short badge retains the full sentence: '+measure.text};report.checks.push(row);save();
    const file='C:/dev/Moodle 51 Perf/moodle/local/guide-fixes-20261017/captures.json',captures=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
    if(!ok&&captures.length<6&&!captures.some(x=>x.lot==='C-G3-short-badge')){row.capture=info.outputPath('failure-short-badge-'+lang+'-'+width+'.png');await p.screenshot({path:row.capture});captures.push({lot:'C-G3-short-badge',path:row.capture});fs.writeFileSync(file,JSON.stringify(captures,null,2));save();}
   };
   const start=async id=>{
    if(!await p.locator('[data-easyedu-guide-open]:visible').count())await p.locator('[data-easyedu-navigation-open]:visible').first().click();await p.locator('[data-easyedu-guide-open]:visible').first().click();const modal=guide.locator('[data-easyedu-guide-modal]');await expect(modal).toBeVisible();const index=await modal.locator('[data-easyedu-guide-start-path="'+id+'"]').first().evaluate(n=>n.closest('[data-easyedu-guide-slide]').getAttribute('data-easyedu-guide-slide'));await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();await recordBadge(modal,index);await modal.locator('[data-easyedu-guide-start-path="'+id+'"]:visible').click();await expect(checklist).toHaveAttribute('data-easyedu-guide-path',id);await settle(root);
   };
   const mark=async id=>expect(checklist.locator('[data-easyedu-guide-step-id="'+id+'"]')).toHaveClass(/is-complete/,{timeout:15000});
   for(const type of types){
    const id=type==='actions'?'try-actions':'inspect-'+type+'-settings';const row={...tag,lot:'J-G3/C-G4',point:id,status:'RUNNING',measure:{cues:[],cueFailures:[]}};report.checks.push(row);save();
    try{
     await start(id);
     row.measure.floating=await p.locator('.easyedu-navigation__trigger:visible').count();save();expect(row.measure.floating).toBe(0);
     if(type!=='actions'){
      const entry=root.locator(type==='group'?'[data-easystud-structure-groups] [data-easystud-open-advanced-settings]:visible, [data-easystud-context-action="group-open-advanced-settings"]:visible':'[data-easystud-tree] [data-easystud-open-advanced-settings][data-easystud-advanced-target="grouping"]:visible, [data-easystud-context-action="grouping-open-advanced-settings"]:visible').first();
      await cue(entry,'entry',row);await entry.click();await mark('open-editor');const editor=root.locator('[data-easystud-editor-context="'+type+'"]');
      for(const [selector,step] of [['input[name="name"]','inspect-name'],['textarea[name="description"]','inspect-description']]){const target=editor.locator(selector);await cue(target,step,row);await target.click();await mark(step);}
      const cancel=editor.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]');await cue(cancel,'cancel',row);await cancel.click();await mark('cancel-editor');
     }else{
      const card=()=>root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').filter({has:p.getByText('QA Guided One',{exact:true})}).first();
      if(width<=1024){await cue(card().locator('[data-easystud-card-menu]:visible'),'open sheet',row);await card().locator('[data-easystud-card-menu]:visible').click();const item=root.locator('[data-easystud-context-action="participant-move-selected"]:visible');await cue(item,'sheet Add to group',row);await item.click();const modal=root.locator('[data-easystud-move-modal]'),confirm=modal.locator('[data-easystud-confirm-move]');await cue(confirm,'confirm',row);const response=p.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&r.request().method()==='POST');await confirm.click();const receipt=await(await response).json();report.receipts.push({...tag,receipt});save();expect(receipt.success).toBe(true);await expect(modal).toBeHidden({timeout:30000});}
      else{await cue(card(),'drag',row);await card().hover();const a=await card().boundingBox(),b=await root.locator('h3.local-groupimport-easystud__panel-title:visible').first().boundingBox();expect(a).not.toBeNull();expect(b).not.toBeNull();row.measure.drag={from:{x:a.x+12,y:a.y+a.height/2},to:{x:b.x+b.width/2,y:b.y+b.height/2},heldMs:750,draggable:await card().evaluate(n=>n.draggable)};save();await p.mouse.move(a.x+12,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await p.waitForTimeout(750);await p.mouse.up();}
      await mark('try-drag');await settle(root);
      const selected=await root.locator('[data-easystud-participant-list] [data-easystud-selector-input]:checked').count();row.measure.clearSelection={selectedBefore:selected};save();
      if(selected){const clear=root.locator('[data-easystud-clear-all-selection]:visible,[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();await clear.click();await settle(root);row.measure.clearSelection.clicked=true;save();}
      const selector=card().locator(':scope > .local-groupimport-easystud-selector');await cue(selector,'after clear selection',row);await selector.click();await mark('try-selection');
      if(width<=1024){await cue(card().locator('[data-easystud-card-menu]:visible'),'context menu target',row);await card().locator('[data-easystud-card-menu]:visible').click();}else{await cue(card(),'right click target',row);await card().click({button:'right'});}await mark('try-context');await p.keyboard.press('Escape');
     }
     await expect(checklist).toHaveClass(/is-complete/);const message=checklist.locator('[data-easyedu-guide-checklist-message]');await expect(message).toBeVisible();row.measure.completed=true;row.measure.message=await message.innerText();save();expect(row.measure.cueFailures).toEqual([]);row.status='PASS';
    }catch(e){row.status='FAIL';row.error=e.message;
     row.measure.failureDom=await guide.evaluate(g=>{const target=g.easyeduGuideCurrentTarget,h=document.querySelector('[data-easyedu-guide-highlight]'),panel=g.querySelector('[data-easyedu-guide-checklist]');const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,display:getComputedStyle(n).display,hidden:n.hidden,connected:n.isConnected};};return {activeStep:panel?.querySelector('[data-easyedu-guide-step-id].is-active')?.getAttribute('data-easyedu-guide-step-id'),target:rect(target),highlight:rect(h),panel:rect(panel),targetMarkup:target?.outerHTML.slice(0,1500),visibleSheets:[...document.querySelectorAll('[data-easystud-move-modal],[data-easystud-editor-context],[data-easystud-context-menu]')].filter(n=>n.getBoundingClientRect().width>0).map(n=>({tag:n.tagName,class:n.className,rect:rect(n)}))};}).catch(error=>({error:error.message}));
     const file='C:/dev/Moodle 51 Perf/moodle/local/guide-fixes-20261017/captures.json';const index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
     const captureLot=(width<=1024?'J-G3-compact-active-step':'J-G3/C-G4')+'-settled';
     if(index.length<6&&!index.some(x=>x.lot===captureLot)){row.capture=info.outputPath('failure-path-'+lang+'-'+width+'-'+level+'.png');await p.screenshot({path:row.capture}).catch(()=>{});index.push({lot:captureLot,path:row.capture});fs.writeFileSync(file,JSON.stringify(index,null,2));}
    }
    finally{const close=checklist.locator('[data-easyedu-guide-checklist-close]:visible');if(await close.count())await close.click();await p.keyboard.press('Escape').catch(()=>{});save();}
   }
  }catch(e){report.checks.push({...tag,lot:'HARNESS/READY',status:'FAIL',point:'path case prerequisite',error:e.message});save();}
  finally{await context.close();}
 }
 report.completed=true;save();
};

async function boundedReady(page,url,lang,width){let timer;try{return await Promise.race([ready(page,url,lang,width),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native readiness exceeded 120s')),120000);})]);}finally{clearTimeout(timer);}}
