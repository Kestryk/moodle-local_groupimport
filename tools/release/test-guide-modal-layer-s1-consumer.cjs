const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const baseline = '28fb7679bd7cc33017acd3e65ad9e519c97d975e';
const phpBaseline = 'e64e531b3bc17061b523c17463af6952a875b6a3';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const old = file => cp.execFileSync('git', ['show', baseline + ':' + file], {cwd: root, encoding: 'utf8', maxBuffer: 20e6}).replace(/\r\n/g, '\n');
const css = read('styles.css');
const blocks = [
    '.easyedu-guide-highlight--in-dialog {\n  z-index: calc(var(--easyedu-modal-layer, 1070) + 1);\n}\n\n',
    '.easyedu-guide[data-easyedu-guide-root][data-easyedu-guide-target-in-dialog] .easyedu-guided-panel {\n  z-index: calc(var(--easyedu-modal-layer, 1070) + 2);\n}\n\n',
];
let preserved = css;
const originalDrawer = 'html.easyedu-guide-dialog-open .drawer-toggler';
const dialogDrawer = 'body:has(:is(.easyedu-modal-layer, .easyedu-message-dialog)[aria-modal=true]:not([hidden]):not([aria-hidden=true])) .drawer-toggler';
assert.equal(preserved.split(originalDrawer + ',\n' + dialogDrawer).length, 2,
    'Exactly one shared native drawer yield extension');
preserved = preserved.replace(originalDrawer + ',\n' + dialogDrawer, originalDrawer);
for (const block of blocks) {
    assert.equal(preserved.split(block).length, 2, 'Exactly one public layering rule');
    preserved = preserved.replace(block, '');
}
assert.equal(preserved, old('styles.css'), 'Complete unrelated CSS, typography and Motion unchanged');
for (const file of ['amd/src/course_manager.js', 'amd/src/motion.js', 'templates/easyedu_guide.mustache',
    'easyedu-guide-kit/templates/easyedu_guide.mustache']) {
    assert.equal(read(file), old(file), file + ' remains exact');
}
for (const file of ['classes/local/guide_discovery.php', 'manage.php', 'ajax.php',
    'lang/en/local_groupimport.php', 'lang/fr/local_groupimport.php']) {
    assert.equal(read(file), cp.execFileSync('git', ['show', phpBaseline + ':' + file],
        {cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n'), 'Claude PHP/lang integration preserved');
}
assert.match(read('amd/src/easyedu_guide.js'), /define\(\['local_groupimport\/motion'\], function\(Motion\)/);
assert.match(read('amd/build/easyedu_guide.min.js'), /define\("local_groupimport\/easyedu_guide"/);
assert.equal(JSON.parse(read('amd/build/easyedu_guide.min.js.map')).sourcesContent, undefined);
console.log(JSON.stringify({surface:'modals',level:1,layerRules:2,nativeDrawerYield:true,
    unrelatedCSSPreserved:true,controllersTemplatesMotionPreserved:true,claudePilotPreserved:true}));
