const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const settle=n=>n.evaluate(async node=>{await Promise.all(node.getAnimations({subtree:true})
 .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
const state=page=>page.evaluate(()=>new Promise(resolve=>require(['local_groupimport/local/cm/state'],s=>{
 const m=s.getOnDemandModel();resolve({groups:m.raw.groups.map(g=>({id:g.id,name:g.name,total:g.memberids.length})),
  grouping:m.raw.groupings[0].id,users:m.raw.users.map(u=>u.id),members:[...m.selectedMembers.keys()],groupsSelected:[...m.selectedGroups.keys()]});
})));
test('K16-01 keyboard compact filter bounded cards FR EN',async({page},info)=>{
 test.setTimeout(1200000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(180000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 if(base.origin!=='http://localhost:8051'||base.searchParams.get('id')==='5')throw Error('Dedicated own8051 fixture required');
 const report={rows:[],errors:[],blockedWrites:[]};
 const save=()=>fs.writeFileSync(info.outputPath('long-lists-native.json'),JSON.stringify(report,null,2));
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
 for(const lang of ['fr','en'])for(const width of [1600,1280,768,390]){
  const row={lang,width,stage:'ready'};report.rows.push(row);save();
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
  await expect(grouping.locator('[data-easystud-group-id="'+ids.groups.find(g=>g.name==='QA Group 02').id+'"] [data-easystud-group-member-search]')).toBeVisible();
  row.stage='group-window';save();
  const group=grouping.locator('[data-easystud-group-id="'+gid+'"]');
  const members=group.locator('[data-easystud-member-id]');await expect(members).toHaveCount(8);
  const search=group.locator('[data-easystud-group-member-search]');await expect(search).toBeVisible();
  await search.fill('Member 59');await expect(members).toHaveCount(1);await expect(members.first()).toContainText('Member 59');
  await search.fill('');await expect(members).toHaveCount(8);
  await group.locator('[data-easystud-long-list-action="more"]').click();await expect(members).toHaveCount(18);await settle(group);
  row.memberFocus=await page.evaluate(()=>document.activeElement.closest('[data-easystud-member-id]')?.getAttribute('data-easystud-member-id'));
  expect(Number(row.memberFocus)).toBe(ids.users[8]);
  await group.locator('[data-easystud-group-select-all]').click();row.selectedMembers=(await state(page)).members.length;
  expect(row.selectedMembers).toBe(60);await expect(members).toHaveCount(18);
  await clearSelection();
  for(const count of [28,38,48,50]){await group.locator('[data-easystud-long-list-action="more"]').click();await expect(members).toHaveCount(count);await settle(group);}
  await expect(group.locator('[data-easystud-long-list-action="more"]')).toBeHidden();
  const all=group.locator('[data-easystud-long-list-action="all"]');await all.click();
  const modal=root.locator('[data-easystud-advanced-settings-modal]');await expect(modal).toBeVisible({timeout:60000});await expect(modal).toContainText('Member 59');
  await modal.locator('[data-easystud-close-advanced-settings]').first().click();await expect(modal).toBeHidden();
  await expect(all).toBeFocused();
  await group.locator('[data-easystud-long-list-action="less"]').click();await expect(members).toHaveCount(8);await settle(group);
  row.stage='grouping-window';save();
  const groupMore=grouping.locator(':scope > [data-easystud-long-list-footer="groups"] [data-easystud-long-list-action="more"]');
  await groupMore.click();await expect(groupCards).toHaveCount(6);await settle(grouping);
  row.groupFocus=await page.evaluate(()=>document.activeElement.closest('[data-easystud-group-id]')?.getAttribute('data-easystud-group-id'));
  expect(Number(row.groupFocus)).toBe(ids.groups.find(g=>g.name==='QA Group 03').id);
  for(const count of [9,12]){await groupMore.click();await expect(groupCards).toHaveCount(count);await settle(grouping);}
  await expect(groupMore).toBeHidden();
  await grouping.locator(':scope > [data-easystud-long-list-footer="groups"] [data-easystud-long-list-action="select"]').click();
  row.selectedGroups=(await state(page)).groupsSelected.length;expect(row.selectedGroups).toBe(16);
  await clearSelection();
  const gs=grouping.locator('[data-easystud-container-group-search]').first();await gs.fill('QA Group 15');
  await expect(groupCards).toHaveCount(1);await expect(groupCards.first()).toContainText('QA Group 15');await gs.fill('');await expect(groupCards).toHaveCount(3);
  row.stage='ungrouped-pages';save();
  if(width<=1024){
   await view('groups');
   const only=root.locator('[data-easystud-catalog-show-ungrouped="structure"]');
   if(!await only.isVisible())await root.locator('[data-easystud-advanced-filters-toggle="structure-groups"]:visible').click();
   await only.focus();await page.keyboard.press('Space');await expect(only).toBeChecked();await settle(root);
  }
  const ungrouped=root.locator('.local-groupimport-easystud-tree__section--ungrouped');
  const ut=ungrouped.locator('[data-easystud-collapse-toggle]').first();if(await ut.getAttribute('aria-expanded')!=='true')await ut.click();
  const ug=ungrouped.locator(':scope > [data-easystud-container-group-list] > [data-easystud-group-id]');
  const pageSize=width===390?6:10;await expect(ug).toHaveCount(pageSize);await expect(ungrouped.locator('[data-easystud-member-id]')).toHaveCount(0);
  const next=ungrouped.locator(':scope > [data-easystud-long-list-footer] [data-easystud-long-list-action="next"]');
  row.ungroupedFirst=await ug.first().getAttribute('data-easystud-group-id');await next.click();await expect(ug).toHaveCount(pageSize);await settle(ungrouped);
  expect(await ug.first().getAttribute('data-easystud-group-id')).not.toBe(row.ungroupedFirst);
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
  await over.click();await expect(root.locator('[data-easystud-user-modal]')).toBeVisible();await root.locator('[data-easystud-close-user-modal]').click();await expect(root.locator('[data-easystud-user-modal]')).toBeHidden();await settle(root);
  row.pageSize=pageSize;row.live=await root.locator('[data-easystud-long-list-live]').textContent();
  row.rawWidthDelta=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  row.overflow=Math.max(0,row.rawWidthDelta);save();expect(row.overflow).toBe(0);
  row.stage='PASS';save();
  // Existing six captures are retained; this successor records JSON only.
 }
 expect(report.errors).toEqual([]);expect(report.blockedWrites).toEqual([]);save();
});

