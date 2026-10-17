// Isolated controller and preservation checks; not native geometry or acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/local/cm/workspace.js').replace(/export /g, '');
const start = source.indexOf('const syncParticipantDensity =');
const end = source.indexOf('/**', start);
assert(start >= 0 && end > start);
let records = 0;
for (const width of [390, 768, 1024, 1600]) {
    let responsive = width <= 1024;
    let selected = [];
    let motion = 0;
    let overflowSyncs = 0;
    const classes = new Set(['local-groupimport-easystud--compact-users']);
    const cards = [1, 2, 3].map(id => ({
        id, rows: [{hidden: false}, {hidden: false}], role: {hidden: false}, profile: {hidden: false},
        querySelectorAll(selector) {
            assert.equal(selector, '[data-easystud-participant-memberships], [data-easystud-participant-profile]');
            return [...this.rows, this.profile];
        },
    }));
    const rootNode = {
        classList: {
            contains: name => classes.has(name), remove: name => classes.delete(name),
            toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
        },
        querySelectorAll(selector) {
            assert.equal(selector, '[data-easystud-participant-list] [data-easystud-user]');
            return cards;
        },
        easystudParticipantDensity: {desktopCompact: true, mobileCompact: true, responsive: false,
            expandedParticipant: null, updateToggle() {}},
    };
    let sync;
    sync = vm.runInNewContext(source.slice(start, end) + '\nsyncParticipantDensity;', {
        isResponsiveWorkspace: () => responsive,
        compactClass: 'local-groupimport-easystud--compact-users',
        getSelectedItems: (_, type) => { assert.equal(type, 'participant'); return selected; },
        syncParticipantTagOverflow() { overflowSyncs++; }, requestGuideHighlightRefresh() {},
        updateSelectionActions: () => sync(rootNode, {animate: false}),
        Motion: {timing: {normal: 320}, resize: (_, apply, options) => {
            assert.equal(options.duration, 320); motion++; apply(); options.onComplete();
        }},
    });
    const check = expected => {
        assert.deepEqual(cards.map(c => c.rows.map(r => r.hidden)), expected.map(hidden => [hidden, hidden]));
        assert(cards.every((c, i) => !c.role.hidden && c.profile.hidden === expected[i]));
        records++;
    };
    sync(rootNode, {animate: false});
    check(responsive ? [true, true, true] : [false, false, false]);
    const initialSyncs = overflowSyncs;
    sync(rootNode); sync(rootNode, {animate: false});
    assert.equal(overflowSyncs, initialSyncs, 'Unchanged refreshes never remeasure membership tags');
    assert.equal(motion, 0, 'Unchanged refreshes never restart Motion');
    selected = [cards[0]]; sync(rootNode);
    check(responsive ? [false, true, true] : [false, false, false]);
    selected = [cards[0], cards[1]]; sync(rootNode);
    check(responsive ? [true, true, true] : [false, false, false]);
    selected = [cards[1]]; sync(rootNode);
    check(responsive ? [true, false, true] : [false, false, false]);
    selected = []; sync(rootNode);
    check(responsive ? [true, true, true] : [false, false, false]);
    assert.equal(motion, responsive ? 4 : 0);
    rootNode.easystudParticipantDensity.mobileCompact = false;
    selected = [cards[0], cards[1]]; sync(rootNode, {animate: false});
    check([false, false, false]);
    responsive = false; sync(rootNode, {animate: false});
    check([false, false, false]);
    assert(classes.has('local-groupimport-easystud--compact-users'), 'Desktop density preference survives');
    responsive = true; rootNode.easystudParticipantDensity.mobileCompact = true;
    selected = []; sync(rootNode, {animate: false});
    check([true, true, true]);
    assert(!classes.has('local-groupimport-easystud--compact-users'));
}
// T055 moved the density authority into workspace; profile now follows membership disclosure.
assert(read('amd/src/local/cm/workspace.js').includes('selectedUsers.length === 1 && !isResponsiveWorkspace()'));
assert(read('templates/sm/participant_card.mustache').includes('data-easystud-participant-memberships'));
let amd;
vm.runInNewContext(read('amd/build/course_manager.min.js'), {define: (name, deps, factory) => {
    assert.equal(name, 'local_groupimport/course_manager');
    assert(deps.includes('local_groupimport/local/cm/workspace'));
    amd = factory(...deps.map(() => ({})));
}});
assert.equal(typeof amd.init, 'function');
console.log(`PASS ${records} current modular membership/profile density states and generated entrypoint.`);
