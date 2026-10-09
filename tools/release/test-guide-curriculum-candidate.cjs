// Offline migration preparation only. Never load a real user's storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
assert.ok(process.argv[2],'Usage: <php>');
const root=path.resolve(__dirname,'../..');
const proposal=JSON.parse(fs.readFileSync(path.join(root,'docs/testing/guide-curriculum-migration-candidate-2026-10-09.json'),'utf8'));
const actual=JSON.parse(execFileSync(process.argv[2],[path.join(__dirname,'guide-discovery-fixture.php'),'en'],{encoding:'utf8'}));
assert.equal(proposal.status,'candidate-not-activated');assert.equal(proposal.changesNativeReading,false);
assert.equal(proposal.slideIds.length,12);assert.equal(new Set(proposal.slideIds).size,12);
const old=actual.historicalSlides.map(slide=>slide.id),current=actual.readingContract.slideIds;
assert.deepEqual(Object.keys(proposal.historicalDestinationIds).sort(),[...old].sort());
const map=ids=>ids.map(id=>{
    const position=proposal.slideIds.indexOf(proposal.historicalDestinationIds[id]);
    assert.ok(position>=0,'Every historical position has an explicit destination');return position;
});
const config={presentationKey:proposal.presentationKey,slideIds:proposal.slideIds,storageKey:'qa-offline-curriculum',
    readingIndexMigrations:{[actual.readingContract.presentationKey]:map(current),'discovery-20261006':map(old),legacy:map(old.slice(4))}};
const source=fs.readFileSync(path.join(root,'amd/src/easyedu_guide.js'),'utf8');
const first=source.indexOf('const getStateKey ='),last=source.indexOf('const getCompletedSteps =',first);
assert.ok(first>=0&&last>first);
const entries=new Map(),context=vm.createContext({getStorage:()=>({getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)})});
vm.runInContext(source.slice(first,last)+'\nglobalThis.api={loadGuideState,saveGuideState};',context);
let cases=0;
for(const [origin,positions] of Object.entries(config.readingIndexMigrations))positions.forEach((destination,index)=>{
    entries.clear();const state={slideIndex:index,path:'practice-membership',activeIndex:3,
        completed:{'practice-membership':['create-group'],'another-path':['preserved']}};
    if(origin!=='legacy')state.presentationKey=origin;
    const key=config.storageKey+'.checklist',original=JSON.stringify(state);entries.set(key,original);
    const loaded=context.api.loadGuideState(config);
    assert.equal(entries.get(key),original,'Reading is not a write');
    assert.equal(loaded.slideIndex,destination);assert.equal(loaded.slideId,proposal.slideIds[destination]);
    assert.equal(loaded.path,state.path);assert.equal(loaded.activeIndex,3);
    assert.deepEqual(JSON.parse(JSON.stringify(loaded.completed)),state.completed);
    context.api.saveGuideState(config,loaded);
    assert.equal(entries.get(key+'.before-'+config.presentationKey),original);
    context.api.saveGuideState(config,{...loaded,slideIndex:0});
    assert.equal(entries.get(key+'.before-'+config.presentationKey),original,'First backup remains immutable');cases++;
});
assert.notEqual(actual.readingContract.presentationKey,proposal.presentationKey,'Candidate must not activate');
assert.equal(actual.readingSlides.length,24);
console.log(`PASS ${cases} offline historical positions: explicit candidate12 destinations, unchanged native24 lessons, preserved paths and immutable backups.`);
