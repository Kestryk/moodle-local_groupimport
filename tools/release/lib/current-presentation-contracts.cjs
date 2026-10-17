/* eslint-env node */
'use strict';
// Successors to one-off historical snapshots: current component contracts, no Moodle runtime.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
const modules = process.env.MOODLE_NODE_MODULES || 'C:/dev/moodle51-build-501/node_modules';
const postcss = require(path.join(modules, 'postcss'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const css = read('styles/student-management.css');
const declarations = predicate => {
    const result = {};
    postcss.parse(css).walkRules(rule => {
        if (predicate(rule.selector)) rule.walkDecls(d => { result[d.prop] = d.value; });
    });
    return result;
};
function selection() {
    const selector = '.easyedu-ui .foundation-selection-action.easyedu-selection-recovery-action';
    const rest = declarations(s => s === selector);
    assert.equal(rest['min-height'], '1.9rem'); assert.equal(rest['column-gap'], '0.35rem');
    assert.equal(rest.background, 'transparent'); assert.equal(rest['border-color'], 'transparent');
    const focus = declarations(s => s === selector + ':focus-visible');
    assert.equal(focus['box-shadow'], '0 0 0 var(--easyedu-focus-ring-width) var(--easyedu-focus-ring)');
    const hover = declarations(s => s.split(/,\s*/).includes(selector + ':hover'));
    assert.equal(hover.background, 'var(--easyedu-surface-soft)');
    const disabled = declarations(s => s.includes(selector + ':disabled'));
    assert.equal(disabled.opacity, '0.62'); assert.equal(disabled['pointer-events'], 'none');
    assert.match(read('templates/manage.mustache'), /easyedu-selection-recovery-action/);
    assert(!postcss.parse(read('styles.css')).nodes.some(n => n.type !== 'comment'), 'No site-global component CSS');
}
function tiles() {
    assert.match(read('templates/manage.mustache'), /easyedu-workspace-view-switcher--tiled/);
    if (process.argv[2]) {
        const file = 'scss/easyedu/_workspace-control-classes.scss';
        const section = text => text.slice(text.indexOf('  // Tiled desktop/tablet variant only.'), text.indexOf('  .easyedu-ui .easyedu-search-field {'));
        const own = section(read(file)); assert(own.includes('--tiled'));
        assert.equal(own, section(fs.readFileSync(path.join(process.argv[2], file), 'utf8').replace(/\r\n/g, '\n')), 'Canonical tiled paint recipe');
    }
    const rules = [];
    postcss.parse(css).walkRules(r => { if (r.selector.includes('.easyedu-workspace-view-switcher--tiled') &&
        r.selector.endsWith('.fa') && !r.selector.includes('--stable-icon')) rules.push(r); });
    assert.equal(rules.length, 4, 'rest, hover/focus, pressed, disabled paints');
    for (const r of rules) assert(r.nodes.every(d => d.type === 'comment' || ['background', 'color'].includes(d.prop)),
        'Tiled palette opt-in cannot change geometry, typography or Motion');
    const rest = rules[0].nodes.filter(n => n.type === 'decl');
    assert(rest.some(d => d.prop === 'background' && d.value === 'var(--easyedu-primary-soft)'));
    assert(rest.some(d => d.prop === 'color' && d.value === 'var(--easyedu-primary)'));
    assert(rules.some(r => r.selector.includes('aria-pressed=true') && r.nodes.some(d => d.value === 'var(--easyedu-surface)')));
    assert(rules.some(r => r.selector.includes(':disabled') && r.nodes.some(d => d.value === 'var(--easyedu-field-disabled-text)')));
}
function tooltip() {
    const consumer = read('scss/components/_tooltips.scss');
    assert.match(consumer, /@include easyedu\.popover-long-copy;/);
    if (process.argv[2]) {
        const file = 'scss/easyedu/components/_tooltips.scss';
        const section = text => text.slice(text.indexOf('// Existing dense long-copy help recipe.'), text.indexOf('@mixin positioned-popover-arrows'));
        assert.equal(section(read(file)), section(fs.readFileSync(path.join(process.argv[2], file), 'utf8').replace(/\r\n/g, '\n')), 'Canonical long-copy recipe');
    }
    assert.doesNotMatch(consumer, /font-size:|font-weight:|line-height:|padding:/);
    const body = declarations(s => s === '.local-groupimport-easystud-hover-popover--long .popover-body');
    assert.deepEqual(body, {'font-size': '0.71rem', 'font-weight': '470', 'line-height': '1.48', padding: '0.52rem 0.66rem 0.56rem'});
    assert.equal(declarations(s => s === '.local-groupimport-easystud-hover-popover')['pointer-events'], 'auto');
}
function guide() {
    const source = read('amd/src/easyedu_guide.js');
    const a = source.indexOf('const bindNavigationTooltips ='), b = source.indexOf('const bindGuide =', a);
    assert(a >= 0 && b > a); const helper = source.slice(a, b);
    for (const marker of ["target === button", "tooltip.addEventListener('pointerenter', cancelGrace)",
        'window.setTimeout(hide, 220)', 'modal.appendChild(tooltip)', "event.key !== 'Escape'", 'event.stopPropagation()',
        "addTrackedListener(root, modal.ownerDocument, 'scroll'", 'root.easyeduGuideTooltipHide = hide']) {
        assert(helper.includes(marker), marker);
    }
    assert.equal(declarations(s => s.endsWith(' .easyedu-guide-label-tooltip'))['pointer-events'], 'auto');
    assert((source.match(/root\.easyeduGuideTooltipHide\?\.\(\);/g) || []).length >= 3, 'Lifecycle hides remain');
    assert(source.includes('delete root.easyeduGuideTooltipHide;'));
}
function filters() {
    const source = read('amd/src/local/cm/list_controls.js');
    const start = source.indexOf('export const bindAdvancedFilters =');
    assert(start >= 0);
    const body = source.slice(start).replace(/^export /gm, '');
    assert(!body.includes('syncPagination('));
    assert(!body.includes('scheduleResponsiveUiRefresh('));
    assert(!body.includes('syncParticipantTagOverflow('));
    let cases = 0;
    for (const key of ['participants', 'participant-groups', 'structure-groups', 'structure-groupings']) {
        for (const initial of [true, false]) {
            const events = [], listeners = {}, docListeners = {}, frame = [];
            const values = new Set();
            const classes = {add: n => values.add(n), remove: n => values.delete(n), toggle: (n, on) => on ? values.add(n) : values.delete(n)};
            const attrs = {'aria-expanded': String(initial)};
            const panel = {hidden: false, inert: false, classList: classes, setAttribute: (n, v) => { panel[n] = v; }, getAttribute: () => key};
            const control = {offsetParent: {}, classList: classes, getAttribute: n => n === 'aria-expanded' ? attrs[n] : key,
                setAttribute: (n, v) => { attrs[n] = v; }};
            const more = {classList: classes};
            const rootNode = {contains: () => true, classList: classes,
                addEventListener: (name, fn) => { listeners[name] = fn; },
                querySelectorAll: selector => { assert.equal(selector, '[data-easystud-advanced-filters]', 'No card/tag scans during disclosure'); return [panel]; }, querySelector: selector => selector.includes('filters-toggle=') ? control :
                    selector.includes('filters-more=') ? more : panel};
            vm.runInNewContext(body + '\nbindAdvancedFilters(rootNode);', {rootNode, document: {addEventListener: (n, f) => {docListeners[n] = f;}},
                window: {requestAnimationFrame: f => frame.push(f), setTimeout: f => f()},
                Motion: {expand: (node, options) => {events.push('expand'); options.prepare(); options.onComplete();},
                    collapse: (node, options) => { assert.equal(options.hideOnComplete, false); events.push('collapse'); options.onComplete(); }},
                syncAdvancedFilterToggle() {}, closeChoicesWithin: () => 0,
                scheduleCompleteListAlignment() {}, requestGuideHighlightRefresh() {}, emitFilterPathCompletion() {},
                emitGuidedCompletion() {}, animateCompleteListAlignment() {}});
            for (const expected of [!initial, initial]) {
                listeners.click({target: {closest: () => control}, preventDefault() {}});
                frame.splice(0).forEach(f => f());
                assert.equal(attrs['aria-expanded'], String(expected));
                assert.equal(panel.inert, !expected); assert.equal(panel['aria-hidden'], String(!expected));
                assert.equal(panel.hidden, false, 'Motion owns layout; no unrelated list replacement');
                assert.equal(values.has('is-expanded'), expected);
            }
            assert.equal(events.length, 2); assert(listeners.pointerdown && docListeners.pointerup && docListeners.pointercancel);
            cases++;
        }
    }
    return cases;
}
function filterCapsule() {
    const markup = read('templates/manage.mustache');
    assert.equal((markup.match(/easyedu-filter-disclosure--capsule /g) || []).length, 4);
    for (const key of ['participants','participant-groups','structure-groups','structure-groupings']) {
        assert(markup.includes('data-easystud-advanced-filters-toggle="' + key + '"'));
        assert(markup.includes('data-easystud-advanced-filters-count-text="' + key + '"'));
    }
    assert.match(read('scss/easyedu/_foundation-classes.scss'), /filter-disclosure--capsule/);
    assert(css.includes('.easyedu-filter-disclosure--capsule'));
}
module.exports = name => {
    const map = {selection, tiles, tooltip, guide, filters, filterCapsule};
    assert(map[name], name); const cases = map[name]();
    console.log(JSON.stringify({contract: name, passed: true, cases: cases || 1, pageCss: 'student-management.css', runtimeAccess: false}));
};
