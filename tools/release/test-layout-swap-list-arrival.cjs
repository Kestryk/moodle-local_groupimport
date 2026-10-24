/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const load = name => fs.readFileSync(path.join(root, 'amd/src/local/cm', name), 'utf8')
    .replace(/\r\n/g, '\n').replace(/^import[\s\S]*?;\s*$/gm, '').replace(/^export /gm, '');
const classes = () => ({add() {}, remove() {}, toggle() {}, contains() { return false; }});
let arrivals = 0, views = 0, pagination = 0, reveals = 0;
const card = {classList: classes(), animate() {
    arrivals++;
    return {finished: Promise.resolve(), cancel() {}};
}};
const layout = {};
const buttons = ['participants', 'structure'].map(mode => ({
    classList: classes(), getAttribute() { return mode; }, setAttribute() {}, addEventListener() {},
}));
const page = {
    classList: classes(),
    getAttribute() { return 'participants'; },
    querySelector(selector) { return selector === '.local-groupimport-easystud__layout' ? layout : null; },
    querySelectorAll(selector) { return selector === '[data-easystud-layout-mode]' ? buttons : []; },
};
const noop = () => undefined;
const context = {
    Motion: {getLevel: () => 'full', timing: {normal: 200}, swap(element, mutate, options) {
        assert.equal(element, layout);
        assert.equal(options.exit, false);
        assert.equal(options.enterDuration, 200);
        views++;
        mutate();
        return Promise.resolve(true);
    }},
    participantFocusClass: 'participants', structureFocusClass: 'structure',
    clearSelectionState: noop, placeColumnActions: noop, updateRoleFilterMode: noop,
    getSelectedFilterValues: () => [], updateSelectionActions: noop,
    scheduleResponsiveUiRefresh: noop, scheduleCompleteListAlignment: noop,
    isResponsiveWorkspace: () => false, emitPracticeCompletion: noop,
    requestGuideHighlightRefresh: noop, snapshotPanelActions: () => [],
    syncPanelActionOverflow: noop, revealChangedPanelActions: noop,
    syncPagination: () => { pagination++; context.api.animateListArrival([card]); },
};
vm.runInNewContext(load('transitions.js') + '\n' + load('navigation.js') +
    '\nthis.api = {bindLayoutModeToggle, animateListArrival, withoutListArrival};', context);

(async() => {
    context.api.bindLayoutModeToggle(page);
    assert.equal(arrivals, 1, 'Initial document rendering still has its card arrival');
    page.easystudBeforeLayoutReveal = () => { reveals++; context.api.animateListArrival([card]); };
    arrivals = 0;
    await page.easystudApplyDesktopMode('structure');
    await page.easystudApplyDesktopMode('participants');
    assert.equal(views, 2, 'Both transitions retain the view animation');
    assert.equal(arrivals, 0, 'Pagination hydration and pre-reveal hydration share the view reveal');
    assert.equal(reveals, 2);
    assert.equal(pagination, 3, 'State and pagination still update on each transition');
    context.api.animateListArrival([card]);
    assert.equal(arrivals, 1, 'A later standalone pagination change still animates its cards');
    assert.throws(() => context.api.withoutListArrival(() => { throw Error('probe'); }), /probe/);
    context.api.animateListArrival([card]);
    assert.equal(arrivals, 2, 'A failed scoped mutation does not leave arrival disabled');
    console.log('PASS: view animation retained; nested arrivals suppressed; pagination and exception recovery preserved');
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
