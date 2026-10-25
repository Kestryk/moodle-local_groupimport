/* eslint-env node */
// Full-state queries and bounded list thresholds, independently of DOM visibility.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const source=['filter_engine','list_windows'].map(n=>fs.readFileSync(path.join(root,'amd/src/local/sm',n+'.js'),'utf8')
 .replace(/\r\n/g,'\n')).join('\n').replace(/^import .*;$/gm,'').replace(/^export const /gm,'const ');
const ctx={};vm.runInNewContext(source+'\nthis.api={listWindow,matchingMemberIds,listPolicy};',ctx);
const {listWindow,matchingMemberIds}=ctx.api;
for(const [kind,initial,step,ceiling] of [['members',8,10,50],['groups',3,3,12]]){
 for(const total of [0,1,initial,initial+1,ceiling,ceiling+1,120]){
  const first=listWindow(kind,total);assert.equal(first.shown,Math.min(initial,total));assert.equal(first.total,total);
  assert.equal(first.all,false);
  for(const limit of [initial+step,ceiling,ceiling+step]){
   const state=listWindow(kind,total,limit);assert(state.shown<=ceiling);assert.equal(state.remaining,total-state.shown);
   assert.equal(state.more,state.shown<total&&state.limit<ceiling);
   assert.equal(state.all,total>ceiling&&state.shown>=ceiling);
  }
 }
}
const users=Array.from({length:120},(_,i)=>[i+1,{fullname:'Member '+i}]);
const model={groups:new Map([[7,{memberids:users.map(([id])=>id)}]]),byId:new Map(users),
 indexById:new Map(users.map(([id,user])=>[id,{text:user.fullname.toLowerCase()}]))};
assert.equal(matchingMemberIds(model,7).length,120);
assert.deepEqual(Array.from(matchingMemberIds(model,7,'member 119')),[120]);
assert.equal(matchingMemberIds(model,7,'missing').length,0);
console.log(JSON.stringify({passed:true,thresholdCases:56,offWindowQuery:true,totalMembers:120}));
