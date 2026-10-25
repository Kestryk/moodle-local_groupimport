'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const sources=['amd/src/easyedu_guide.js','easyedu-guide-kit/amd/src/easyedu_guide.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
if(process.argv[2])sources.push(fs.readFileSync(path.join(process.argv[2],'guide/amd/src/easyedu_guide.js'),'utf8'));
const declarations=sources.map(s=>{s=s.replace(/\r\n/g,'\n');const matches=s.match(/const placeWelcome = root => \{[\s\S]*?\n\};/g);assert.equal(matches?.length,1);return matches[0];});
declarations.forEach(d=>assert.equal(d,declarations[0],'Canonical and mirrored placement stay identical'));
function place({avoid=true,hidden=false,anchorTop=288,height=621,protectedAbove=false}={}){
 const values={},invitation={hidden:false,offsetWidth:600,offsetHeight:152,style:{setProperty:(n,v)=>values[n]=v},dataset:{}};
 const target={getBoundingClientRect:()=>({left:1085,right:1201,top:anchorTop,bottom:anchorTop+40,width:116})};
 const controls=[{hidden,getBoundingClientRect:()=>({left:560,right:1240,top:protectedAbove?100:450,bottom:protectedAbove?260:498})}];
 const context={document:{documentElement:{clientWidth:1366},querySelectorAll:selector=>{assert.equal(selector,'[data-test-workspace-control]');return controls;}},window:{innerWidth:1366,innerHeight:height},isVisibleElement:e=>!e.hidden};
 vm.runInNewContext(declarations[0]+'\nthis.place=placeWelcome;',context);
 context.place({querySelector:()=>invitation,easyeduGuideWelcomeTarget:target,easyeduGuideConfig:{welcomeAvoidTargets:avoid?'[data-test-workspace-control]':''}});
 return {values,placement:invitation.dataset.easyeduV3Placement};
}
assert.equal(place({avoid:false}).values['--easyedu-v3-banner-top'],'346px','Unconfigured consumers keep below-anchor geometry');
assert.equal(place().values['--easyedu-v3-banner-top'],'118px','Controls are not obscured when the upper slot fits');
assert.equal(place().placement,'above');
assert.equal(place({hidden:true}).placement,'below','Hidden controls do not reserve space');
assert.equal(place({protectedAbove:true}).placement,'below','Do not move onto protected controls');
assert.equal(place({avoid:false,height:480}).placement,'above','Existing short-viewport flip retained');
assert.equal(place({anchorTop:30,height:180}).placement,'none','Existing viewport clamp retained');
const config=fs.readFileSync(path.join(root,'classes/output/guide_config.php'),'utf8');
assert.ok(config.includes("'welcomeAvoidTargets' => '[data-easystud-layout-mode], [data-easystud-mobile-view]'"));
console.log('PASS 6 placement cases, consumer opt-in and canonical/mirror parity');
