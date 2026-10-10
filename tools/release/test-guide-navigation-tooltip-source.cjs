// Full baseline preservation except the explicit tooltip helper/hooks/style.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = '3ce1aac';
const normalize = text => text.replace(/\r\n/g, '\n');
const read = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const old = file => normalize(execFileSync('git', ['show', base + ':' + file],
    {cwd:root, encoding:'utf8', maxBuffer:16*1024*1024}));
for (const file of ['amd/src/easyedu_guide.js', 'easyedu-guide-kit/amd/src/easyedu_guide.js']) {
    let text = read(file);
    const start = text.indexOf('// The full navigation label remains');
    const end = text.indexOf('const bindGuide =', start);
    assert.ok(start >= 0 && end > start);
    text = text.slice(0, start) + text.slice(end);
    assert.equal((text.match(/root\.easyeduGuideTooltipHide\?\.\(\);/g) || []).length, 3);
    text = text.replace(/^  root\.easyeduGuideTooltipHide\?\.\(\);\n/gm, '');
    text = text.replace('\n  delete root.easyeduGuideTooltipHide;\n', '');
    text = text.replace('  bindNavigationTooltips(root);\n', '');
    assert.equal(text, old(file), file + ': complete commands/state/Motion preserved');
}
const css = read('styles.css');
// Strip only the new rules, preserving every other selector/property/order.
// Their removal changes inter-rule line breaks, which have no CSS semantics.
const stripped = css.replace(/[^{}]*\.easyedu-guide-label-tooltip[^{}]*\{[^{}]*\}\s*/g, '\n').replace(/\n{2,}/g, '\n');
const baselineCss = old('styles.css').replace(/\n{2,}/g, '\n');
if (stripped !== baselineCss) {
    let index = 0; while (stripped[index] === baselineCss[index] && index < stripped.length) index++;
    throw new Error('Non-tooltip CSS mismatch at ' + index + ': ' + JSON.stringify(stripped.slice(index - 80, index + 150)) +
        ' vs ' + JSON.stringify(baselineCss.slice(index - 80, index + 150)));
}
for (const file of ['templates/easyedu_guide.mustache', 'easyedu-guide-kit/templates/easyedu_guide.mustache',
    'amd/src/course_manager.js']) assert.equal(read(file), old(file), file + ': no template/business changes');
console.log('PASS full controller/Motion/native markup and unrelated CSS preservation.');
