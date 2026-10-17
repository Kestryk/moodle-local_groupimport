/* eslint-env node */
'use strict';
// Execute the actual dialog member handlers; no Moodle, browser or business writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'amd/src/local/cm/advanced_settings.js'),'utf8').replace(/\r\n/g,'\n');
const start=source.indexOf('const bindDialogMembers ='),end=source.indexOf('const getAdvancedGroupGroupingRows =',start);
assert(start>=0&&end>start);
const fallback=source.slice(source.indexOf('const focusDialogMemberFallback ='),source.indexOf('const refreshDialogMembers ='));
(async()=>{
 let selected=false,active='group',cleared=0,updates=0,bulk=0,focuses=0,observer,removed=false;
 const body={},doc={body,activeElement:null};
 const member={classList:{contains:()=>selected},getAttribute:()=> '42'};
 const close={focus:()=>{focuses++;doc.activeElement=close;}};
 const input={checked:true,getAttribute:()=> '42'};
 const row={getAttribute:()=> '42',remove:()=>{removed=true;doc.activeElement=body;}};
 const listeners={};
 const modal={isConnected:true,hidden:false,classList:{contains:()=>false},contains:node=>node===row||node===close,
  addEventListener:(name,fn)=>{listeners[name]=fn;},querySelector:()=>close,querySelectorAll:()=>[row]};
 const workspace={getAttribute:()=> '71'},item={};
 const context={document:doc,getDialogMemberItem:()=>member,areSelectionTypesCompatible:(a,b)=>a===b||!a,
  getActiveSelectionType:()=>active,clearSelectionState:()=>{cleared++;selected=false;active=null;},
  setItemSelected:(m,on)=>{assert.equal(m,member);selected=on;active=on?'member':null;},
  updateSelectionActions:()=>updates++,syncDialogBulk:()=>bulk++,
  MutationObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}},
  refreshDialogMembers:()=>{},getSelectedItems:()=>[],removeMembers:()=>Promise.resolve({message:'ok'}),
  showNotification:()=>{},handleActionError:(r,e)=>{throw e;}};
 const bind=vm.runInNewContext(fallback+source.slice(start,end)+'\nbindDialogMembers;',context);
 bind(workspace,item,modal);
 listeners.change({target:{closest:()=>input}});assert.equal(selected,true);assert.equal(cleared,1);assert.equal(input.checked,true);
 input.checked=false;listeners.change({target:{closest:()=>input}});assert.equal(selected,false);assert.equal(cleared,1);
 active='member';input.checked=true;listeners.change({target:{closest:()=>input}});assert.equal(cleared,1,'Compatible member choices preserve other member selections');
 doc.activeElement=row;
 listeners.click({target:{closest:selector=>selector==='[data-easystud-entity-remove]'?{getAttribute:()=> '42'}:null}});
 await new Promise(setImmediate);assert(removed);assert.equal(focuses,1);assert.equal(doc.activeElement,close);
 assert(updates>=4&&bulk>=4);assert.equal(typeof observer,'function');
 modal.classList.contains=()=>true;doc.activeElement=row;
 listeners.click({target:{closest:selector=>selector==='[data-easystud-entity-remove]'?{getAttribute:()=> '42'}:null}});
 await new Promise(setImmediate);assert.equal(focuses,1,'A closing dialog cannot steal focus back');
 console.log(JSON.stringify({passed:true,scope:'actual member selection/removal handlers; incompatible type, compatible selection, last removal focus, closing guard',runtimeAccess:false}));
})().catch(e=>{console.error(e);process.exitCode=1;});
