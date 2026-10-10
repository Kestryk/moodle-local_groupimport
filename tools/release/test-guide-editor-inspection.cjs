/* eslint-env node */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
assert.equal(process.argv.length,3,'Usage: <php>');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const old=file=>execFileSync('git',['show','9288b66:'+file],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replace(/\r\n/g,'\n');
const removeBetween=(text,start,end)=>{
    const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a,start);
    return text.slice(0,a)+text.slice(b);
};
const source=read('amd/src/course_manager.js');
let restored=removeBetween(source,'const emitEditorInspectionCompletion =','\nconst getFixedHeaderOffset =');
restored=restored.replace("    modal.setAttribute('data-easystud-editor-context', type);\n",'');
restored=restored.replace('const closeModal = (completeInspection = true) => hideEasyStudModal(modal, () => {',
    'const closeModal = () => hideEasyStudModal(modal, () => {');
restored=restored.replace("        if (completeInspection) {\n            emitEditorInspectionCompletion(root, type, 'cancel-editor');\n        }\n",'');
restored=removeBetween(restored,'    // Guide review awaits the same native exit,','    modal.addEventListener(\'click\', event => {');
restored=restored.replace("    emitEditorInspectionCompletion(root, type, 'open-editor');\n",'');
restored=removeBetween(restored,'    const openEditorEntry =','    const openTarget =');
restored=removeBetween(restored,'        const editorTargets =',"        if (selector === 'tutorial:close-participant-move-dialog') {");
restored=removeBetween(restored,"        if (request.target === 'tutorial:close-group-editor'",'        if (openTarget(request.target)) {');
assert.ok(restored===old('amd/src/course_manager.js'),'Every unrelated native command, form, old path and Motion preserved');
let php=removeBetween(read('manage.php'),"            'groupEditorAction' =>","            'firstGroup' =>");
for(const type of ['group','grouping']){
    php=php.replace("            'inspect-"+type+"-settings' => get_string('editor_"+type+"_title', 'local_groupimport'),\n",'');
    php=php.replace("            'inspect-"+type+"-settings' => \\local_groupimport\\local\\guide_discovery::editor_inspection_path('"+type+"'),\n",'');
}
assert.ok(php===old('manage.php'),'Only eight typed targets and two paths/labels added');
let discovery=removeBetween(read('classes/local/guide_discovery.php'),"            if ($source === 'reference-5'",'            $result[] = $slide;');
discovery=removeBetween(discovery,'    /** Inspect actual editor fields and Cancel;','    /** Source-member transfer');
assert.ok(discovery===old('classes/local/guide_discovery.php'),'Reading IDs, migrations, old invitations/paths preserved');
for(const language of ['en','fr']){
    const file='lang/'+language+'/local_groupimport.php';
    assert.ok(read(file).replace(/^\$string\['editor_[^\n]+\n/gm,'')===old(file),'Original language strings preserved');
    const data=JSON.parse(execFileSync(process.argv[2],[path.join(__dirname,'guide-current-curriculum-fixture.php'),language],{encoding:'utf8'}));
    assert.equal(data.templateData.slides.length,12);
    for(const type of ['group','grouping']){
        const id='inspect-'+type+'-settings',steps=data.paths[id];
        assert.deepEqual(steps.map(step=>step.id),['open-editor','inspect-name','inspect-description','cancel-editor']);
        steps.forEach((step,index)=>{
            assert.equal(step.completionMode,'event');assert.equal(step.autoHighlightNext,true);
            assert.ok(step.title&&step.description&&step.target.startsWith(type+'Editor'));
            if(index)assert.equal(step.requiresStep,steps[index-1].id);
        });
        const invitation=data.templateData.slides.find(slide=>slide.id==='read-'+type+'-card');
        assert.equal(invitation.guidedpath,id);assert.equal(invitation.guidedpathsteps.items.length,4);
    }
}
for(const file of ['styles.css','templates/easyedu_guide.mustache','amd/src/easyedu_guide.js','amd/build/easyedu_guide.min.js']){
    assert.ok(read(file)===old(file),'Canonical presentation and engine unchanged: '+file);
}
const start=source.indexOf('    const closeModal = (completeInspection'),end=source.indexOf("    modal.addEventListener('click', event => {",start);
const openerStart=source.indexOf('    const openEditorDialog ='),openerEnd=source.indexOf('    const openTarget =',openerStart);
let openerCases=0;
for(const type of ['group','grouping'])for(const state of ['same','foreign','other','aria-hidden','hidden','open','missing','disabled']){
    let current=state==='same'||state==='foreign'?{hidden:false,getAttribute:()=>state==='same'?type:(type==='group'?'grouping':'group')}:null;
    let clicks=0;
    const host={querySelector:()=>current,querySelectorAll:()=>['other','aria-hidden','hidden'].includes(state)?[{
        hidden:state==='hidden',getAttribute:()=>state==='aria-hidden'?'true':null,getClientRects:()=>[{}]
    }]:[]};
    const ctx={root:host,openEditorEntry:()=>state==='missing'?null:{disabled:state==='disabled',click:()=>{
        clicks++;current={getAttribute:()=>type};
    }}};
    vm.runInNewContext(source.slice(openerStart,openerEnd)+'\nthis.openEditor=openEditorDialog;',ctx);
    const result=ctx.openEditor(type);
    assert.equal(!!result,['same','open','aria-hidden','hidden'].includes(state));
    assert.equal(clicks,['open','aria-hidden','hidden'].includes(state)?1:0);openerCases++;
}
const events=[],listeners={},modal={remove:()=>events.push('removed'),addEventListener:(key,value)=>listeners[key]=value};
let finish;
const context={modal,root:{},type:'group',returnFocus:null,
    emitEditorInspectionCompletion:(_root,type,step)=>events.push(type+':'+step),
    hideEasyStudModal:(_modal,callback)=>new Promise(resolve=>{finish=()=>{callback();resolve(true);};})};
vm.runInNewContext(source.slice(start,end)+'\nthis.closeUser=closeModal;',context);
(async()=>{
    const review=modal.easystudCloseEditor();assert.deepEqual(events,[]);finish();await review;
    assert.deepEqual(events,['removed'],'Guide review never claims user Cancel');events.length=0;
    const cancel=context.closeUser();assert.deepEqual(events,[]);finish();await cancel;
    assert.deepEqual(events,['removed','group:cancel-editor'],'Cancel completes only after native exit');
    console.log('PASS EN/FR: distinct editor paths, '+openerCases+' typed opener cases, exact native/CSS/Guide preservation and awaited Cancel/review semantics.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
