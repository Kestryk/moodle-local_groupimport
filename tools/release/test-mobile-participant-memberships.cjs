// Isolated controller and preservation checks; not native geometry or acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/course_manager.js');
const baseline = '02d8013d4e73ebb3415a3ac41f801143306d60cd';
const old = file => execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const start = source.indexOf('const syncParticipantDensity =');
const end = source.indexOf('const bindOptionalTools =', start);
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
            assert.equal(selector, '[data-easystud-participant-memberships]');
            return this.rows;
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
        assert(cards.every(c => !c.role.hidden && !c.profile.hidden));
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
// Reconstruct every untouched command, Guide, disclosure and selection region.
let reconstructed = source.replace('        syncParticipantDensity(root, {animate: false});\n', '')
    .replace('    syncParticipantDensity(root);\n', '');
const helperStart = reconstructed.indexOf('/**\n * Keep compact membership visibility independent');
const helperEnd = reconstructed.indexOf('const bindOptionalTools =', helperStart);
reconstructed = reconstructed.slice(0, helperStart) + reconstructed.slice(helperEnd);
const replaceDensityPrefix = text => {
    const a = text.indexOf('const bindOptionalTools =');
    const b = text.indexOf('    if (modal && openClipboardButtons.length', a);
    assert(a >= 0 && b > a);
    return text.slice(0, a) + 'DENSITY_PREFIX\n' + text.slice(b);
};
assert.equal(replaceDensityPrefix(reconstructed), replaceDensityPrefix(old('amd/src/course_manager.js')));
const markup = read('templates/manage.mustache');
assert.equal((markup.match(/data-easystud-participant-memberships=/g) || []).length, 2);
assert.equal(markup.replace(/ data-easystud-participant-memberships="(?:groups|groupings)"/g, ''),
    old('templates/manage.mustache'));
assert.equal(read('styles.css'), old('styles.css'));
assert(source.includes('selectedUsers.length === 1 && !isResponsiveWorkspace()'), 'Desktop automatic density is untouched');
let amd;
vm.runInNewContext(read('amd/build/course_manager.min.js'), {define: (name, deps, factory) => {
    assert.equal(name, 'local_groupimport/course_manager');
    assert.equal(deps.join(','), 'local_groupimport/motion,local_groupimport/searchable_choices,local_groupimport/member_selection');
    amd = factory({}, {}, {});
}});
assert.equal(typeof amd.init, 'function');
const design = JSON.parse(read('docs/testing/mobile-participant-memberships-final-2026-10-05.json'));
assert.equal(design.localMasters, 0);
assert.equal(design.records.length, 12);
for (const card of design.records) {
    assert.equal(card.overflow.length, 0);
    assert.deepEqual(card.fonts, ['Inter']);
    assert(card.texts.includes('ROLES'));
    assert(card.texts.includes('PROGRAMME'));
    assert.equal(card.title.size, '14');
    assert.equal(card.title.weight, '700');
    assert.equal(card.title.color, '#264861');
    assert.equal(card.headerDelta, 0);
    assert.equal(card.texts.includes('GROUPS'), !!card.state.membershipsVisible);
    assert.equal(card.texts.includes('GROUPINGS'), !!card.state.membershipsVisible);
    assert(card.roots.some(link => link.component === '16efa6a5-be95-808f-8008-98eada4dab16'));
}
console.log(`PASS ${records} isolated membership states, source/build preservation and 12 saved Penpot usages; native/human pending.`);
