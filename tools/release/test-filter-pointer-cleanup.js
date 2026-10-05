// Exercise the actual owned handler slice, including outside-root releases.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../../amd/src/course_manager.js'),'utf8');
const start=source.indexOf('    const pointerHandledControls = new WeakSet();'),
    end=source.indexOf("    root.querySelectorAll('[data-easystud-advanced-filters]')",start);
assert.ok(start>0&&end>start);
for(const mode of ['outside-release','inside-release','outside-cancel']){
    const events={root:{},document:{}},timers=[],panel={},calls=[];
    let expanded=true,nested=true;
    const control={offsetParent:{},getAttribute:k=>k==='aria-expanded'?String(expanded):'participants'};
    const target={closest:()=>control},outside={closest:()=>null};
    const root={contains:c=>c===control,querySelector:()=>panel,
        addEventListener:(type,fn)=>events.root[type]=fn};
    const document={addEventListener:(type,fn)=>events.document[type]=fn};
    const dispatch=(where,type,inside=true)=>events[where][type]?.({target:inside?target:outside,
        pointerId:1,preventDefault(){}});
    vm.runInNewContext(source.slice(start,end),{root,document,window:{setTimeout:fn=>timers.push(fn)},
        closeChoicesWithin:()=>{const count=nested?1:0;nested=false;return count;},
        toggleAdvancedFilters:()=>{expanded=!expanded;calls.push(expanded);},
        emitGuidedCompletion(){},scheduleResponsiveUiRefresh(){},animateCompleteListAlignment(){},scheduleCompleteListAlignment(){}});
    dispatch('root','pointerdown');assert.equal(expanded,false);
    if(mode==='outside-cancel')dispatch('document','pointercancel',false);
    else{
        dispatch('document','pointerup',mode==='inside-release');
        if(mode==='inside-release')dispatch('root','click');
        while(timers.length)timers.shift()();
    }
    dispatch('root','click');assert.equal(expanded,true,mode+' next genuine click is not swallowed');
    assert.deepEqual(calls,[false,true],mode+' closes once and reopens once');
}
console.log('PASS More Filters outside release/cancel cleanup; same-pointer click suppression retained');
