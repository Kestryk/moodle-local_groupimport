'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../../amd/src/course_manager.js'),'utf8');
const helpers=source.slice(source.indexOf('const modalKeyboardState'),source.indexOf('// Normalise text for filtering.'));
const document={activeElement:null,body:null};let finish;
const element=(name,parent=null)=>({name,parent,isConnected:true,disabled:false,tabIndex:0,hidden:false,style:{visibility:'visible'},
    focus(){document.activeElement=this;},closest(){return this.hidden||this.parent?.hidden?{}:null;},
    getClientRects(){return this.hidden||this.parent?.hidden?[]:[{}];},
    matches(selector){return selector===':disabled'?(this.disabled||this.fieldsetDisabled):this.name==='close';}});
const body=element('body');document.body=body;
const opener=element('opener');opener.focus();
const classes=new Set();const handlers=[];
const modal=element('modal');modal.hidden=true;
modal.classList={contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n)};
modal.addEventListener=(type,fn)=>{if(type==='keydown')handlers.push(fn);};
modal.setAttribute=(name,value)=>{modal[name]=value;};
const close=element('close',modal),input=element('input',modal),last=element('last',modal);
modal.fields=[close,input,last];modal.contains=n=>n===modal||modal.fields.includes(n);
modal.querySelectorAll=()=>modal.fields;modal.querySelector=()=>modal;
const context={document,getComputedStyle:n=>n.style,Motion:{cancel(){},timing:{fast:1},exit:()=>new Promise(r=>{finish=r;})}};
vm.createContext(context);vm.runInContext(helpers+'\nthis.api={showEasyStudModal,hideEasyStudModal,bindCardModalKeyboard};',context);
const api=context.api;let calls=0;const checks=[];
const check=(name,fn)=>{fn();checks.push(name);};
const key=(name,shift=false,handled=false)=>{const e={key:name,shiftKey:shift,defaultPrevented:handled,
    preventDefault(){this.defaultPrevented=true;},stopPropagation(){}};handlers.forEach(fn=>fn(e));return e;};
(async()=>{
    const initial=api.bindCardModalKeyboard(modal,()=>calls++);api.showEasyStudModal(modal);initial();
    check('initial-close',()=>assert.equal(document.activeElement,close));
    last.focus();check('Tab-wrap',()=>{assert(key('Tab').defaultPrevented);assert.equal(document.activeElement,close);});
    check('Shift-Tab-wrap',()=>{key('Tab',true);assert.equal(document.activeElement,last);});
    last.disabled=true;close.focus();check('disabled-excluded',()=>{key('Tab',true);assert.equal(document.activeElement,input);});last.disabled=false;
    last.hidden=true;close.focus();check('hidden-excluded',()=>{key('Tab',true);assert.equal(document.activeElement,input);});last.hidden=false;
    last.fieldsetDisabled=true;close.focus();check('disabled-fieldset-excluded',()=>{key('Tab',true);assert.equal(document.activeElement,input);});last.fieldsetDisabled=false;
    check('nested-Escape-yields',()=>{key('Escape',false,true);assert.equal(calls,0);});
    check('native-Escape',()=>{key('Escape');assert.equal(calls,1);});
    api.bindCardModalKeyboard(modal,()=>calls+=10);check('idempotent-listener',()=>{assert.equal(handlers.length,1);key('Escape');assert.equal(calls,11);});
    last.focus();const exiting=api.hideEasyStudModal(modal);
    check('no-early-return',()=>assert.equal(document.activeElement,last));finish(true);await exiting;
    check('exit-then-return',()=>{assert(modal.hidden);assert.equal(document.activeElement,opener);});
    api.showEasyStudModal(modal);initial();const canceled=api.hideEasyStudModal(modal);finish(false);await canceled;
    check('canceled-exit-keeps-focus',()=>{assert(!modal.hidden);assert.equal(document.activeElement,close);});
    api.showEasyStudModal(modal);const proxy=element('proxy');initial();
    const custom=api.hideEasyStudModal(modal,()=>proxy.focus());finish(true);await custom;
    check('native-proxy-priority',()=>assert.equal(document.activeElement,proxy));
    console.log(JSON.stringify({lot:'T058-focus',passed:true,checks}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
