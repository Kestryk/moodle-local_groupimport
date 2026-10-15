const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {recipe,settle,literal,groupingLiteral}=require('./complement5-native-helpers.cjs');

test('Runtime4d current JS full surface contracts successor',async({page},info)=>recipe(page,info,async c=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>{const original=Element.prototype.animate;window.qaRuntime4d=[];Element.prototype.animate=function(frames,options){const result=original.call(this,frames,options);window.qaRuntime4d.push({classes:this.className,mobileBar:this.hasAttribute('data-easystud-mobile-actions'),frames,options});return result;};});
 const take=async()=>{const value=await page.evaluate(()=>window.qaRuntime4d);await page.evaluate(()=>window.qaRuntime4d=[]);return value;};
 await c.open(390);await c.view('participants',390);await take();await c.view('groups',390);const view=await take();await c.view('participants',390);await take();
 const search=c.root.locator('[data-easystud-search]:visible');await search.fill('QA Guided One');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(1);await settle(c.root);const arrivals=await take();await search.fill('');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(4);await settle(c.root);await take();
 await c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first().locator(':scope > .local-groupimport-easystud-selector').click();await expect(c.root.locator('[data-easystud-mobile-actions]')).toHaveAttribute('data-easystud-selection-bar','visible');await settle(c.root);await c.root.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').click();await expect(c.root.locator('[data-easystud-mobile-actions]')).toHaveAttribute('data-easystud-selection-bar','hidden');const bars=(await take()).filter(a=>a.mobileBar);
 // These choices belong to the collapsed native More Filters panel.
 await c.root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').click();
 await expect(c.root.locator('[data-easystud-advanced-filters="participants"]')).not.toHaveClass(/is-collapsed/);
 await settle(c.root);await take();
 const choice=c.root.locator('.easyedu-searchable-choice:visible').first(),trigger=choice.locator('.easyedu-searchable-choice__trigger'),panel=choice.locator('.easyedu-searchable-choice__panel');await trigger.click();await expect(panel).toBeVisible();await settle(c.root);const open=(await take()).filter(a=>String(a.classes).includes('easyedu-searchable-choice__panel'));await page.keyboard.press('Escape');await expect(panel).toBeHidden();const close=(await take()).filter(a=>String(a.classes).includes('easyedu-searchable-choice__panel'));
 await c.open(1280);await c.view('participants',1280);await take();await c.view('structure',1280);const actions=(await take()).filter(a=>String(a.classes).includes('local-groupimport-easystud__panel-actions'));
 c.report.rows.push({mode:'served full JS, no M1',view,arrivals,bars,open,close,actions});c.save();
 for(const [surface,batch] of [['view',view],['arrivals',arrivals.filter(a=>/easystud-user/.test(a.classes))],['bars',bars],['dropdown open',open],['dropdown close',close],['actions',actions]]){
  expect(batch.length,surface).toBeGreaterThan(0);for(const a of batch)expect(a.options.duration,surface).toBeGreaterThan(0);
  if(surface.startsWith('dropdown'))for(const a of batch){expect(a.frames[0].height,surface).not.toBe(a.frames[a.frames.length-1].height);expect(Number(a.frames[0].opacity),surface).not.toBe(Number(a.frames[a.frames.length-1].opacity));}
  else expect(batch.some(a=>a.frames.some(f=>f.transform&&f.transform!=='none')),surface).toBe(true);
 }
 expect(bars.length).toBeGreaterThanOrEqual(2);expect(open).toHaveLength(1);expect(close).toHaveLength(1);await c.harmony(1280,'JS full');await c.open(390);await c.harmony(390,'JS full');
}));
