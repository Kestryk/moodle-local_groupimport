/* eslint-env node */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const [php,m45,m51,pw,output]=process.argv.slice(2),root=path.resolve(__dirname,'../..');
const sass=require('C:/Users/kj220291/AppData/Local/EasyEdu/tooling/sass-1.79.1/node_modules/sass');
const {chromium}=require(path.join(pw,'playwright'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const report={runtimeAccess:false,interfaces:[],visibility:[]};
(async()=>{
const fixture=path.join(root,'tools/release/fixtures/a10-readfilter-compat.php');
for(const moodle of [m45,m51]){const lib=path.join(moodle,'lib/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet');const row=JSON.parse(cp.execFileSync(php,[fixture,lib],{encoding:'utf8'}));assert(row.passed&&row.cases===8);report.interfaces.push(row);}
const baseline=path.join(path.dirname(output),'readfilter-baseline.php');fs.writeFileSync(baseline,cp.execFileSync('git',['-C',root,'show','108f0b2c:classes/local/import_reader.php']));
const old51=JSON.parse(cp.execFileSync(php,[fixture,path.join(m51,'lib/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet'),baseline],{encoding:'utf8'}));assert.equal(old51.cases,report.interfaces[1].cases);report.typed51Parity=true;
const old45=cp.spawnSync(php,[fixture,path.join(m45,'lib/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet'),baseline],{encoding:'utf8'});assert.notEqual(old45.status,0);assert((old45.stderr+old45.stdout).includes('must be compatible'));report.previous45SignatureFatalReproduced=true;
const markup=read('templates/manage.mustache');assert.equal((markup.match(/class="sr-only visually-hidden"/g)||[]).length,4);
const original=cp.execFileSync('git',['-C',root,'show','108f0b2c:templates/manage.mustache'],{encoding:'utf8'}).replace(/\r\n/g,'\n');assert.equal(markup.replace(/class="sr-only visually-hidden"/g,'class="visually-hidden"'),original);
assert.equal(read('version.php'),cp.execFileSync('git',['-C',root,'show','108f0b2c:version.php'],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{const page=await browser.newPage();await page.route('**/*',r=>r.abort());for(const [moodle,mixin,utility]of [[m45,'_screen-reader.scss','utilities/_screenreaders.scss'],[m51,'_visually-hidden.scss','helpers/_visually-hidden.scss']]){
 const base=path.join(moodle,'theme/boost/scss/bootstrap');const css=sass.compileString(fs.readFileSync(path.join(base,'mixins',mixin),'utf8')+'\n'+fs.readFileSync(path.join(base,utility),'utf8'),{logger:sass.Logger.silent}).css;
 await page.setContent('<div style="width:100px;height:30px"><span id="old" class="visually-hidden">Active filters</span><span id="new" class="sr-only visually-hidden">Active filters</span></div>');await page.addStyleTag({content:css});
 const row=await page.evaluate(()=>{const snap=id=>{const c=getComputedStyle(document.getElementById(id));return {width:c.width,height:c.height,position:c.position,clip:c.clip,overflow:c.overflow,text:document.getElementById(id).textContent};};return {old:snap('old'),current:snap('new')};});assert.equal(row.current.width,'1px');assert.equal(row.current.height,'1px');assert.equal(row.current.position,'absolute');assert.equal(row.current.text,'Active filters');if(moodle===m51)assert.deepEqual(row.old,row.current);report.visibility.push(row);
 }}finally{await browser.close();}report.passed=true;fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,interfaceCases:16,typed51Parity:true,old45Fatal:true,nativeCoreStyleCases:2,runtimeAccess:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
