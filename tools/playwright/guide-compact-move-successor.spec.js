// Actual Moodle writes on the wrapper's disposable8051 course only. No mocked
// receipts, seeded completion, synthetic Guide events or hidden-control forcing.
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {guideStorageKey,guideDiscoveryKey}=require('./guide-storage-helper.cjs');
const settle=n=>n.evaluate(async root=>{await document.fonts.ready;await Promise.all(root.getAnimations({subtree:true})
 .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
const field=(request,name)=>{
 const body=request.postData()||'';
 if((request.headers()['content-type']||'').includes('multipart/form-data')){
  const match=body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]+)'));return match?.[1]||'';
 }return new URLSearchParams(body).get(name)||'';
};
for(const width of [1280,390]) test('Guide compact move commands successor '+width,async({page},info)=>{
 test.setTimeout(900000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 const course=Number(url.searchParams.get('id'));
 if(url.hostname!=='localhost'||url.port!=='8051'||!course||course===5)throw Error('Disposable fixture manager URL required');
 let key;const report={course,language:'fr',width,mode:'on-demand-only',phase:'auth',paths:[],steps:[],writes:[],errors:[],blocked:[],blockedWrites:0,failures:[]};
 const save=()=>fs.writeFileSync(info.outputPath('guide-writing.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',route=>{
  const request=route.request();if(request.method()==='GET')return route.continue();
  const path=new URL(request.url()).pathname,action=field(request,'action'),id=Number(field(request,'courseid'));
  if(path.endsWith('/ajax.php')&&id===course&&['creategroup','addusers','movemembers','movegroup','addgroups'].includes(action))return route.continue();
  report.blocked.push({path,action,course:id});report.blockedWrites++;save();return route.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  const calls=route.request().postDataJSON()||[],mutation=calls.filter(c=>(c.methodname||'').startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname));
  if(mutation.length){report.blocked.push(mutation.map(c=>c.methodname));report.blockedWrites+=mutation.length;save();return route.abort('blockedbyclient');}return route.continue();
 });
 const root=page.locator('#local-groupimport-easystud'),guide=page.locator('.easyedu-guide--discovery[data-easyedu-guide-root]');
 const checklist=guide.locator('[data-easyedu-guide-checklist]'),dialog=root.locator('[data-easystud-move-modal]');
 const ready=async()=>{await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);};
 const init=async()=>{
  if(!key){key=await guideStorageKey(page);report.storage={key,discoveryKey:await guideDiscoveryKey(page)};save();}
  await guide.evaluate(async(n,key)=>{const G=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
   n.qaOriginalGuideConfig=n.easyeduGuideConfig;G.destroy(n);G.init(n,{...n.qaOriginalGuideConfig,firstVisit:false,welcomeOffer:false,storageKey:key});},key);
 };
 const clear=async()=>{const button=root.locator('[data-easystud-clear-all-selection]:visible').first();if(await button.count())await button.click();await settle(root);};
 const view=async mode=>{const selector=width<768?'[data-easystud-mobile-view="'+(mode==='structure'?'groupings':mode)+'"]:visible':'[data-easystud-layout-mode="'+mode+'"]:visible';await root.locator(selector).click();await settle(root);};
 const group=name=>root.locator('[data-easystud-group-id]:visible').filter({has:page.locator('.local-groupimport-easystud-group__name',{hasText:name})}).first();
 const participant=()=>root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').filter({has:page.getByText('QA Guided One',{exact:true})}).first();
 const mark=async(id,path)=>{
  const item=checklist.locator('[data-easyedu-guide-step-id="'+id+'"]');await expect(item).toHaveClass(/is-complete/);
  const paint=await item.evaluate(n=>{const marker=n.querySelector('.easyedu-guided-panel__index'),s=getComputedStyle(marker,'::before');return {
   completed:n.classList.contains('is-complete'),state:n.querySelector('[data-easyedu-guide-step-state]').textContent,
   tick:{display:s.display,content:s.content,bottom:s.borderBottomStyle,right:s.borderRightStyle,height:s.height}};});
  expect(paint.state).toBeTruthy();expect(paint.tick.display).toBe('block');expect(paint.tick.bottom).toBe('solid');expect(paint.tick.right).toBe('solid');
  report.steps.push({path,id,paint});save();
 };
 const highlight=async target=>{
  await expect(target).toBeVisible();await settle(root);
  await target.evaluate(n=>n.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));await settle(root);
  await expect(page.locator('[data-easyedu-guide-highlight]')).toBeVisible({timeout:1500});
  await expect.poll(async()=>target.evaluate(node=>{const h=document.querySelector('[data-easyedu-guide-highlight]');if(!h)return Infinity;
   const a=h.getBoundingClientRect(),b=node.getBoundingClientRect();return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height));}).catch(()=>Infinity),{timeout:1500}).toBeLessThanOrEqual(2);
  report.cues=report.cues||[];report.cues.push(await target.evaluate(n=>{const p=document.querySelector('[data-easyedu-guide-checklist]'),h=document.querySelector('[data-easyedu-guide-highlight]'),r=p.getBoundingClientRect(),t=n.getBoundingClientRect();return {step:p.querySelector('.is-active[data-easyedu-guide-step-id]')?.dataset.easyeduGuideStepId,side:r.x+r.width/2<innerWidth/2?'left':'right',panel:{x:r.x,y:r.y,width:r.width,height:r.height},target:{x:t.x,y:t.y,width:t.width,height:t.height},painted:!h.hidden&&getComputedStyle(h).display!=='none'};}));save();
 };
 const start=async(path,number)=>{
  report.phase='path'+number;save();await clear();
  if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
  await page.locator('[data-easyedu-guide-open]:visible').first().click();
  const modal=guide.locator('[data-easyedu-guide-modal]');await expect(modal).toBeVisible();
  const index=await modal.locator('[data-easyedu-guide-start-path="'+path+'"]').first().evaluate(n=>n.closest('[data-easyedu-guide-slide]').getAttribute('data-easyedu-guide-slide'));
  await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
  await modal.locator('[data-easyedu-guide-start-path="'+path+'"]:visible').click();
  await expect(modal).toBeHidden();await expect(checklist).toBeVisible();await expect(checklist).toHaveAttribute('data-easyedu-guide-path',path);await settle(root);
 };
 const write=async(action,perform)=>{
  const refreshed=page.waitForResponse(r=>r.url().includes('/lib/ajax/service.php')&&(r.request().postData()||'').includes('local_groupimport_get_state')).then(r=>r.json(),error=>({qaResponseError:error.message}));
  const response=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/local/groupimport/ajax.php')&&field(r.request(),'action')===action);
  await perform();const result=await(await response).json();report.writes.push({phase:report.phase,action,course,success:result.success});save();expect(result.success).toBe(true);
  const fresh=await refreshed;expect(fresh.qaResponseError).toBeUndefined();await expect(root).toHaveAttribute('data-easystud-sm-ready','1');await settle(root);return result;
 };
 const choose=async label=>{
  const choice=dialog.locator('.easyedu-searchable-choice');
  // Native modal setup can select its first valid option and advance the path
  // before the user changes that choice. Verify the actually current cue.
  const next=checklist.locator('[data-easyedu-guide-step-id].is-active');
  const id=await next.getAttribute('data-easyedu-guide-step-id');
  await highlight(id?.startsWith('confirm-')?dialog.locator('[data-easystud-confirm-move]'):choice);
  await choice.locator('.easyedu-searchable-choice__trigger').click();await choice.locator('input[type="search"]').fill(label);
  await choice.locator('.easyedu-searchable-choice__option:visible').filter({hasText:label}).first().click();await settle(root);
 };
 const confirm=async(action,id,path)=>{
  const button=dialog.locator('[data-easystud-confirm-move]');await highlight(button);await expect(checklist.locator('[data-easyedu-guide-step-id="'+id+'"]')).not.toHaveClass(/is-complete/);
  await write(action,()=>button.click());await expect(dialog).toBeHidden();await mark(id,path);
 };
 const complete=async(path,number)=>{
  await expect(checklist).toHaveClass(/is-complete/);const message=checklist.locator('[data-easyedu-guide-checklist-message]');await expect(message).toHaveClass(/is-complete/);await expect(message).toBeVisible();
  await settle(guide);await page.screenshot({path:info.outputPath('path'+number+'-complete.png')});report.paths.push({number,path,complete:true,message:await message.innerText()});save();
 };
 const reload=async()=>{await page.goto(url.href,{waitUntil:'domcontentloaded'});await ready();await init();};
 const run=async(number,perform)=>{if(![3,7].includes(number))return;try{await perform();}catch(error){report.failures.push({number,phase:report.phase,error:error.message});save();await page.screenshot({path:info.outputPath('path'+number+'-failure.png')}).catch(()=>{});}finally{await reload();}};
 try{
  await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
  if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(url.href,{waitUntil:'domcontentloaded'});}
  await ready();await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);await init();
  report.contract=await guide.evaluate(n=>({slides:n.easyeduGuideConfig.slideIds,paths:Object.fromEntries(Object.entries(n.easyeduGuideConfig.paths).map(([name,steps])=>[name,steps.map(s=>s.id)]))}));save();
  await run(11,async()=>{
   const path='prepare-activity-grouping';await start(path,11);
   const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').first(),toggle=grouping.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
   await highlight(toggle);if(await toggle.getAttribute('aria-expanded')==='true')await toggle.click();await toggle.click();await mark('open-grouping',path);await settle(root);
   const selector=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible > .local-groupimport-easystud-selector').first();await highlight(selector);await selector.click();await mark('select-groups',path);await expect(dialog).toBeVisible();
   await choose('QA Activity Destination');await mark('choose-grouping',path);await confirm('movegroup','confirm-groups',path);await mark('verify-grouping',path);await complete(path,11);
   report.activityContext=await guide.evaluate(async n=>{const G=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));return G.getPathContext(n,'prepare-activity-grouping');});save();
  });

  for(const type of ['group','grouping']) await run(type,async()=>{
   const path='inspect-'+type+'-settings';await start(path,type);
   const entry=root.locator(type==='group'?'[data-easystud-structure-groups] [data-easystud-open-advanced-settings]:visible, [data-easystud-context-action="group-open-advanced-settings"]:visible':'[data-easystud-tree] [data-easystud-open-advanced-settings][data-easystud-advanced-target="grouping"]:visible, [data-easystud-context-action="grouping-open-advanced-settings"]:visible').first();
   await highlight(entry);await entry.click();await mark('open-editor',path);
   const editor=root.locator('[data-easystud-editor-context="'+type+'"]');
   const name=editor.locator('input[name="name"]'),description=editor.locator('textarea[name="description"]');
   await highlight(name);await name.click();await mark('inspect-name',path);
   await highlight(description);await description.click();await mark('inspect-description',path);
   const cancel=editor.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]');await highlight(cancel);await cancel.click();await mark('cancel-editor',path);await complete(path,type);
  });
  await run('filters',async()=>{
   const path='verify-with-filters';await start(path,'filters');
   const toggle=root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible');await highlight(toggle);await toggle.click();await mark('open-filters',path);
   const search=root.locator('[data-easystud-search]:visible');await highlight(search);await search.fill('QA Guided');await mark('apply-filter',path);
   const select=root.locator('[data-easystud-guide-result-scope="participants"] [data-easystud-select-results]:visible');await highlight(select);await select.click();await mark('select-results',path);
   const clear=root.locator('[data-easystud-clear-all-selection]:visible, [data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();await highlight(clear);await clear.click();await mark('clear-selection',path);await complete(path,'filters');
  });
  await run(3,async()=>{
   const path='practice-membership';await start(path,3);
   const name='QA Native Practice '+course,field=root.locator('input[name="groupname"]:visible');await highlight(field);await field.fill(name);await write('creategroup',()=>field.press('Enter'));await mark('create-group',path);
   const participants=root.locator(width<768?'[data-easystud-mobile-view="participants"]:visible':'[data-easystud-layout-mode="participants"]:visible');await highlight(participants);await participants.click();await mark('open-participants',path);await settle(root);
   const selector=participant().locator(':scope > .local-groupimport-easystud-selector');await highlight(selector);await selector.click();await mark('select-participant',path);
   const move=root.locator('[data-easystud-move-selected-participants]:visible, [data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]:visible').first();await highlight(move);await move.click();await mark('open-move',path);await expect(dialog).toBeVisible();
   await choose(name);await mark('choose-destination',path);await confirm('addusers','confirm-move',path);await complete(path,3);
   report.practice={name};
  });
  await run(7,async()=>{
   const path='reorganise-source-members';await start(path,7);
   const member=root.locator('[data-easystud-structure-groups] [data-easystud-member-id]:visible').first(),selector=member.locator('.local-groupimport-easystud-selector');
   await highlight(selector);const source=await member.evaluate(n=>({userId:n.dataset.easystudMemberId,groupId:n.closest('[data-easystud-group-id]').dataset.easystudGroupId}));
   await selector.click();await mark('select-source-member',path);
   const move=root.locator('[data-easystud-move-selected-members]:visible, [data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]:visible').first();await highlight(move);await move.click();await mark('open-member-move',path);await expect(dialog).toBeVisible();
   const destination=await dialog.locator('[data-easystud-move-destination] option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,label:n.textContent.trim()})).find(n=>/^\d+$/.test(n.value)));
   expect(destination).toBeTruthy();await choose(destination.label);await mark('choose-member-destination',path);await confirm('movemembers','confirm-member-move',path);await complete(path,7);
   report.memberTransfer={...source,destinationId:destination.value};save();
  });
  await run(10,async()=>{
   const path='try-actions';await start(path,10);await view('participants');
   const card=participant();await expect(card).toBeVisible();await highlight(card);
   // Current Kevin choice b: teach native dragstart, then abandon over a
   // neutral area; no drop receipt or membership write belongs to this step.
   report.drag=await card.evaluate(n=>{
    window.qaNativeDragEvents=[];
    window.qaNativeDragStarted=new Promise(resolve=>document.addEventListener('dragstart',event=>{
     if(event.target.closest('[data-easystud-user]')===n){window.qaNativeDragStartAt=performance.now();resolve(true);}
    },{capture:true,once:true}));
    for(const name of ['dragstart','dragend','drop'])document.addEventListener(name,e=>window.qaNativeDragEvents.push({name,target:e.target.tagName,user:!!e.target.closest('[data-easystud-user]'),isExpectedCard:e.target.closest('[data-easystud-user]')===n,isTrusted:e.isTrusted,at:performance.now(),prevented:e.defaultPrevented}),true);
    window.qaGuideDragendSamples=[];window.qaGuideDragendPromises={};window.qaExpectedCard=n;
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const state=node=>{if(!node)return {present:false};const s=getComputedStyle(node),r=rect(node);return {
     present:true,hidden:node.hidden,classes:node.className,display:s.display,visibility:s.visibility,opacity:s.opacity,
     rect:r,painted:!node.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0};};
    const delta=(a,b)=>Math.max(...['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])));
    window.qaGuideHeldSample=(at,delay)=>{
     const highlight=document.querySelector('[data-easyedu-guide-highlight]'),guide=document.querySelector('.easyedu-guide--discovery[data-easyedu-guide-root]');
     const selector=n.querySelector(':scope > .local-groupimport-easystud-selector'),other=[...n.parentElement.querySelectorAll('[data-easystud-user]')].find(card=>card!==n),neighbor=other?.querySelector(':scope > .local-groupimport-easystud-selector');
     const h=state(highlight),current=guide?.easyeduGuideCurrentTarget,active=guide?.querySelector('[data-easyedu-guide-step-id].is-active');
     return {requestedMs:delay,elapsedMs:performance.now()-at,highlight:h,target:state(current),
      expectedCard:state(n),expectedSelector:state(selector),neighborSelector:state(neighbor),
      selectorDelta:h.present?delta(h.rect,rect(selector)):null,cardDelta:h.present?delta(h.rect,rect(n)):null,
      neighborSelectorDelta:h.present&&neighbor?delta(h.rect,rect(neighbor)):null,
      targetIsExpectedSelector:current===selector,targetIsExpectedCard:current===n,
      activeStep:active?.dataset.easyeduGuideStepId,dragging:document.querySelector('#local-groupimport-easystud').classList.contains('is-dragging-participants')};
    };
    document.addEventListener('dragend',event=>{
     if(event.target.closest('[data-easystud-user]')!==n)return;
     const at=performance.now();window.qaGuideDragendAt=at;
     for(const delay of [1000,5000])window.qaGuideDragendPromises[delay]=new Promise(resolve=>setTimeout(()=>{
      const sample=window.qaGuideHeldSample(at,delay);window.qaGuideDragendSamples.push(sample);resolve(sample);
     },delay));
    },true);
    return {draggable:n.draggable,coarse:matchMedia('(hover: none), (pointer: coarse), (max-width: 1024px)').matches};
   });save();expect(report.drag.draggable).toBe(true);expect(report.drag.coarse).toBe(width<1025);
   // Use the actual avatar rail instead of a translated, selectable text line.
   // The destination is the native panel title, not a group drop surface.
   const neutral=root.locator('h3.local-groupimport-easystud__panel-title').first();
   const avatarRail=card.locator('.local-groupimport-easystud-user__avatar');await avatarRail.hover();
   const avatar=await avatarRail.boundingBox(),destination=await neutral.boundingBox();
   expect(avatar).toBeTruthy();expect(destination).toBeTruthy();
   const x=avatar.x+avatar.width/2,y=avatar.y+avatar.height/2;
   report.drag.startPoint=await card.evaluate((node,{x,y})=>{const hit=document.elementFromPoint(x,y);return {x,y,hitTag:hit?.tagName,hitClasses:hit?.className,hitIsCard:node.contains(hit),draggable:node.draggable};},{x,y});save();
   expect(report.drag.startPoint.hitIsCard).toBe(true);expect(report.drag.startPoint.draggable).toBe(true);
   await page.mouse.move(x,y);await page.mouse.down();
   // Travel to the neutral title before awaiting dragstart; moving24px inside
   // the avatar did not initiate Chromium's native drag in the predecessor.
   await page.mouse.move(destination.x+destination.width/2,destination.y+destination.height/2,{steps:5});
   await page.mouse.move(destination.x+destination.width/2+1,destination.y+destination.height/2,{steps:2});
   await page.evaluate(()=>Promise.race([window.qaNativeDragStarted,new Promise((_,reject)=>setTimeout(()=>reject(Error('Native dragstart missing')),5000))]));
   // Deliberate held native gesture exposes the neighbour-cue race (>600ms).
   await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,750)));
   await page.mouse.up();
   report.drag.events=await page.evaluate(()=>window.qaNativeDragEvents);save();
   expect(report.drag.events.some(e=>e.name==='dragstart'&&e.user)).toBe(true);
   expect(report.drag.events.some(e=>e.name==='dragend'&&e.user)).toBe(true);
   report.drag.heldMs=await page.evaluate(()=>window.qaGuideDragendAt-window.qaNativeDragStartAt);save();expect(report.drag.heldMs).toBeGreaterThan(600);
   expect(report.drag.events.filter(e=>e.name==='dragstart'||e.name==='dragend').every(e=>e.isExpectedCard&&e.isTrusted)).toBe(true);
   report.dragendSamples=[];
   for(const delay of [1000,5000]){
    const sample=await page.evaluate(delay=>window.qaGuideDragendPromises[delay],delay);report.dragendSamples.push(sample);save();
    await page.screenshot({path:info.outputPath('path10-highlight-'+delay+'ms.png')});
   }
   for(const sample of report.dragendSamples){
    expect(sample.highlight.hidden).toBe(false);expect(sample.highlight.display).not.toBe('none');expect(sample.highlight.painted).toBe(true);
    expect(sample.highlight.rect.width).toBeGreaterThan(0);expect(sample.highlight.rect.height).toBeGreaterThan(0);
    expect(sample.activeStep).toBe('try-selection');expect(sample.dragging).toBe(false);
    expect(sample.selectorDelta).toBeLessThanOrEqual(2);expect(sample.neighborSelectorDelta).toBeGreaterThan(2);
   }
   await mark('try-drag',path);await settle(root);
   await expect(root).not.toHaveClass(/is-dragging-participants/);
   const selector=participant().locator(':scope > .local-groupimport-easystud-selector');await highlight(selector);
   await selector.evaluate(n=>document.addEventListener('click',event=>{
    if(n.contains(event.target)){
     const at=performance.now();window.qaGuideSelectionFrames=[];
     window.qaGuideSelectionPromise=new Promise(resolve=>{
      let ended=false;const finish=sample=>{if(ended)return;ended=true;resolve(sample);};
      const deadline=setTimeout(()=>finish({...window.qaGuideHeldSample(at,1500),timedOut:true}),1500);
      const frame=()=>{
       if(ended)return;const sample=window.qaGuideHeldSample(at,1500);if(innerWidth<768){const b=n.closest('[data-easystud-user]').querySelector('[data-easystud-card-menu]')?.getBoundingClientRect(),h=document.querySelector('[data-easyedu-guide-highlight]')?.getBoundingClientRect();sample.cardDelta=b&&h?Math.max(Math.abs(b.x-h.x),Math.abs(b.y-h.y),Math.abs(b.width-h.width),Math.abs(b.height-h.height)):Infinity;sample.compactTarget='card-menu';}window.qaGuideSelectionFrames.push(sample);
       if(sample.highlight.painted&&sample.cardDelta<=2&&sample.activeStep==='try-context'){
        clearTimeout(deadline);finish({...sample,firstPaintLatencyMs:sample.elapsedMs,timedOut:false});return;
       }
       requestAnimationFrame(frame);
      };requestAnimationFrame(frame);
     });
    }
   },{capture:true,once:true}));
   await selector.click();report.afterSelection=await page.evaluate(()=>window.qaGuideSelectionPromise);
   report.selectionFrames=await page.evaluate(()=>window.qaGuideSelectionFrames);save();
   await page.screenshot({path:info.outputPath('path10-selection-first-paint.png')});
   expect(report.afterSelection.timedOut).toBe(false);expect(report.afterSelection.firstPaintLatencyMs).toBeLessThanOrEqual(1500);
   expect(report.afterSelection.highlight.painted).toBe(true);expect(report.afterSelection.cardDelta).toBeLessThanOrEqual(2);
   expect(report.afterSelection.activeStep).toBe('try-context');await mark('try-selection',path);
   if(width<768){const menu=participant().locator('[data-easystud-card-menu]:visible');await highlight(menu);await menu.click();}else{await highlight(participant());await participant().click({button:'right'});}await expect(root.locator('[data-easystud-context-menu]')).toBeVisible();
   await mark('try-context',path);await page.keyboard.press('Escape');await expect(root.locator('[data-easystud-context-menu]')).toBeHidden();await complete(path,10);
  });
  expect(report.failures).toEqual([]);expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);expect(report.blockedWrites).toBe(0);expect(report.paths).toHaveLength(2);
 }finally{
  await guide.evaluate(async(n,key)=>{const G=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));G.destroy(n);
   Object.keys(localStorage).filter(k=>k===key||k.startsWith(key+'.')).forEach(k=>localStorage.removeItem(k));
   if(n.qaOriginalGuideConfig)G.init(n,n.qaOriginalGuideConfig);},key).catch(()=>{});save();
 }
});

