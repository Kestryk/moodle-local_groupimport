// Isolated PHP context contract: no Moodle bootstrap, database or live resolver.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Usage: <php>');
const root = path.resolve(__dirname, '../..');
const fixture = path.join(__dirname, 'guide-discovery-fixture.php');
const source = fs.readFileSync(path.join(root, 'classes/local/guide_discovery.php'), 'utf8');
const original = execFileSync('git', ['show', 'd3bd32d880869ff161d4877fe60571558817eaf3:classes/local/guide_discovery.php'],
    {cwd:root, encoding:'utf8'});
const normalize = value => value.replace(/\r\n/g, '\n');
const normalizedSource = normalize(source);
const added = normalizedSource.slice(normalizedSource.indexOf('    /**\n     * Prepare illustration-only'),
    normalizedSource.indexOf('    /** Modern reading topics'));
assert.ok(added.includes('public static function card_inspection('));
assert.equal(normalizedSource.replace(added, ''), normalize(original), 'All historical adapters remain unchanged');
const invalid = execFileSync(process.argv[2], ['-r',
    'define("MOODLE_INTERNAL",true);require($argv[1]);try{' +
    '\\local_groupimport\\local\\guide_discovery::card_inspection("participant");exit(2);}' +
    'catch(\\InvalidArgumentException $error){echo "rejected";}',
    path.join(root, 'classes/local/guide_discovery.php')], {encoding:'utf8'});
assert.equal(invalid, 'rejected', 'Unknown destination rejects before string lookup or data access');
const scenes = {};
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2], [fixture, language], {encoding:'utf8'}));
    assert.equal(data.historicalSlides.length, 24);
    assert.equal(data.readingSlides[0].id, 'use-this-guide');
    assert.equal(data.practicePath.length, 6);
    assert.equal(data.slides.some(slide => slide.discoveryscene.kind === 'inspection'), false,
        'The four discovery samples remain unchanged; inspection belongs to existing card lessons');
    scenes[language] = data.inspectionScenes;
    for (const type of ['group', 'grouping']) {
        const scene = data.inspectionScenes[type];
        assert.equal(scene.kind, 'inspection');
        assert.equal(scene.inspection, true);
        assert.equal(scene.grouping, type === 'grouping');
        assert.deepEqual(scene.phases.map(phase => phase.name), ['orient', 'open', 'enter', 'review', 'return']);
        assert.ok(scene.phases[1].compactlabel);
        assert.equal(scene.initiallabel, scene.phases[0].label);
        assert.equal(scene.inputvalue.split('\n').length, 2);
        assert.equal(scene.inputvalue.split('\n')[1], scene.unknownlabel);
        assert.equal(scene.unknownlabel, 'unknown-entry');
        if (type === 'group') assert.equal(scene.inputvalue.split('\n')[0], 'alex@example.test');
        else assert.equal(scene.inputvalue.split('\n')[0], scene.knownlabel);
        for (const key of ['cardtitle', 'cardmeta', 'actionlabel', 'inputlabel', 'caption', 'menutitle',
            'knownlabel', 'resultlabel', 'note', 'addlabel', 'cancellabel', 'pauselabel', 'resumelabel',
            'nextphaselabel', 'finishedlabel', 'recaptitle', 'replay', 'reset']) {
            assert.ok(typeof scene[key] === 'string' && scene[key].trim(), language + '/' + type + '/' + key);
        }
        for (const key of ['target', 'guidedpath', 'completionMode', 'open', 'showopen', 'url', 'command']) {
            assert.equal(Object.hasOwn(scene, key), false, 'Illustration context is not a native action/path');
        }
    }
}
for (const type of ['group', 'grouping']) {
    assert.notEqual(scenes.en[type].actionlabel, scenes.fr[type].actionlabel);
    assert.notEqual(scenes.en[type].phases[1].compactlabel, scenes.fr[type].phases[1].compactlabel);
}
console.log('PASS4 localized inspection contexts; historical adapters/24 slides/six-step path and four discovery samples preserved. Activation is checked separately.');
