// Bounded follow-up: restore complete-view precondition; open empty groupings;
// measure every hover target and perform the supported participant gesture.
const {test,expect}=require('@playwright/test');
const {login,ready,settle,view}=require('./k16-sort-copy-helper.cjs');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const evidence='C:/dev/Moodle 51 Perf/moodle/local/recette-soir-20261016';
test('Evening focused successor2 targets and supported drag FR EN four widths',async({page},info)=>{
 test.setTimeout(1700000);
 const manifestPath=path.resolve(info.outputDir,'..','..','fixture-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));
 const report={source:'caa43774',fixture:manifest,checks:[],pageErrors:[],consoleErrors:[],blockedWrites:[]};
 const save=()=>fs.writeFileSync(info.outputPath('recette-soir-followup.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.pageErrors.push(e.message);save();});
 page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push(m.text());save();}});
 const php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe';
 const proof=(action,index=0)=>JSON.parse(cp.execFileSync(php,[path.join(__dirname,'recette-soir-proof.php'),
  '--moodle-root','C:/dev/Moodle 51 Perf/moodle','--manifest',manifestPath,'--action',action,'--user-index',String(index)],{encoding:'utf8'}));
 const url=await login(page);expect(manifest.groupIds.length).toBeGreaterThanOrEqual(150);
 await page.route('**/local/groupimport/ajax.php*',r=>{const p=new URLSearchParams(r.request().postData()||'');
  if(p.get('action')==='addusers'&&p.get('courseid')===String(manifest.courseId))return r.continue();
  report.blockedWrites.push(p.get('action'));save();return r.abort();});
 const geo=loc=>loc.evaluate(n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n),m=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform);
  const center={x:b.x+b.width/2,y:b.y+b.height/2};const hit=document.elementFromPoint(center.x,center.y);
  return {x:b.x,y:b.y,documentY:b.y+scrollY,width:b.width,height:b.height,translateY:m.m42,translateX:m.m41,
   background:s.backgroundColor,image:s.backgroundImage,shadow:s.boxShadow,hover:n.matches(':hover'),focusWithin:n.matches(':focus-within'),
   radius:parseFloat(s.borderTopLeftRadius),overflow:n.scrollWidth-n.clientWidth,hit:hit?.tagName,
   centerInside:!!hit&&(hit===n||n.contains(hit)),label:n.getAttribute('aria-label'),class:n.className};});
 let lang,width,root;
 const load=async()=>{root=await ready(page,url,lang,width);page.setDefaultTimeout(10000);};
 const list=kind=>root.locator(kind==='participants'?'[data-easystud-participant-list]:visible':kind==='groups'?
  '.local-groupimport-easystud-structure-groups__list:visible, .local-groupimport-easystud-participant-groups__list:visible':
  '[data-easystud-tree] .local-groupimport-easystud-tree__groupings:visible').first();
 const card=kind=>list(kind).locator(kind==='participants'?':scope > [data-easystud-user]:visible':
  `:scope > [data-easystud-${kind==='groups'?'group':'grouping'}-id]:visible`).first();
 const groups=async()=>{await view(root,'groups');const mode=root.locator('[data-easystud-layout-mode="structure"]:visible');if(await mode.count())await mode.click();
  await settle(root);const search=root.locator('[data-easystud-structure-group-search]:visible, [data-easystud-catalog-search="participants"]:visible').first();
  if(await search.count()){await search.fill('QA Audit');await expect(list('groups').locator(':scope > [data-easystud-group-id]:visible')).toHaveCount(4,{timeout:15000});}
  else{const first=list('groups').locator('[data-easystud-pagination="top"] [data-easystud-page-first]');if(await first.isVisible()&&!await first.isDisabled())await first.click();
   for(const id of manifest.groupIds.slice(0,4))await expect(root.locator(`[data-easystud-group-id="${id}"]:visible`).first()).toBeVisible();}
  await settle(root);};
 const capture=async row=>{const file=path.join(evidence,'capture-index.json');const index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
  if(index.length>=6||index.some(x=>x.lot===row.lot))return;const name=`failure-${index.length+1}-${row.lot}-${lang}-${width}.png`;
  row.capture=info.outputPath(name);await page.screenshot({path:row.capture});index.push({lot:row.lot,path:row.capture});fs.writeFileSync(file,JSON.stringify(index,null,2));};
 const check=async(lot,point,fn)=>{const row={lot,point,lang,width,status:'RUNNING'};report.checks.push(row);save();
  if(lang==='fr'&&width>=1280&&lot!=='K16-69'){report.checks.pop();save();return;} // All other focused desktop points already measured; retain genuine failures.
  try{await fn(row);row.status=row.notApplicable?'N/A':'PASS';}catch(e){row.status='FAIL';row.error=e.message;
   await capture(row).catch(e=>{row.captureError=e.message;});await page.keyboard.press('Escape').catch(()=>{});}save();};
 for(lang of ['fr','en'])for(width of [1600,1280,768,390]){
  proof('reset-cards');await load();
  await check('K16-69','columns, action menus and complete-view round trip',async row=>{
   row.measure={completeViewEnabled:true,priorSetting:manifest.showCompleteBefore,samples:[]};
   const responsive=await root.evaluate(n=>n.classList.contains('local-groupimport-easystud--responsive-workspace'));
   row.measure.initialCounts=await root.evaluate(n=>{window.__eveningNodes69=[...n.querySelectorAll('[data-easystud-column-action]')];
    return window.__eveningNodes69.reduce((a,b)=>{const key=b.getAttribute('data-easystud-column-action');a[key]=(a[key]||0)+1;return a;},{});});
   for(const mode of (responsive?['participants','groups','groupings']:['both','participants','structure','both'])){
    if(responsive)await view(root,mode);else{await root.locator(`[data-easystud-layout-mode="${mode}"]:visible`).click();await settle(root);}
    const state=await root.evaluate(n=>{const nodes=[...n.querySelectorAll('[data-easystud-column-action]')];return {
     sameNodes:window.__eveningNodes69.length===nodes.length&&window.__eveningNodes69.every(x=>nodes.includes(x)),
     actions:nodes.map(b=>{const slot=b.closest('[data-easystud-column-actions]'),heading=slot?.closest('.local-groupimport-easystud-column-heading');
      return {column:b.getAttribute('data-easystud-column-action'),slot:slot?.getAttribute('data-easystud-column-actions')||null,
       title:heading?.querySelector('h3')?.textContent.trim()||'',counts:[...(heading?.querySelectorAll('.local-groupimport-easystud__panel-badge')||[])].map(x=>x.textContent.trim())};})};});
    row.measure.samples.push({mode,...state});save();
    const counts=state.actions.reduce((a,b)=>{a[b.column]=(a[b.column]||0)+1;return a;},{});expect(counts).toEqual(row.measure.initialCounts);
    for(const a of state.actions){const focused=!responsive&&((mode==='participants'&&['participants','participant-groups'].includes(a.column))||
     (mode==='structure'&&['structure-groups','structure-groupings'].includes(a.column)));expect(a.slot).toBe(focused?a.column:null);
     if(focused)expect(a.title).toMatch(a.column==='participants'?/Participants/i:a.column==='structure-groupings'?/Groupements|Groupings/:/Groupes|Groups/);}
    const toggles=root.locator('[data-easystud-panel-actions-toggle]:visible');
    for(let i=0;i<await toggles.count();i++){const t=toggles.nth(i);await t.click();await expect(t).toHaveAttribute('aria-expanded','true');
     await expect(t.locator('..').locator('[data-easystud-panel-actions-menu]')).toBeVisible();await t.click();}
   }
  });
  await check('SEARCH','group catalogue search visibility',async row=>{
   await groups();
   const inspect=()=>root.locator('[data-easystud-structure-group-search], [data-easystud-catalog-search="participants"]').evaluateAll(ns=>ns.map(n=>{
    const b=n.getBoundingClientRect();let hidden=null;for(let p=n;p;p=p.parentElement){if(getComputedStyle(p).display==='none'){hidden=p.className;break;}}
    return {field:n.getAttribute('data-easystud-structure-group-search')?'structure':'participants',width:b.width,height:b.height,
     visible:b.width>0&&b.height>0&&getComputedStyle(n).visibility!=='hidden',hiddenAncestor:hidden};}));
   row.measure={before:await inspect()};save();
   const more=root.getByRole('button',{name:lang==='fr'?'Plus de filtres':'More filters',exact:true}).first();
   if(width<=768&&await more.isVisible()){
    await more.click();await settle(root);row.measure.withFiltersOpen=await inspect();save();
    const less=root.getByRole('button',{name:lang==='fr'?'Moins de filtres':'Fewer filters',exact:true}).first();if(await less.isVisible())await less.click();
   }
   expect([...row.measure.before,...(row.measure.withFiltersOpen||[])].some(m=>m.visible)).toBe(true);
  });
  await groups();
  await check('K16-73','empty group and grouping slots',async row=>{
   row.measure={};const emptyGroup=root.locator(`[data-easystud-group-id="${manifest.groupIds[2]}"]:visible`).first().locator('.easyedu-entity-card-empty--group');
   await expect(emptyGroup).toBeVisible();row.measure.group=await geo(emptyGroup);save();
   await view(root,'groupings');const emptyGrouping=root.locator(`[data-easystud-grouping-id="${manifest.groupingIds[1]}"]:visible`).first();
   const toggle=emptyGrouping.locator('.local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
   if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await settle(emptyGrouping);
   const slot=emptyGrouping.locator('.easyedu-entity-card-empty--grouping');await expect(slot).toBeVisible();row.measure.grouping=await geo(slot);save();
   expect(await slot.evaluate(n=>getComputedStyle(n).borderTopStyle)).toBe('dashed');
   expect(row.measure.group.overflow).toBeLessThanOrEqual(1);expect(row.measure.grouping.overflow).toBeLessThanOrEqual(1);
  });
  await check('K16-74','flat card and zero lift on hover',async row=>{
   row.measure=[];
   for(const kind of ['groups','participants','groupings']){
    if(kind==='groups')await groups();else await view(root,kind);const target=card(kind);await target.scrollIntoViewIfNeeded();await page.mouse.click(1,1);await settle(target);
    const before=await geo(target);await target.hover();await settle(target);const hover=await geo(target);row.measure.push({kind,before,hover});save();
   }
   for(const sample of row.measure){expect(Math.abs(sample.hover.translateY-sample.before.translateY),sample.kind+' hover transform delta').toBeLessThanOrEqual(.5);
    expect(Math.abs(sample.hover.documentY-sample.before.documentY),sample.kind+' document position').toBeLessThanOrEqual(.5);
    expect(sample.hover.image,sample.kind+' surface').toBe('none');}
  });
  await groups();
  await check('K16-55','header icon hover disc',async row=>{
   row.measure=[];const target=root.locator(`[data-easystud-group-id="${manifest.groupIds[0]}"]:visible`).first();
   const buttons=target.locator('.local-groupimport-easystud-group__header button.btn-link.p-0:visible, :scope > [data-easystud-card-menu]:visible');
   expect(await buttons.count()).toBeGreaterThan(0);
   for(let i=0;i<await buttons.count();i++){await page.mouse.move(1,1);await buttons.nth(i).hover();await settle(target);row.measure.push(await geo(buttons.nth(i)));save();}
   for(const sample of row.measure){expect(sample.hover).toBe(true);expect(sample.image,sample.label||sample.class).toContain('radial-gradient');
    expect([...sample.image.matchAll(/([\d.]+)px/g)].some(m=>Math.abs(Number(m[1])-12)<=.25)).toBe(true);}
  });
  await check('DRAG','supported participant transfer to empty group',async row=>{
   row.measure={};await load();await view(root,'participants');const targetUser=card('participants');
   const userid=Number(await targetUser.getAttribute('data-selectable-id')),index=manifest.userIds.indexOf(userid);expect(index).toBeGreaterThanOrEqual(0);
   row.measure.before=proof('snapshot',index);
   if(width>768){
    const search=root.locator('[data-easystud-catalog-search="participants"]:visible');await search.fill('QA Audit');await settle(root);
    const destination=root.locator(`[data-easystud-group-id="${manifest.groupIds[2]}"]:visible`).first();
    await page.evaluate(()=>{window.__eveningDragEvents=[];window.__eveningDragController?.abort();window.__eveningDragController=new AbortController();
     for(const type of ['dragstart','dragover','drop','dragend'])document.addEventListener(type,e=>{
      if(type==='dragover'&&window.__eveningDragEvents.filter(x=>x.type==='dragover').length>=4)return;
      window.__eveningDragEvents.push({type,x:e.clientX,y:e.clientY,source:e.target.closest('[data-easystud-user]')?.getAttribute('data-selectable-id'),
       group:e.target.closest('[data-easystud-group-id]')?.getAttribute('data-easystud-group-id'),types:[...(e.dataTransfer?.types||[])]});
     },{capture:true,signal:window.__eveningDragController.signal});});
    await targetUser.scrollIntoViewIfNeeded();const from=await targetUser.boundingBox(),to=await destination.boundingBox();row.measure.rectangles={from,to};save();
    const x=from.x+from.width*.55,y=from.y+from.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+12,y+2,{steps:6});
    await page.waitForTimeout(650);await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:24});await page.mouse.up();
    row.measure.events=await page.evaluate(()=>window.__eveningDragEvents);save();
   }else{
    row.measure.compactAlternative='Add to group (native drag intentionally suppressed)';
    await targetUser.locator('[data-easystud-card-menu]:visible').first().click();
    await root.locator('[data-easystud-context-menu]:visible').getByRole('menuitem',{name:lang==='fr'?'Ajouter à un groupe':'Add to group',exact:true}).click();
    const modal=root.locator('[data-easystud-move-modal]');await expect(modal).toBeVisible();await settle(modal);
    const chooser=modal.locator('.easyedu-searchable-choice');await chooser.locator('.easyedu-searchable-choice__trigger').click();await settle(chooser);
    await chooser.locator('input[type="search"]').fill('QA Audit Empty Gamma');const option=chooser.locator('.easyedu-searchable-choice__option:visible').filter({hasText:'QA Audit Empty Gamma'});
    await expect(option).toHaveCount(1);await option.focus();await option.press('Enter');await modal.locator('[data-easystud-confirm-move]').click();await expect(modal).toBeHidden();
   }
   await expect.poll(()=>proof('snapshot',index).rows.some(r=>Number(r.groupid)===manifest.groupIds[2]),{timeout:15000}).toBe(true);
   row.measure.after=proof('snapshot',index);save();expect(row.measure.after.rows.some(r=>Number(r.groupid)===manifest.groupIds[0])).toBe(true);
  });
  await check('K16-14','fresh copy and unchecked on immediate reopening',async row=>{
   row.measure={before:proof('snapshot')};await groups();
   const clear=root.locator('[data-easystud-clear-all-selection]:visible, [data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();if(await clear.isVisible())await clear.click();
   const source=root.locator(`[data-easystud-group-id="${manifest.groupIds[0]}"]:visible`).first();
   const expand=source.locator('[data-easystud-group-members-toggle]');
   if(await expand.isVisible()&&await expand.getAttribute('aria-expanded')!=='true'){await expand.click();await settle(source);}
   const member=()=>source.locator(`[data-easystud-member-id="${manifest.userIds[0]}"] > .local-groupimport-easystud-selector`);
   const open=async()=>{await member().click();await root.locator('[data-easystud-move-selected-members]:visible, '+
    '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]:visible').first().click();
    const modal=root.locator('[data-easystud-move-modal]');await expect(modal).toBeVisible();await settle(modal);return modal;};
   const modal=await open(),checkbox=modal.locator('[data-easystud-move-remove-origin]');await expect(checkbox).not.toBeChecked();
   const chooser=modal.locator('.easyedu-searchable-choice');await chooser.locator('.easyedu-searchable-choice__trigger').click();await settle(chooser);
   await chooser.locator('input[type="search"]').fill('QA Audit Destination Beta');const option=chooser.locator('.easyedu-searchable-choice__option:visible').filter({hasText:'QA Audit Destination Beta'});
   await expect(option).toHaveCount(1);await option.focus();await option.press('Enter');await modal.locator('[data-easystud-move-origin-wrap]').click();
   await expect(checkbox).toBeChecked();const reply=page.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&new URLSearchParams(r.request().postData()).get('action')==='addusers');
   await modal.locator('[data-easystud-confirm-move]').click();row.measure.response=await (await reply).json();save();
   expect(row.measure.response.success).toBe(true);expect(row.measure.response.added).toBe(1);expect(row.measure.response.existing).toBe(0);
   await expect(modal).toBeHidden();row.measure.after=proof('snapshot');save();
   const expected=[...new Set([...row.measure.before.rows.map(r=>Number(r.groupid)),manifest.groupIds[1]])].sort((a,b)=>a-b);
   expect(row.measure.after.rows.map(r=>Number(r.groupid)).sort((a,b)=>a-b)).toEqual(expected);
   const reopened=await open();await expect(reopened.locator('[data-easystud-move-remove-origin]')).not.toBeChecked();
   await reopened.locator('[data-easystud-close-move-modal]:visible').last().click();await expect(reopened).toBeHidden();
   expect(proof('snapshot').rows).toEqual(row.measure.after.rows);row.measure.immediateReopenUnchecked=true;save();
  });
  await check('GLOBAL','follow-up console and horizontal containment',async row=>{
   row.measure=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,scrollX}));
   expect(row.measure.scroll-row.measure.width).toBeLessThanOrEqual(1);expect(row.measure.scrollX).toBe(0);
   expect(report.pageErrors).toEqual([]);expect(report.consoleErrors).toEqual([]);expect(report.blockedWrites).toEqual([]);
  });
 }
 report.completed=true;save();
});
