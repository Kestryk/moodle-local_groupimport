const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'af963aee05b6daeac0706c58056f22e37a75484a';
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const old = f => execFileSync('git', ['show', `${baseline}:${f}`], {cwd: root}).toString().replace(/\r\n/g, '\n');
const block = 'body:has(:is(.easyedu-modal-layer, .easyedu-message-dialog)[aria-modal=true]:not([hidden]):not([aria-hidden=true])) .easyedu-ui .easyedu-modal-yield-control {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n';
const css = read('styles.css');
assert.equal(css.split(block).length, 2, 'One exact shared yield rule');
assert.equal(css.replace(block, ''), old('styles.css'), 'All other CSS preserved');
const template = read('templates/easyedu_navigation.mustache');
assert.equal(template.split(' easyedu-modal-yield-control').length, 2);
assert.equal(template.replace(' easyedu-modal-yield-control', ''), old('templates/easyedu_navigation.mustache'));
for (const f of ['amd/src/easyedu_navigation.js', 'amd/build/easyedu_navigation.min.js',
    'amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/src/motion.js',
    'amd/build/motion.min.js', 'scss/easyedu/components/_navigation.scss', 'templates/manage.mustache']) {
    assert.equal(read(f), old(f), `${f} unchanged`);
}
console.log('PASS exact shared visibility rule and one public template class; complete other CSS/controllers/Motion unchanged.');
