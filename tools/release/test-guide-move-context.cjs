/* eslint-env node */
// Isolated adapter proof, not native Moodle or business-transaction proof.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/local/cm/guide.js').replace(/export /g, '');
const move = read('amd/src/local/cm/move_modal.js');
assert(move.includes("modal.setAttribute('data-easystud-move-context', type)"));
assert(move.includes("modal.removeAttribute('data-easystud-move-context')"));
for (const target of ['participantMoveDestination', 'participantMoveConfirm']) {
    const php = read('classes/output/guide_config.php');
    const at = php.indexOf("'" + target + "' =>");
    assert(at >= 0 && php.slice(at, at + 250).includes('data-easystud-move-context="participant"'));
}
// Execute the exact production opener, not a copied implementation.
const start = source.indexOf('const bindSharedGuideTargets = root => {');
const end = source.length;
assert.ok(start > 0 && end > start);
const binder = source.slice(start, end);
let cases = 0;
for (const context of ['participant', 'member', 'group', null]) {
    let listener;
    const modal = {hidden:false, getAttribute:() => context};
    const guide = {};
    const host = {dataset:{}, querySelector:selector =>
        selector === '[data-easyedu-guide-root]' ? guide :
            selector === '[data-easystud-move-modal]' ? modal : null};
    vm.runInNewContext(`${binder}\nbindSharedGuideTargets(host);`, {
        getActivityGuideRoot: node => node.querySelector('[data-easyedu-guide-root]'), bindTryActionsCompactMove() {}, host, document:{addEventListener:(name, callback) => {listener = callback;}}
    });
    const detail = {root:guide,target:'tutorial:participant-move-dialog'};
    listener({detail});
    assert.equal(detail.handled === true, context === 'participant', 'Never claim an unrelated dialog');
    const foreign = {root:{},target:'tutorial:participant-move-dialog'};
    listener({detail:foreign});
    assert.equal(foreign.handled, undefined);
    cases++;
}
for (const enabled of [true, false]) {
    let listener, clicks = 0, context = null;
    const modal = {hidden:true, getAttribute:() => context};
    const guide = {};
    const action = {disabled:!enabled,click:() => {clicks++;modal.hidden=false;context='participant';}};
    const host = {dataset:{}, querySelector:selector =>
        selector === '[data-easyedu-guide-root]' ? guide : modal,
    querySelectorAll:() => [action]};
    vm.runInNewContext(`${binder}\nbindSharedGuideTargets(host);`, {
        getActivityGuideRoot: node => node.querySelector('[data-easyedu-guide-root]'), bindTryActionsCompactMove() {}, host, document:{addEventListener:(name, callback) => {listener = callback;}}
    });
    const detail = {root:guide,target:'tutorial:participant-move-dialog'};
    listener({detail});
    assert.equal(clicks, enabled ? 1 : 0);
    assert.equal(detail.handled === true, enabled);
    cases++;
}
assert.ok(move.indexOf("modal.removeAttribute('data-easystud-move-context');") >
    move.indexOf('return hideEasyStudModal(modal, () => {'), 'Context cleared after completed exit');
console.log(`PASS ${cases} current production-opener cases and typed PHP targets.`);
