const {test,expect}=require('@playwright/test');
const {recipe,settle}=require('./complement5-native-helpers.cjs');

// Complement the same-row sample: a responsive line break does not change a pill's height contract.
test('Runtime4d neighbouring labels strict one pixel harmony',async({page},info)=>recipe(page,info,async c=>{
 const measure=async(locator,kind,width)=>{
  const items=await locator.evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent.trim(),height:r.height,x:r.x,y:r.y,width:r.width};}));
  const pairs=items.slice(1).map((b,i)=>({a:items[i].text,b:b.text,delta:Math.abs(items[i].height-b.height)}));
  c.report.rows.push({language:c.url.searchParams.get('lang'),width,kind,items,pairs,comparable:pairs.length>0});c.save();return items;
 };
 for(const language of ['fr','en'])for(const width of [1280,390]){
  c.url.searchParams.set('lang',language);
  await c.open(width);await c.view('participants',width);
  await expect(c.root.locator('[data-easystud-participants-panel] h3').first()).toHaveText('Participants');
  const participant=c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();
  await participant.scrollIntoViewIfNeeded();await settle(c.root);
  const pills=await measure(participant.locator('.local-groupimport-easystud-token:visible'),'participant role/group/grouping pills',width);
  expect(pills.length).toBeGreaterThanOrEqual(width===1280?3:1);
  for(const mode of width===1280?['participants','structure']:['participants','groups','structure']){
   await c.view(mode,width);
   for(const nav of await c.root.locator('[data-easystud-pagination="top"]:visible').all()){
    const peers=nav.locator('[data-easystud-select-results]:visible,[data-easystud-list-count]:visible');
    await measure(peers,'pagination results / Select all: '+mode,width);
   }
   if(mode==='structure'){
    const counts=c.root.locator('[data-easystud-structure-count]:visible');
    const items=await measure(counts,'K21 grouping/group count labels',width);
    expect(items).toHaveLength(2);
    expect(items.map(n=>n.text)).toEqual(language==='fr'?['2 groupements','3 groupes']:['2 groupings','3 groups']);
   }
   await page.screenshot({path:info.outputPath('harmony-'+language+'-'+width+'-'+mode+'.png')});
  }
 }
 c.url.searchParams.set('lang','fr');await c.open(1280);
 for(const mode of ['participants','structure']){
  await c.view(mode,1280);
  const keys=mode==='participants'?['participants','participant-groups']:['structure-groups','structure-groupings'];
  const buttons=keys.map(k=>c.root.locator('[data-easystud-advanced-filters-toggle="'+k+'"]:visible'));
  // Establish the baseline after Playwright's native scroll-to-target, not before it.
  await buttons[0].scrollIntoViewIfNeeded();await settle(c.root);
  const rect=()=>buttons[1].evaluate(n=>{const r=n.getBoundingClientRect(),root=n.closest('#local-groupimport-easystud').getBoundingClientRect();return {viewportY:r.y,rootY:root.y,relativeY:r.y-root.y};});
  const before=await rect();await buttons[0].click();await settle(c.root);const after=await rect();
  const row={width:1280,kind:'paired filters '+mode,before,after,viewportDelta:after.viewportY-before.viewportY,relativeDelta:after.relativeY-before.relativeY,pairs:[]};
  c.report.rows.push(row);c.save();await page.screenshot({path:info.outputPath('paired-filters-'+mode+'.png')});
  expect(Math.abs(row.relativeDelta)).toBeLessThanOrEqual(1);expect(Math.abs(row.viewportDelta)).toBeLessThanOrEqual(1);
  await buttons[0].click();await settle(c.root);
 }
 for(const width of [1280,390])expect(c.report.rows.some(r=>r.width===width&&r.comparable)).toBe(true);
 for(const row of c.report.rows)for(const p of row.pairs)expect(p.delta,`${row.width}/${row.kind}: ${p.a} / ${p.b}`).toBeLessThanOrEqual(1);
}));
