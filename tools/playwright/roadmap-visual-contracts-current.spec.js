'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {catalogue, compare} = require('../release/visual-contracts.cjs');
const audit = require('./roadmap-audit-helper.cjs');

// local-supervised candidate; tools only, no approved raster baseline yet.
test('T056 current visual contracts capture native FR1280 repeatability', async({page}, info) => {
    test.setTimeout(180000);
    const report = {task: 'T056', level: 'N1', viewport: {width: 1280, height: 900}, locale: 'fr',
        servedFiles: audit.identity(), contracts: catalogue(), states: [], failures: [], blockedWrites: [],
        baseline: 'candidate-only, not human-approved', rasterGate: 'pending reviewed external baseline'};
    const save = () => fs.writeFileSync(info.outputPath('T056-raw.json'), JSON.stringify(report, null, 2));
    await page.setViewportSize(report.viewport);
    await page.emulateMedia({reducedMotion: 'no-preference'});
    try {
        await audit.login(page);
        await audit.blockBusinessWrites(page, report.blockedWrites);
        const capture = async (root, name) => {
            await audit.settle(root);
            const selector = 'button:visible, input:visible, select:visible, .easyedu-modal-title:visible';
            const read = () => root.locator(selector).evaluateAll(nodes => nodes.map(node => {
                const r = node.getBoundingClientRect(), s = getComputedStyle(node);
                return {tag: node.tagName, family: s.fontFamily, size: s.fontSize, weight: s.fontWeight,
                    color: s.color, background: s.backgroundColor, radius: s.borderTopLeftRadius,
                    gap: s.gap, align: s.alignItems, justify: s.justifyContent,
                    x: r.x, y: r.y, width: r.width, height: r.height};
            }));
            const first = await read();
            await page.screenshot({path: info.outputPath(name + '.png'), fullPage: false});
            await audit.settle(root);
            const second = await read();
            const differences = compare(first, second);
            if (process.env.EASYEDU_VISUAL_BASELINE_JSON) {
                const baseline = JSON.parse(fs.readFileSync(process.env.EASYEDU_VISUAL_BASELINE_JSON, 'utf8'));
                if (baseline.approval !== 'human-approved' || baseline.viewport.width !== 1280 || baseline.locale !== 'fr')
                    throw new Error('Only an explicitly human-approved matching external baseline may be used.');
                const reference = baseline.states.find(s => s.name === name);
                if (!reference) throw new Error('Approved baseline has no state: ' + name);
                const regressions = compare(reference.first, first);
                if (regressions.length) report.failures.push({name, kind: 'approved-baseline-regression', regressions});
                report.baseline = 'human-approved external baseline';
                report.rasterGate = 'geometry/type/paint comparison; raster still human-reviewed';
            }
            report.states.push({name, sampleCount: first.length, first, differences,
                contracts: ['test-student-card-header-contract.ps1', 'test-action-button-alignment-contract.ps1',
                    'test-student-control-treatment-contract.ps1']});
            if (differences.length) report.failures.push({name, kind: 'repeatability', differences});
            if (!first.length) report.failures.push({name, kind: 'empty-surface'});
            const overflow = await root.evaluate(node => ({scroll: node.scrollWidth, width: node.clientWidth}));
            if (overflow.scroll > overflow.width + 1) report.failures.push({name, kind: 'horizontal-overflow', overflow});
            save();
        };
        const root = await audit.ready(page);
        expect(await page.locator('html').getAttribute('lang')).toMatch(/^fr/);
        await capture(root, 'student-initial');
        const filters = root.locator('[data-easystud-advanced-filters-toggle]:visible').first();
        if (await filters.count()) {
            await filters.click();
            await capture(root, 'student-more-filters');
            await filters.click();
        } else report.failures.push({kind: 'missing-more-filters'});
        const url = audit.perfUrl(); url.pathname = '/local/groupimport/index.php';
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        const mass = page.locator('#local-groupimport-import');
        await expect(mass).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        const pickerReady = await mass.locator('[id^="filepicker-button-"]:visible').first()
            .waitFor({state: 'visible', timeout: 30000}).then(() => true).catch(() => false);
        if (!pickerReady) report.failures.push({name: 'mass-import', kind: 'native-picker-unavailable-after-30s'});
        await capture(mass, 'mass-import-initial');
        report.completed = true;
        report.passed = report.failures.length === 0 && report.blockedWrites.length === 0;
        save();
        expect(report.failures, 'Existing contracts retained; no product repair or weakened oracle').toEqual([]);
        expect(report.blockedWrites).toEqual([]);
    } finally { save(); }
});
