// K20-18: execute the real density handler with a deferred overflow/layout queue.
// Native frame sampling supplies the separate geometry and Motion evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/cm/optional_tools.js'), 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('    if (densityToggle) {');
const end = source.indexOf('    if (modal &&', start);
assert(start > 0 && end > start);
let cases = 0;
for (const mobile of [false, true]) {
    for (const level of ['full', 'reduced', 'minimal']) {
        const classes = new Set(['compact']);
        const queue = [];
        const list = {height: 44, count: mobile ? 15 : 20};
        let rowsHidden = mobile;
        let tagLayoutResolved = false;
        let deferredRepaginations = 0;
        let synchronousPages = 0;
        const animations = [];
        const labels = new Map();
        const text = {textContent: ''};
        const icon = {classList: {toggle() {}}};
        const toggle = {
            setAttribute: (key, value) => labels.set(key, value),
            getAttribute: key => key,
            querySelector: selector => selector === '.fa' ? icon : text,
            addEventListener: (event, handler) => { assert.equal(event, 'click'); toggle.click = handler; },
        };
        const node = {
            classList: {
                contains: name => classes.has(name),
                remove: name => classes.delete(name),
                toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
            },
            querySelector: selector => {
                assert.equal(selector, '[data-easystud-participant-list]');
                return list;
            },
            querySelectorAll: () => [],
        };
        const naturalHeight = () => {
            const compact = mobile ? rowsHidden : classes.has('compact');
            return compact ? 44 : (tagLayoutResolved ? 160 : 370);
        };
        vm.runInNewContext(source.slice(start, end), {
            root: node, densityToggle: toggle, mobileMembershipToggle: null,
            compactClass: 'compact', isResponsiveWorkspace: () => mobile,
            syncParticipantDensity: () => { rowsHidden = node.easystudParticipantDensity.mobileCompact; },
            syncParticipantTagOverflow: scope => { assert.equal(scope, list); tagLayoutResolved = true; },
            syncPagination: scope => {
                assert.equal(scope, node);
                synchronousPages++;
                // Rendering a changed page replaces its card nodes and unresolved tags.
                list.count = mobile || !classes.has('compact') ? 15 : 20;
                tagLayoutResolved = false;
            },
            scheduleResponsiveUiRefresh: (scope, options = {}) => {
                assert.equal(scope, node);
                queue.push(() => {
                    if (options.pagination !== false) { deferredRepaginations++; }
                    tagLayoutResolved = true;
                    list.height = naturalHeight();
                });
            },
            requestGuideHighlightRefresh() {},
            Motion: {timing: {fast: 160, normal: 320}, swap: (scope, mutate, options) => {
                assert.equal(scope, list);
                assert.equal(options.enterDuration, 320);
                mutate();
                list.height = naturalHeight();
                animations.push({level, target: list.height});
                return Promise.resolve();
            }},
        });
        for (const expected of [160, 44, 160]) {
            tagLayoutResolved = false;
            toggle.click();
            const target = animations.at(-1).target;
            while (queue.length) { queue.shift()(); }
            assert.equal(target, expected, 'Height is final before Motion measures, not after a frame');
            assert.equal(list.height, target, 'Deferred refresh must not resize the settled disclosure');
            assert.equal(synchronousPages, animations.length, 'Resolve the density-specific page before measurement');
            assert.equal(list.count, mobile || expected === 160 ? 15 : 20);
            assert.equal(deferredRepaginations, 0, 'No second page rendering after measurement');
            cases++;
        }
    }
}
console.log(`PASS ${cases} density transitions: final target and page size before Motion, no deferred repagination`);
