'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/cm/optional_tools.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export const /g, 'const ');
const noop = () => {};
const classes = new Set();
const element = () => ({disabled: false, hidden: false, attrs: {}, text: {}, icon: {classList: {toggle: noop}},
    setAttribute(key, value) { this.attrs[key] = value; },
    getAttribute(key) { return this.attrs[key] || key; },
    querySelector(selector) { return selector === '.fa' ? this.icon : this.text; },
    addEventListener: noop,
});
const density = element();
const mobileToggle = element();
const host = {classList: {contains: name => classes.has(name), remove: name => classes.delete(name),
    toggle: (name, value) => value ? classes.add(name) : classes.delete(name)},
    querySelector: selector => selector === '[data-easystud-density-toggle]' ? density :
        selector === '[data-easystud-mobile-membership-toggle]' ? mobileToggle : null,
    querySelectorAll: () => [],
};
let mobile = true;
let model = null;
const context = {isResponsiveWorkspace: () => mobile, getOnDemandModel: () => model, compactClass: 'compact',
    syncParticipantDensity: () => host.easystudParticipantDensity.updateToggle()};
vm.runInNewContext(source + '\nthis.bind = bindOptionalTools;', context);
context.bind(host);
const sync = () => host.easystudParticipantDensity.updateToggle();
assert.equal(density.disabled, true, 'no state yet is not an available membership command');
assert.equal(mobileToggle.disabled, true);
model = {index: [], raw: {groups: [{id: 1, memberids: []}], groupings: [{id: 2}]}};
sync();
assert.equal(mobileToggle.disabled, true, 'empty Groups/Groupings do not constitute participant memberships');
model.index = [{id: 9, groupids: [], groupingids: []}];
sync();
assert.equal(density.disabled, true, 'enrolled participants without memberships');
model.index.push({id: 10, groupids: ['1'], groupingids: []});
model.filteredIds = [];
sync();
assert.equal(density.disabled, false, 'a membership outside the displayed/filter page still counts');
assert.equal(mobileToggle.disabled, false);
model.index = [{id: 10, groupids: [], groupingids: ['2']}];
sync();
assert.equal(mobileToggle.disabled, false, 'reuse the index grouping facts as well');
model.index = [];
sync();
assert.equal(mobileToggle.disabled, true, 'last membership removed updates availability');
mobile = false;
sync();
assert.equal(density.disabled, false, 'desktop full-information command remains available');
assert.equal(mobileToggle.hidden, true);
mobile = true;
sync();
assert.equal(density.disabled, true, 'returning to responsive recomputes the disabled state');
assert.equal(mobileToggle.hidden, false, 'disabled does not replace the control with hiding');
console.log(JSON.stringify({passed: true, fullIndex: true, emptyContainers: true, liveChanges: true,
    desktopPreserved: true, nativeDisabled: true}));
