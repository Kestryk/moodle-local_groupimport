/* eslint-env node */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../../amd/src/easyedu_guide.js'),'utf8');
const start=source.indexOf('const scheduleHighlightRefresh ='),end=source.indexOf('const dockChecklistAwayFromTarget =',start);
assert.ok(start>0&&end>start);
let id=0;const queue=new Map(),root={},target={visible:true},paint=[];
const context={window:{requestAnimationFrame:fn=>{queue.set(++id,fn);return id;},cancelAnimationFrame:key=>queue.delete(key)},
    performance:{now:()=>0},isVisibleElement:node=>!!node?.visible,
    clearHighlight:host=>{queue.delete(host.easyeduGuideRefreshBurstFrame);host.easyeduGuideRefreshTarget=null;paint.push('cleared');},
    dockChecklistAwayFromTarget:()=>{},updateHighlight:(host,node)=>{host.easyeduGuideCurrentTarget=node;paint.push('target');}};
vm.runInNewContext(source.slice(start,end)+'\nthis.burst=scheduleHighlightRefreshBurst;this.refresh=scheduleHighlightRefresh;',context);
context.burst(root,target);
const first=queue.entries().next().value;queue.delete(first[0]);first[1](16);
context.refresh(root,null); // Real resize/scroll refresh while the target frame is queued.
const next=queue.entries().next().value;queue.delete(next[0]);next[1](32);
console.log(JSON.stringify({paint,pendingTarget:root.easyeduGuideRefreshTarget===target,currentTarget:root.easyeduGuideCurrentTarget===target}));
assert.equal(root.easyeduGuideCurrentTarget,target,'A targetless viewport refresh must preserve the queued real target');
