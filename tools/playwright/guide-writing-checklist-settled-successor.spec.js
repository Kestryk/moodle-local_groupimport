// Actual Moodle writes on the wrapper's disposable8051 course only. No mocked
// receipts, seeded completion, synthetic Guide events or hidden-control forcing.
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const settle=n=>n.evaluate(async root=>{await document.fonts.ready;await Promise.all(root.getAnimations({subtree:true})
 .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
const field=(request,name)=>{
 const body=request.postData()||'';
 if((request.headers()['content-type']||'').includes('multipart/form-data')){
  const match=body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]+)'));return match?.[1]||'';
 }return new URLSearchParams(body).get(name)||'';
};
test('Guide settled writing paths3 7 10 11 checklist native8051',async({page},info)=>{
 test.setTimeout(600000);page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 const course=Number(url.searchParams.get('id'));
 if(url.hostname!=='localhost'||url.port!=='8051'||!course||course===5)throw Error('Disposable fixture manager URL required');
 const key='codex2-guide-writing-'+course,report={course,language:'fr',width:1280,phase:'auth',paths:[],steps:[],writes:[],errors:[],blocked:[],failures:[]};
 const save=()=>fs.writeFileSync(info.outputPath('guide-writing.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 const allowed=new Set(['creategroup','addusers','movemembers','movegroup','addgroups']);
 await page.route('**/local/groupimport/**',route=>{
  const request=route.request();if(request.method()==='GET')return route.continue();
  const path=new URL(request.url()).pathname,action=field(request,'action'),id=Number(field(request,'courseid'));
  if(path.endsWith('/ajax.php')&&id===course&&allowed.has(action))return route.continue();
  report.blocked.push({path,action,course:id});save();return route.abort('blockedbyclient');
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  const calls=route.request().postDataJSON()||[],mutation=calls.filter(c=>(c.methodname||'').startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname));
  if(mutation.length){report.blocked.push(mutation.map(c=>c.methodname));save();return route.abort('blockedbyclient');}return route.continue();
 });
 const root=page.locator('#local-groupimport-easystud'),guide=page.locator('.easyedu-guide--discovery[data-easyedu-guide-root]');
 const checklist=guide.locator('[data-easyedu-guide-checklist]'),dialog=root.locator('[data-easystud-move-modal]');
 const ready=async()=>{await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);};
 const init=async()=>{
  await guide.evaluate(async(n,key)=>{const G=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
   n.qaOriginalGuideConfig=n.easyeduGuideConfig;G.destroy(n);G.init(n,{...n.qaOriginalGuideConfig,firstVisit:false,welcomeOffer:false,storageKey:key});},key);
 };
 const clear=async()=>{const button=root.locator('[data-easystud-clear-all-selection]:visible').first();if(await button.count())await button.click();await settle(root);};
 const view=async mode=>{await root.locator('[data-easystud-layout-mode="'+mode+'"]:visible').click();await settle(root);};
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
  await expect(page.locator('[data-easyedu-guide-highlight]')).toBeVisible();
  await expect.poll(async()=>target.evaluate(node=>{const h=document.querySelector('[data-easyedu-guide-highlight]');if(!h)return Infinity;
   const a=h.getBoundingClientRect(),b=node.getBoundingClientRect();return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height));}).catch(()=>Infinity),{timeout:15000}).toBeLessThan(2);
 };
 const start=async(path,number)=>{
  report.phase='path'+number;save();await clear();
  if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
  await page.locator('[data-easyedu-guide-open]:visible').first().click();
  const modal=guide.locator('[data-easyedu-guide-modal]');await expect(modal).toBeVisible();
  await modal.locator('[data-easyedu-guide-nav-item="'+(number-1)+'"]').click();
  await modal.locator('[data-easyedu-guide-start-path="'+path+'"]:visible').click();
  await expect(modal).toBeHidden();await expect(checklist).toBeVisible();await expect(checklist).toHaveAttribute('data-easyedu-guide-path',path);await settle(root);
 };
 const write=async(action,perform)=>{
  const refreshed=page.waitForResponse(r=>r.url().includes('/lib/ajax/service.php')&&(r.request().postData()||'').includes('local_groupimport_get_state'));
  const response=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/local/groupimport/ajax.php')&&field(r.request(),'action')===action);
  await perform();const result=await(await response).json();report.writes.push({phase:report.phase,action,course,success:result.success});save();expect(result.success).toBe(true);
  await(await refreshed).json();await expect(root).toHaveAttribute('data-easystud-sm-ready','1');await settle(root);return result;
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
 const run=async(number,perform)=>{try{await perform();}catch(error){report.failures.push({number,phase:report.phase,error:error.message});save();await page.screenshot({path:info.outputPath('path'+number+'-failure.png')}).catch(()=>{});}finally{await reload();}};
 try{
  await page.setViewportSize({width:1280,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
  if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(url.href,{waitUntil:'domcontentloaded'});}
  await ready();await expect(page.locator('html')).toHaveAttribute('lang',/^fr(?:-|$)/);await init();
  report.contract=await guide.evaluate(n=>({slides:n.easyeduGuideConfig.slideIds,paths:Object.fromEntries(Object.entries(n.easyeduGuideConfig.paths).map(([name,steps])=>[name,steps.map(s=>s.id)]))}));save();
  await run(3,async()=>{
   const path='practice-membership';await start(path,3);
   const name='QA Native Practice '+course,field=root.locator('input[name="groupname"]:visible');await highlight(field);await field.fill(name);await write('creategroup',()=>field.press('Enter'));await mark('create-group',path);
   const participants=root.locator('[data-easystud-layout-mode="participants"]:visible');await highlight(participants);await participants.click();await mark('open-participants',path);await settle(root);
   const selector=participant().locator(':scope > .local-groupimport-easystud-selector');await highlight(selector);await selector.click();await mark('select-participant',path);
   const move=root.locator('[data-easystud-move-selected-participants]:visible');await highlight(move);await move.click();await mark('open-move',path);await expect(dialog).toBeVisible();
   await choose(name);await mark('choose-destination',path);await confirm('addusers','confirm-move',path);await complete(path,3);
   report.practice={name};
  });
  await view('structure');const newGroup=group(report.practice?.name||'QA Native Practice '+course);if(await newGroup.count())report.practicePersisted={groupId:await newGroup.getAttribute('data-easystud-group-id')};save();
  await run(7,async()=>{
   const path='reorganise-source-members';await start(path,7);
   const member=root.locator('[data-easystud-structure-groups] [data-easystud-member-id]:visible').first(),selector=member.locator('.local-groupimport-easystud-selector');
   await highlight(selector);const source=await member.evaluate(n=>({userId:n.dataset.easystudMemberId,groupId:n.closest('[data-easystud-group-id]').dataset.easystudGroupId}));
   await selector.click();await mark('select-source-member',path);
   const move=root.locator('[data-easystud-move-selected-members]:visible');await highlight(move);await move.click();await mark('open-member-move',path);await expect(dialog).toBeVisible();
   const destination=await dialog.locator('[data-easystud-move-destination] option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,label:n.textContent.trim()})).find(n=>/^\d+$/.test(n.value)));
   expect(destination).toBeTruthy();await choose(destination.label);await mark('choose-member-destination',path);await confirm('movemembers','confirm-member-move',path);await complete(path,7);
   report.memberTransfer={...source,destinationId:destination.value};save();
  });
  await run(10,async()=>{
   const path='try-actions';await start(path,10);await view('participants');
   const card=participant(),target=group('QA Activity Gamma');await expect(card).toBeVisible();await expect(target).toBeVisible();await highlight(card);
   await write('addusers',()=>card.dragTo(target));await mark('try-drag',path);
   await view('participants');const selector=participant().locator(':scope > .local-groupimport-easystud-selector');await highlight(selector);await selector.click();await mark('try-selection',path);
   await highlight(participant());await participant().click({button:'right'});await expect(root.locator('[data-easystud-context-menu]')).toBeVisible();
   await mark('try-context',path);await root.locator('[data-easystud-context-close]').click();await complete(path,10);
  });
  await run(11,async()=>{
   const path='prepare-activity-grouping';await start(path,11);
   const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').first(),toggle=grouping.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
   await highlight(toggle);if(await toggle.getAttribute('aria-expanded')==='true')await toggle.click();await toggle.click();await mark('open-grouping',path);await settle(root);
   const selector=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible > .local-groupimport-easystud-selector').first();await highlight(selector);await selector.click();await mark('select-groups',path);await expect(dialog).toBeVisible();
   await choose('QA Activity Destination');await mark('choose-grouping',path);await confirm('movegroup','confirm-groups',path);await mark('verify-grouping',path);await complete(path,11);
   report.activityContext=await guide.evaluate(async n=>{const G=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));return G.getPathContext(n,'prepare-activity-grouping');});save();
  });
  expect(report.failures).toEqual([]);expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);expect(report.paths).toHaveLength(4);
 }finally{
  await guide.evaluate(async(n,key)=>{const G=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));G.destroy(n);
   Object.keys(localStorage).filter(k=>k===key||k.startsWith(key+'.')).forEach(k=>localStorage.removeItem(k));
   if(n.qaOriginalGuideConfig)G.init(n,n.qaOriginalGuideConfig);},key).catch(()=>{});save();
 }
});
