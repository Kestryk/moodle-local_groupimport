const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {login,ready}=require('./k16-sort-copy-helper.cjs');
test('V2 native bounded actions and cross course ownership',async({page},info)=>{
 test.setTimeout(300000);const report={checks:[],errors:[],consoleErrors:[]};const save=()=>fs.writeFileSync(info.outputPath('bulk.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
 const manifest=path.resolve(info.outputDir,'../..','fixture-manifest.json'),m=JSON.parse(fs.readFileSync(manifest));
 const proof=()=>JSON.parse(cp.execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'k16-14-membership-proof.php'),'--moodle-root','C:/dev/Moodle 51 Perf/moodle','--manifest',manifest,'--action','snapshot','--existing','0','--multi','0'],{encoding:'utf8'}));
 const url=await login(page);await ready(page,url,'en',1600);const sesskey=await page.evaluate(()=>M.cfg.sesskey),endpoint=new URL('/local/groupimport/ajax.php',url).href;
 const check=async(lot,point,fn)=>{const r={lot,point,status:'RUNNING',measure:{}};report.checks.push(r);save();try{await fn(r);r.status='PASS';}catch(e){r.status='FAIL';r.error=e.message;r.capture=info.outputPath('failure-'+report.checks.length+'.png');await page.screenshot({path:r.capture}).catch(()=>{});}save();};
 const post=async form=>{const r=await page.request.post(endpoint,{form:{courseid:String(m.courseId),sesskey,...form}});return {http:r.status(),json:await r.json()};};
 const before=proof();
 for(const action of ['addusers','addemails','removemembers','deletegroups'])await check('R6',action+' refuses 501 before mutations',async r=>{const form={action,groupid:String(m.groupIds[0])};if(action==='addemails')form.emails=Array.from({length:501},(_,i)=>'v2-bound-'+i+'@example.invalid').join('\n');else for(let i=0;i<501;i++)form[(action==='deletegroups'?'groupids':'userids')+'['+i+']']=String(action==='deletegroups'?m.groupIds[0]:m.userIds[0]);if(action==='removemembers')form['groupids[0]']=String(m.groupIds[0]);r.measure=await post(form);expect(r.measure.json.success).toBe(false);expect(JSON.stringify(r.measure.json)).toMatch(/500/);expect(proof()).toEqual(before);});
 await check('R6','500 repeated existing members accepted without duplicates',async r=>{const form={action:'addusers',groupid:String(m.groupIds[0])};for(let i=0;i<500;i++)form['userids['+i+']']=String(m.userIds[0]);r.measure=await post(form);expect(r.measure.json.success).toBe(true);expect(proof()).toEqual(before);});
 await check('S4','foreign course cannot rename own fixture group',async r=>{r.measure=await post({courseid:'5',action:'renamegroup',groupid:String(m.groupIds[0]),name:'QA foreign scope refused'});expect(r.measure.json.success).toBe(false);expect(proof()).toEqual(before);});
 report.completed=true;save();expect(report.errors).toEqual([]);
});
