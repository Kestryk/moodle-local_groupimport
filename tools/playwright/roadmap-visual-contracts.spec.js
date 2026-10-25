'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {catalogue, compare} = require('../release/visual-contracts.cjs');
const audit = require('./roadmap-audit-helper.cjs');

// local-supervised candidate; tools only, no approved raster baseline yet.
test('T056 visual contracts capture native FR1280 repeatability', async({page}, info) => {
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
        await expect(mass).toBeVisible();
        await capture(mass, 'mass-import-initial');
        report.completed = true;
        report.passed = report.failures.length === 0 && report.blockedWrites.length === 0;
        save();
        expect(report.failures, 'Existing contracts retained; no product repair or weakened oracle').toEqual([]);
        expect(report.blockedWrites).toEqual([]);
    } finally { save(); }
});
