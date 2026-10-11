// Execute the existing native Group destination adapter without Moodle/network/storage.
// This audit is not an installed activity path, browser proof or database transaction test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/course_manager.js');
const from = source.indexOf('const bindMoveModal =');
const to = source.indexOf('const bindParticipantMessaging =', from);
assert.ok(from >= 0 && to > from);
const adapter = source.slice(from, to);

class Element {
    constructor(attributes = {}) {
        this.attributes = new Map(Object.entries(attributes));
        this.listeners = new Map();
        this.children = [];
        this.hidden = false;
        this.disabled = false;
        this.checked = false;
        this.value = '';
        this.textContent = '';
    }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    fire(name) { this.listeners.get(name)?.({target: this}); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    removeAttribute(name) { this.attributes.delete(name); }
    focus() {}
    appendChild(child) { this.children.push(child); }
    insertBefore(child) { this.children.unshift(child); }
    get firstChild() { return this.children[0]; }
    get options() { return this.children; }
    set innerHTML(value) { assert.equal(value, ''); this.children = []; }
}

const settle = () => new Promise(resolve => setImmediate(resolve));
let cases = 0;
async function runCase({count, destinationId, removeOriginal, existing, failure, cancelOnly = false}) {
    const calls = [];
    const copies = [];
    const moves = [];
    const completions = [];
    let reloads = 0;
    let clears = 0;
    const modal = new Element();
    modal.hidden = true;
    const destination = new Element();
    const confirm = new Element();
    const cancel = new Element();
    const opener = new Element();
    const remove = new Element();
    const wrap = new Element();
    const help = new Element();
    const label = new Element();
    const empty = new Element();
    const body = new Element({'data-move-groups-help': 'Choose a grouping', 'data-move-groups-label': 'Grouping'});
    modal.querySelector = selector => selector === '.local-groupimport-easystud-modal__body' ? body : null;
    const selected = Array.from({length: count}, (_, index) => new Element({
        'data-easystud-group-id': String(index + 10),
    }));
    const grouping = new Element({'data-easystud-grouping-id': '31'});
    grouping.querySelector = selector => {
        assert.equal(selector, '.local-groupimport-easystud-grouping__name');
        return {textContent: ' Activity grouping '};
    };
    const singles = new Map([
        ['[data-easystud-move-modal]', modal], ['[data-easystud-confirm-move]', confirm],
        ['[data-easystud-move-destination]', destination], ['[data-easystud-move-origin-wrap]', wrap],
        ['[data-easystud-move-remove-origin]', remove], ['[data-easystud-move-modal-help]', help],
        ['[data-easystud-move-modal-label]', label], ['[data-easystud-move-empty]', empty],
    ]);
    const lists = new Map([
        ['[data-easystud-move-selected-groups]', [opener]],
        ['[data-easystud-close-move-modal]', [cancel]],
        ['[data-easystud-grouping-id]', [grouping, grouping]],
    ]);
    const host = new Element({'data-easystud-detail-labels': '{}'});
    host.querySelector = selector => singles.get(selector) || null;
    host.querySelectorAll = selector => lists.get(selector) || [];
    const context = {
        document: {body: {}, activeElement: null, contains: () => false,
            createElement: tag => {assert.equal(tag, 'option'); return new Element();}},
        window: {location: {reload: () => reloads++}},
        Motion: {},
        getSelectedItems: (node, type) => {assert.equal(node, host); return type === 'group' ? selected : [];},
        getGroupsWithGroupingMembership: (node, groups) => groups,
        enhanceSelect: () => ({host: new Element(), trigger: new Element(), refresh() {}, close() {}}),
        showEasyStudModal: node => {node.hidden = false;},
        hideEasyStudModal: (node, callback) => {node.hidden = true; callback(); return Promise.resolve(true);},
        postAction: payload => {
            calls.push({...payload});
            return failure && payload.groupid === '11' ? Promise.reject(new Error('isolated failure')) :
                Promise.resolve({existing});
        },
        copyGroupElementToGrouping: (node, group, id) => copies.push([group.getAttribute('data-easystud-group-id'), id]),
        moveGroupElementToGrouping: (node, id, groupingId) => moves.push([id, groupingId]),
        clearSelectionState: () => clears++, updateSelectionActions() {}, showNotification() {},
        formatCountMessage: () => '', formatMoveSummary: () => '',
        emitGuidedCompletion: (node, step, kind) => completions.push([step, kind]),
        emitPracticeCompletion: () => assert.fail('Group command is not Participant practice'),
        emitMemberPathCompletion: () => assert.fail('Group command is not source-member transfer'),
    };
    vm.runInNewContext(adapter + '\nbindMoveModal(host, 5);', {...context, host});
    opener.fire('click');
    assert.equal(modal.getAttribute('data-easystud-move-context'), 'group');
    assert.equal(modal.hidden, false);
    assert.equal(remove.checked, false, 'Native default preserves original grouping memberships');
    assert.deepEqual(destination.options.map(option => option.value), ['0', '31'], 'No-grouping sentinel is distinct');
    assert.equal(destination.options[1].textContent, 'Activity grouping');
    assert.equal(wrap.hidden, count === 0);
    assert.equal(calls.length, 0, 'Presentation must not submit a business command');
    destination.value = destinationId;
    destination.fire('change');
    assert.equal(calls.length, 0, 'Choosing an option must not submit');
    assert.equal(completions.length, 0, 'Old Group adapter has no typed choose-destination completion');
    if (cancelOnly) {
        cancel.fire('click');
        assert.equal(modal.hidden, true);
        assert.equal(calls.length, 0);
        assert.equal(completions.length, 0);
        cases++;
        return;
    }
    remove.checked = removeOriginal;
    confirm.fire('click');
    await settle();
    await settle();
    assert.equal(calls.length, destinationId ? count : 0);
    calls.forEach((payload, index) => assert.deepEqual(payload, {
        courseid: 5, action: 'movegroup', groupid: String(index + 10),
        groupingid: destinationId, removefromorigin: removeOriginal ? 1 : 0,
    }));
    const failed = failure && count > 1 && !!destinationId;
    const expected = destinationId && count ? count - (failed ? 1 : 0) : 0;
    assert.equal(moves.length, removeOriginal || destinationId === '0' ? expected : 0);
    assert.equal(copies.length, !removeOriginal && destinationId !== '0' && !existing ? expected : 0);
    assert.equal(reloads, failed ? 1 : 0);
    assert.equal(clears, destinationId && count && !failed ? 1 : 0);
    assert.deepEqual(completions, destinationId && destinationId !== '0' && count && !failed ?
        [[1, 'actions'], [1, 'grouping']] : []);
    if (failed) {
        assert.equal(modal.hidden, false, 'Failed batch is not reported as completed');
        assert.equal(expected, 1, 'One successful response may precede another request failure: not atomic');
    }
    cases++;
}

async function main() {
    const baseline = '59d42bcc0c5e612dc290d8099711754b1e2ba46c';
    const protectedFiles = ['amd/src/course_manager.js', 'amd/build/course_manager.min.js',
        'amd/build/course_manager.min.js.map', 'amd/src/easyedu_guide.js', 'amd/build/easyedu_guide.min.js',
        'amd/src/motion.js', 'amd/build/motion.min.js', 'manage.php', 'classes/local/guide_discovery.php',
        'templates/manage.mustache', 'templates/easyedu_guide.mustache', 'styles.css', 'ajax.php',
        'settings.php', 'version.php', 'lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php',
        'tools/release/test-guide-current-path-coverage.cjs', 'tools/release/test-guide-filter-path.cjs'];
    protectedFiles.forEach(file => assert.equal(read(file), execFileSync('git', ['show', baseline + ':' + file],
        {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}).replace(/\r\n/g, '\n'), file));
    for (const count of [0, 1, 2]) for (const destinationId of ['', '0', '31']) {
        for (const removeOriginal of [false, true]) for (const existing of [false, true]) {
            for (const failure of [false, true]) {
                await runCase({count, destinationId, removeOriginal, existing, failure});
            }
        }
    }
    await runCase({count: 2, destinationId: '31', removeOriginal: false, existing: false,
        failure: false, cancelOnly: true});
    assert.equal(cases, 73);
    // The legacy stage also has unrelated member-removal/member-paste call sites.
    const removal = source.slice(source.indexOf('const removeButton = event.target.closest'),
        source.indexOf("root.addEventListener('input'", source.indexOf('const removeButton = event.target.closest')));
    assert.match(removal, /removeMembers\(root, courseId, members\)/);
    assert.match(removal, /emitGuidedCompletion\(root, 1, 'grouping'\)/);
    const copiedUsers = source.slice(source.indexOf('const addCopiedUsersToGroup ='),
        source.indexOf('const addCopiedGroupsToGrouping ='));
    assert.match(copiedUsers, /action: 'addemails'/);
    assert.match(copiedUsers, /emitGuidedCompletion\(root, 1, 'grouping'\)/);
    const endpoint = read('ajax.php');
    const groupAction = endpoint.slice(endpoint.indexOf("} else if ($action === 'movegroup')"),
        endpoint.indexOf("} else if ($action === 'duplicategroup')"));
    assert.match(groupAction, /groups_assign_grouping\(\$grouping->id, \$groupid\)/);
    assert.match(groupAction, /if \(\$removefromorigin\)/);
    assert.match(groupAction, /\$response\['existing'\] = \$existing/);
    console.log(JSON.stringify({status: 'PASS', nativeAdapterCases: cases,
        protectedFilesUnchanged: protectedFiles.length, baseline,
        unrelatedLegacyCompletionSites: 2,
        adapterSha256: crypto.createHash('sha256').update(adapter).digest('hex'),
        scope: 'Actual adapter execution in isolated mocks; backend source contract only; no new path, native browser or database proof'}, null, 2));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
