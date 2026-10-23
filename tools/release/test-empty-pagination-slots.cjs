/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/cm/pagination.js'), 'utf8')
    .replace(/\r\n/g, '\n').replace(/^import[\s\S]*?from '[^']+';$/gm, '')
    .replace(/^export const /gm, 'const ');
let ids = [];
const makeNode = () => ({hidden: true, inert: false, textContent: '', disabled: false,
    attributes: new Map(), setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); }});
const label = makeNode();
const select = {...makeNode(), querySelector: () => label};
const tools = makeNode();
const selection = makeNode();
const count = makeNode();
const classes = new Set();
const bar = {classList: {toggle(name, value) { value ? classes.add(name) : classes.delete(name); }},
    querySelector(selector) {
        return new Map([['[data-easystud-list-count]', count],
            ['.local-groupimport-easystud-pagination__tools', tools],
            ['.local-groupimport-easystud-pagination__selection', selection]]).get(selector) || null;
    }, scrollWidth: 100, clientWidth: 100};
const scope = {classList: {contains: name => name === 'participant-focus'}};
const context = {participantFocusClass: 'participant-focus', structureFocusClass: 'structure-focus',
    selectedClass: 'is-selected', compactClass: 'compact',
    getOnDemandList: () => ({ids, isSelected: () => false}), hasActiveListFilters: () => false,
    getLabels: () => ({selectall: 'Select all', listeditemscounttemplate: '{count} listed'}),
    countLabel: (template, value) => template.replace('{count}', value),
    window: {requestAnimationFrame: callback => callback()}};
vm.runInNewContext(source + '\nthis.api = {updateResultSelectionControl, updatePaginationMetaControls};', context);
// Exercise empty -> populated -> empty transitions with the real exported functions.
for (const total of [0, 3, 0]) {
    ids = Array.from({length: total}, (_, i) => i + 1);
    context.api.updateResultSelectionControl(scope, {}, {selector: 'not-selectable'}, select);
    context.api.updatePaginationMetaControls(scope, {}, bar, total, 'top');
    assert.equal(select.hidden, false, 'the intrinsic slot must survive');
    assert.equal(select.disabled, total === 0);
    assert.equal(select.attributes.get('aria-disabled'), total === 0 ? 'true' : 'false');
    assert.equal(tools.hidden, false, 'the tools slot must survive');
    assert.equal(count.hidden, false, 'focus views reserve the count slot');
    assert.equal(classes.has('is-empty'), total === 0);
    assert.equal(tools.inert, total === 0);
    assert.equal(selection.inert, total === 0);
}
context.api.updatePaginationMetaControls(scope, {}, bar, 0, 'bottom');
assert.equal(tools.hidden, true, 'bottom controls retain their existing behavior');
console.log('PASS empty pagination slots: disabled selection, inert side lanes, reversible result transitions.');
