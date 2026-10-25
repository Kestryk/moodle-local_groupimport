// Execute existing result-scope authorities before adding a Guide completion adapter.
// Minimal DOM-shaped inputs, not a browser or installed guided path.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const declarations = require('./lib/js-declarations.cjs');
const source = declarations(root, 'amd/src/local/cm/filters.js', ['hasActiveListFilters']) + '\n' +
    declarations(root, 'amd/src/local/cm/pagination.js', ['isItemFilteredOut', 'getSelectableResultItems']) + '\n' +
    declarations(root, 'amd/src/local/cm/cards.js', ['getOnDemandList']) + '\n' +
    declarations(root, 'amd/src/local/cm/state.js', ['onDemandParticipants', 'getOnDemandModel']);
const api = vm.runInNewContext(source +
    '\n({hasActiveListFilters,isItemFilteredOut,getSelectableResultItems});', {
    getSelectedFilterValues: control => control ? control.selectedValues || [] : [],
});
const exclusions = ['data-easystud-filter-hidden', 'data-easystud-catalog-filter-hidden',
    'data-easystud-catalog-search-hidden', 'data-easystud-structure-search-hidden',
    'data-easystud-grouping-filter-hidden'];
let exclusionCases = 0;
for (let mask = 0; mask < 32; mask++) {
    for (const hidden of [false, true]) for (const offPage of [false, true]) {
        for (const validEntity of [false, true]) {
            const attributes = new Map();
            exclusions.forEach((name, index) => {if (mask & (1 << index)) attributes.set(name, '1');});
            if (offPage) attributes.set('data-easystud-page-hidden', '1');
            const item = {hidden, hasAttribute: name => attributes.has(name),
                getAttribute: name => attributes.get(name) ?? null,
                matches: selector => {assert.equal(selector, '[data-easystud-user]');return validEntity;}};
            assert.equal(api.isItemFilteredOut(item), mask !== 0);
            const results = api.getSelectableResultItems({children: [item], closest: () => null}, {selector: '[data-easystud-user]'});
            assert.equal(results.length, validEntity && mask === 0 && (!hidden || offPage) ? 1 : 0);
            if (results.length) assert.equal(results[0], item);
            exclusionCases++;
        }
    }
}
const controls = ['[data-easystud-search]', '[data-easystud-role-filter]',
    '[data-easystud-group-filter]', '[data-easystud-grouping-filter]'];
let filterCases = 0;
for (let mask = 0; mask < 16; mask++) {
    const values = new Map(controls.map((selector, index) => [selector,
        index === 0 ? {value: mask & 1 ? ' name ' : '   '} :
            {selectedValues: mask & (1 << index) ? ['existing-value'] : []}]));
    const host = {querySelector: selector => values.get(selector)};
    const list = {matches: selector => selector === '[data-easystud-participant-list]'};
    assert.equal(api.hasActiveListFilters(host, list), mask !== 0);
    filterCases++;
}
assert.equal(api.hasActiveListFilters(null, null), false);
console.log(JSON.stringify({status: 'PASS', exclusionCases, filterCases,
    scope: 'Actual existing helper execution; no Guide path installed, native DOM, selection gesture or business completion proof'}, null, 2));
