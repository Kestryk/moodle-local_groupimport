const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const baseline='24b82fb2a170d6c82d2c741f7e9f605120fa420c';
const old=file=>execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).replace(/\r\n/g,'\n');
const source=read('amd/src/course_manager.js');
const start=source.indexOf('const bindTagToggles = root =>');
const end=source.indexOf('const bindHoverPopovers',start);
const helper=source.slice(start,end);
assert.ok(start>0&&end>start);
const repaired=helper.replace('syncParticipantTagOverflow(card);','syncParticipantTagOverflow(root);')
    .replace('            // A local disclosure changes no result order or page. Reinserting\n'+
        "            // sorted cards here destroys the native drawer's scroll anchor.\n",'')
    .replace('scheduleResponsiveUiRefresh(root, {pagination: false})','scheduleResponsiveUiRefresh(root)');
assert.ok(source.slice(0,start)+repaired+source.slice(end)===old('amd/src/course_manager.js'),
    'Exact two bounded edits; unrelated native controller retained');
for(const file of ['amd/src/motion.js','amd/build/motion.min.js','styles.css','templates/manage.mustache',
    'ajax.php','amd/src/easyedu_guide.js','amd/src/csv_import.js','settings.php','version.php'])
    assert.ok(read(file)===old(file),file+' unchanged');
let cases=0;
for(const expanded of [false,true]) {
    let callback,measured,refresh,options;
    const card={};
    const container={closest:()=>card};
    const toggle={closest:()=>container,getAttribute:()=>expanded?'1':'0',setAttribute(name,value){this.value=value;}};
    const rootNode={contains:()=>true,addEventListener(type,handler){callback=handler;}};
    const bind=vm.runInNewContext(helper+'\nbindTagToggles;',{
        Motion:{timing:{normal:360},resize(element,mutate,config){assert.equal(element,card);options=config;mutate();config.onComplete();}},
        syncParticipantTagOverflow:node=>{measured=node;},
        scheduleResponsiveUiRefresh:(node,config)=>{assert.equal(node,rootNode);refresh=config;},
    });
    bind(rootNode);
    callback({target:{closest:selector=>selector==='[data-easystud-toggle-tags]'?toggle:null}});
    assert.equal(measured,card);assert.equal(refresh.pagination,false);
    assert.equal(options.duration,360);assert.equal(toggle.value,expanded?'0':'1');cases++;
}
console.log(JSON.stringify({status:'PASS',actualClickCases:cases,completeUnrelatedSourcePreserved:true,
    acceptedMotionUnchanged:true,browserProof:false},null,2));
