const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {login,ready,settle}=require('./k16-sort-copy-helper.cjs');
test('V2 preview settled navigation native own8051',async({page},info)=>{
 test.setTimeout(1700000);const report={checks:[],errors:[],consoleErrors:[]};const save=()=>fs.writeFileSync(info.outputPath('v2-security-settled.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});page.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push(m.text());save();}});
 const url=await login(page),course=Number(url.searchParams.get('id')),manifest=path.resolve(info.outputDir,'../..','fixture-manifest.json');
 const fixture=JSON.parse(fs.readFileSync(manifest));
 const php=(action,file)=>JSON.parse(cp.execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'v2-security-runtime.php'),'--manifest',manifest,'--output',info.outputDir,'--action',action,...(file?['--file',file]:[])],{encoding:'utf8',maxBuffer:4000000}));
 const check=async(lot,point,fn)=>{const row={lot,point,status:'RUNNING',measure:{}};report.checks.push(row);save();try{await fn(row);row.status='PASS';}catch(e){row.status='FAIL';row.error=e.message;row.capture=info.outputPath('fail-'+report.checks.length+'.png');await page.screenshot({path:row.capture}).catch(()=>{});}save();};
 await check('S2/S5/S6/R9','native API and generated inputs',async row=>{row.measure=php('security');expect(row.measure.checks.every(r=>r.status==='PASS')).toBe(true);});
 const seed=JSON.parse(fs.readFileSync(info.outputPath('seed.json')));
 await ready(page,url,'en',1600);const sesskey=await page.evaluate(()=>M.cfg.sesskey);
 const endpoint=new URL('/local/groupimport/ajax.php',url).href;
 const post=async(form)=>{const r=await page.request.post(endpoint,{form:{courseid:String(course),sesskey,...form}});const text=await r.text();let json;try{json=JSON.parse(text);}catch{}return {http:r.status(),json,text:text.slice(0,500)};};
 for(const [point,fn] of [
  ['GET rejected',()=>page.request.get(endpoint,{params:{courseid:course,action:'renamegroup',groupid:fixture.groupIds[0],name:'V2 forbidden GET',sesskey}})],
  ['site course out of scope rejected',()=>page.request.post(endpoint,{form:{courseid:'1',action:'renamegroup',groupid:String(fixture.groupIds[0]),name:'V2 forbidden SITEID',sesskey}})],
  ['missing sesskey rejected',()=>page.request.post(endpoint,{form:{courseid:String(course),action:'renamegroup',groupid:String(fixture.groupIds[0]),name:'V2 forbidden sesskey'}})]
 ])await check('S4',point,async row=>{const r=await fn();const text=await r.text();let j;try{j=JSON.parse(text);}catch{}row.measure={http:r.status(),json:j,bodyPrefix:j?undefined:text.slice(0,200)};expect(j?.success===true).toBe(false);expect(r.status()>=400||!!j?.error||!!j?.exception||j?.success===false).toBe(true);});
 await check('R6','501 native addusers rejected',async row=>{const form={action:'addusers',groupid:String(fixture.groupIds[1])};for(let i=0;i<501;i++)form['userids['+i+']']=String(fixture.userIds[0]);row.measure=await post(form);expect(row.measure.json?.success).toBe(false);});
 await check('S7-M5','download and inspect native report XLSX',async row=>{const r=await page.request.get(new URL('/local/groupimport/export.php?id='+course+'&historyid='+seed.historyid,url).href);row.measure={http:r.status(),contentType:r.headers()['content-type']};expect(r.ok()).toBe(true);const file=info.outputPath('native-report.xlsx');fs.writeFileSync(file,await r.body());row.measure.inspection=php('xlsx',file);expect(row.measure.inspection.every(c=>c.status==='PASS')).toBe(true);for(const value of ['=1+1','+SUM(1,1)','-1+1','@SUM(1,1)'])expect(row.measure.inspection[0].measure.values).toContain("'"+value);});
 const importUrl=new URL('/local/groupimport/index.php?id='+course+'&lang=en',url).href;
 await check('R8','history list excludes large changes payload',async row=>{const r=await page.request.get(importUrl),html=await r.text();row.measure={http:r.status(),bytes:Buffer.byteLength(html),hasHistory:html.includes('v2-export.csv'),hasHeavyPayload:html.includes('x'.repeat(10000))};expect(row.measure.hasHistory).toBe(true);expect(row.measure.hasHeavyPayload).toBe(false);});
 const upload=async(file)=>{
  await page.goto(importUrl,{waitUntil:'domcontentloaded'});const root=page.locator('#local-groupimport-import');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
  await page.locator('[id^="filepicker-button-"]').click();await page.getByRole('tab',{name:/Upload a file/i}).click();const input=page.locator('input[type="file"][name="repo_upload_file"]');
  await input.setInputFiles({name:'v2-'+course+'-'+path.basename(file),mimeType:file.endsWith('.xlsx')?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv',buffer:fs.readFileSync(file)});
  const response=page.waitForResponse(r=>r.url().includes('/repository/repository_ajax.php')&&r.request().method()==='POST');await page.locator('.fp-upload-btn').click();const r=await response;let receipt;try{receipt=await r.json();}catch{receipt={body:(await r.text()).slice(0,200)};}return {root,receipt};
 };
 for(const filename of ['multiline-utf8.csv','multiline-cp1252.csv','formatted-3000.xlsx'])await check(filename.endsWith('xlsx')?'S6/R9':'S6',filename+' native editable preview and cancel',async row=>{
  const {root,receipt}=await upload(info.outputPath(filename));row.measure.upload={error:receipt.error};expect(receipt.error).toBeFalsy();await expect(root.locator('.filepicker-filename a')).toContainText(filename);await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#id_submitbutton').click({noWaitAfter:true})]);await expect(page.locator('#local-groupimport-import')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
  const rows=page.locator('[data-local-groupimport-preview-row]');await expect(rows).toHaveCount(filename.endsWith('xlsx')?3000:1,{timeout:120000});row.measure.previewRows=await rows.count();row.measure.firstGroup=await rows.first().locator('input[name^="groupname["]').inputValue();
  if(!filename.endsWith('xlsx'))expect(row.measure.firstGroup).toContain('Équipe été');await rows.first().locator('input[name^="groupname["]').fill('QA edited preview');await expect(rows.first().locator('input[name^="groupname["]')).toHaveValue('QA edited preview');
  await page.getByRole('link',{name:'Cancel',exact:true}).click();await expect(page.locator('#id_submitbutton')).toBeVisible();expect(await rows.count()).toBe(0);row.measure.cancelled=true;
 });
 await check('S6','native picker obeys course maxbytes 1024',async row=>{try{row.measure.setting=php('maxbytes');const {receipt}=await upload(info.outputPath('formatted-3000.xlsx'));row.measure.upload=receipt;expect(!!receipt.error).toBe(true);}finally{php('restorebytes');}});
 expect(report.errors).toEqual([]);save();
});
