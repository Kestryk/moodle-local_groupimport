// Bounded product successor: real presentation and actual typed completion gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Supply PHP executable');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = '0980a2bff71be76890a0d3b1c65d597b9807f3dc';
const old = file => execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}).replace(/\r\n/g, '\n');
for (const file of ['styles.css', 'templates/easyedu_guide.mustache', 'templates/manage.mustache',
    'amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js', 'amd/src/motion.js',
    'amd/build/motion.min.js', 'ajax.php', 'settings.php', 'version.php',
    'docs/testing/guide-historical-presentation-archive-2026-10-10.json',
    'tools/release/test-guide-current-path-coverage.cjs']) assert.equal(read(file), old(file), file);
const manager = read('amd/src/course_manager.js');
let built;
vm.runInNewContext(read('amd/build/course_manager.min.js'), {
    define: (name, dependencies, factory) => {built = {name, dependencies, exports: factory({}, {}, {})};},
    window: {}, document: {},
});
assert.equal(built.name, 'local_groupimport/course_manager');
assert.equal(typeof built.exports.init, 'function');
assert.equal(JSON.stringify(built.dependencies), JSON.stringify(['local_groupimport/motion',
    'local_groupimport/searchable_choices', 'local_groupimport/member_selection']));
const from = manager.indexOf('const emitNativePathCompletion =');
const to = manager.indexOf('const emitEditorInspectionCompletion =', from);
assert.ok(from >= 0 && to > from);
const engine = manager.slice(from, to);
let reconstructed = manager;
const helperStart = reconstructed.indexOf('// Completion uses the same result authority');
const helperEnd = reconstructed.indexOf('const emitEditorInspectionCompletion =', helperStart);
reconstructed = reconstructed.slice(0, helperStart) + reconstructed.slice(helperEnd);
const openerStart = reconstructed.indexOf("        if (selector === 'tutorial:participant-filter-workspace'");
const openerEnd = reconstructed.indexOf('        const editorTargets =', openerStart);
assert.ok(openerStart >= 0 && openerEnd > openerStart);
reconstructed = reconstructed.slice(0, openerStart) + reconstructed.slice(openerEnd);
reconstructed = reconstructed.replace(/    if \(list\.matches\('\[data-easystud-participant-list\]'\)\) \{\n        pagination\.setAttribute\('data-easystud-guide-result-scope', 'participants'\);\n    }\n/, '');
reconstructed = reconstructed.replace(/            if \(type === 'participant'\) \{\n                emitFilterPathCompletion\(root, deselect \? 'clear-selection' : 'select-results'\);\n            }\n/, '');
reconstructed = reconstructed.replace(/                    if \(key === 'participants'\) \{\n                        emitFilterPathCompletion\(root, 'open-filters'\);\n                    }\n/, '');
reconstructed = reconstructed.replace(/^\s*emitFilterPathCompletion\(root, '(?:apply-filter|clear-selection)'\);\n/gm, '');
assert.equal(reconstructed, old('amd/src/course_manager.js'), 'Complete controller outside exact additive adapter');
for (const file of ['lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php']) {
    assert.equal(read(file).replace(/^\$string\['filter_path_[^']+'\] = .*;\n/gm, ''), old(file));
}
const dataSource = read('classes/local/guide_discovery.php');
const invitationStart = dataSource.indexOf("            if ($source === 'reference-3') {");
const invitationEnd = dataSource.indexOf("            if ($source === 'discovery-membership')", invitationStart);
const pathStart = dataSource.indexOf('    /** Verify native filtered selection');
const pathEnd = dataSource.indexOf('    /** Inspect actual editor fields', pathStart);
assert.ok(invitationStart >= 0 && invitationEnd > invitationStart && pathEnd > pathStart);
assert.equal(dataSource.slice(0, invitationStart) + dataSource.slice(invitationEnd, pathStart) +
    dataSource.slice(pathEnd), old('classes/local/guide_discovery.php'), 'All previous payloads and reading/path contracts');
let manage = read('manage.php');
const targetStart = manage.indexOf("            'participantFilterToggle' =>");
const targetEnd = manage.indexOf("            'layoutBoth' =>", targetStart);
manage = manage.slice(0, targetStart) + manage.slice(targetEnd);
manage = manage.replace("            'verify-with-filters' => get_string('filter_path_title', 'local_groupimport'),\n", '');
manage = manage.replace("            'verify-with-filters' => \\local_groupimport\\local\\guide_discovery::filter_verification_path(),\n", '');
assert.equal(manage, old('manage.php'), 'Native configuration outside new four targets/path/label');
const steps = ['open-filters', 'apply-filter', 'select-results', 'clear-selection'];
let completionCases = 0;
for (const filtered of [false, true]) for (const open of [false, true]) {
    for (const selection of ['none', 'partial', 'exact', 'stale', 'all', 'empty-results']) {
        for (const step of steps) for (const next of steps) for (const locked of [false, true]) {
            const item = () => ({classList: {contains: () => false}});
            const one = item(), two = item(), excluded = item();
            const items = selection === 'empty-results' ? [] : [one, two];
            const selected = {none: [], partial: [one], exact: [one, two], stale: [one, excluded],
                all: [one, two, excluded], 'empty-results': []}[selection];
            [one, two, excluded].forEach(node => {node.classList.contains = name =>
                name === 'is-selected' && selected.includes(node);});
            const list = {};
            const panel = {hidden: !open, inert: !open, classList: {contains: () => open},
                getAttribute: () => open ? 'false' : 'true'};
            const checklist = {hidden: false, querySelector: () => ({disabled: locked,
                getAttribute: () => next})};
            const emitted = [];
            const host = {isConnected: true, querySelector: selector =>
                selector === '[data-easystud-participant-list]' ? list :
                    selector === '[data-easystud-advanced-filters="participants"]' ? panel : checklist,
                dispatchEvent: event => emitted.push(event.detail)};
            const api = vm.runInNewContext(engine + '\nemitFilterPathCompletion;', {
                document: {querySelector: selector => {
                    assert.ok(selector.includes('verify-with-filters'));return checklist;
                }},
                selectedClass: 'is-selected', getSelectableResultItems: target => {
                    assert.equal(target, list);return items;
                }, getSelectedItems: (target, type) => {
                    assert.equal(target, host);assert.equal(type, 'participant');return selected;
                }, hasActiveListFilters: () => filtered,
                CustomEvent: class {constructor(name, options) {this.detail = options.detail;}},
            });
            api(host, step);
            const valid = {'open-filters': open, 'apply-filter': filtered && items.length > 0,
                'select-results': filtered && selection === 'exact', 'clear-selection': selected.length === 0}[step];
            assert.equal(emitted.length, valid && !locked && next === step ? 1 : 0);
            if (emitted.length) assert.equal(JSON.stringify(emitted[0]),
                JSON.stringify({path: 'verify-with-filters', step}));
            completionCases++;
        }
    }
}
let migrationCases = 0;
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2],
        [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding: 'utf8'}));
    assert.equal(data.templateData.slides.length, 12);
    assert.equal(Object.keys(data.paths).length, 8);
    assert.equal(data.templateData.slides.filter(slide => slide.hasguidedpath).length, 7);
    const invitation = data.templateData.slides.find(slide => slide.id === 'search-filter-select');
    assert.equal(invitation.guidedpath, 'verify-with-filters');
    const definitions = data.paths['verify-with-filters'];
    assert.deepEqual(definitions.map(item => item.id), steps);
    assert.deepEqual(definitions.map(item => item.target), ['participantFilterToggle', 'participantFilterSearch',
        'participantFilteredResults', 'participantClearSelection']);
    assert.deepEqual(invitation.guidedpathsteps.items, definitions.map(item => item.title));
    definitions.forEach((item, index) => {
        assert.equal(item.requiresStep, index ? steps[index - 1] : undefined);
        assert.equal(item.completionMode, 'event');assert.equal(item.autoHighlightNext, true);
    });
    const guide = read('amd/src/easyedu_guide.js');
    const start = guide.indexOf('const getStateKey ='), end = guide.indexOf('const getCompletedSteps =', start);
    const entries = new Map();
    const api = vm.runInNewContext(guide.slice(start, end) + '\n({loadGuideState,saveGuideState});', {
        getStorage: () => ({getItem: key => entries.get(key) ?? null,
            setItem: (key, value) => entries.set(key, value)}),
    });
    const config = {...data.readingContract, storageKey: 'qa-offline-filter-path'};
    const key = config.storageKey + '.checklist';
    for (const [origin, positions] of Object.entries(config.readingIndexMigrations)) {
        positions.forEach((position, index) => {
            entries.clear();
            const completed = Object.fromEntries(Object.entries(data.paths).map(([id, items]) =>
                [id, items.map(item => item.id)]));
            const state = {slideIndex: index, path: 'first-structure', activeIndex: 1, completed};
            if (origin !== 'legacy') state.presentationKey = origin;
            const original = JSON.stringify(state);
            entries.set(key, original);
            const loaded = api.loadGuideState(config);
            assert.equal(entries.get(key), original);
            assert.equal(loaded.slideIndex, position);
            assert.equal(JSON.stringify(loaded.completed), JSON.stringify(completed));
            assert.equal(loaded.path, state.path);
            api.saveGuideState(config, loaded);
            assert.equal(entries.get(key + '.before-' + config.presentationKey), original);
            migrationCases++;
        });
    }
}
console.log(JSON.stringify({status: 'PASS', completionCases, migrationCases,
    languages: ['en', 'fr'], invitations: 7, paths: 8,
    scope: 'Actual product gate and PHP plus isolated storage; native responsive lifecycle remains pending'}, null, 2));
