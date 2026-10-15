const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {recipe,settle,literal,groupingLiteral}=require('./complement5-native-helpers.cjs');
test('Complement5 S9 literal card tooltip CSV and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1280,390]){await c.open(width);await c.view(width<=1024?'groups':'structure',width);
  const card=c.root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText(literal,{exact:true})}).first();await expect(card).toBeVisible();
  const name=card.locator('.local-groupimport-easystud-group__name');expect(await name.innerText()).toBe(literal);expect(await card.getAttribute('data-easystud-advanced-name')).toBe(literal);
  const alpha=c.root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first();
  const expand=alpha.locator('[data-easystud-group-members-toggle]');if(await expand.getAttribute('aria-expanded')!=='true')await expand.click();await settle(c.root);
  const remove=alpha.locator('[data-easystud-member-id]').filter({hasText:literal}).locator('[data-easystud-remove-member]');await remove.scrollIntoViewIfNeeded();await settle(c.root);await remove.hover();const tip=page.locator('.local-groupimport-easystud-hover-popover');await expect(tip).toBeVisible();await expect(tip).toContainText(literal);await page.screenshot({path:info.outputPath('literal-tooltip-'+width+'.png')});
  await c.view('structure',width);const grouping=c.root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').filter({has:page.getByText(groupingLiteral,{exact:true})}).first();await expect(grouping).toBeVisible();
  const direct=grouping.locator('[data-easystud-open-advanced-settings]:visible');if(await direct.count())await direct.first().click();else{await grouping.locator('[data-easystud-card-menu]:visible').first().click();await c.root.locator('[data-easystud-context-action="grouping-open-advanced-settings"]:visible').click();}
  const editor=c.root.locator('[data-easystud-editor-context="grouping"]');await expect(editor).toBeVisible();
  const section=editor.locator('[data-easystud-settings-list-section]').filter({has:page.getByText('=1+1',{exact:true})}).first();const awaited=page.waitForEvent('download');await section.locator('[data-easystud-settings-export]').click();const download=await awaited,path=info.outputPath('literal-export-'+width+'.csv');await download.saveAs(path);const csv=fs.readFileSync(path,'utf8');expect(csv).toContain('"\'=1+1"');expect(csv).toContain('QA & < > "" \'');expect(csv).not.toContain('&amp;');
  c.report.rows.push({width,literalCard:true,literalTooltip:true,literalGrouping:true,csvFormulaStillNeutralised:true,csvLiteral:true});c.save();await editor.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]').click();await c.harmony(width,'S9');
 }
}));
test('Complement5 T020 strict settled two pixels and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1600,1920]){await c.open(width);await c.view('both',width);
  const sample=()=>c.root.evaluate(n=>{const visible=e=>e&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length>0;const first=(n,s)=>[...n.querySelectorAll(s)].find(visible);const list=n.querySelector('[data-easystud-participant-list]'),tree=n.querySelector('[data-easystud-tree]');const a=first(list,':scope > [data-easystud-pagination="top"]'),b=first(tree,'[data-easystud-pagination="top"]'),p=first(list,'[data-easystud-user]'),g=first(tree,'.local-groupimport-easystud-tree__section--ungrouped,.local-groupimport-easystud-tree__section[data-easystud-grouping-id]');if(!a||!b||!p||!g)return {missing:true};return {barDelta:a.getBoundingClientRect().y-b.getBoundingClientRect().y,cardDelta:p.getBoundingClientRect().y-g.getBoundingClientRect().y,layoutWidth:n.querySelector('.local-groupimport-easystud__layout').clientWidth};});
  let row;await expect.poll(async()=>{row=await sample();return row.missing?Infinity:Math.max(Math.abs(row.barDelta),Math.abs(row.cardDelta));},{timeout:12000}).toBeLessThanOrEqual(2);c.report.rows.push({width,...row});c.save();await page.screenshot({path:info.outputPath('T020-'+width+'.png')});await c.harmony(width,'T020');
 }
}));
test('Complement5 Mass Import root sixteen pixels and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1280,390]){await c.open(width);await page.goto(new URL('/local/groupimport/index.php?id='+c.report.course+'&lang=fr',c.url).href,{waitUntil:'domcontentloaded'});const root=page.locator('.local-groupimport-import');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.evaluate(()=>document.fonts.ready);const font=await root.evaluate(n=>getComputedStyle(n).fontSize);c.report.rows.push({width,font});c.save();await page.screenshot({path:info.outputPath('mass-'+width+'.png')});expect(font).toBe('16px');await c.open(width);await c.harmony(width,'Mass Import');}
}));
test('Complement5 participant eye mobile geometry and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [390,768]){await c.open(width);await c.view('participants',width);const card=c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();await card.scrollIntoViewIfNeeded();await settle(c.root);
  const row=await card.evaluate(n=>{const eye=n.querySelector('[data-easystud-open-user]'),name=n.querySelector('.local-groupimport-easystud-user__name'),e=eye.getBoundingClientRect(),t=name.getBoundingClientRect(),r=n.getBoundingClientRect();const hit=document.elementFromPoint(e.x+e.width/2,e.y+e.height/2);return {eye:{x:e.x,y:e.y,width:e.width,height:e.height},name:{x:t.x,y:t.y,width:t.width,height:t.height},card:{x:r.x,y:r.y,width:r.width,height:r.height},centreDelta:(e.y+e.height/2)-(t.y+t.height/2),hit:eye.contains(hit)};});c.report.rows.push({width,...row});c.save();await page.screenshot({path:info.outputPath('eye-'+width+'.png')});expect(row.hit).toBe(true);expect(Math.abs(row.centreDelta),'eye/name vertical centres').toBeLessThanOrEqual(2);await c.harmony(width,'eye');}
}));
test('Complement5 Alt Control Shift native selection and harmony',async({page},info)=>recipe(page,info,async c=>{
 await c.open(1280);
 const check=async(cards,type,name)=>{await expect.poll(()=>cards.count()).toBeGreaterThanOrEqual(3);const count=()=>cards.evaluateAll(ns=>ns.filter(n=>n.classList.contains('is-selected')).length);
  await cards.nth(0).locator(name).click();await expect.poll(count).toBe(1);
  await cards.nth(1).locator(name).click({modifiers:['Alt']});await expect.poll(count).toBe(2);
  await cards.nth(1).locator(name).click({modifiers:['Alt']});await expect.poll(count).toBe(1);
  await cards.nth(1).locator(name).click({modifiers:['Control']});await expect.poll(count).toBe(2);
  await cards.nth(2).locator(name).click({modifiers:['Shift']});await expect.poll(count).toBe(3);
  c.report.rows.push({type,altAdds:true,altRemoves:true,control:true,shift:true});c.save();
 };
 await c.view('participants',1280);const participants=c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible');await check(participants,'participant','.local-groupimport-easystud-user__name');
 const incompatible=c.root.locator('[data-easystud-participant-groups-panel] [data-easystud-group-id]:visible').first();await incompatible.locator('.local-groupimport-easystud-group__name').click({modifiers:['Alt']});await expect(incompatible).not.toHaveClass(/is-selected/);expect(await participants.locator(':scope.is-selected').count()).toBe(3);c.report.rows.push({mixedTypeAltRefused:true});
 await c.open(1280);await c.view('structure',1280);await check(c.root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible'),'group','.local-groupimport-easystud-group__name');
 await c.open(1280);await c.view('structure',1280);const alpha=c.root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first();await alpha.locator('[data-easystud-group-members-toggle]').click();await settle(c.root);await check(alpha.locator('[data-easystud-member-id]:visible'),'member','.local-groupimport-easystud-member__name');
 await c.harmony(1280,'Alt/Ctrl/Shift');
}));
test('Complement5 mobile view lists selection actions dropdown motion harmony',async({page},info)=>recipe(page,info,async c=>{
 await page.addInitScript(()=>{const original=Element.prototype.animate;window.qaNativeAnimations=[];Element.prototype.animate=function(frames,options){const result=original.call(this,frames,options);window.qaNativeAnimations.push({at:performance.now(),classes:this.className,mobileBar:this.hasAttribute('data-easystud-mobile-actions'),frames,options});return result;};});
 const take=async()=>{const value=await page.evaluate(()=>window.qaNativeAnimations);await page.evaluate(()=>window.qaNativeAnimations=[]);return value;};
 for(const reduced of ['no-preference','reduce']){
  // This probes the currently served OS-sensitive engine. Rebind to the personal preference UI
  // once the M1 contract is delivered; it does not certify the future preference/default policy.
  await page.emulateMedia({reducedMotion:reduced});await c.open(390);await c.view('participants',390);await take();
  await c.view('groups',390);const view=await take();await c.view('participants',390);await take();
  const search=c.root.locator('[data-easystud-search]:visible');await search.fill('QA Guided One');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(1);await settle(c.root);const arrival=await take();await search.fill('');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(4);await settle(c.root);await take();
  await c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first().locator(':scope > .local-groupimport-easystud-selector').click();await expect(c.root.locator('[data-easystud-mobile-actions]')).toHaveAttribute('data-easystud-selection-bar','visible');await settle(c.root);await c.root.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').click();await expect(c.root.locator('[data-easystud-mobile-actions]')).toHaveAttribute('data-easystud-selection-bar','hidden');const bars=(await take()).filter(a=>a.mobileBar);
  const choice=c.root.locator('.easyedu-searchable-choice:visible').first(),trigger=choice.locator('.easyedu-searchable-choice__trigger'),panel=choice.locator('.easyedu-searchable-choice__panel');
  await trigger.click();await expect(panel).toBeVisible();await settle(c.root);const menuOpenRaw=await take(),menuOpen=menuOpenRaw.filter(a=>String(a.classes).includes('easyedu-searchable-choice__panel'));await page.keyboard.press('Escape');await expect(panel).toBeHidden();const menuCloseRaw=await take(),menuClose=menuCloseRaw.filter(a=>String(a.classes).includes('easyedu-searchable-choice__panel'));
  await c.open(1280);await c.view('participants',1280);await take();await c.view('structure',1280);const actions=(await take()).filter(a=>String(a.classes).includes('local-groupimport-easystud__panel-actions'));
  const row={reduced,view,arrival,bars,menuOpen,menuClose,menuOpenRaw,menuCloseRaw,actions};c.report.rows.push(row);c.save();
  const batches=[view,arrival.filter(a=>/easystud-user/.test(a.classes)),bars,menuOpen,menuClose,actions];
  for(const batch of batches){expect(batch.length,'Each native motion surface is observed').toBeGreaterThan(0);if(reduced==='reduce')for(const a of batch){expect(a.frames.every(f=>!Object.hasOwn(f,'transform'))).toBe(true);expect(a.options.duration).toBe(120);}else expect(batch.some(a=>a.frames.some(f=>f.transform&&f.transform!=='none'))).toBe(true);}
  expect(bars.length).toBeGreaterThanOrEqual(2);expect(menuOpen).toHaveLength(1);expect(menuClose).toHaveLength(1);expect([...menuOpenRaw,...menuCloseRaw].filter(a=>String(a.classes).includes('easyedu-searchable-choice__option'))).toEqual([]);
  await c.harmony(1280,'motion '+reduced);await c.open(390);await c.harmony(390,'motion '+reduced);await page.screenshot({path:info.outputPath('motion-'+reduced+'.png')});
 }
}));
