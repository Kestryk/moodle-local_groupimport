// Source/AMD parity only: no runtime, Moodle service, browser or database.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const before=f=>execFileSync('git',['-C',root,'show','05a84c57:'+f],{encoding:'utf8',maxBuffer:8*1024*1024}).replace(/\r\n/g,'\n');
let checks=0;const check=(ok,message)=>{checks++;assert(ok,message);};
const file='amd/src/local/cm/guide.js',source=read(file),old=before(file);
const active=s=>s.slice(s.indexOf('const bindTryActionsCompactMove ='),s.indexOf('export const bindTutorialModal =')<0?undefined:s.indexOf('export const bindTutorialModal =')).replace('// even when the legacy tutorial modal is not rendered.','// independently from the removed legacy tutorial.').trim();
check(active(source)===active(old),'all shared targets, event handlers, compact moves and opener bodies identical');
check(!source.includes('bindTutorialModal')&&!source.includes('getFixedHeaderOffset'),'dead binder/header helper removed');
const orchestrator=before('amd/src/course_manager.js').replace('bindSharedGuideTargets, bindTutorialModal','bindSharedGuideTargets').replace('            () => bindTutorialModal(root),\n','');
check(orchestrator===read('amd/src/course_manager.js'),'orchestrator differs only by dead binding');
const navigation=before('amd/src/local/cm/navigation.js').replace("'[data-easyedu-guide-root], [data-easystud-open-tutorial]'","'[data-easyedu-guide-root]'").replace("'[data-easystud-tutorial-modal], [data-easyedu-guide-modal]'","'[data-easyedu-guide-modal]'").replace("'[data-easystud-guided-panel], [data-easyedu-guided-panel], ' +\n            '[data-easystud-tutorial-return], [data-easyedu-guide-return]'","'[data-easyedu-guided-panel], [data-easyedu-guide-return]'");
check(navigation===read('amd/src/local/cm/navigation.js'),'navigation differs only by removed legacy selectors');
for(const f of ['templates/manage.mustache','amd/src/easyedu_guide.js','classes/local/guide_discovery.php','manage.php','styles.css','styles/student-management.css','styles/mass-import.css','styles/administration.css'])check(before(f)===read(f),f+' unchanged');
function exportsOf(code){const api={};vm.runInNewContext(code,{define:(name,deps,factory)=>factory(...deps.map(d=>d==='exports'?api:{}))});return api;}
const oldApi=exportsOf(before('amd/build/local/cm/guide.min.js')),newApi=exportsOf(read('amd/build/local/cm/guide.min.js'));
check(typeof oldApi.bindTutorialModal==='function'&&!('bindTutorialModal'in newApi),'only legacy export retired');
check(Object.keys(newApi).filter(k=>k!=='__esModule').join(',')===Object.keys(oldApi).filter(k=>!['__esModule','bindTutorialModal'].includes(k)).join(','),'all other compiled exports retained');
for(const name of Object.keys(newApi).filter(k=>k!=='__esModule'))check(typeof newApi[name]==='function',name+' AMD callable');
let queries=0;oldApi.bindTutorialModal({querySelector:selector=>{assert.equal(selector,'[data-easyedu-guide-root]');queries++;return {};}});
check(queries===1,'removed baseline binder did no work on active shared Guide');
check(!read('amd/build/course_manager.min.js').includes('bindTutorialModal'),'built orchestrator has no legacy call');
console.log(JSON.stringify({surface:'P2-js-parity',passed:true,checks,removedSourceBytes:Buffer.byteLength(old)-Buffer.byteLength(source),runtimeAccess:false}));
