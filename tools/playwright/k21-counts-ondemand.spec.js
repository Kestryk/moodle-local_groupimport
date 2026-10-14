'use strict';
const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const audit=require('./roadmap-audit-helper.cjs');
test('K21 separate structure counts FR EN 1280 390 on demand',async({page},info)=>{
 test.setTimeout(200000);page.setDefaultTimeout(60000);
 const report={cases:[],errors:[],blocked:[],identity:audit.identity(),candidateCss:process.env.EASYEDU_CANDIDATE_CSS};
 const save=()=>fs.writeFileSync(info.outputPath('counts.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>report.errors.push(e.message));await audit.login(page);await audit.blockBusinessWrites(page,report.blocked);
 try{
  for(const language of ['fr','en'])for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});const url=audit.perfUrl();url.pathname='/local/groupimport/manage.php';url.searchParams.set('lang',language);
   const response=page.waitForResponse(r=>r.url().includes('/lib/ajax/service.php')&&(r.request().postData()||'').includes('local_groupimport_get_state'));
   await page.goto(url.href,{waitUntil:'domcontentloaded'});
   const payload=await(await response).json();const state=JSON.parse(payload.find(p=>p.data&&p.data.state).data.state);
   const counts={groupings:state.groupings.length,groups:state.groups.length};
   const root=await audit.ready(page);await page.addStyleTag({path:process.env.EASYEDU_CANDIDATE_CSS});
   const view=width===390?'[data-easystud-mobile-view="groups"]:visible':'[data-easystud-layout-mode="structure"]:visible';
   await root.locator(view).first().click();await audit.settle(root);
   const badges=root.locator('[data-easystud-structure-count]');await expect(badges).toHaveCount(2);await badges.first().scrollIntoViewIfNeeded();
   const labels=[];
   for(const kind of ['groupings','groups']){
    const badge=root.locator(`[data-easystud-structure-count="${kind}"]`);await expect(badge).toBeVisible();
    const one=new Intl.PluralRules(language).select(counts[kind])==='one';
    const word=language==='fr'?(kind==='groups'?'groupe':'groupement'):(kind==='groups'?'group':'grouping');
    await expect(badge).toHaveText(`${counts[kind]} ${word}${one?'':'s'}`);
    labels.push({kind,text:await badge.textContent(),box:await badge.boundingBox()});
   }
   const geometry=await badges.first().evaluate(n=>{const p=n.parentElement;const r=p.getBoundingClientRect();return {overflow:p.scrollWidth-p.clientWidth,left:r.left,right:r.right,viewport:innerWidth};});
   const row={language,width,counts,labels,geometry};report.cases.push(row);save();
   await page.screenshot({path:info.outputPath(`counts-${language}-${width}.png`)});
   expect(geometry.overflow).toBeLessThanOrEqual(1);expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(width+1);
   const [a,b]=labels.map(v=>v.box);expect(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1).toBe(false);
   expect(await page.locator('html').getAttribute('lang')).toMatch(new RegExp('^'+language));
  }
  expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
 }finally{save();}
});
