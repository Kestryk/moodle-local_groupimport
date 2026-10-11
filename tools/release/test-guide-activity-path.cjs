// Actual bilingual payload and bounded native completion successor; no Moodle writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 3, 'Supply PHP executable');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const baseline = '0a929b5b8f9e04baa71479aca4cda0e652ce976c';
const old = file => execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}).replace(/\r\n/g, '\n');
for (const file of ['amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js',
    'amd/src/motion.js', 'amd/build/motion.min.js', 'ajax.php', 'settings.php', 'version.php',
    'styles.css', 'templates/manage.mustache', 'templates/easyedu_guide.mustache',
    'tools/release/test-guide-activity-context-bridge.cjs']) assert.ok(read(file) === old(file), file);
const ids = ['open-grouping', 'select-groups', 'choose-grouping', 'confirm-groups', 'verify-grouping'];
const targets = ['activityGroupingEntry', 'activityGroupSelection', 'activityGroupDestination',
    'activityGroupConfirm', 'activityGroupingResult'];
for (const language of ['en', 'fr']) {
    const data = JSON.parse(execFileSync(process.argv[2],
        [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding: 'utf8'}));
    assert.equal(data.templateData.slides.length, 12);
    assert.equal(Object.keys(data.paths).length, 9);
    const steps = data.paths['prepare-activity-grouping'];
    assert.deepEqual(steps.map(step => step.id), ids);
    assert.deepEqual(steps.map(step => step.target), targets);
    steps.forEach((step, index) => {
        assert.ok(step.title && step.description && step.open);
        assert.equal(step.completionMode, 'event');
        if (index) assert.equal(step.requiresStep, ids[index - 1]);
    });
    const invitation = data.templateData.slides.find(slide => slide.id === 'use-groupings-in-activities');
    assert.equal(invitation.guidedpath, 'prepare-activity-grouping');
    assert.deepEqual(invitation.guidedpathsteps.items, steps.map(step => step.title));
    assert.deepEqual(data.paths['create-grouping'].map(step => step.id),
        ['create-grouping', 'add-group-to-grouping', 'verify-grouping']);
    // Evaluate only the predecessor's literal path array against current translations.
    const oldManage = old('manage.php');
    const pathsFrom = oldManage.indexOf("        'paths' => [");
    const pathsTo = oldManage.indexOf("        'labels' => [", pathsFrom);
    const literal = oldManage.slice(pathsFrom + "        'paths' => ".length, pathsTo).trim().replace(/,$/, '');
    const php = 'define("MOODLE_INTERNAL", true); require $argv[1]; ' +
        'function get_string($key,$component){global $string; return $string[$key];} ' +
        'require $argv[2]; $literal=stream_get_contents(STDIN); echo json_encode(eval("return ".$literal.";"));';
    const oldPaths = JSON.parse(execFileSync(process.argv[2], ['-r', php,
        path.join(root, 'lang', language, 'local_groupimport.php'),
        path.join(root, 'classes/local/guide_discovery.php')], {encoding: 'utf8', input: literal}));
    Object.entries(oldPaths).forEach(([id, value]) => assert.deepEqual(data.paths[id], value,
        'Preserve complete old definition: ' + id));
    assert.equal(data.templateData.slides.filter(slide => slide.hasguidedpath).length, 7);
}
const manager = read('amd/src/course_manager.js');
const from = manager.indexOf('const emitNativePathCompletion =');
const to = manager.indexOf('// Capture before the native asynchronous Group batch,', from);
assert.ok(from > 0 && to > from);
const helpers = manager.slice(from, to);
let cases = 0;
for (const connected of [false, true]) for (const hidden of [false, true]) {
    for (const disabled of [false, true]) for (const step of ids) {
        for (const matchingDestination of [false, true]) for (const allPresent of [false, true]) {
            for (const current of [false, true]) {
                const events = [];
                const token = {root: null, config: {}, epoch: 7};
                const next = {disabled, getAttribute: () => step};
                const checklist = {hidden, querySelector: () => next};
                const grouping = {getAttribute: () => matchingDestination ? '31' : '32'};
                const childGroups = (allPresent ? ['10', '11'] : ['10']).map(id => ({hidden: false,
                    closest: () => grouping, getAttribute: () => id}));
                grouping.querySelector = selector => selector.includes('collapse-toggle') ?
                    {getAttribute: () => 'true'} : {hidden: false, querySelectorAll: () => childGroups};
                const host = {isConnected: connected, querySelectorAll: () => [grouping],
                    dispatchEvent: event => events.push(event.detail)};
                token.root = host;
                const scope = {document: {querySelector: () => checklist},
                    CustomEvent: class {constructor(name, data) {this.detail = data.detail;}},
                    Guide: {getPathContextToken: () => current ? token : null,
                        getPathContext: () => ({destinationId: '31', groupIds: ['10', '11']})},
                    getSelectedItems: () => [{getAttribute: () => '10'}]};
                vm.runInNewContext(helpers + '\nthis.verify = verifyActivityGrouping;' +
                    '\nthis.entry = emitActivityGroupingEntry;\nthis.selection = emitActivityGroupSelection;', scope);
                scope.verify(host, grouping, token);
                const expected = connected && !hidden && !disabled && step === 'verify-grouping' &&
                    matchingDestination && allPresent && current;
                assert.equal(events.length, expected ? 1 : 0);
                events.length = 0;
                scope.entry(host, matchingDestination ? '31' : '32', token);
                assert.equal(events.length, connected && !hidden && !disabled && step === 'open-grouping' && current ? 1 : 0);
                events.length = 0;
                scope.selection(host);
                assert.equal(events.length, connected && !hidden && !disabled && step === 'select-groups' ? 1 : 0);
                cases++;
            }
        }
    }
}
assert.match(manager, /options\.onComplete\?\.\(\)/);
assert.match(manager, /onComplete: \(\) => \{\s+if \(!expanded\)/);
assert.match(manager, /verifyActivityGrouping\(root, section, activityToken\)/);
// Presentation branches cannot call any completion helper or business command.
const openers = manager.slice(manager.indexOf("if (selector === 'tutorial:activity-grouping-workspace'"),
    manager.indexOf("if (selector === 'tutorial:participant-filter-workspace'"));
assert.ok(openers.length > 0);
assert.doesNotMatch(openers, /emitNativePathCompletion|verifyActivityGrouping|postAction|setPathContext/);
assert.match(openers, /root\.easystudDesktopMode !== 'structure'/);
assert.match(openers, /context\.destinationId/);
let built;
vm.runInNewContext(read('amd/build/course_manager.min.js'), {
    window: {}, document: {}, define: (name, dependencies, factory) => {
        built = {name, dependencies, api: factory({}, {}, {}, {})};
    }});
assert.equal(typeof built.api.init, 'function');
console.log(JSON.stringify({status: 'PASS', languages: ['en', 'fr'], guardedCases: cases,
    paths: 9, readings: 12, invitations: 7, legacyProgressRetained: true,
    browserProof: false, businessOutcomeProof: false}, null, 2));
