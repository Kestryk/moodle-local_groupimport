const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {login,ready,settle,view}=require('./k16-sort-copy-helper.cjs');
test('V2 native participant context menu and held drag counters',async({page},info)=>{
 test.setTimeout(900000);const report={checks:[],errors:[],consoleErrors:[]},save=()=>fs.writeFileSync(info.outputPath('menu-drag.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
 const proof=action=>JSON.parse(cp.execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'k16-14-membership-proof.php'),'--moodle-root','C:/dev/Moodle 51 Perf/moodle','--manifest',path.resolve(info.outputDir,'../..','fixture-manifest.json'),'--action',action,'--existing','0','--multi','0'],{encoding:'utf8'}));
 const url=await login(page);page.setDefaultTimeout(20000);
 for(const lang of ['fr','en'])for(const width of [1600,768,390]){
  const before=proof('reset'),[source,destination,empty]=before.groupIds,uid=before.userId;const root=await ready(page,new URL(url),lang,width);await view(root,'participants');
  const user=()=>root.locator('[data-easystud-user][data-user-id="'+uid+'"]:visible').first(),card=id=>root.locator('[data-easystud-group-id="'+id+'"]:visible').first(),count=id=>card(id).locator('[data-easystud-count-value]').first();
  const check=async(point,fn)=>{const row={lot:'K16-14b',lang,width,point,status:'RUNNING',measure:{before:proof('snapshot')}};report.checks.push(row);save();try{await fn(row);row.status='PASS';}catch(e){row.status='FAIL';row.error=e.message;row.capture=info.outputPath('failure-'+lang+'-'+width+'-'+report.checks.length+'.png');await page.screenshot({path:row.capture}).catch(()=>{});await page.keyboard.press('Escape').catch(()=>{});}save();};
  await check('native context menu adds and updates destination without reload',async row=>{
   await user().hover();const menu=user().locator('[data-easystud-card-menu]:visible');if(await menu.count())await menu.click();else await user().click({button:'right'});
   await root.locator('[data-easystud-context-action="participant-move-selected"]:visible').click();const modal=root.locator('[data-easystud-move-modal]');await expect(modal).toBeVisible();const chooser=modal.locator('.easyedu-searchable-choice');await chooser.locator('.easyedu-searchable-choice__trigger').click();await chooser.locator('input[type="search"]').fill('QA Destination Beta');await settle(chooser);const option=chooser.locator('.easyedu-searchable-choice__option:visible').filter({hasText:'QA Destination Beta'});await option.focus();await option.press('Enter');
   const receipt=page.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&r.request().method()==='POST');await modal.locator('[data-easystud-confirm-move]').click();row.measure.response=await(await receipt).json();expect(row.measure.response.success).toBe(true);await expect(modal).toBeHidden();await view(root,'groups');await expect(count(destination)).toHaveText('2');row.measure.count=await count(destination).innerText();row.measure.after=proof('snapshot');expect(row.measure.after.rows.some(r=>Number(r.groupid)===destination)).toBe(true);
  });
  if(width===1600)await check('native held participant drag onto empty group updates immediately',async row=>{
   await view(root,'participants');await user().scrollIntoViewIfNeeded();await card(empty).scrollIntoViewIfNeeded();await settle(root);const a=await user().boundingBox(),b=await card(empty).boundingBox();expect(a).not.toBeNull();expect(b).not.toBeNull();row.measure.drag={from:{x:a.x+12,y:a.y+a.height/2},to:{x:b.x+Math.min(100,b.width/2),y:b.y+30},heldMs:750};save();
   const receipt=page.waitForResponse(r=>r.url().includes('/local/groupimport/ajax.php')&&r.request().method()==='POST');await page.mouse.move(row.measure.drag.from.x,row.measure.drag.from.y);await page.mouse.down();await page.mouse.move(row.measure.drag.to.x,row.measure.drag.to.y,{steps:12});await page.waitForTimeout(750);await page.mouse.up();row.measure.response=await(await receipt).json();expect(row.measure.response.success).toBe(true);await expect(count(empty)).toHaveText('1');row.measure.count=await count(empty).innerText();row.measure.after=proof('snapshot');expect(row.measure.after.rows.some(r=>Number(r.groupid)===empty)).toBe(true);
  });
 }
 report.completed=true;save();expect(report.errors).toEqual([]);
});
