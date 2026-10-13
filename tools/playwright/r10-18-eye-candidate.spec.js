'use strict';
const {test,expect}=require('@playwright/test');const fs=require('node:fs');const audit=require('./roadmap-audit-helper.cjs');
test('R10-18 painted eye identity alignment candidate FR mobile',async({page},info)=>{
 test.setTimeout(180000);const rows=[],blocked=[];let cssNode;
 const save=()=>fs.writeFileSync(info.outputPath('eye.json'),JSON.stringify({rows,blocked},null,2));
 await audit.login(page);await audit.blockBusinessWrites(page,blocked);const root=await audit.ready(page);
 const sample=async(width,phase,state)=>{
  await audit.settle(root);
  const card=root.locator('[data-easystud-user]:visible').first();
  await card.scrollIntoViewIfNeeded();
  const value=await card.evaluate(n=>{
   const eye=n.querySelector('[data-easystud-open-user]'),name=n.querySelector('.local-groupimport-easystud-user__name');
   const range=document.createRange();range.selectNodeContents(name);const ink=range.getClientRects()[0];
   const box=eye.getBoundingClientRect(),glyph=eye.querySelector('.fa,.icon').getBoundingClientRect();
   return {delta:glyph.y+glyph.height/2-(ink.y+ink.height/2),targetWidth:box.width,targetHeight:box.height,
    glyphTop:glyph.y,titleTop:ink.y,grid:getComputedStyle(n.querySelector('.local-groupimport-easystud-user__headline')).gridTemplateAreas};
  });rows.push({width,phase,state,...value});save();
 };
 try{
  for(const width of [390,768,1024]){
   await page.setViewportSize({width,height:1000});await audit.settle(root);
   const toggle=root.locator('[data-easystud-mobile-membership-toggle]');
   const card=root.locator('[data-easystud-user]:visible').first();const checkbox=card.locator('[data-easystud-selector-input]').first();
   for(const phase of ['served','candidate']){
    if(phase==='candidate') cssNode=await page.addStyleTag({content:fs.readFileSync(process.env.EASYEDU_CANDIDATE_CSS,'utf8')});
    if(await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();
    await sample(width,phase,'compact');await checkbox.evaluate(n=>n.click());await sample(width,phase,'sole-selected');
    await checkbox.evaluate(n=>n.click());await toggle.click();await sample(width,phase,'full');
    const name=card.locator('.local-groupimport-easystud-user__name');const original=await name.textContent();
    try{await name.evaluate(n=>n.textContent='Alexandrine Catherine de La Roche Internationale');await sample(width,phase,'long-name-full');}
    finally{await name.evaluate((n,s)=>n.textContent=s,original);}
    if(phase==='candidate'){await page.screenshot({path:info.outputPath('eye-'+width+'.png')});await cssNode.evaluate(n=>n.remove());}
   }
  }
  expect(blocked).toEqual([]);
  for(const r of rows.filter(x=>x.phase==='candidate'))expect(Math.abs(r.delta),JSON.stringify(r)).toBeLessThanOrEqual(3);
 }finally{save();}
});
