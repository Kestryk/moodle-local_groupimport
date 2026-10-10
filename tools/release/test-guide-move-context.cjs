/* eslint-env node */
// Isolated adapter proof, not native Moodle or business-transaction proof.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const pin = 'f31fa994bb2734b1ba7dcc5a0fb3d6bf6bca8558';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const original = file => execFileSync('git', ['show', `${pin}:${file}`],
    {cwd: root, encoding: 'utf8'}).replace(/\r\n/g, '\n');
const source = read('amd/src/course_manager.js');
const replacements = [
    ["            contextType = '';\n            modal.removeAttribute('data-easystud-move-context');",
        "            contextType = '';"],
    ["        contextType = type;\n" +
        '        // One dialog serves three different native commands. Guide targets\n' +
        '        // must identify the opened context, not infer it from shared geometry.\n' +
        "        modal.setAttribute('data-easystud-move-context', type);", '        contextType = type;'],
    ["            return modal && !modal.hidden && modal.getAttribute('data-easystud-move-context') === 'participant' ?\n" +
        '                modal : null;', '            return modal && !modal.hidden ? modal : null;'],
];
let restored = source;
for (const [after, before] of replacements) {
    assert.equal(restored.split(after).length, 2, 'Exactly one bounded adapter replacement');
    restored = restored.replace(after, before);
}
assert.equal(restored, original('amd/src/course_manager.js'),
    'All native commands, selection, Motion, completion predicates and unrelated adapters preserved');
const afterTargets = "            'participantMoveDestination' => '[data-easystud-move-modal][data-easystud-move-context=\"participant\"] ' .\n" +
    "                '.easyedu-searchable-choice',\n" +
    "            'participantMoveConfirm' => '[data-easystud-move-modal][data-easystud-move-context=\"participant\"] ' .\n" +
    "                '[data-easystud-confirm-move]',";
const beforeTargets = "            'participantMoveDestination' => '[data-easystud-move-modal] .easyedu-searchable-choice',\n" +
    "            'participantMoveConfirm' => '[data-easystud-confirm-move]',";
assert.equal(read('manage.php').split(afterTargets).length, 2);
assert.equal(read('manage.php').replace(afterTargets, beforeTargets), original('manage.php'),
    'All curriculum, path definitions, labels, storage and PHP business data preserved');

// Execute the exact production opener, not a copied implementation.
const start = source.indexOf('const bindSharedGuideTargets = root => {');
const end = source.indexOf('const bindTutorialModal = root => {', start);
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
        host, document:{addEventListener:(name, callback) => {listener = callback;}}
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
        host, document:{addEventListener:(name, callback) => {listener = callback;}}
    });
    const detail = {root:guide,target:'tutorial:participant-move-dialog'};
    listener({detail});
    assert.equal(clicks, enabled ? 1 : 0);
    assert.equal(detail.handled === true, enabled);
    cases++;
}
assert.ok(source.indexOf("modal.removeAttribute('data-easystud-move-context');") >
    source.indexOf('return hideEasyStudModal(modal, () => {', source.indexOf('const bindMoveModal')),
    'Context cleanup follows the existing completed exit callback');
console.log(`PASS: ${cases} production-opener cases; exact native/PHP baseline preserved outside typed context.`);
