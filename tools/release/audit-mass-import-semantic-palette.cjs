/* eslint-env node */
// Diagnostic, not a repair/acceptance test. Uses real PHP mapping and compiled
// consumer CSS in isolated HTML; never loads Moodle config, a session or a DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const php = `define('MOODLE_INTERNAL', true);
$auditConfig = json_decode($argv[1], true);
function get_config($component, $key) {
    global $auditConfig;
    if ($component !== 'local_groupimport') { throw new RuntimeException('Unexpected component'); }
    return $auditConfig[$key] ?? false;
}
require $argv[2];
echo json_encode(['style'=>local_groupimport_get_theme_style(),
    'flags'=>local_groupimport_get_theme_rail_roles()]);`;
const palettes = [
    ['official', {}],
    ['primary-only', {themeprimarycolor: '#7B3F98'}],
    ['accent-only', {themeaccentcolor: '#984B27'}],
    ['both', {themeprimarycolor: '#7B3F98', themeaccentcolor: '#984B27'}],
    ['official-restored', {}],
].map(([name, config]) => ({name, ...JSON.parse(execFileSync('php',
    ['-r', php, JSON.stringify(config), path.join(root, 'lib.php')], {encoding: 'utf8'}))}));
const ids = ['primary-panel', 'success-panel', 'primary-icon', 'success-icon',
    'notice', 'ready', 'warning', 'summary', 'error-summary', 'report-title', 'report-icon', 'export'];
const roles = {'primary-panel': 'primary', 'success-panel': 'success',
    'primary-icon': 'primary', 'success-icon': 'success', notice: 'primary', ready: 'success'};
const fixed = ['warning', 'error-summary', 'summary', 'report-title', 'report-icon', 'export'];
// Export uses Bootstrap at rest. An explicit sentinel demonstrates that the
// consumer CSS does not own that paint; it is NOT a reproduction of Moodle CSS.
const html = `<style>.btn-outline-primary {color:rgb(9,87,161);border:1px solid rgb(9,87,161);}</style>
<main id="workspace" class="easyedu-ui local-groupimport-import">
  <section id="primary-panel" class="easyedu-panel">Import file</section>
  <section id="success-panel" class="easyedu-panel easyedu-panel--success">Import results</section>
  <span id="primary-icon" class="fa fa-file-csv easyedu-icon-tile easyedu-icon-tile--compact"></span>
  <span id="success-icon" class="fa fa-clipboard-check easyedu-icon-tile easyedu-icon-tile--compact easyedu-icon-tile--success"></span>
  <div id="notice" class="local-groupimport-import-preview__notice easyedu-notice">
    <span class="fa fa-magic"></span><div><strong>Preview before importing</strong><p>Review the interpreted rows.</p></div>
  </div>
  <span id="ready" class="easyedu-status">Ready</span><span id="warning" class="easyedu-status easyedu-status--warning">Check identifier</span>
  <div class="local-groupimport-import-summary">
    <span id="summary" class="local-groupimport-import-summary__item local-groupimport-import-summary__item--success"><strong>12</strong> rows ready</span>
    <span id="error-summary" class="local-groupimport-import-summary__item local-groupimport-import-summary__item--error"><strong>2</strong> rows need attention</span>
  </div>
  <h4 id="report-title" class="local-groupimport-import-report__title local-groupimport-import-report__title--success">Successful additions</h4>
  <ul class="local-groupimport-import-report local-groupimport-import-report--success"><li><span id="report-icon" class="fa fa-check"></span><span>Existing membership</span></li></ul>
  <a id="export" class="btn btn-outline-primary easyedu-action-with-icon local-groupimport-import__export-results"><span class="fa fa-file-excel"></span><span>Export annotated Excel report</span></a>
</main>`;
(async() => {
    const browser = await chromium.launch({headless: true});
    let checks = 0;
    try {
        const page = await browser.newPage();
        await page.route('**/*', route => route.abort());
        await page.setContent(html);
        await page.addStyleTag({content: css});
        const read = () => page.evaluate(ids => Object.fromEntries(ids.map(id => {
            const node = document.getElementById(id), style = getComputedStyle(node), box = node.getBoundingClientRect();
            return [id, {paint: [style.backgroundImage, style.backgroundColor, style.borderColor, style.color],
                metrics: [box.width, box.height, style.padding, style.fontFamily, style.fontSize,
                    style.fontWeight, style.borderWidth, style.borderRadius, style.animation, style.transition]}];
        })), ids);
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1200});
            let baseline;
            for (const palette of palettes) {
                await page.locator('#workspace').evaluate((node, palette) => {
                    node.setAttribute('style', palette.style);
                    node.setAttribute('data-easyedu-custom-rails', palette.flags);
                }, palette);
                await page.evaluate(async() => {
                    await document.fonts.ready;
                    await Promise.all(document.getAnimations().filter(animation =>
                        Number.isFinite(animation.effect.getComputedTiming().endTime))
                        .map(animation => animation.finished.catch(() => {})));
                });
                const state = await read();
                if (!baseline) { baseline = state; continue; }
                for (const id of ids) {
                    assert.deepEqual(state[id].metrics, baseline[id].metrics, `${width}/${palette.name}/${id}: geometry/Motion identity`);
                    checks++;
                }
                for (const [id, role] of Object.entries(roles)) {
                    const changed = palette.flags.split(' ').includes(role);
                    if (changed) assert.notDeepEqual(state[id].paint, baseline[id].paint, `${id}: independent ${role} mapping`);
                    else assert.deepEqual(state[id].paint, baseline[id].paint, `${id}: unchanged other/default role`);
                    checks++;
                }
                for (const id of fixed) {
                    assert.deepEqual(state[id].paint, baseline[id].paint, `${id}: confirmed fixed current paint, NOT repaired`);
                    checks++;
                }
            }
            assert.deepEqual(baseline.summary.paint.slice(1), ['rgb(238, 248, 242)', 'rgb(207, 231, 217)', 'rgb(31, 103, 72)']);
            assert.equal(baseline['report-title'].paint[3], 'rgb(31, 103, 72)');
            assert.equal(baseline['report-icon'].paint[1], 'rgb(228, 245, 235)');
            assert.equal(baseline.export.paint[3], 'rgb(9, 87, 161)', 'Bootstrap sentinel remains at rest');
        }
        console.log(`AUDIT PASS ${checks} isolated checks at1600/768/390: independent mapped controls and exact geometry/Motion; summary/report/export gaps REPRODUCED, not fixed. Export uses a sentinel, not native Bootstrap proof. No Moodle/DB/settings/Guide/Penpot writes.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
