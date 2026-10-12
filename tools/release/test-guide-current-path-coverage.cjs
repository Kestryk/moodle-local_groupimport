// Current successor: actual bilingual production payloads, not historical activation-only assertions.
// No Moodle bootstrap, browser, live storage or database writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Usage: node test-guide-current-path-coverage.cjs <php>');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('amd/src/easyedu_guide.js');
const start = source.indexOf('const getStateKey =');
const end = source.indexOf('const getCompletedSteps =', start);
assert.ok(start >= 0 && end > start, 'Bounded actual storage engine');
const slideIds = ['use-this-guide', 'understand-workspace', 'create-structure',
    'read-participant-card', 'read-group-card', 'read-grouping-card', 'add-or-move-members',
    'search-filter-select', 'pasted-identifiers', 'choose-right-action',
    'use-groupings-in-activities', 'ready-to-work'];
const invitations = {
    'create-structure': 'practice-membership',
    'read-group-card': 'inspect-group-settings',
    'read-grouping-card': 'inspect-grouping-settings',
    'add-or-move-members': 'reorganise-source-members',
    'choose-right-action': 'try-actions',
    'use-groupings-in-activities': 'prepare-activity-grouping',
    'search-filter-select': 'verify-with-filters',
};
const historicalSteps = {
    'try-actions': ['try-drag', 'try-selection', 'try-context'],
};
const typedTargets = {
    'practice-membership': ['groupCreateInput', 'viewParticipants', 'participantSelectionInput',
        'participantMoveAction', 'participantMoveDestination', 'participantMoveConfirm'],
    'reorganise-source-members': ['groupMemberSelection', 'memberMoveAction',
        'memberMoveDestination', 'memberMoveConfirm'],
    'inspect-group-settings': ['groupEditorAction', 'groupEditorName',
        'groupEditorDescription', 'groupEditorCancel'],
    'inspect-grouping-settings': ['groupingEditorAction', 'groupingEditorName',
        'groupingEditorDescription', 'groupingEditorCancel'],
    'verify-with-filters': ['participantFilterToggle','participantFilterSearch','participantFilteredResults','participantClearSelection'],
    'prepare-activity-grouping': ['activityGroupingEntry','activityGroupSelection','activityGroupDestination','activityGroupConfirm','activityGroupingResult'],
};
const expectedPaths = [...Object.keys(historicalSteps), ...Object.keys(typedTargets)].sort();
const archive = JSON.parse(read('docs/testing/guide-historical-presentation-archive-2026-10-10.json'));
let migratedPositions = 0;
let milestones = 0;
let restoredPathStates = 0;
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2],
        [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding: 'utf8'}));
    const slides = data.templateData.slides;
    assert.deepEqual(slides.map(slide => slide.id), slideIds);
    assert.deepEqual(data.readingContract.slideIds, slideIds);
    assert.equal(data.modernCandidate.nativeActivated, true);
    assert.deepEqual(Object.keys(data.paths).sort(), expectedPaths);
    assert.equal(slides[0].hasguidedpath === true, false, 'Introduction teaches Guide, not group practice');
    const actualInvitations = Object.fromEntries(slides.filter(slide => slide.hasguidedpath)
        .map(slide => [slide.id, slide.guidedpath]));
    assert.deepEqual(actualInvitations, invitations);
    for (const slide of slides.filter(slide => slide.hasguidedpath)) {
        assert.ok(slide.guidedpathtitle && slide.guidedpathcontent);
        assert.ok(slide.guidedpathlabel || data.templateData.guideguidedpathlabel,
            'Existing optional category and canonical fallback retained');
        assert.equal(slide.guidedpathsteps.items.length, data.paths[slide.guidedpath].length);
        if (typedTargets[slide.guidedpath]) {
            assert.deepEqual(slide.guidedpathsteps.items, data.paths[slide.guidedpath].map(step => step.title),
                'Typed invitation and native checklist describe the same milestones');
        }
    }
    const legacy = archive.languages.find(item => item.language === language).templateData.slides;
    assert.equal(legacy.length, 24, 'Original public payloads retained');
    for (const id of ['practice-membership', 'try-actions']) {
        const old = legacy.find(slide => slide.hasguidedpath && slide.guidedpath === id);
        const current = slides.find(slide => slide.hasguidedpath && slide.guidedpath === id);
        assert.ok(old && current, 'Original visible invitation still reachable: ' + id);
        assert.equal(current.guidedpath, old.guidedpath, 'Existing reachable path IDs retained');
    }
    for (const [id, steps] of Object.entries(data.paths)) {
        assert.equal(new Set(steps.map(step => step.id)).size, steps.length, 'Unique milestone IDs: ' + id);
        assert.ok(steps.every(step => step.title && step.description && step.target));
        milestones += steps.length;
        if (historicalSteps[id]) {
            assert.deepEqual(steps.map(step => step.id), historicalSteps[id]);
        } else {
            assert.deepEqual(steps.map(step => step.target), typedTargets[id]);
            steps.forEach((step, index) => {
                assert.equal(step.completionMode, 'event');
                assert.equal(step.autoHighlightNext, true);
                assert.equal(step.requiresStep, index ? steps[index - 1].id : undefined);
            });
        }
    }
    const entries = new Map();
    const config = {...data.readingContract, paths:data.paths, storageKey: 'qa-offline-current-path-coverage'};
    const context = vm.createContext({getStorage: () => ({
        getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value),
    })});
    vm.runInContext(source.slice(start, end).replace(/^export const /gm,'const ') +
        '\nglobalThis.api={loadGuideState,saveGuideState};', context);
    const key = config.storageKey + '.checklist';
    const completed = Object.fromEntries(Object.entries(data.paths).map(([id, steps]) =>
        [id, steps.map(step => step.id)]));
    for (const [origin, positions] of Object.entries(config.readingIndexMigrations)) {
        positions.forEach((destination, index) => {
            entries.clear();
            const state = {slideIndex: index, path: 'try-actions', activeIndex: 1, completed};
            if (origin !== 'legacy') state.presentationKey = origin;
            const original = JSON.stringify(state);
            entries.set(key, original);
            const loaded = context.api.loadGuideState(config);
            assert.equal(entries.get(key), original, 'Loading is read-only');
            assert.equal(loaded.slideIndex, destination);
            assert.equal(loaded.slideId, slideIds[destination]);
            assert.equal(loaded.path, state.path);
            assert.equal(loaded.activeIndex, state.activeIndex);
            assert.equal(JSON.stringify(loaded.completed), JSON.stringify(completed));
            context.api.saveGuideState(config, loaded);
            assert.equal(entries.get(key + '.before-' + config.presentationKey), original);
            context.api.saveGuideState(config, {...loaded, slideIndex: 0});
            assert.equal(entries.get(key + '.before-' + config.presentationKey), original);
            migratedPositions++;
        });
    }
    for (const id of expectedPaths) {
        entries.clear();
        const state = {presentationKey: config.presentationKey, slideIndex: 0,
            slideId: slideIds[0], path: id, activeIndex: 0, completed};
        entries.set(key, JSON.stringify(state));
        assert.equal(JSON.stringify(context.api.loadGuideState(config)), JSON.stringify(state));
        restoredPathStates++;
    }
    const unknown = {presentationKey: 'future-unknown', slideIndex: 99,
        path: 'future-path', completed: {'future-path': ['future-step'], ...completed}};
    entries.clear();
    entries.set(key, JSON.stringify(unknown));
    const cleaned={...unknown,path:null,activeIndex:0,completed};
    assert.equal(JSON.stringify(context.api.loadGuideState(config)), JSON.stringify(cleaned));
    assert.equal(entries.get(key), JSON.stringify(cleaned), 'Unknown path entries retired, known progress retained');
}
console.log(JSON.stringify({status: 'PASS', languages: ['en', 'fr'], slidesPerLanguage: 12,
    invitationsPerLanguage: 6, definitionsPerLanguage: 7, milestones, migratedPositions,
    restoredPathStates, scope: 'Actual PHP payload and isolated actual storage engine; no native workflow, raster or human acceptance'}, null, 2));
