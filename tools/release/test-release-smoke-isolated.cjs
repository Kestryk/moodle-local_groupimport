// Bounded standalone release smoke. No Moodle bootstrap/config.php, network or DB.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const [php,lib,output]=process.argv.slice(2);
if(!php||!lib||!output||![php,lib,output].every(path.isAbsolute))throw Error('Pass absolute PHP executable, Moodle lib sources and external JSON paths');
if(path.resolve(output).toLowerCase().startsWith(root.toLowerCase()+path.sep))throw Error('Keep generated evidence outside the repository');
const cases=[
 ['preview','test-import-preview.php'],['execution','test-import-execution.php'],
 ['privacy','fixtures/s2-privacy-isolated.php'],['ajax','fixtures/security-s4-isolated.php'],
 ['manage','fixtures/security-s4-isolated.php','manage'],['identity','fixtures/security-s5-isolated.php'],
 ['reader','fixtures/security-s6-isolated.php',lib],['export','fixtures/security-s7-m5-isolated.php',lib],
 ['bulk','fixtures/r6-bulk-actions-isolated.php'],['history','fixtures/r8-history-list-isolated.php'],
 ['formatted-xlsx','fixtures/r9-formatted-xlsx-isolated.php',lib],
];
const results=[];
for(const [name,file,...args] of cases){
 const run=spawnSync(php,[path.join(__dirname,file),...args],{encoding:'utf8',timeout:60000,maxBuffer:1024*1024,cwd:root});
 let value;try{value=JSON.parse((run.stdout||'').trim());}catch{value=null;}
 results.push({name,exit:run.status,passed:run.status===0&&value?.passed===true,result:value,error:run.error?.message||((run.stderr||'').trim().slice(0,1000))});
}
for(const name of ['test-security-escaping.cjs','test-filter-engine.cjs']){
 const run=spawnSync(process.execPath,[path.join(__dirname,name)],{encoding:'utf8',timeout:60000,maxBuffer:1024*1024,cwd:root});
 results.push({name,exit:run.status,passed:run.status===0,error:run.error?.message||((run.stderr||'').trim().slice(0,1000))});
}
const report={surface:'TRI19-isolated-release-smoke',passed:results.every(r=>r.passed),results,runtimeAccess:false,nativePhpunit:'NOT_RUN',nativeBehat:'NOT_RUN'};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:results.length,failed:results.filter(r=>!r.passed).map(r=>r.name),nativePhpunit:report.nativePhpunit,nativeBehat:report.nativeBehat}));
process.exitCode=report.passed?0:1;
