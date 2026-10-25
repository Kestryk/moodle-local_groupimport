// SM-50 geometry successor. Preserve the original 32-state guard at its exact
// committed revision; admit only the one measured narrow/full CSS addition.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const revision = '2a6b6b172bf0dfa8bb39f6747f8fdfea6f38d731';
const original = file => execFileSync('git', ['show', `${revision}:${file}`], {cwd: root})
    .toString().replace(/\r\n/g, '\n');
const rule = '  .local-groupimport-easystud--responsive-workspace:not(.local-groupimport-easystud--compact-users) ' +
    '.local-groupimport-easystud-user__headline-main {\n    padding-inline-start: 2.02rem;\n  }\n';
const css = read('styles.css');
assert.equal(css.split(rule).length, 2, 'Exactly one opt-in rule');
assert.equal(css.replace(rule, ''), original('styles.css'), 'All unrelated CSS is identical');
const narrow = css.indexOf('@media (max-width: 560px)', css.lastIndexOf('@media (max-width: 1024px)'));
assert(narrow >= 0 && css.indexOf(rule) > narrow, 'Existing phone breakpoint owns the opt-in');
const adapter = read('scss/responsive/_mobile.scss');
assert(adapter.includes('@include easyedu.person-card-selection-title-clearance;'));
const shared = read('scss/easyedu/components/_card-responsive.scss');
assert(shared.includes('@mixin person-card-selection-title-clearance('));
assert(shared.includes('$selection-target: 2.75rem'));
const mobileButton = `                        <button
                            type="button"
                            class="btn btn-outline-secondary btn-sm foundation-selection-action foundation-selection-action--tray"
                            data-easystud-mobile-membership-toggle="1"
                            aria-pressed="true"
                            hidden
                        >
                            <span class="fa fa-expand" aria-hidden="true"></span>
                            <span></span>
                        </button>
`;
assert.equal(read('templates/manage.mustache').split(mobileButton).length, 2);
// Execute the real density bind prefix: the mobile button forwards to the
// existing controller and exposes localized labels/state at its own breakpoint.
const source = read('amd/src/course_manager.js');
const prefix = source.slice(source.indexOf('const bindOptionalTools ='),
    source.indexOf('    if (modal && openClipboardButtons.length')) + '\n};\nbindOptionalTools;';
const control = attributes => {
    const attrs = new Map(Object.entries(attributes));
    const listeners = new Map();
    const classes = new Set();
    const icon = {classList: {toggle: (name, on) => on ? classes.add(name) : classes.delete(name)}};
    const text = {textContent: ''};
    return {hidden: true, attrs, text, classes,
        getAttribute: name => attrs.get(name), setAttribute: (name, value) => attrs.set(name, value),
        querySelector: selector => selector === '.fa' ? icon : text,
        addEventListener: (name, callback) => listeners.set(name, callback), click: () => listeners.get('click')(),
    };
};
for (const width of [320, 390, 768, 1024, 1600]) {
    let responsive = width <= 1024;
    const originalButton = control({'data-mobile-detailed-label': 'Show groups and groupings',
        'data-mobile-compact-label': 'Hide groups and groupings',
        'data-detailed-label': 'Full details', 'data-compact-label': 'Compact list'});
    const mobile = control({});
    const classes = new Set(['local-groupimport-easystud--compact-users']);
    const node = {classList: {contains: name => classes.has(name), remove: name => classes.delete(name),
        toggle: (name, on) => on ? classes.add(name) : classes.delete(name)},
        querySelector: selector => selector === '[data-easystud-density-toggle]' ? originalButton :
            selector === '[data-easystud-mobile-membership-toggle]' ? mobile : null,
        querySelectorAll: () => []};
    const bind = vm.runInNewContext(prefix, {isResponsiveWorkspace: () => responsive,
        compactClass: 'local-groupimport-easystud--compact-users',
        syncParticipantDensity: rootNode => rootNode.easystudParticipantDensity.updateToggle(),
        scheduleResponsiveUiRefresh() { node.easystudParticipantDensity.updateToggle(); }});
    bind(node);
    assert.equal(mobile.hidden, !responsive);
    assert.equal(mobile.attrs.get('aria-pressed'), 'true');
    assert.equal(mobile.text.textContent, 'Show groups and groupings');
    if (responsive) {
        mobile.click();
        assert.equal(node.easystudParticipantDensity.mobileCompact, false);
        assert.equal(mobile.text.textContent, 'Hide groups and groupings');
        mobile.click();
        assert.equal(node.easystudParticipantDensity.mobileCompact, true);
        assert.equal(mobile.text.textContent, 'Show groups and groupings');
        responsive = false; node.easystudParticipantDensity.updateToggle();
        assert.equal(mobile.hidden, true);
    }
}
// Run every historical controller/template/AMD/Penpot check. Replace only its
// CSS identity oracle with the stricter complete-CSS successor proven above.
const historical = original('tools/release/test-mobile-participant-memberships.cjs');
const oldOracle = "assert.equal(read('styles.css'), old('styles.css'));";
assert.equal(historical.split(oldOracle).length, 2);
const markupOracle = "const markup = read('templates/manage.mustache');";
assert.equal(historical.split(markupOracle).length, 2);
vm.runInNewContext(historical.replace(oldOracle, '').replace(markupOracle,
    `const markup = read('templates/manage.mustache').replace(${JSON.stringify(mobileButton)}, '');`),
{require, __dirname, console});
const design = JSON.parse(read('docs/testing/mobile-membership-action-penpot-2026-10-05.json'));
assert.equal(design.records.length, 6);
assert.deepEqual(design.boardOverlap, []);
for (const action of design.records) {
    assert.equal(action.provider, 'c403923b-827e-80b7-8008-bbd343f71807');
    assert.equal(action.font, 'Inter'); assert.equal(action.size, '12.48');
    assert.equal(action.weight, '600'); assert.deepEqual(action.overflow, []);
    assert(action.centreDelta < 1);
    assert(Math.abs(action.icon.w - 12.48) < 0.01);
}
console.log('PASS title clearance, 5 mobile-action bindings, 6 linked controls and unrelated CSS; native/human separate.');
