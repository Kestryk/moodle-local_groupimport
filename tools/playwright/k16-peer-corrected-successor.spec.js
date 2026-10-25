'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),audit=require('./roadmap-audit-helper.cjs');
const metrics=locator=>locator.evaluate(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {height:r.height,padding:s.padding,radius:s.borderRadius,minHeight:s.minHeight,border:s.borderWidth,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight};});
test('K16 peer corrected on demand filter cancel FR EN390 reference1280',async({page},info)=>{
 test.setTimeout(240000);page.setDefaultTimeout(60000);
 const report={cases:[],errors:[],blocked:[],identity:audit.identity(),mode:'reactive'};
 const save=()=>fs.writeFileSync(info.outputPath('k16.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>report.errors.push(e.message));await audit.login(page);await audit.blockBusinessWrites(page,report.blocked);
 const initial=await audit.ready(page);await expect(initial).toHaveAttribute('data-easystud-sm-ready','1');
 try{
  for(const [language,width]of [['fr',390],['en',390],['fr',1280]]){
   await page.setViewportSize({width,height:900});const url=audit.perfUrl();url.pathname='/local/groupimport/manage.php';url.searchParams.set('lang',language);
   // The dynamic rendering attribute follows the real state response; do not race it at5s.
   const response=page.waitForResponse(r=>r.url().includes('/lib/ajax/service.php')&&(r.request().postData()||'').includes('local_groupimport_get_state'));
   await page.goto(url.href,{waitUntil:'domcontentloaded'});const payload=await(await response).json();const state=JSON.parse(payload.find(p=>p.data&&p.data.state).data.state);
   const root=await audit.ready(page);await expect(root).toHaveAttribute('data-easystud-rendering-mode','reactive');
   await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language+'(?:-|$)'));
   await root.locator(width===390?'[data-easystud-mobile-view="participants"]:visible':'[data-easystud-layout-mode="participants"]:visible').first().click();await audit.settle(root);
   const search=root.locator('[data-easystud-search]:visible');await search.fill('a');
   const reset=root.locator('[data-easystud-reset-filters]:visible');await expect(reset).toBeVisible();await audit.settle(root);
   const row={language,width,reset:await metrics(reset),stage:'reset'};report.cases.push(row);save();
   await page.screenshot({path:info.outputPath(`${language}-${width}-reset.png`)});
   expect(Math.abs(row.reset.height-38)).toBeLessThanOrEqual(0.5);
   await reset.click();await expect(search).toHaveValue('');
   await root.locator(width===390?'[data-easystud-mobile-view="groupings"]:visible':'[data-easystud-layout-mode="structure"]:visible').first().click();await audit.settle(root);
   const cards=root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible');await expect(cards.first()).toBeVisible();
   const ids=await cards.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-easystud-grouping-id')));
   const id=ids.find(id=>state.groupings.some(g=>String(g.id)===id&&g.groupids.length>=2));expect(id,'Populated existing grouping on the current page').toBeTruthy();row.groupingId=id;
   const grouping=cards.filter({has:page.locator('[data-easystud-container-search-panel="'+id+'"]')}).first();
   const groups=grouping.locator('[data-easystud-group-id]:visible');row.initialGroupIds=await groups.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-easystud-group-id')));
   let trigger;
   if(width===390){
    await grouping.locator(':scope > [data-easystud-card-menu]:visible,:scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first().click();
    const menu=root.locator('[data-easystud-context-menu].is-mobile-sheet');await expect(menu).toBeVisible();
    trigger=menu.locator('[data-easystud-context-action="grouping-search-groups"]');await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(language==='fr'?'Rechercher des groupes':'Search groups');row.action=await trigger.textContent();
   }else{
    trigger=grouping.locator('[data-easystud-container-search-toggle]:visible').first();
    if(!await trigger.count())await grouping.locator(':scope > .local-groupimport-easystud-grouping__header > [data-easystud-group-actions-toggle]:visible').click();
   }
   await trigger.click();const panel=grouping.locator('[data-easystud-container-search-panel="'+id+'"]');await expect(panel).toBeVisible();await audit.settle(panel);
   const field=panel.locator('[data-easystud-container-group-search]');await expect(field).toBeFocused();
   const cancel=panel.locator('[data-easystud-container-search-cancel]');await expect(cancel).toBeVisible();
   row.cancel=await metrics(cancel);row.openGroupIds=await groups.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-easystud-group-id')));row.stage='opened';save();
   await page.screenshot({path:info.outputPath(`${language}-${width}-search.png`)});
   expect(row.cancel).toEqual(row.reset);expect(row.openGroupIds.length).toBeGreaterThan(0);
   await field.fill('qa-k16-no-group-can-match-this-query');await expect(groups).toHaveCount(0);row.filteredGroupIds=await groups.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-easystud-group-id')));save();
   await page.screenshot({path:info.outputPath(`${language}-${width}-filtered.png`)});
   await cancel.click();await expect(panel).toBeHidden();await expect(field).toHaveValue('');await audit.settle(root);
   row.restoredGroupIds=await groups.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-easystud-group-id')));
   expect(row.restoredGroupIds).toEqual(row.initialGroupIds);
   row.focusVisible=await grouping.evaluate(n=>{const a=document.activeElement;return n.contains(a)&&a.getClientRects().length>0&&!a.closest('[hidden],[aria-hidden="true"]');});expect(row.focusVisible).toBe(true);
   row.stage='complete';save();await page.screenshot({path:info.outputPath(`${language}-${width}-restored.png`)});
  }
  expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
 }finally{save();}
});
