// K17-80: the participant grouping control and filter stay shared across workspace views.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const block = (source, name) => {
    const start = source.indexOf('export const ' + name + ' =');
    assert.notEqual(start, -1, name + ' remains exported');
    const end = source.indexOf('\n};', start);
    assert.notEqual(end, -1, name + ' block remains bounded');
    return source.slice(start, end + 3).replace('export const ', 'const ');
};
const template = read('templates/manage.mustache');
const groupingBlock = template.match(/<div class="([^"]*__filter-group--groupings[^"]*)">([\s\S]*?)<\/select>/);
assert.ok(groupingBlock, 'the shared participant grouping control is present');
assert.ok(!groupingBlock[1].includes('__filter-group--participant-only'), 'complete view does not hide the control');
assert.match(groupingBlock[2], /{{groupingsfilterlabel}}/);
assert.match(groupingBlock[2], /{{#groupingoptions}}/);
assert.equal((template.match(/data-easystud-grouping-filter="1"/g) || []).length, 1,
    'all views reuse one selection control, not a second state');
const filterControls = read('amd/src/local/cm/filters.js');
assert.match(filterControls, /\[data-easystud-grouping-filter\], \[data-easystud-catalog-grouping-filter\]/);
assert.match(filterControls, /const choice = enhanceMultipleSelect\(select,/);

const state = {
    meta: {display: {}},
    roles: [{id: 5, name: 'Participant'}],
    groups: [{id: 10, name: 'Alpha', groupingids: [100]}, {id: 11, name: 'Beta', groupingids: [101]},
        {id: 12, name: 'Other', groupingids: []}],
    groupings: [{id: 100, name: 'One', groupids: [10]}, {id: 101, name: 'Two', groupids: [11]}],
    users: [
        {id: 1, fullname: 'Ada', roleids: [5], groupids: [10]},
        {id: 2, fullname: 'Bea', roleids: [5], groupids: [11]},
        {id: 3, fullname: 'Cam', roleids: [5], groupids: [12]},
        {id: 4, fullname: 'Dan', roleids: [5], groupids: []},
    ],
};
const select = values => ({tagName: 'SELECT', multiple: true,
    options: values.map(value => ({value, selected: true})),
    get selectedOptions() {
        return this.options.filter(option => option.selected);
    },
    set selectedOptions(options) {
        this.options = options.map(option => ({...option, selected: true}));
    },
});
let mode = 'complete';
let mobile = '';
let model;
const controls = {
    '[data-easystud-search]': {value: ''},
    '[data-easystud-role-filter]': select([]),
    '[data-easystud-group-filter]': select([]),
    '[data-easystud-grouping-filter]': select(['100']),
};
const fixtureRoot = {
    querySelector: selector => controls[selector],
    querySelectorAll: () => [],
    classList: {contains: name => mode === 'participants' && name === 'participant-focus'},
    getAttribute: name => name === 'data-easystud-mobile-view-active' ? mobile : null,
};
let pageResets = 0;
const context = {
    normalise: text => text.toLowerCase(), getOnDemandModel: () => model,
    participantFocusClass: 'participant-focus', syncPagination: () => pageResets++,
    updateParticipantEmptyState() {}, syncResponsiveResetButtons() {}, scheduleResponsiveUiRefresh() {},
    filterChoiceControllers: new Map(),
};
const engine = ['amd/src/local/sm/filter_engine.js', 'amd/src/local/sm/index.js'].map(read).join('\n')
    .replace(/^import .*;$/gm, '').replace(/^export \{[^}]+\};?$/gm, '').replace(/^export (const )/gm, '$1');
vm.runInNewContext(engine + '\n' + block(filterControls, 'getSelectedFilterValues') + '\n' +
    block(filterControls, 'refreshFilterChoice') + '\n' + block(filterControls, 'resetFilters') + '\n' +
    block(read('amd/src/local/sm/participants.js'), 'applyParticipantFilters') + '\n' +
    block(read('amd/src/local/cm/workspace.js'), 'applyFilters') +
    '\nthis.api = {buildParticipantIndex, applyFilters, resetFilters};', context);
model = {index: context.api.buildParticipantIndex(state)};
let cases = 0;
for (const locale of ['fr', 'en']) {
    const language = read('lang/' + locale + '/local_groupimport.php');
    assert.match(language, /\$string\['groupingsfilterlabel'\] = '[^']+'/);
    for (const values of [['100'], ['101'], ['100', '101'], ['__none__'], []]) {
        const expected = values.length === 0 ? [1, 2, 3, 4] : values[0] === '__none__' ? [3, 4] :
            values.length === 2 ? [1, 2] : values[0] === '100' ? [1] : [2];
        const control = controls['[data-easystud-grouping-filter]'];
        control.selectedOptions = values.map(value => ({value}));
        for (const [view, mobileView] of [['complete', ''], ['participants', ''], ['structure', ''],
            ['complete', 'participants'], ['complete', 'groups'], ['complete', '']]) {
            mode = view;
            mobile = mobileView;
            context.api.applyFilters(fixtureRoot);
            assert.deepEqual(Array.from(model.filteredIds), expected, locale + ': ' + view + '/' + mobileView);
            assert.strictEqual(controls['[data-easystud-grouping-filter]'], control, 'view changes keep the control');
            cases++;
        }
    }
}
controls['[data-easystud-grouping-filter]'].selectedOptions = [{value: '100'}];
controls['[data-easystud-group-filter]'].selectedOptions = [{value: '11'}];
context.api.applyFilters(fixtureRoot);
assert.deepEqual(Array.from(model.filteredIds), [], 'group and grouping filters still combine with AND');
const resetsBefore = pageResets;
context.api.applyFilters(fixtureRoot, {pagination: false, responsive: false});
assert.equal(pageResets, resetsBefore, 'view switches can preserve pagination');
context.api.resetFilters(fixtureRoot);
for (const view of ['complete', 'participants', 'complete']) {
    mode = view;
    context.api.applyFilters(fixtureRoot);
    assert.deepEqual(Array.from(model.filteredIds), [1, 2, 3, 4], 'reset clears the shared grouping state in ' + view);
}
console.log(JSON.stringify({passed: true, surface: 'participant-grouping-filter-views', cases,
    singleControl: true, sharedEngine: true, sharedReset: true, runtimeAccess: false}));
