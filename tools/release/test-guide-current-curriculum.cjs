// Inventory actual public presentation adapters, not native Moodle availability.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Usage: <php>');
const root = path.resolve(__dirname, '../..');
const candidate = JSON.parse(fs.readFileSync(path.join(root,
    'docs/testing/guide-curriculum-migration-candidate-2026-10-09.json'), 'utf8'));
const sources = ['use-this-guide', 'discovery-concepts', 'discovery-creation',
    'reference-4', 'reference-5', 'reference-6', 'discovery-membership',
    'reference-3', 'reference-9', 'discovery-actions', 'reference-7', 'reference-19'];
const rows = [];
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2],
        [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding:'utf8'}));
    const slides = data.templateData.slides;
    assert.equal(slides.length, 24);
    assert.equal(new Set(slides.map(slide => slide.id)).size, 24);
    assert.deepEqual(slides.map(slide => slide.id), data.readingContract.slideIds);
    assert.equal(slides[0].id, 'use-this-guide');
    assert.equal(slides[0].hasguidedpath, undefined, 'Common intro is not a group exercise');
    assert.deepEqual(slides.map(slide => slide.index), Array.from({length:24}, (_,index) => index));
    assert.deepEqual(Object.keys(data.paths).sort(),
        ['create-grouping', 'first-structure', 'practice-membership', 'try-actions']);
    assert.equal(data.paths['practice-membership'].length, 6);
    const byId = Object.fromEntries(slides.map(slide => [slide.id, slide]));
    for (const id of sources) assert.ok(byId[id], 'Actual payload exists: ' + id);
    assert.deepEqual(sources.map(id => candidate.historicalDestinationIds[id]), candidate.slideIds);
    const invitations = slides.filter(slide => slide.hasguidedpath).map(slide => ({
        slideId:slide.id, pathId:slide.guidedpath,
        steps:slide.guidedpathsteps.items.length,
    }));
    for (const invite of invitations) {
        assert.ok(data.paths[invite.pathId], 'Real invitation references a retained path');
        assert.equal(invite.steps, data.paths[invite.pathId].length);
    }
    assert.deepEqual(invitations.map(item => item.pathId).sort(),
        ['create-grouping', 'practice-membership', 'try-actions']);
    const missingCandidateInvitations = invitations.filter(invite => !sources.includes(invite.slideId));
    assert.deepEqual(missingCandidateInvitations.map(item => item.pathId).sort(),
        ['create-grouping', 'try-actions'], 'Candidate access gap is explicit, not silently dropped');
    assert.equal(byId['reference-5'].discoveryscene.kind, 'inspection');
    assert.equal(byId['reference-6'].discoveryscene.kind, 'inspection');
    assert.ok(byId['reference-4'].visualcarddetail);
    assert.equal(byId['reference-16'].visualformula.results.length, 4);
    rows.push({language, slideCount:slides.length,
        lessons:slides.map(slide => ({id:slide.id, index:slide.index, title:slide.title,
            explanationTopics:slide.commonintroduction?.topics.length || 0,
            scene:slide.discoveryscene?.kind || null,
            path:slide.hasguidedpath ? slide.guidedpath : null})),
        paths:Object.keys(data.paths), invitations, candidateSources:sources,
        candidateAccessGaps:missingCandidateInvitations});
}
console.log(JSON.stringify({passed:true, sourceOnly:true, nativeConfigurationEvaluated:false,
    fixtures:false, courseWrites:false, candidateActivated:false, rows}, null, 2));
