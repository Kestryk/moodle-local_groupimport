// Active production twelve-slide successor against immutable actual historical payloads.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Usage: <php>');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8');
const start = source.indexOf('const getStateKey =');
const end = source.indexOf('const getCompletedSteps =', start);
assert.ok(start >= 0 && end > start);
let cases = 0;
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2],
        [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding:'utf8'}));
    const archive = JSON.parse(fs.readFileSync(path.join(root, 'docs/testing/guide-historical-presentation-archive-2026-10-10.json'), 'utf8'));
    const legacy = archive.languages.find(item => item.language === language).templateData.slides;
    const candidate = data.modernCandidate;
    assert.equal(legacy.length, 24, 'Historical payloads remain available');
    assert.equal(data.templateData.slides.length, 12);
    assert.deepEqual(data.templateData.slides, candidate.slides);
    assert.deepEqual(data.readingContract, candidate.readingContract);
    assert.equal(candidate.nativeActivated, true);
    assert.equal(candidate.slides.length, 12);
    assert.deepEqual(candidate.slides.map(slide => slide.id), candidate.readingContract.slideIds);
    const invitations = slides => slides.filter(slide => slide.hasguidedpath).map(slide => ({
        path:slide.guidedpath, title:slide.guidedpathtitle, content:slide.guidedpathcontent,
        steps:slide.guidedpathsteps,
    })).sort((a,b) => a.path.localeCompare(b.path));
    assert.deepEqual(invitations(candidate.slides), invitations(legacy),
        'All three original entry points/copy/steps retained, not just stored completion');
    assert.ok(candidate.slides[3].visualcarddetail);
    for (const index of [4,5]) assert.equal(candidate.slides[index].discoveryscene.kind, 'inspection');
    assert.equal(candidate.slides[2].guidedpath, 'practice-membership');
    assert.equal(candidate.slides[9].guidedpath, 'try-actions');
    assert.equal(candidate.slides[10].guidedpath, 'create-grouping');
    const oldSlide = id => legacy.find(slide => slide.id === id);
    assert.deepEqual(candidate.slides[2].commonintroduction,
        oldSlide('reference-16').commonintroduction, 'Real creation syntax survives the merge');
    const actions = candidate.slides[9].commonintroduction;
    assert.equal(actions.topics.length, 5, 'Bounded action explanation, not a concatenation of old slides');
    assert.deepEqual(actions.topics.slice(0, 2), oldSlide('reference-14').commonintroduction.topics.slice(1));
    assert.deepEqual(actions.topics[2], oldSlide('reference-11').commonintroduction.topics[1]);
    assert.deepEqual(actions.topics[3], oldSlide('reference-10').commonintroduction.topics[1]);
    assert.equal(actions.topics[4].title, oldSlide('reference-13').title);
    assert.ok(actions.topics[4].description.includes('Ctrl'));
    assert.ok(actions.topics[4].description.includes(language === 'fr' ? 'Maj' : 'Shift'));
    assert.ok(actions.topics[4].description.includes('Tab'));
    assert.ok(actions.topics[4].description.includes('Space') || actions.topics[4].description.includes('Espace'));
    assert.ok(!/<[^>]+>/.test(actions.topics[4].description), 'Text-only shared description, no inline styling');
    assert.equal(actions.note, oldSlide('reference-11').commonintroduction.note);
    const entries = new Map();
    const config = {...candidate.readingContract, storageKey:'qa-offline-modern-curriculum'};
    const context = vm.createContext({getStorage:() => ({
        getItem:key => entries.get(key) ?? null, setItem:(key,value) => entries.set(key,value),
    })});
    vm.runInContext(source.slice(start,end) + '\nglobalThis.api={loadGuideState,saveGuideState};',context);
    for (const [origin, positions] of Object.entries(config.readingIndexMigrations)) {
        positions.forEach((destination,index) => {
            entries.clear();
            const state = {slideIndex:index, path:'create-grouping', activeIndex:1,
                completed:{'create-grouping':['create-grouping'], 'practice-membership':['create-group']}};
            if (origin !== 'legacy') state.presentationKey = origin;
            const key = config.storageKey + '.checklist';
            const original = JSON.stringify(state);
            entries.set(key,original);
            const loaded = context.api.loadGuideState(config);
            assert.equal(entries.get(key),original,'Loading must not write');
            assert.equal(loaded.slideIndex,destination);
            assert.equal(loaded.slideId,config.slideIds[destination]);
            assert.equal(loaded.path,state.path);
            assert.equal(loaded.activeIndex,state.activeIndex);
            assert.equal(JSON.stringify(loaded.completed),JSON.stringify(state.completed));
            context.api.saveGuideState(config,loaded);
            const backup = key + '.before-' + config.presentationKey;
            assert.equal(entries.get(backup),original);
            context.api.saveGuideState(config,{...loaded,slideIndex:0});
            assert.equal(entries.get(backup),original,'First backup immutable');
            cases++;
        });
    }
    const unknown = {presentationKey:'future-unknown',slideIndex:99,path:'try-actions',completed:{retained:['x']}};
    entries.clear();
    entries.set(config.storageKey+'.checklist',JSON.stringify(unknown));
    assert.equal(JSON.stringify(context.api.loadGuideState(config)),JSON.stringify(unknown),
        'Unknown history not silently rewritten/reset');
}
console.log(`PASS ${cases} actual modern migration positions, twelve payloads, three path invitations, original backups and unknown histories; active production adapter, archived original payloads preserved.`);
