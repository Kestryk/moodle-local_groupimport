// Reconstruct the entire prior canonical engine around the bounded header changes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const kit = path.resolve(process.argv[2]), baseline = '261b692fda86ce8f2c25027c4cde57f152255825';
const norm = s => s.replace(/\r\n/g, '\n');
let current = norm(fs.readFileSync(path.join(kit, 'guide/amd/src/easyedu_guide.js'), 'utf8'));
const original = norm(execFileSync('git', ['show', baseline + ':guide/amd/src/easyedu_guide.js'], {cwd: kit, encoding: 'utf8'}));
const replaceOnce = (from, to) => { assert.ok(current.includes(from)); current = current.replace(from, to); };
replaceOnce("  const defaultMode = kind === 'actions' ? 'actions' : 'add';\n  const mode = requestedMode === 'reset' ? defaultMode : requestedMode || scene.easyeduGuideSceneMode || defaultMode;",
    "  const mode = requestedMode || scene.easyeduGuideSceneMode || (kind === 'actions' ? 'actions' : 'add');");
const liveStart = current.indexOf('  // New compositions own their live region;'), liveEnd = current.indexOf('  const liveCopy =', liveStart);
assert.ok(liveStart > 0 && liveEnd > liveStart);
current = current.slice(0, liveStart) + "  const live = scene.parentElement.querySelector('[data-guide-live]');\n" + current.slice(liveEnd);
const syncStart = current.indexOf('    if (sceneHeader) {'), syncEnd = current.indexOf('    if (startControl) {', syncStart);
assert.ok(syncStart > 0 && syncEnd > syncStart); current = current.slice(0, syncStart) + current.slice(syncEnd);
const previewStart = current.indexOf('  // At rest, the membership strip'), previewEnd = current.indexOf("  scene.toggleAttribute('data-guide-mobile-actions'", previewStart);
assert.ok(previewStart > 0 && previewEnd > previewStart);
current = current.slice(0, previewStart) + "  const compact = window.matchMedia('(max-width: 64rem), (pointer: coarse), (hover: none)').matches;\n" + current.slice(previewEnd);
replaceOnce("  if (requestedMode === 'reset' || !start) { return; }", "  if (mode === 'reset' || !start) { return; }");
replaceOnce('((sceneHeader || live)?.getBoundingClientRect().height || 0)', '(live?.getBoundingClientRect().height || 0)');
assert.equal(current, original, 'Full clocks, choreography, paths and unrelated engine preserved');
const root = path.resolve(__dirname, '../..');
for (const file of ['amd/src/motion.js', 'amd/src/course_manager.js', 'classes/local/guide_discovery_activity.php']) {
    if (!fs.existsSync(path.join(root, file))) continue;
    assert.equal(norm(fs.readFileSync(path.join(root, file), 'utf8')), norm(execFileSync('git', ['show', 'f71ab2e:' + file], {cwd: root, encoding: 'utf8'})));
}
console.log('PASS entire canonical engine reconstructed after exact header/preview/caption/clearance changes; native Motion/course manager unchanged.');
