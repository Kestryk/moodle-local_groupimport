'use strict';
// Execute the production scheduler with controlled geometry/time. Native drag
// paint and pointer/ghost synchronization remain the post-publication gate.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const cp = require('node:child_process'), assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repo, 'amd/src/course_manager.js'), 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('const dragAutoScroll =');
const end = source.indexOf('\nconst isResponsiveDragSuppressed', start);
assert(start >= 0 && end > start, 'Production auto-scroll helper required');
let now = 0, nextId = 0;
const frames = new Map(), handlers = new Map();
class Element {
    constructor(parent, top, height, overflow = 'auto', scrollHeight = 4000) {
        Object.assign(this, {parentElement:parent, top, clientHeight:height, overflow, scrollHeight});
        this.scrollTop = 500;
    }
    get scrollTop() { return this.scroll; }
    set scrollTop(value) { this.scroll = Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight)); }
    getBoundingClientRect() { return {top:this.top, bottom:this.top + this.clientHeight}; }
}
const body = new Element(null,0,1000,'visible');
const viewport = new Element(null,0,1000);
const page = new Element(body,100,800);
const child = new Element(page,100,800,'visible',800);
const window = {innerHeight:1000,performance:{now:()=>now},getComputedStyle:n=>({overflowY:n.overflow}),
    requestAnimationFrame:fn=>{frames.set(++nextId,fn);return nextId;},cancelAnimationFrame:id=>frames.delete(id)};
const document = {body,scrollingElement:viewport,documentElement:viewport,
    addEventListener:(type,fn,capture)=>{assert.equal(capture,true);handlers.set(type,fn);}};
const api = vm.runInNewContext(source.slice(start,end)+'\ndragAutoScroll;', {Element,window,document});
const tick = () => { const [id,fn] = frames.entries().next().value || []; if (fn) {frames.delete(id);fn();} };
const update = (target,y) => api.update({target,clientY:y});
const reset = () => { api.stop();now=0;page.scrollTop=500;viewport.scrollTop=500; };
const cases = [];
reset(); update(child,180); tick(); assert.equal(page.scrollTop,497); assert.equal(viewport.scrollTop,500); cases.push('real-parent-scroll-80px-before-top');
reset(); update(child,100); tick(); assert.equal(page.scrollTop,482); cases.push('edge-speed-18px');
reset(); update(child,850); tick(); assert.equal(page.scrollTop,509); cases.push('bottom-direction-speed');
reset(); update(child,500); tick(); assert.equal(page.scrollTop,500); assert.equal(frames.size,0); cases.push('middle-no-scroll');
reset(); update(null,64); tick(); assert.equal(viewport.scrollTop,494); cases.push('viewport-fallback');
reset(); const small = new Element(body,100,160); update(small,120); tick(); assert.equal(small.scrollTop,491); cases.push('small-scroller-quarter-zone');
reset(); update(child,100); now=201; tick(); assert.equal(page.scrollTop,500); cases.push('stale-pointer-stops');
reset(); update(child,100); update(child,850); assert.equal(frames.size,1); tick(); assert.equal(page.scrollTop,509); cases.push('latest-pointer-one-frame');
for (const type of ['drop','dragend']) {
    reset(); update(child,100); handlers.get(type)(); assert.equal(frames.size,0); tick(); assert.equal(page.scrollTop,500); cases.push(type+'-cancels');
}
reset(); page.scrollTop=0; update(child,100); tick(); assert.equal(page.scrollTop,0); assert.equal(frames.size,0); cases.push('scroll-limit-stops');

// The cherry-pick must not change the ghost or business/drop handlers beyond
// the three auto-scroll hooks in each existing drag binding.
const acorn = require(path.join(process.argv[2], 'acorn'));
const previous = cp.execFileSync('git',['-C',repo,'show','9e0ccb44:amd/src/course_manager.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const declaration = (code,name) => {
    const node = acorn.parse(code,{sourceType:'module',ecmaVersion:'latest'}).body.find(n=>
        n.type==='VariableDeclaration' && n.declarations[0].id.name===name);
    assert(node,name); return code.slice(node.start,node.end);
};
assert.equal(declaration(source,'moveDragPreview'),declaration(previous,'moveDragPreview'));
for (const name of ['bindGroupDragDrop','bindUserDragDrop']) {
    const body = declaration(source,name)
        .replace(/^[ \t]*dragAutoScroll\.stop\(\);\n/gm,'')
        .replace(/^[ \t]*if \(dragged(?:Groups|Users)\.length\) \{\n[ \t]*dragAutoScroll\.update\(event\);\n[ \t]*\}\n/gm,'');
    assert.equal(body,declaration(previous,name),name+' business/ghost body');
}
api.stop();
console.log(JSON.stringify({lot:'R10-23',passed:true,cases,ghostAndBusinessBodiesUnchanged:true,nativeVerified:false}));
