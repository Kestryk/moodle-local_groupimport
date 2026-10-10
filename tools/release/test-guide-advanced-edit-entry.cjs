/* eslint-env node */
// Execute the bounded production availability guard and preserve unrelated code.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const old=file=>execFileSync('git',['show','e42f76d:'+file],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replace(/\r\n/g,'\n');
const source=read('amd/src/course_manager.js');
const bounds=text=>[text.indexOf('    const canOpenAdvancedSettingsFromContext ='),
    text.indexOf('    const setVisibleActions =')];
const [start,end]=bounds(source),baseline=old('amd/src/course_manager.js');
const [beforeStart,beforeEnd]=bounds(baseline);
assert.ok(start>0&&end>start&&beforeStart>0&&beforeEnd>beforeStart);
let restored=source.slice(0,start)+baseline.slice(beforeStart,beforeEnd)+source.slice(end);
restored=restored.replace("['group-open-advanced-settings', 'grouping-open-advanced-settings'].includes(\n"+
    "                    button.getAttribute('data-easystud-context-action'))",
    "button.getAttribute('data-easystud-context-action') === 'group-open-advanced-settings'");
restored=restored.replace("action === 'group-open-advanced-settings' || action === 'grouping-open-advanced-settings'",
    "action === 'group-open-advanced-settings'");
restored=restored.replace('const opener = contextOpener || document.activeElement;',
    'const opener = document.activeElement;');
assert.ok(restored===baseline,'Entire unrelated native source, commands, Guide and Motion preserved');
const addition="        'grouping-open-advanced-settings' => [\n"+
    "            'contexts' => 'grouping',\n            'icon' => 'fa-cog',\n"+
    "            'label' => get_string('advancedsettings', 'local_groupimport'),\n        ],\n";
assert.equal(read('manage.php').split(addition).length,2);
assert.ok(read('manage.php').replace(addition,'')===old('manage.php'),'Only one new existing-style menu command');
for(const file of ['styles.css','templates/easyedu_guide.mustache','amd/src/easyedu_guide.js']){
    assert.ok(read(file)===old(file),'Canonical paint and Guide engine preserved: '+file);
}
const evaluate=(responsive,kind,directVisible,count=1,complete=true,nativeUrl=true)=>{
    const direct=directVisible===null?null:{getClientRects:()=>directVisible?[{}]:[]};
    const target={matches:()=>kind==='group'||kind==='grouping',hasAttribute:()=>complete,
        getAttribute:()=>nativeUrl?'native-url':'',querySelector:()=>({querySelector:()=>direct})};
    const context={isResponsiveWorkspace:()=>responsive};
    vm.runInNewContext(source.slice(start,end)+'\nthis.check=canOpenAdvancedSettingsFromContext;',context);
    return context.check(Array.from({length:count},()=>target),target);
};
let cases=0;
for(const kind of ['group','grouping']){
    assert.equal(evaluate(true,kind,false),true);cases++;
    assert.equal(evaluate(true,kind,null),true);cases++;
    assert.equal(evaluate(true,kind,true),false);cases++;
    assert.equal(evaluate(false,kind,false),false);cases++;
    assert.equal(evaluate(true,kind,false,2),false);cases++;
    assert.equal(evaluate(true,kind,false,1,false),false);cases++;
    assert.equal(evaluate(true,kind,false,1,true,false),false);cases++;
}
assert.equal(evaluate(true,'participant',false),false);cases++;
process.stdout.write('PASS '+cases+' availability cases; exact unrelated source/PHP/CSS/Guide preservation.\n');
