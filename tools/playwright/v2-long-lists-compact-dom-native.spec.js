const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const settle=n=>n.evaluate(async node=>{await Promise.all(node.getAnimations({subtree:true})
 .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
const state=page=>page.evaluate(()=>new Promise(resolve=>require(['local_groupimport/local/cm/state'],s=>{
 const m=s.getOnDemandModel();resolve({groups:m.raw.groups.map(g=>({id:g.id,name:g.name,total:g.memberids.length})),
  grouping:m.raw.groupings[0].id,users:m.raw.users.map(u=>u.id),members:[...m.selectedMembers.keys()],groupsSelected:[...m.selectedGroups.keys()]});
})));
test('K16-01 compact catalog DOM evidenced native',async({page},info)=>{
 test.setTimeout(1200000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(180000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 if(base.origin!=='http://localhost:8051'||base.searchParams.get('id')==='5')throw Error('Dedicated own8051 fixture required');
 const report={rows:[],errors:[],blockedWrites:[]};
 const save=()=>fs.writeFileSync(info.outputPath('long-lists-native.json'),JSON.stringify(report,null,2));
 report.consoleErrors=[];page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push(m.text());save();}});
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',r=>r.request().method()==='GET'?r.continue():
  (report.blockedWrites.push(new URL(r.request().url()).pathname),r.abort()));
 await page.route('**/lib/ajax/service.php*',r=>{
  const calls=r.request().postDataJSON()||[];
  const writes=Array.isArray(calls)?calls.filter(c=>c.methodname.startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname)):[];
  return writes.length?(report.blockedWrites.push(writes.map(c=>c.methodname)),r.abort()):r.continue();
 });
 await page.goto(base.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'}),page.locator('#loginbtn').click({noWaitAfter:true})]);
 }
 for(const lang of ['fr','en'])for(const width of [768,390]){
  const row={lang,width,stage:'ready'};report.rows.push(row);save();try{
  await page.setViewportSize({width,height:width===768?1024:1000});base.searchParams.set('lang',lang);
  await page.goto(base.href,{waitUntil:'domcontentloaded'});const root=page.locator('#local-groupimport-easystud');
  await expect(root).toHaveAttribute('data-easystud-manager-initialised','1',{timeout:180000});
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:180000});
  const ids=await state(page),gid=ids.groups.find(g=>g.name==='QA Group 00').id;
  const clearSelection=async(optional=false)=>{
   const clear=root.locator('[data-easystud-clear-all-selection]:visible, [data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();
   if(optional&&!await clear.count())return;
   await clear.click();await settle(root);
   const after=await state(page);expect(after.members.length+after.groupsSelected.length).toBe(0);
  };
  const view=async name=>{
   const mobile=root.locator('[data-easystud-mobile-view="'+name+'"]:visible');
   if(await mobile.count())await mobile.first().click();
   else await root.locator('[data-easystud-layout-mode="'+(name==='participants'?'participants':'both')+'"]:visible').first().click();
   await settle(root);
  };
  await view('groupings');
  const grouping=root.locator('[data-easystud-grouping-id="'+ids.grouping+'"]');
  const open=grouping.locator('[data-easystud-collapse-toggle]').first();
  if(await open.getAttribute('aria-expanded')!=='true')await open.click();
  const groupCards=grouping.locator(':scope > [data-easystud-container-group-list] > [data-easystud-group-id]');
  await expect(groupCards).toHaveCount(3);
  await expect(grouping.locator('[data-easystud-group-id="'+ids.groups.find(g=>g.name==='QA Group 01').id+'"] [data-easystud-group-member-search]')).toBeHidden();

  row.stage='ungrouped-pages';save();
  await view('groups');const only=root.locator('[data-easystud-catalog-show-ungrouped="structure"]');if(!await only.isVisible())await root.locator('[data-easystud-advanced-filters-toggle="structure-groups"]:visible').click();if(!await only.isChecked())await only.locator('..').click();await expect(only).toBeChecked();await settle(root);
  const catalog=root.locator('.local-groupimport-easystud-structure-groups__list');const ug=root.locator('[data-easystud-sm-catalog=structure]:visible');row.dom=await root.evaluate(n=>({active:n.getAttribute('data-easystud-mobile-view-active'),catalogs:Array.from(n.querySelectorAll('.local-groupimport-easystud-structure-groups__list,.local-groupimport-easystud-participant-groups__list')).map(x=>({class:x.className,display:getComputedStyle(x).display,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,cards:x.querySelectorAll('[data-easystud-group-id]').length,html:x.innerHTML.slice(0,800)}))}));save();const pageSize=10;await expect(ug).toHaveCount(pageSize);const grouped=ids.groups.filter(g=>/^QA Group \d{2}$/.test(g.name)&&Number(g.name.slice(-2))<16).map(g=>String(g.id));row.catalogIds=await ug.evaluateAll(ns=>ns.map(n=>n.dataset.easystudGroupId));expect(row.catalogIds.every(id=>!grouped.includes(id))).toBe(true);row.ungroupedFirst=await ug.first().getAttribute('data-easystud-group-id');await catalog.locator('[data-easystud-pagination="top"] [data-easystud-page-next]').click();await settle(catalog);await expect(ug).toHaveCount(pageSize);expect(await ug.first().getAttribute('data-easystud-group-id')).not.toBe(row.ungroupedFirst);
  row.stage='participant-tokens';save();await view('participants');
  const cards=root.locator('[data-easystud-participant-list] [data-easystud-user]');
  const user=cards.filter({hasText:'Member 01'}).first();const tags=user.locator('[data-easystud-participant-memberships="groups"] .local-groupimport-easystud-user__meta-tags');
  if(!await tags.isVisible())await user.locator(':scope > .local-groupimport-easystud-selector input').check();
  await expect(tags.locator('span.local-groupimport-easystud-token')).toHaveCount(6);
  row.pillHeights=await tags.locator('span.local-groupimport-easystud-token,button').evaluateAll(nodes=>nodes.filter(n=>!n.hidden).map(n=>n.getBoundingClientRect().height));
  expect(Math.max(...row.pillHeights)-Math.min(...row.pillHeights)).toBeLessThanOrEqual(1);
  row.pillHeights.forEach(h=>expect(Math.abs(h-22)).toBeLessThanOrEqual(1));
  await tags.locator('[data-easystud-toggle-tags]').click();await expect(tags.locator('span.local-groupimport-easystud-token')).toHaveCount(15);await settle(user);
  await tags.locator('[data-easystud-toggle-tags]').click();await expect(tags.locator('span.local-groupimport-easystud-token')).toHaveCount(6);
  await clearSelection(true);
  const overCard=cards.filter({hasText:'Member 00'}).first();
  const over=overCard.locator('[data-easystud-participant-memberships="groups"] [data-easystud-toggle-tags]');
  if(!await over.isVisible())await overCard.locator(':scope > .local-groupimport-easystud-selector input').check();
  await over.click();await expect(root.locator('[data-easystud-user-modal]')).toBeVisible();await root.locator('[data-easystud-close-user-modal]').first().click();await expect(root.locator('[data-easystud-user-modal]')).toBeHidden();await settle(root);
  row.pageSize=pageSize;row.live=await root.locator('[data-easystud-long-list-live]').textContent();
  row.rawWidthDelta=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  row.overflow=Math.max(0,row.rawWidthDelta);save();expect(row.overflow).toBe(0);
  row.stage='PASS';row.status='PASS';save();}catch(e){row.status='FAIL';row.error=e.message;const name='failure-long-'+lang+'-'+width+'.png';await page.screenshot({path:info.outputPath(name)}).catch(()=>{});row.capture=name;save();}
  // Existing six captures are retained; this successor records JSON only.
 }
 expect(report.errors).toEqual([]);expect(report.blockedWrites).toEqual([]);save();
});

