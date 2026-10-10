// Pure paint/portal-helper fixture. No Moodle session or admin palette writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.ok(process.argv.length === 5 || process.argv.length === 6,
    'Usage: <playwright> <mustache> <php> [css-path]');
const {chromium} = require(process.argv[2]);
const renderer = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(process.argv[3], 'utf8')
    .replace('export default mustache;', 'module.exports = mustache;'), renderer);
const root = path.resolve(__dirname, '../..');
const css = fs.readFileSync(process.argv[5] || path.join(root, 'styles.css'), 'utf8');
const template = fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8');
const source = fs.readFileSync(path.join(root, 'amd/src/course_manager.js'), 'utf8');
const start = source.indexOf('    const preserveGuidePortalTheme = () => {');
const end = source.indexOf('    const syncGuideLauncher', start);
assert.ok(start >= 0 && end > start, 'Actual bounded product palette copier');
const copier = source.slice(start, end);
const data = JSON.parse(execFileSync(process.argv[4],
    [path.join(__dirname, 'guide-current-curriculum-fixture.php'), 'en'], {encoding: 'utf8'}));
(async() => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    let cases = 0;
    try {
        for (const width of [1280, 768, 390]) for (const palette of [
            {name: 'default', accent: '#1b7f5a', soft: '#eef8f2'},
            {name: 'purple', accent: '#6432a8', soft: '#f2ecfa'},
            {name: 'orange', accent: '#94420a', soft: '#fcf1e7'},
            {name: 'restore', accent: '#1b7f5a', soft: '#eef8f2'}]) {
            const page = await browser.newPage({viewport: {width, height: 900}});
            await page.setContent('<style>*{box-sizing:border-box}' + css + '</style>' +
                '<div class="local-groupimport-easystud path-local-groupimport easyedu-ui" id="workspace" style="' +
                '--easyedu-accent:' + palette.accent + ';--easyedu-accent-soft:' + palette.soft + '">' +
                renderer.module.exports.render(template, data.templateData) + '</div>');
            for (const portalled of [false, true]) {
                if (portalled) await page.evaluate(copier => {
                    const guideNode = document.querySelector('[data-easyedu-guide-root]');
                    // Execute the exact product helper, not a fake colour-copy algorithm.
                    Function('guideNode', copier + '\npreserveGuidePortalTheme();')(guideNode);
                    document.body.appendChild(guideNode);
                }, copier);
                const paint = await page.evaluate(() => {
                    const root = document.querySelector('[data-easyedu-guide-root]');
                    const track = root.querySelector('.easyedu-guide-modal__progress-track');
                    const bar = root.querySelector('[data-easyedu-guide-progress-bar]');
                    const probe = document.createElement('span');
                    root.appendChild(probe);
                    const expected = value => {probe.style.background = value; return getComputedStyle(probe).backgroundColor;};
                    const result = {track: getComputedStyle(track).backgroundColor,
                        border: getComputedStyle(track).borderTopColor,
                        bar: getComputedStyle(bar).backgroundColor,
                        barImage: getComputedStyle(bar).backgroundImage,
                        soft: expected('var(--easyedu-accent-soft)'), accent: expected('var(--easyedu-accent)'),
                        expectedBorder: expected('color-mix(in srgb, var(--easyedu-accent) 22%, var(--easyedu-surface) 78%)'),
                        height: parseFloat(getComputedStyle(track).height)};
                    probe.remove();return result;
                });
                const context = `${width}/${palette.name}/${portalled ? 'portal' : 'workspace'}`;
                assert.equal(paint.track, paint.soft, context + ': semantic track');
                assert.equal(paint.border, paint.expectedBorder, context + ': semantic border');
                assert.equal(paint.bar, paint.accent, context + ': semantic indicator');
                assert.equal(paint.barImage, 'none', context + ': no retained legacy gradient');
                assert.equal(paint.height, 4, context + ': unchanged density');
                cases++;
            }
            await page.close();
        }
        console.log(`PASS ${cases} Discovery palette paints: default/purple/orange/restore, three widths, actual product helper before/after portal.`);
    } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode = 1;});
