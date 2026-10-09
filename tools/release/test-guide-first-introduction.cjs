// Actual PHP ordering/configuration plus actual synchronized Guide state functions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.ok(process.argv[2], 'Usage: <php-executable>');
const root = path.resolve(__dirname, '../..');
const fixture = JSON.parse(execFileSync(process.argv[2], [path.join(__dirname,'guide-discovery-fixture.php'),'en'], {encoding:'utf8'}));
const config = {...fixture.readingContract, storageKey:'qa-first-introduction'};
assert.equal(config.slideIds.length,24);
assert.equal(new Set(config.slideIds).size,24);
assert.equal(config.slideIds[0],'use-this-guide');
assert.deepEqual(fixture.readingSlides.map(slide=>slide.id),config.slideIds);
fixture.readingSlides.forEach((slide,index)=>{
    const original=fixture.historicalSlides.find(old=>old.id===slide.id);
    assert.deepEqual({...slide,index:original.index},original,'only reading index changes');
    assert.equal(slide.index,index);
});
const engine=fs.readFileSync(path.join(root,'amd/src/easyedu_guide.js'),'utf8');
const first=engine.indexOf('const getStateKey ='),last=engine.indexOf('const getCompletedSteps =',first);
const entries=new Map(),context=vm.createContext({getStorage:()=>({getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)})});
vm.runInContext(engine.slice(first,last)+'\nglobalThis.api={loadGuideState,saveGuideState};',context);
const key=config.storageKey+'.checklist',progress={path:'practice-membership',activeIndex:3,completed:{'practice-membership':['create-group','select-participant'],other:['kept']}};
let cases=0;
for(const [origin,map] of Object.entries(config.readingIndexMigrations)) {
    map.forEach((expected,index)=>{
        entries.clear();
        const state={...progress,slideIndex:index};
        if(origin!=='legacy')state.presentationKey=origin;
        const original=JSON.stringify(state);entries.set(key,original);
        const next=context.api.loadGuideState(config);
        assert.equal(next.slideIndex,expected);assert.equal(next.slideId,config.slideIds[expected]);
        assert.equal(entries.get(key),original,'load must not write');
        assert.deepEqual(JSON.parse(JSON.stringify(next.completed)),progress.completed);
        assert.equal(next.activeIndex,3);assert.equal(next.path,progress.path);
        context.api.saveGuideState(config,next);
        assert.equal(entries.get(key+'.before-'+config.presentationKey),original);
        context.api.saveGuideState(config,{...next,slideIndex:0});
        assert.equal(entries.get(key+'.before-'+config.presentationKey),original,'backup immutable');
        cases++;
    });
}
const manage=fs.readFileSync(path.join(root,'manage.php'),'utf8');
const introStart=manage.indexOf("if (!empty($step['visualguided']))");
const intro=manage.slice(introStart,manage.indexOf("} else if (!empty($step['visualemptycourse']))",introStart));
assert.ok(intro.includes('common_introduction(true)'));
assert.ok(!intro.includes("'guidedpath'"),'introduction has no group exercise');
assert.ok(manage.includes('guide_discovery::introduction_first($slides)'));
console.log(`PASS:${cases} actual historical migrations,24 retained lessons,first introduction,no group exercise,preserved native targets/progress,immutable backup.`);
