const {test,expect}=require('@playwright/test');
const {recipe}=require('./complement5-native-helpers.cjs');

test('Runtime4d T020 actual Complete view strict two pixel successor',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1600,1920]){
  await c.open(width);await c.view('participants',width);await c.view('both',width);
  const sample=()=>c.root.evaluate(n=>{
   const first=(parent,selector)=>parent&&[...parent.querySelectorAll(selector)].find(e=>!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).display!=='none');
   const list=n.querySelector('[data-easystud-participant-list]'),tree=n.querySelector('[data-easystud-tree]');
   const participant=first(list,'[data-easystud-user]'),section=first(tree,'.local-groupimport-easystud-tree__section--ungrouped,.local-groupimport-easystud-tree__section[data-easystud-grouping-id]');
   const a=first(list,':scope > [data-easystud-pagination="top"]'),b=first(tree,'[data-easystud-pagination="top"]');
   const missing={participant:!participant,section:!section,participantBar:!a};
   if(Object.values(missing).some(Boolean))return {missing};
   return {cardDelta:participant.getBoundingClientRect().y-section.getBoundingClientRect().y,barDelta:b?a.getBoundingClientRect().y-b.getBoundingClientRect().y:null,structureBar:b?'present':'absent in served Complete view',layoutWidth:n.querySelector('.local-groupimport-easystud__layout').clientWidth,participantY:participant.getBoundingClientRect().y,sectionY:section.getBoundingClientRect().y};
  });
  let row;await expect.poll(async()=>{row=await sample();c.report.lastLayout={width,...row};c.save();return row.missing?Infinity:Math.max(Math.abs(row.cardDelta),row.barDelta===null?0:Math.abs(row.barDelta));},{timeout:12000}).toBeLessThanOrEqual(2);
  c.report.rows.push({width,...row});c.save();await c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first().scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('T020-'+width+'.png')});
 }
}));
