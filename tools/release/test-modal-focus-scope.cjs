/* eslint-env node */
'use strict';
// Current modular modal keyboard authority, executed with isolated DOM/Motion doubles.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const modules=path.resolve(process.argv[2] || 'C:/dev/moodle51-build-501/node_modules');
const acorn=require(path.join(modules,'acorn'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const source=read('amd/src/local/cm/modal.js');
acorn.parse(source,{sourceType:'module',ecmaVersion:'latest'});
const start=source.indexOf('const modalKeyboardState ='),end=source.indexOf('export const openConfirmModal =');
assert(start>=0&&end>start);
const doc={body:{},activeElement:null};const listeners={};let stops=[],hidden=false,closed=0,focuses=0;
const classes=new Set();const opener={isConnected:true,disabled:false,tabIndex:0,matches:()=>false,closest:()=>null,
    getClientRects:()=>[{}],focus:()=>{focuses++;doc.activeElement=opener;}};
const control=(name,close=false)=>({name,isConnected:true,disabled:false,tabIndex:0,
    matches:s=>s===':disabled'?false:close,closest:()=>null,getClientRects:()=>[{}],
    focus:()=>{doc.activeElement=stops.find(x=>x.name===name);}});
const first=control('close',true),last=control('last');stops=[first,last];
const modal={get hidden(){return hidden;},set hidden(v){hidden=v;},classList:{contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n)},
    contains:n=>stops.includes(n),querySelectorAll:()=>stops,querySelector:()=>null,
    addEventListener:(name,fn)=>{assert(!listeners[name],'No duplicate owned listener');listeners[name]=fn;},
    setAttribute(){},focus:()=>{doc.activeElement=modal;}};
let exitResolve;const exits=[];
const api=vm.runInNewContext(source.slice(start,end).replace(/^export /gm,'')+
    '\n({showEasyStudModal,hideEasyStudModal,bindCardModalKeyboard});',{
    document:doc,getComputedStyle:()=>({visibility:'visible'}),window:{requestAnimationFrame:f=>f()},
    Motion:{cancel(){},timing:{fast:80},exit:()=>{exits.push('exit');return new Promise(r=>{exitResolve=r;});}}});
(async()=>{
 doc.activeElement=opener;api.showEasyStudModal(modal);assert.equal(modal.hidden,false);
 const focus=api.bindCardModalKeyboard(modal,()=>{closed++;});api.bindCardModalKeyboard(modal,()=>{closed++;});focus();assert.equal(doc.activeElement,first);
 let prevented=0;const event=(key,shiftKey=false,defaultPrevented=false)=>({key,shiftKey,defaultPrevented,preventDefault(){prevented++;},stopPropagation(){}});
 doc.activeElement=last;listeners.keydown(event('Tab'));assert.equal(doc.activeElement,first);
 doc.activeElement=first;listeners.keydown(event('Tab',true));assert.equal(doc.activeElement,last);
 listeners.keydown(event('Escape',false,true));assert.equal(closed,0,'Nested controls retain first refusal');
 classes.add('is-closing');listeners.keydown(event('Escape'));assert.equal(closed,0);classes.delete('is-closing');
 listeners.keydown(event('Escape'));assert.equal(closed,1);
 doc.activeElement=first;const pending=api.hideEasyStudModal(modal);assert.equal(modal.hidden,false);assert.equal(focuses,0,'Never restore focus before Motion ends');
 exitResolve(true);assert.equal(await pending,true);assert.equal(modal.hidden,true);assert.equal(doc.activeElement,opener);assert.equal(focuses,1);
 api.showEasyStudModal(modal);doc.activeElement=last;const cancelled=api.hideEasyStudModal(modal);exitResolve(false);assert.equal(await cancelled,false);assert.equal(modal.hidden,false);assert.equal(focuses,1);
 stops=[];listeners.keydown(event('Tab'));assert.equal(doc.activeElement,modal,'Empty dialogs retain keyboard focus');assert(prevented>=4);
 for(const f of ['amd/src/local/cm/move_modal.js','amd/src/local/cm/optional_tools.js'])assert(read(f).includes('bindCardModalKeyboard'));
 const built=read('amd/build/local/cm/modal.min.js');for(const name of ['bindCardModalKeyboard','showEasyStudModal','hideEasyStudModal'])assert(built.includes(name));
 console.log(JSON.stringify({passed:true,contract:'current modular keyboard containment, Escape refusal, completed/cancelled Motion and focus return',runtimeAccess:false}));
})().catch(e=>{console.error(e);process.exitCode=1;});
