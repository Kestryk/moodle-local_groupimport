/* eslint-env node */
// Pure production data / adapter proof: no Moodle bootstrap, DB or transaction.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length,3,'Usage: <php>');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const old=file=>execFileSync('git',['show',`6087be542aa0b2eb641dd0ade10f87c0520192c1:${file}`],
    {cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replace(/\r\n/g,'\n');
const source=read('amd/src/course_manager.js');
const removeOne=(text,chunk)=>{
    assert.equal(text.split(chunk).length,2,'One bounded addition');return text.replace(chunk,'');
};
let restored=source;
for(const chunk of [
    "    if (selectedMembers.length) {\n        emitMemberPathCompletion(root, 'select-source-member');\n    }\n",
    "        if (type === 'member' && selectedCount > 0 && hasDestination) {\n"+
        "            emitMemberPathCompletion(root, 'open-member-move');\n        }\n",
    "        if (contextType === 'member' && destination.value &&\n"+
        "                getGroupElementsById(root, destination.value).length &&\n"+
        "                memberSnapshot.some(pair => pair.groupid !== destination.value)) {\n"+
        "            emitMemberPathCompletion(root, 'choose-member-destination');\n        }\n",
    "                emitMemberPathCompletion(root, 'confirm-member-move');\n",
]) restored=removeOne(restored,chunk);
const helpersStart=source.indexOf('const emitNativePathCompletion =');
const helpersEnd=source.indexOf('const getFixedHeaderOffset =',helpersStart);
const oldSource=old('amd/src/course_manager.js');
const oldStart=oldSource.indexOf('const emitPracticeCompletion =');
const oldEnd=oldSource.indexOf('const getFixedHeaderOffset =',oldStart);
let originalHelper=source.slice(helpersStart,helpersEnd)
    .replace('const emitNativePathCompletion = (root, path, step) => {','const emitPracticeCompletion = (root, step) => {')
    .replace("'[data-easyedu-guide-checklist][data-easyedu-guide-path=\"' + path + '\"]'",
        "'[data-easyedu-guide-checklist][data-easyedu-guide-path=\"practice-membership\"]'")
    .replace('detail: {path, step}',"detail: {path: 'practice-membership', step}")
    .replace(/const emitPracticeCompletion = \(root, step\) => emitNativePathCompletion[^\n]+\n/,'')
    .replace(/const emitMemberPathCompletion = \(root, step\) => emitNativePathCompletion[^\n]+\n/,'')
    .replace(/\n{3}$/, '\n\n');
assert.equal(originalHelper,oldSource.slice(oldStart,oldEnd),'Previous Practice guard exactly preserved');
restored=restored.replace(source.slice(helpersStart,helpersEnd),oldSource.slice(oldStart,oldEnd));
const memberOpenerStart=restored.indexOf("        if (selector === 'tutorial:member-move-dialog') {");
const memberOpenerEnd=restored.indexOf("        if (selector === 'tutorial:participant-card-actions') {",memberOpenerStart);
assert.ok(memberOpenerStart>0 && memberOpenerEnd>memberOpenerStart);
restored=restored.slice(0,memberOpenerStart)+restored.slice(memberOpenerEnd);
const memberCloseStart=restored.indexOf("        if (request.target === 'tutorial:close-member-move-dialog') {");
const memberCloseEnd=restored.indexOf('        if (openTarget(request.target)) {',memberCloseStart);
assert.ok(memberCloseStart>0 && memberCloseEnd>memberCloseStart);
restored=restored.slice(0,memberCloseStart)+restored.slice(memberCloseEnd);
assert.equal(restored,oldSource,'Every native transaction, selection, Motion and previous opener preserved');
let php=read('manage.php');
const targetsStart=php.indexOf("            'groupMemberSelection' =>");
const targetsEnd=php.indexOf("            'firstGroup' =>",targetsStart);
assert.ok(targetsStart>0 && targetsEnd>targetsStart);
php=php.slice(0,targetsStart)+php.slice(targetsEnd);
php=removeOne(php,"            'reorganise-source-members' => get_string('member_path_title', 'local_groupimport'),\n");
php=removeOne(php,"            'reorganise-source-members' => \\local_groupimport\\local\\guide_discovery::source_member_path(),\n");
assert.equal(php,old('manage.php'),'All unrelated PHP and original Guide declarations preserved');
let discovery=read('classes/local/guide_discovery.php');
const invitationStart=discovery.indexOf("            if ($source === 'discovery-membership') {");
const invitationEnd=discovery.indexOf('            $result[] = $slide;',invitationStart);
assert.ok(invitationStart>0 && invitationEnd>invitationStart);
discovery=discovery.slice(0,invitationStart)+discovery.slice(invitationEnd);
const methodStart=discovery.indexOf('    /** Source-member transfer is distinct');
const methodEnd=discovery.indexOf('    /** Six native milestones;',methodStart);
assert.ok(methodStart>0 && methodEnd>methodStart);
discovery=discovery.slice(0,methodStart)+discovery.slice(methodEnd);
assert.equal(discovery,old('classes/local/guide_discovery.php'),'Reading mappings and every other lesson preserved');
for(const language of ['en','fr']) {
    const file=`lang/${language}/local_groupimport.php`;
    assert.equal(read(file).replace(/\n\n\$string\['member_path_label'\][\s\S]*$/, '\n'),old(file),
        'All previous localized strings preserved');
}
for(const file of ['styles.css','templates/easyedu_guide.mustache','amd/src/easyedu_guide.js','amd/build/easyedu_guide.min.js']) {
    assert.equal(read(file),old(file),'Canonical presentation/engine unchanged');
}

const archive=JSON.parse(read('docs/testing/guide-historical-presentation-archive-2026-10-10.json'));
for(const language of ['en','fr']) {
    const data=JSON.parse(execFileSync(process.argv[2],[path.join(__dirname,'guide-current-curriculum-fixture.php'),language],
        {encoding:'utf8'}));
    const previous=archive.languages.find(item=>item.language===language);
    for(const [key,steps] of Object.entries(previous.paths)) assert.deepEqual(data.paths[key],steps,'Original path retained');
    const memberPath=data.paths['reorganise-source-members'];
    const ids=['select-source-member','open-member-move','choose-member-destination','confirm-member-move'];
    assert.deepEqual(memberPath.map(step=>step.id),ids);
    memberPath.forEach((step,index)=>{
        assert.equal(step.completionMode,'event');assert.equal(step.autoHighlightNext,true);
        if(index) assert.equal(step.requiresStep,ids[index-1]);
        assert.ok(step.title && step.description);
    });
    assert.equal(data.templateData.slides.length,12);
    assert.deepEqual(data.templateData.slides.map(slide=>slide.id),data.readingContract.slideIds);
    const invitation=data.templateData.slides.find(slide=>slide.id==='add-or-move-members');
    assert.equal(invitation.guidedpath,'reorganise-source-members');
    assert.equal(invitation.guidedpathsteps.items.length,4);
    assert.ok(invitation.guidedpathcontent.includes(language==='fr'?'confirmation':'confirmation'));
}

let activePath='reorganise-source-members',next='select-source-member',disabled=false,connected=true;
const events=[];
const checklist={hidden:false,querySelector:()=>next ? {disabled,getAttribute:()=>next}:null};
const host={get isConnected(){return connected;},dispatchEvent:event=>events.push(event.detail)};
const sandbox={document:{querySelector:selector=>selector.includes(`path="${activePath}"`) ? checklist:null},
    CustomEvent:class {constructor(name,options){this.detail=options.detail;}},host};
vm.runInNewContext(source.slice(helpersStart,helpersEnd)+'\nthis.emitMember=emitMemberPathCompletion;this.emitPractice=emitPracticeCompletion;',sandbox);
sandbox.emitPractice(host,'select-participant');sandbox.emitMember(host,'confirm-member-move');
assert.equal(events.length,0,'Wrong path and out-of-order signals rejected');
disabled=true;sandbox.emitMember(host,next);assert.equal(events.length,0);
disabled=false;connected=false;sandbox.emitMember(host,next);assert.equal(events.length,0);
connected=true;sandbox.emitMember(host,next);assert.equal(events.length,1);
assert.equal(events[0].path,activePath);assert.equal(events[0].step,next);
checklist.hidden=true;sandbox.emitMember(host,next);assert.equal(events.length,1);
console.log('PASS EN/FR: four distinct member milestones, original paths, twelve reading IDs, guarded signals and native source preservation.');
