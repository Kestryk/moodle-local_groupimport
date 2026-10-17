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
const source=read('amd/src/local/cm/guide_hooks.js').replace(/export /g, '');
const helpersStart=source.indexOf('const emitNativePathCompletion =');
const helpersEnd=source.indexOf('// Navigation can portal',helpersStart);
assert(helpersStart >= 0 && helpersEnd > helpersStart);
const modules = fs.readdirSync(path.join(root,'amd/src/local/cm')).filter(f=>f.endsWith('.js'))
    .map(f=>read('amd/src/local/cm/'+f)).join('\n');
for(const step of ['select-source-member','open-member-move','choose-member-destination','confirm-member-move']) {
    assert(modules.includes("emitMemberPathCompletion(root, '"+step+"')"), 'Native milestone remains wired: '+step);
}
assert(read('amd/src/local/cm/guide.js').includes("selector === 'tutorial:member-move-dialog'"));
for(const language of ['en','fr']) {
    const data=JSON.parse(execFileSync(process.argv[2],[path.join(__dirname,'guide-current-curriculum-fixture.php'),language],
        {encoding:'utf8'}));
    // Retired numeric tutorial paths are deliberately absent after P2.
    assert.equal(data.modernCandidate.nativeActivated, true);
    assert(data.paths['practice-membership']?.length > 0);
    const memberPath=data.paths['reorganise-source-members'];
    const ids=['select-source-member','open-member-move','choose-member-destination','confirm-member-move'];
    assert.deepEqual(memberPath.map(step=>step.id),ids);
    memberPath.forEach((step,index)=>{
        assert.equal(step.completionMode,'event');assert.equal(step.autoHighlightNext,true);
        if(index) assert.equal(step.requiresStep,ids[index-1]);
        assert.ok(step.title && step.description);
    });
    assert.equal(data.templateData.slides.length,13);
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
console.log('PASS EN/FR: four distinct member milestones, retained paths, thirteen reading IDs and guarded production signals.');
