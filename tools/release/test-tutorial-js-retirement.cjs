// Source/AMD parity only: no runtime, Moodle service, browser or database.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const historical=f=>execFileSync('git',['-C',root,'show','c33fbbeb:'+f],{encoding:'utf8',maxBuffer:8*1024*1024}).replace(/\r\n/g,'\n');
const before=f=>execFileSync('git',['-C',root,'show','05a84c57:'+f],{encoding:'utf8',maxBuffer:8*1024*1024}).replace(/\r\n/g,'\n');
let checks=0;const check=(ok,message)=>{checks++;assert(ok,message);};
const file='amd/src/local/cm/guide.js',source=historical(file),old=before(file);
const active=s=>s.slice(s.indexOf('const bindTryActionsCompactMove ='),s.indexOf('export const bindTutorialModal =')<0?undefined:s.indexOf('export const bindTutorialModal =')).replace('// even when the legacy tutorial modal is not rendered.','// independently from the removed legacy tutorial.').trim();
check(active(source)===active(old),'all shared targets, event handlers, compact moves and opener bodies identical');
check(!source.includes('bindTutorialModal')&&!source.includes('getFixedHeaderOffset'),'dead binder/header helper removed');
const orchestrator=before('amd/src/course_manager.js').replace('bindSharedGuideTargets, bindTutorialModal','bindSharedGuideTargets').replace('            () => bindTutorialModal(root),\n','');
check(orchestrator===historical('amd/src/course_manager.js'),'orchestrator differs only by dead binding');
const navigation=before('amd/src/local/cm/navigation.js').replace("'[data-easyedu-guide-root], [data-easystud-open-tutorial]'","'[data-easyedu-guide-root]'").replace("'[data-easystud-tutorial-modal], [data-easyedu-guide-modal]'","'[data-easyedu-guide-modal]'").replace("'[data-easystud-guided-panel], [data-easyedu-guided-panel], ' +\n            '[data-easystud-tutorial-return], [data-easyedu-guide-return]'","'[data-easyedu-guided-panel], [data-easyedu-guide-return]'");
check(navigation===historical('amd/src/local/cm/navigation.js'),'navigation differs only by removed legacy selectors');
for(const f of ['templates/manage.mustache','amd/src/easyedu_guide.js','classes/local/guide_discovery.php','manage.php','styles.css','styles/student-management.css','styles/mass-import.css','styles/administration.css'])check(before(f)===historical(f),f+' unchanged');
function exportsOf(code){const api={};vm.runInNewContext(code,{define:(name,deps,factory)=>factory(...deps.map(d=>d==='exports'?api:{}))});return api;}
const oldApi=exportsOf(before('amd/build/local/cm/guide.min.js')),newApi=exportsOf(historical('amd/build/local/cm/guide.min.js'));
check(typeof oldApi.bindTutorialModal==='function'&&!('bindTutorialModal'in newApi),'only legacy export retired');
check(Object.keys(newApi).filter(k=>k!=='__esModule').join(',')===Object.keys(oldApi).filter(k=>!['__esModule','bindTutorialModal'].includes(k)).join(','),'all other compiled exports retained');
for(const name of Object.keys(newApi).filter(k=>k!=='__esModule'))check(typeof newApi[name]==='function',name+' AMD callable');
let queries=0;oldApi.bindTutorialModal({querySelector:selector=>{assert.equal(selector,'[data-easyedu-guide-root]');queries++;return {};}});
check(queries===1,'removed baseline binder did no work on active shared Guide');
check(!historical('amd/build/course_manager.min.js').includes('bindTutorialModal'),'built orchestrator has no legacy call');

// Historical full-file proof above is immutable. Current checks focus on the retired
// feature and its surviving integration, so later A11Y/Guide/SCSS work remains allowed.
const historicalChecks=checks;
function currentContract(current){
 const guide=current(file);
 check(guide.includes('const bindTryActionsCompactMove ='),'current shared binding boundary exists');
 check(active(guide)===active(old),'current shared target/event/compact-move/opener bodies retained');
 check(!/\b(?:bindTutorialModal|getFixedHeaderOffset)\b/.test(guide),'current dead binder/helper absent');
 const manager=current('amd/src/course_manager.js');
 check(!/\bbindTutorialModal\b/.test(manager),'current orchestrator has no legacy import or call');
 check(/import\s*\{\s*bindSharedGuideTargets\s*\}\s*from\s*['"]\.\/local\/cm\/guide['"]/.test(manager),'active Guide binder imported');
 check((manager.match(/\(\) => bindSharedGuideTargets\(root\)/g)||[]).length===1,'active Guide binder scheduled once');
 const nav=current('amd/src/local/cm/navigation.js');
 // data-easystud-guided-panel remains an accepted alias in the floating-control selector.
 check(nav.includes('[data-easystud-guided-panel]:not([hidden])'),'accepted floating-control alias retained');
 check(!/data-easystud-(?:open-tutorial|tutorial-modal|tutorial-return)/.test(nav),'no retired navigation selectors');
 const launcher=current('amd/src/local/cm/guide_launcher.js');
 check(nav.includes("import {bindGuideLauncher} from './guide_launcher';") &&
     nav.includes('bindGuideLauncher(root, responsiveWorkspaceQuery)'), 'shared launcher remains wired');
 check(launcher.includes('[data-easyedu-guide-root]'), 'shared launcher retains canonical Guide root');
 for(const marker of ['data-easyedu-guide-modal','data-easyedu-guided-panel','data-easyedu-guide-return'])check(nav.includes(marker),'retains '+marker);
 const api=exportsOf(current('amd/build/local/cm/guide.min.js'));
 check(!('bindTutorialModal' in api),'current compiled legacy export absent');
 check(Object.keys(api).filter(k=>k!=='__esModule').sort().join(',')===Object.keys(oldApi).filter(k=>!['__esModule','bindTutorialModal'].includes(k)).sort().join(','),'all current compiled exports retained');
 for(const name of Object.keys(api).filter(k=>k!=='__esModule'))check(typeof api[name]==='function',name+' current AMD callable');
 check(!current('amd/build/course_manager.min.js').includes('bindTutorialModal'),'current built orchestrator has no legacy call');
}
currentContract(read);
const currentChecks=checks-historicalChecks;
const mutations=[
 ['amd/src/local/cm/guide_launcher.js',s=>s.replace(/data-easyedu-guide-root/g,'broken-guide-root')],
 [file,s=>s+'\nexport const bindTutorialModal = () => {};'],
 [file,s=>s.replace('const bindTryActionsCompactMove =','const BROKEN =')],
 ['amd/src/course_manager.js',s=>s.replace('() => bindSharedGuideTargets(root)','() => void root')],
 ['amd/src/local/cm/navigation.js',s=>s+'\n// data-easystud-tutorial-return'],
 ['amd/build/course_manager.min.js',s=>s+'\n/* bindTutorialModal */'],
 ['amd/build/local/cm/guide.min.js',s=>s.replace(/bindSharedGuideTargets/g,'brokenSharedGuideTargets')],
];
for(const [file,mutate] of mutations)assert.throws(()=>currentContract(name=>name===file?mutate(read(name)):read(name)),undefined,'reject regression in '+file);
console.log(JSON.stringify({surface:'P2-js-current-contract',passed:true,historicalRef:'c33fbbeb',historicalChecks,currentChecks,rejectedMutations:mutations.length,runtimeAccess:false}));
