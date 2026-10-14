'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),audit=require('./roadmap-audit-helper.cjs');
test('R10-06 corrected History and Rollback palette FR1280',async({page},info)=>{
 test.setTimeout(180000);page.setDefaultTimeout(60000);await page.setViewportSize({width:1280,height:900});
 const report={cases:[],errors:[],blocked:[],configSaved:false,identity:audit.identity()};
 const save=()=>fs.writeFileSync(info.outputPath('history-palette.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>report.errors.push(e.message));await audit.login(page);await audit.blockBusinessWrites(page,report.blocked);
 const root=page.locator('#local-groupimport-import');await expect(root).toHaveAttribute('data-easyedu-loading-ready','1');
 await page.addStyleTag({path:process.env.EASYEDU_CANDIDATE_CSS});
 const palette=JSON.parse(fs.readFileSync(process.env.EASYEDU_PALETTE_VALUES,'utf8'));
 const original=await root.evaluate(n=>({style:n.getAttribute('style'),attrs:Object.fromEntries(['custom-rails','dialog-palette','report-palette'].map(k=>[k,n.getAttribute('data-easyedu-'+k)]))}));
 const paint=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {color:s.color,background:s.backgroundColor,border:s.borderColor,width:r.width,height:r.height};};
 try{
  for(const state of ['official','custom','restored']){
   if(state==='custom')await root.evaluate((n,p)=>{n.setAttribute('style',p.style);for(const k of ['custom-rails','dialog-palette','report-palette'])n.setAttribute('data-easyedu-'+k,p.flags);},palette);
   if(state==='restored')await root.evaluate((n,p)=>{if(p.style===null)n.removeAttribute('style');else n.setAttribute('style',p.style);for(const [k,v]of Object.entries(p.attrs)){if(v===null)n.removeAttribute('data-easyedu-'+k);else n.setAttribute('data-easyedu-'+k,v);}},original);
   const history=page.locator('[data-local-groupimport-history-modal]');await expect(history).toHaveAttribute('data-local-groupimport-history-bound','1');
   const trigger=page.locator('[data-local-groupimport-history-open]:visible,[data-easyedu-navigation-action="mass-import-history"]:visible').first();
   await expect(trigger.or(page.locator('[data-easyedu-navigation-open]:visible')).first()).toBeVisible({timeout:60000});
   if(!await trigger.count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
   await trigger.click();await expect(history).toBeVisible();await audit.settle(history);
   const links=history.locator('.local-groupimport-import-history__export:visible');expect(await links.count()).toBeGreaterThan(0);
   const row={state,exports:await links.evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return {color:s.color,background:s.backgroundColor};})),historyHeader:await history.locator('.easyedu-dialog-header').evaluate(paint)};report.cases.push(row);save();
   if(state==='custom')expect(row.exports.every(v=>v.color==='rgb(123, 63, 152)')).toBe(true);
   if(state==='custom'){expect(row.historyHeader.color).toBe('rgb(123, 63, 152)');expect(row.historyHeader.background).not.toBe(report.cases[0].historyHeader.background);}
   await page.screenshot({path:info.outputPath('history-'+state+'.png')});
   const opener=history.locator('[data-local-groupimport-rollback-open]:visible').first();await opener.click();
   const rollback=page.locator('[data-local-groupimport-rollback-modal]');await expect(rollback).toBeVisible();await audit.settle(rollback);
   row.rollbackHeader=await rollback.locator('.local-groupimport-import-modal__header').evaluate(paint);
   row.rollbackCancel=await rollback.locator('[data-local-groupimport-rollback-close]').last().evaluate(paint);
   if(state==='custom')expect(row.rollbackCancel.color).toBe('rgb(123, 63, 152)');
   await page.screenshot({path:info.outputPath('history-rollback-'+state+'.png')});save();
   await page.keyboard.press('Escape');await expect(rollback).toBeHidden();await expect(history).toBeVisible();
   await page.keyboard.press('Escape');await expect(history).toBeHidden();
  }
  expect(report.cases[2].exports).toEqual(report.cases[0].exports);expect(report.cases[2].historyHeader).toEqual(report.cases[0].historyHeader);
  expect(report.cases[2].rollbackHeader).toEqual(report.cases[0].rollbackHeader);expect(report.cases[2].rollbackCancel).toEqual(report.cases[0].rollbackCancel);
  expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
 }finally{save();}
});
