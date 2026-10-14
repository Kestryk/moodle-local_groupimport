// Execute the actual bootstrap with virtual time and completed-resource events.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/loading_state_bootstrap.js'),'utf8');
function simulate({progress=[],frame=null,ready=null,observer=true,reduced=false}={}){
    let now=0,sequence=0;const timers=new Map(),mutations=[],resources=[],resourceStops=[],states=[],events=[],classes=new Set();
    const timer=(fn,delay=0)=>{const id=++sequence;timers.set(id,{at:now+delay,fn});return id;};
    const attrs=new Map([['data-easystud-loading-state','loading'],['data-easystud-loading-reveal-duration','320'],
        ['data-easyedu-loading-recover-late-ready','1']]);
    const content={hidden:true,inert:false,getBoundingClientRect:()=>({width:400,height:600}),setAttribute(){},removeAttribute(){}};
    const skeleton={hidden:false,getBoundingClientRect:()=>({width:400,height:600})};
    const root={id:'local-groupimport-easystud',classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)},
        getAttribute:k=>attrs.get(k)??null,setAttribute(k,v){attrs.set(k,v);if(k==='data-easystud-loading-state')states.push({at:now,state:v});
            mutations.filter(o=>o.active&&o.node===root&&o.options.attributeFilter?.includes(k)).forEach(o=>o.fn());},
        querySelector:s=>s==='[data-easystud-loading-skeleton]'?skeleton:content,getBoundingClientRect:()=>({width:400,height:600})};
    class MutationObserver{constructor(fn){this.fn=fn;mutations.push(this);}observe(node,options){Object.assign(this,{node,options,active:true});}disconnect(){this.active=false;}}
    class PerformanceObserver{constructor(fn){this.fn=fn;resources.push(this);}observe(){this.active=true;}disconnect(){this.active=false;resourceStops.push(now);}}
    const window={location:{href:'http://localhost/manage.php?easystudloadingdiagnostics=1'},performance:{now:()=>now},
        setTimeout:timer,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>timer(fn,16),matchMedia:()=>({matches:reduced}),
        getComputedStyle:n=>({display:n.hidden?'none':'block',visibility:'visible'})};
    if(observer)window.PerformanceObserver=PerformanceObserver;
    const document={readyState:'complete',getElementById:()=>root,querySelectorAll:()=>[],fonts:{ready:{then:fn=>fn()}},dispatchEvent:e=>events.push(e.detail)};
    vm.runInNewContext(source,{window,document,MutationObserver,PerformanceObserver,URL,
        Date:class extends Date{static now(){return now;}},CustomEvent:class{constructor(type,options){this.detail=options.detail;}}});
    for(const [at,type]of progress)timer(()=>resources.filter(o=>o.active).forEach(o=>o.fn({getEntries:()=>[{initiatorType:type}]})),at);
    if(frame!==null)timer(()=>root.setAttribute('data-easyedu-loading-frame','1'),frame);
    if(ready!==null)timer(()=>root.setAttribute('data-easystud-manager-initialised','1'),ready);
    while(timers.size){const [id,task]=[...timers].sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(task.at>50000)throw Error('Virtual deadline failed to settle');
        timers.delete(id);now=task.at;task.fn();}
    return{states,events,resourceStops,state:attrs.get('data-easystud-loading-state'),resourceObservers:resources.filter(o=>o.active).length};
}
let count=0;
function degraded(options,at){const r=simulate(options);const reveal=options.frame===undefined?(options.reduced?32:672):0;
    assert.equal(r.states[0].at,at+reveal,'Deadline plus unchanged reveal Motion');if(options.observer!==false)assert.equal(r.resourceStops[0],at,'Transition begins at deadline');
    assert.equal(r.states[0].state,'degraded');
    assert.ok(r.events.some(e=>e.name==='manager-degraded'&&e.details.reason==='amd-timeout'));assert.equal(r.resourceObservers,0);count++;return r;}
for(const reduced of [false,true]){
    degraded({reduced},8000);
    degraded({reduced,observer:false},8000);
    degraded({reduced,progress:[[6000,'script'],[13000,'fetch']]},21000);
    degraded({reduced,progress:[[6000,'img'],[7000,'css']]},8000);
    const continuous=[6000,12000,18000,24000,29000].map(t=>[t,'xmlhttprequest']);
    degraded({reduced,progress:continuous},30000);
    degraded({reduced,frame:6000,progress:[[6000,'script']]},14000);
    degraded({reduced,frame:6000,progress:[6000,12000,18000,24000,30000,35000].map(t=>[t,'script'])},36000);
    const r=simulate({reduced,frame:11400,ready:20300,progress:[[6000,'script'],[11000,'script'],[16000,'fetch']]});
    assert.equal(r.state,'ready');assert.deepEqual(r.states.map(s=>s.state),['ready']);assert.equal(r.resourceObservers,0);count++;
    const late=degraded({reduced,ready:12000},8000);assert.equal(late.state,'ready');
}
console.log(`PASS ${count} progress/stall/ceiling/frame/ready/late-recovery cases; real bootstrap, virtual time, no runtime writes.`);
