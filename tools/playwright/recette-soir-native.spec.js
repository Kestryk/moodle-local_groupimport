// Native receipt only: pinned product, disposable Perf course, no product/style injection.
const {test,expect}=require('@playwright/test');
const {login,ready,settle,view}=require('./k16-sort-copy-helper.cjs');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const evidence='C:/dev/Moodle 51 Perf/moodle/local/recette-soir-20261016';
const php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe';

test('Evening native receipt pinned caa43774 FR EN four widths',async({page},info)=>{
 test.setTimeout(1700000);page.setDefaultTimeout(12000);
 const manifestPath=path.resolve(info.outputDir,'..','..','fixture-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));
 const report={source:'caa43774',fixture:manifest,cells:[],checks:[],pageErrors:[],consoleErrors:[],blockedWrites:[]};
 const save=()=>fs.writeFileSync(info.outputPath('recette-soir.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.pageErrors.push({url:page.url(),message:e.message});save();});
 page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push({url:page.url(),message:m.text()});save();}});
 const proof=(action,edge=false,index=0)=>JSON.parse(cp.execFileSync(php,[path.join(__dirname,'recette-soir-proof.php'),
  '--moodle-root','C:/dev/Moodle 51 Perf/moodle','--manifest',manifestPath,'--action',action,
  '--existing',edge?'1':'0','--multi',edge?'1':'0','--user-index',String(index)],{encoding:'utf8'}));
 const url=await login(page);expect(manifest.groupIds.length).toBeGreaterThanOrEqual(150);
 await page.route('**/local/groupimport/ajax.php*',r=>{
  const p=new URLSearchParams(r.request().postData()||'');
  if(['addusers','movemembers'].includes(p.get('action'))&&p.get('courseid')===String(manifest.courseId))return r.continue();
  report.blockedWrites.push({url:r.request().url(),action:p.get('action')});save();return r.abort();
 });
 await page.route('**/lib/ajax/service.php*',r=>{
  const data=r.request().postDataJSON();
  if(Array.isArray(data)&&data.some(c=>/^local_groupimport_/.test(c.methodname)&&!/(?:get|list)_/.test(c.methodname))){
   report.blockedWrites.push({methods:data.map(c=>c.methodname)});save();return r.abort();
  }return r.continue();
 });
 const capture=async row=>{
  const file=path.join(evidence,'capture-index.json');
  const index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
  if(index.length>=6||index.some(x=>x.lot===row.lot))return;
  const name=`failure-${index.length+1}-${row.lot}-${row.lang}-${row.width}.png`;
  await page.screenshot({path:info.outputPath(name),timeout:15000});
  row.capture=info.outputPath(name);index.push({lot:row.lot,path:row.capture});fs.writeFileSync(file,JSON.stringify(index,null,2));
 };
 const recover=async()=>{
  await page.keyboard.press('Escape').catch(()=>{});
  for(const selector of ['[data-easyedu-guide-close]:visible','[data-easystud-context-close]:visible',
   '[data-easyedu-navigation-close]:visible','[data-easystud-close-move-modal]:visible']){
   const button=page.locator(selector).first();if(await button.isVisible())await button.click({timeout:2000}).catch(()=>{});
  }
 };
 let cell;
 const check=async(lot,point,fn)=>{
  const row={lang:cell.lang,width:cell.width,lot,point,status:'RUNNING'};report.checks.push(row);save();
  try{row.measure=await fn();row.status=row.measure?.notApplicable?'N/A':'PASS';}
  catch(e){row.status='FAIL';row.error=e.message;await capture(row).catch(error=>{row.captureError=error.message;});await recover();}
  save();return row;
 };
 const geometry=async locator=>locator.evaluate(n=>{
  const b=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:b.x,y:b.y,documentY:b.y+scrollY,width:b.width,height:b.height,
   radius:parseFloat(s.borderTopLeftRadius),background:s.backgroundColor,image:s.backgroundImage,
   shadow:s.boxShadow,transform:s.transform,display:s.display,overflow:n.scrollWidth-n.clientWidth};
 });
 const noOverflow=async()=>page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,
  body:document.body.scrollWidth,scrollX,excess:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth}));
 let root;
 const load=async()=>{root=await ready(page,url,cell.lang,cell.width);page.setDefaultTimeout(12000);return root;};
 const clear=async()=>{
  const button=root.locator('[data-easystud-clear-all-selection]:visible').first();
  if(await button.isVisible())await button.click();await settle(root);
 };
 const listFor=kind=>root.locator(kind==='participants'?'[data-easystud-participant-list]:visible':kind==='groups'?
  '.local-groupimport-easystud-structure-groups__list:visible, .local-groupimport-easystud-participant-groups__list:visible':
  '[data-easystud-tree] .local-groupimport-easystud-tree__groupings:visible').first();
 const cardFor=kind=>kind==='participants'?':scope > [data-easystud-user]:visible':
  `:scope > [data-easystud-${kind==='groups'?'group':'grouping'}-id]:visible`;
 const filteredGroups=async()=>{
  await view(root,'groups');const mode=root.locator('[data-easystud-layout-mode="structure"]:visible');
  if(await mode.count())await mode.click();await settle(root);
  const search=root.locator('[data-easystud-structure-group-search]:visible, [data-easystud-participant-group-search]:visible').first();
  await search.fill('QA Audit');await expect(listFor('groups').locator(cardFor('groups'))).toHaveCount(4,{timeout:15000});await settle(root);
 };
 const group=idx=>root.locator(`[data-easystud-group-id="${manifest.groupIds[idx]}"]:visible`).first();
 const expand=async card=>{const b=card.locator('[data-easystud-group-members-toggle]');
  if(await b.isVisible()&&await b.getAttribute('aria-expanded')!=='true'){await b.click();await settle(card);}};
 const toggleMember=async(gidx,useridx=0)=>{
  const card=group(gidx);await expand(card);
  const member=card.locator(`[data-easystud-member-id="${manifest.userIds[useridx]}"]`);
  await member.locator(':scope > .local-groupimport-easystud-selector').click();
  await expect(member.locator('input[type="checkbox"]').first()).toBeChecked();
 };
 const columns=()=>root.evaluate(n=>[...n.querySelectorAll('[data-easystud-column-action]')].map(b=>({
  column:b.getAttribute('data-easystud-column-action'),slot:b.closest('[data-easystud-column-actions]')?.getAttribute('data-easystud-column-actions')||null,
  identity:[...b.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).sort().join('|')})));

 for(const lang of ['fr','en'])for(const width of [1600,1280,768,390]){
  cell={lang,width};report.cells.push(cell);save();proof('reset-cards');await load();
  await check('GLOBAL','initial containment',async()=>{const b=await noOverflow();expect(b.excess).toBeLessThanOrEqual(1);expect(b.scrollX).toBe(0);return b;});
  await check('K16-69','columns, action menus and complete-view round trip',async()=>{
   const responsive=await root.evaluate(n=>n.classList.contains('local-groupimport-easystud--responsive-workspace'));
   const samples=[];let identities;
   for(const mode of (responsive?['participants','groups','groupings']:['both','participants','structure','both'])){
    if(responsive)await view(root,mode);else{await root.locator(`[data-easystud-layout-mode="${mode}"]:visible`).click();await settle(root);}
    const actions=await columns();const sorted=actions.map(a=>a.identity).sort();if(identities)expect(sorted).toEqual(identities);else identities=sorted;
    for(const a of actions){const focused=!responsive&&((mode==='participants'&&['participants','participant-groups'].includes(a.column))||
     (mode==='structure'&&['structure-groups','structure-groupings'].includes(a.column)));expect(a.slot).toBe(focused?a.column:null);}
    const menus=root.locator('[data-easystud-panel-actions-toggle]:visible');let opened=0;
    for(let i=0;i<await menus.count();i++){const t=menus.nth(i);await t.click();await expect(t).toHaveAttribute('aria-expanded','true');
     await expect(t.locator('..').locator('[data-easystud-panel-actions-menu]')).toBeVisible();await page.keyboard.press('Escape');
     if(await t.getAttribute('aria-expanded')==='true')await t.click();opened++;}
    const bounds=await noOverflow();expect(bounds.excess).toBeLessThanOrEqual(1);samples.push({mode,actions,opened,bounds});
   }return {responsive,samples};
  });
  for(const kind of ['participants','groups','groupings']){
   await check('SELECTION',kind,async()=>{await clear();await view(root,kind);const card=listFor(kind).locator(cardFor(kind)).first();
    await card.locator(':scope > .local-groupimport-easystud-selector').click();await expect(card.locator(':scope > label input[type="checkbox"]')).toBeChecked();
    const data={kind,id:await card.getAttribute('data-selectable-id'),class:await card.getAttribute('class')};expect(data.class).toContain('is-selected');
    await clear();await expect(root.locator('[data-selectable-type].is-selected')).toHaveCount(0);return data;});
   await check('K16-13',kind+' alpha / descending / alpha',async()=>{
    await view(root,kind);const list=listFor(kind),nav=list.locator(':scope > [data-easystud-pagination="top"]');
    const toggle=nav.locator('[data-easystud-list-sort-toggle]');const cards=list.locator(cardFor(kind));
    const namesel=kind==='participants'?'.local-groupimport-easystud-user__name':'.local-groupimport-easystud-'+(kind==='groups'?'group':'grouping')+'__name';
    const choose=async mode=>{await toggle.click();const option=nav.locator(`[data-easystud-list-sort-option="${mode}"]`);
     await expect(option).toHaveText(mode==='alpha'?'A → Z':'Z → A');await option.click();await settle(root);
     await expect(list).toHaveAttribute('data-easystud-sort',mode);await toggle.click();await expect(option).toHaveAttribute('aria-pressed','true');
     await expect(option).toHaveClass(/is-active/);await toggle.click();await settle(root);};
    const all=async()=>{const names=[];for(let i=0;i<30;i++){names.push(...await cards.evaluateAll((ns,s)=>ns.map(n=>n.querySelector(s).textContent.trim()),namesel));
     const next=nav.locator('[data-easystud-page-next]');if(!await next.isVisible()||await next.isDisabled())return names;
     await next.click();await settle(root);}throw Error('Unexpected >30 pages');};
    await choose('alpha');const alpha=await all();await choose('alpha-desc');const desc=await all();
    expect(desc).toEqual([...alpha].reverse());await choose('alpha');const returned=await all();expect(returned).toEqual(alpha);
    return {count:alpha.length,first:alpha[0],last:alpha.at(-1),descendingFirst:desc[0],activeCheck:true,restored:true};
   });
  }
  await load();await filteredGroups();
  await check('K16-73','empty group and grouping slots',async()=>{
   const slot=group(2).locator('.easyedu-entity-card-empty--group');await expect(slot).toBeVisible();
   const g=await geometry(slot);const dashed=await slot.evaluate(n=>getComputedStyle(n).borderTopStyle);expect(dashed).toBe('dashed');expect(g.height).toBeGreaterThan(0);expect(g.overflow).toBeLessThanOrEqual(1);
   await view(root,'groupings');const empty=root.locator('.easyedu-entity-card-empty--grouping:visible').first();await expect(empty).toBeVisible();
   const h=await geometry(empty);expect(await empty.evaluate(n=>getComputedStyle(n).borderTopStyle)).toBe('dashed');expect(h.overflow).toBeLessThanOrEqual(1);
   return {group:g,grouping:h,borderStyle:dashed};
  });
  await filteredGroups();
  await check('K16-70','18-member label, expand and reduce',async()=>{
   const card=group(0),button=card.locator('[data-easystud-group-members-toggle]');await expect(button).toBeVisible();
   if(await button.getAttribute('aria-expanded')==='true'){await button.click();await settle(card);}
   const label=await button.getAttribute('aria-label');expect(label).toBe(lang==='fr'?'Voir les 18 membres':'See all 18 members');
   const before=await geometry(card);await button.click();await settle(card);await expect(button).toHaveAttribute('aria-expanded','true');
   await expect(button).toHaveAttribute('aria-label',lang==='fr'?'Réduire':'Show less');const expanded=await geometry(card);
   await button.click();await settle(card);await expect(button).toHaveAttribute('aria-expanded','false');const reduced=await geometry(card);
   return {label,before,expanded,reduced,labelVisible:await button.locator('[data-easystud-group-members-toggle-label]').isVisible()};
  });
  await check('K16-74','flat card and zero lift on hover',async()=>{
   const samples=[];for(const kind of ['groups','participants','groupings']){
    if(kind==='groups')await filteredGroups();else await view(root,kind);
    const card=kind==='groups'?group(0):listFor(kind).locator(cardFor(kind)).first();await card.scrollIntoViewIfNeeded();
    await page.mouse.move(1,1);await settle(card);const before=await geometry(card);await card.hover();await settle(card);const hovered=await geometry(card);
    const translate=await card.evaluate(n=>{const s=getComputedStyle(n);const m=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform);return {x:m.m41,y:m.m42,scaleX:m.m11,scaleY:m.m22};});
    expect(Math.abs(translate.y)).toBeLessThanOrEqual(.5);expect(Math.abs(hovered.documentY-before.documentY)).toBeLessThanOrEqual(.5);
    expect(hovered.image).toBe('none');samples.push({kind,before,hovered,translate});
   }return samples;
  });
  await filteredGroups();
  await check('K16-65','selected group member surface',async()=>{
   const card=group(0);await card.locator(':scope > .local-groupimport-easystud-selector').click();await expand(card);await settle(card);
   await expect(card).toHaveClass(/is-selected/);const members=card.locator('[data-easystud-member-id]');
   const paints=await members.evaluateAll(ns=>ns.slice(0,6).map(n=>({background:getComputedStyle(n).backgroundColor,
    parentBackground:getComputedStyle(n.parentElement).backgroundColor})));
   expect(paints.length).toBeGreaterThan(0);for(const p of paints){expect(p.background).not.toBe('rgb(255, 255, 255)');
    expect(p.parentBackground).not.toBe('rgb(255, 255, 255)');}
   const result={card:await geometry(card),members:paints};await clear();return result;
  });
  await check('K16-55','header icon hover disc',async()=>{
   const card=group(0);const icon=card.locator('.local-groupimport-easystud-group__header button:visible, :scope > [data-easystud-card-menu]:visible').first();
   await icon.hover();await settle(card);const g=await geometry(icon);const px=[...g.image.matchAll(/([\d.]+)px/g)].map(m=>Number(m[1]));
   expect(g.image).toContain('radial-gradient');expect(px.some(p=>Math.abs(p-12)<=.25)).toBe(true);return {...g,discDiameter:24};
  });
  await check('K16-71','phone action-menu close',async()=>{
   if(width>768)return {notApplicable:true,reason:'Desktop context menu has no phone sheet close'};
   const opener=group(0).locator('[data-easystud-card-menu]:visible').first();await opener.click();
   const menu=root.locator('[data-easystud-context-menu]');await expect(menu).toBeVisible();await settle(menu);
   const close=menu.locator('[data-easystud-context-close]');await expect(close).toBeVisible();const g=await geometry(close);
   expect(Math.abs(g.width-g.height)).toBeLessThanOrEqual(.5);expect(g.radius).toBeLessThan(g.width/2-1);
   await close.click();await expect(menu).toBeHidden();await expect(opener).toBeFocused();return g;
  });
  await check('K16-72','navigation drawer close',async()=>{
   const nav=page.locator('[data-easyedu-navigation]').first(),open=nav.locator('[data-easyedu-navigation-open]');
   if(width>768){await expect(open).toBeHidden();return {notApplicable:true,reason:'Desktop navigation, no drawer'};}
   await open.click();const panel=nav.locator('[data-easyedu-navigation-panel]');await expect(panel).toHaveAttribute('aria-hidden','false');await settle(nav);
   const close=nav.locator('[data-easyedu-navigation-close]');const g=await geometry(close);
   expect(Math.abs(g.width-g.height)).toBeLessThanOrEqual(.5);expect(g.radius).toBeLessThan(g.width/2-1);
   await close.click();await expect(panel).toHaveAttribute('aria-hidden','true');await settle(nav);await expect(open).toBeFocused();return g;
  });
  for(const keep of [false,true])await check('K16-14',keep?'copy with original memberships':'move removes selected original memberships',async()=>{
   const before=proof('reset',true);await load();await filteredGroups();await toggleMember(0);await toggleMember(2);
   await root.locator('[data-easystud-move-selected-members]:visible, [data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]:visible').first().click();
   const modal=root.locator('[data-easystud-move-modal]');await expect(modal).toBeVisible();await settle(modal);
   const checkbox=modal.locator('[data-easystud-move-remove-origin]'),wrap=modal.locator('[data-easystud-move-origin-wrap]');
   await expect(wrap).toBeVisible();await expect(checkbox).not.toBeChecked();await expect(wrap).toHaveText(lang==='fr'?"Conserver les participants dans le groupe d'origine":'Keep participants in their original group');
   const chooser=modal.locator('.easyedu-searchable-choice');await chooser.locator('.easyedu-searchable-choice__trigger').click();await settle(chooser);
   await chooser.locator('input[type="search"]').fill('QA Audit Destination Beta');const option=chooser.locator('.easyedu-searchable-choice__option:visible').filter({hasText:'QA Audit Destination Beta'});
   await expect(option).toHaveCount(1);await option.focus();await option.press('Enter');
   await expect(modal.locator('[data-easystud-move-destination]')).toHaveValue(String(before.groupIds[1]));
   if(keep)await wrap.click();const bounds=await geometry(wrap);expect(bounds.overflow).toBeLessThanOrEqual(1);
   const response=page.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&['addusers','movemembers'].includes(new URLSearchParams(r.request().postData()).get('action')));
   await modal.locator('[data-easystud-confirm-move]').click();const native=await response,payload=await native.json();expect(payload.success).toBe(true);
   await expect(modal).toBeHidden();const message=keep?(lang==='fr'?'Participants copiés':'Participants copied'):(lang==='fr'?'Appartenances d’origine déplacées':'Source memberships moved');
   await expect(page.locator('[role="status"]:visible,[role="alert"]:visible,.toast:visible').filter({hasText:message}).last()).toBeVisible();
   const after=proof('snapshot');const actual=after.rows.map(r=>Number(r.groupid)).sort((a,b)=>a-b);
   const expected=(keep?before.groupIds.slice(0,4):[before.groupIds[1],before.groupIds[3]]).sort((a,b)=>a-b);expect(actual).toEqual(expected);
   expect(new Set(actual).size).toBe(actual.length);return {before,after,response:payload,action:keep?'addusers':'movemembers',bounds};
  });
  await check('DRAG','native member drag to empty group',async()=>{
   proof('reset-cards');await load();await filteredGroups();const source=group(0),target=group(2);await expand(source);
   const member=source.locator(`[data-easystud-member-id="${manifest.userIds[2]}"]`);await member.scrollIntoViewIfNeeded();
   const before=proof('snapshot',false,2);const sourceBox=await member.boundingBox(),targetBox=await target.boundingBox();
   if(!sourceBox||!targetBox)throw Error('Native drag source/empty destination has no rectangle');
   const x=sourceBox.x+sourceBox.width*.65,y=sourceBox.y+sourceBox.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+12,y+2,{steps:6});await page.waitForTimeout(650);
   await page.mouse.move(targetBox.x+targetBox.width/2,targetBox.y+targetBox.height/2,{steps:20});await page.mouse.up();
   await expect.poll(()=>proof('snapshot',false,2).rows.some(r=>Number(r.groupid)===manifest.groupIds[2]),{timeout:12000}).toBe(true);
   const after=proof('snapshot',false,2);expect(after.rows.some(r=>Number(r.groupid)===manifest.groupIds[0])).toBe(true);
   await expect(root).not.toHaveClass(/is-dragging-participants/);return {before,after,sourceBox,targetBox,nativeMouse:true,holdMs:650};
  });
  await check('GUIDE','slides 1 through 12',async()=>{
   await load();if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
   await page.locator('[data-easyedu-guide-open]:visible').first().click();const modal=page.locator('[data-easyedu-guide-modal]:visible');await expect(modal).toHaveCount(1);await settle(modal);
   const nav=modal.locator('[data-easyedu-guide-nav-item]');await expect(nav).toHaveCount(12);const steps=[];
   for(let i=0;i<12;i++){await nav.nth(i).click();await settle(modal);await expect(nav.nth(i)).toHaveAttribute('aria-current','step');
    const g=await geometry(modal);const horizontal=await modal.evaluate(n=>({scrollLeft:n.scrollLeft,pageX:scrollX,overflow:n.scrollWidth-n.clientWidth}));
    expect(horizontal.pageX).toBe(0);expect(horizontal.scrollLeft).toBe(0);expect(horizontal.overflow).toBeLessThanOrEqual(1);
    expect(g.x).toBeGreaterThanOrEqual(-1);expect(g.x+g.width).toBeLessThanOrEqual(width+1);steps.push({step:i+1,modal:g,horizontal});}
   await modal.locator('[data-easyedu-guide-close]').first().click();await expect(modal).toHaveCount(0);return steps;
  });
  await check('MASS-IMPORT','opening and native editable preview',async()=>{
   const u=new URL('/local/groupimport/index.php',url);u.searchParams.set('id',String(manifest.courseId));u.searchParams.set('lang',lang);
   await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:90000});const form=page.locator('#local-groupimport-import');await expect(form).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
   const filename=`recette-soir-${manifest.courseId}-${lang}-${width}.csv`;
   await form.evaluate((n,{filename,ids})=>{const transfer=new DataTransfer();transfer.items.add(new File([
    'username;group;grouping\n'+ids.slice(0,2).map(id=>id+';QA Audit Import Only;QA Import Structure').join('\n')+'\n'],filename,{type:'text/csv'}));
    n.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));},{filename,ids:manifest.identifiers});
   await expect(form.locator('.filepicker-filename a')).toContainText(filename,{timeout:60000});
   await page.locator('#id_submitbutton').click({noWaitAfter:true});const rows=page.locator('[data-local-groupimport-preview-row]');
   await expect(rows).toHaveCount(2,{timeout:60000});const bounds=await noOverflow();expect(bounds.excess).toBeLessThanOrEqual(1);
   return {filename,rows:await rows.count(),editable:await rows.first().locator('input[name^="groupname["]').isEditable(),bounds,importApplied:false};
  });
  await check('GLOBAL','console and final containment',async()=>{
   const b=await noOverflow();expect(b.excess).toBeLessThanOrEqual(1);expect(report.consoleErrors).toEqual([]);expect(report.pageErrors).toEqual([]);expect(report.blockedWrites).toEqual([]);return b;
  });save();
 }
 report.completed=true;report.pass=report.checks.every(r=>r.status!=='FAIL');save();
});
