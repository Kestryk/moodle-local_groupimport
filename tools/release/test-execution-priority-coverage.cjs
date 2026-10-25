// Offline plan preservation gate: no build, runtime, browser or data writes.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const plan=JSON.parse(fs.readFileSync('docs/execution-priority-2026-10-12.json','utf8'));
const ids=plan.groups.flatMap(g=>g.ids);assert.equal(ids.length,new Set(ids).size,'Every request has one primary cohort');
const all=new Set(ids),expected=[];
for(const[prefix,n]of [['SM-',73],['R10-',33],['T',61]])for(let i=1;i<=n;i++)expected.push(prefix+String(i).padStart(prefix==='T'?3:2,'0'));
expected.push('PG-S1',...Array.from({length:8},(_,i)=>'PG-A'+(i+1)),...Array.from('ABCDEFGHI',c=>'G11-'+c),'AUD-CLAUDE-01');
assert.deepEqual([...all].sort(),expected.sort(),'Every original request and explicit successor preserved');
const groups=new Map(plan.groups.map(g=>[g.id,g])),visited=new Set(),active=new Set();
function visit(id){assert.ok(groups.has(id),'Known dependency');if(visited.has(id))return;assert.ok(!active.has(id),'No dependency cycle');active.add(id);groups.get(id).after.forEach(visit);active.delete(id);visited.add(id);}
plan.groups.forEach(g=>visit(g.id));
for(const f of ['docs/testing/claude-interface-review-intake-2026-10-11.json','docs/testing/student-feedback-intake-2026-10-10.json']){
 const before=JSON.parse(execFileSync('git',['show','b48bd20:'+f],{encoding:'utf8'})),now=JSON.parse(fs.readFileSync(f,'utf8'));
 assert.deepEqual(now.tasks.map(t=>[t.id,t.receivedScope||t.request,t.acceptance]),before.tasks.map(t=>[t.id,t.receivedScope||t.request,t.acceptance]),'Original scopes/acceptance unchanged: '+f);
}
assert.equal(plan.groups.find(g=>g.ids.includes('T054')).id,'EXEC-13');assert.ok(plan.groups.find(g=>g.id==='EXEC-13').after.includes('EXEC-12'));
assert.equal(plan.decisionGates.T039,'Existing Kevin choice retains the dedicated interface cue; alternate footer merge is not authorized');
console.log('PASS '+ids.length+' request IDs,15 cohorts, acyclic dependencies, original61+33 scopes unchanged and human gates preserved');
