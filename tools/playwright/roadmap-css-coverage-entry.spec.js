'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const crypto = require('node:crypto');
const audit = require('./roadmap-audit-helper.cjs');

// local-supervised; read-only conditional Chromium coverage, never a dead-rule gate.
test('T053 cold entry records conditional native CSS coverage on Perf', async({page}, info) => {
    test.setTimeout(150000);
    const report = {task: 'T053', viewport: 1280, locale: 'fr', servedFiles: audit.identity(),
        states: [], coverage: [], blockedWrites: [], deadRulesConfirmed: 0};
    try {
        await page.setViewportSize({width: 1280, height: 900});
        await page.coverage.startCSSCoverage({resetOnNavigation: false});
        await audit.login(page);
        await audit.blockBusinessWrites(page, report.blockedWrites);
        const root = await audit.ready(page);
        report.states.push('student-initial');
        const filters = root.locator('[data-easystud-advanced-filters-toggle]:visible').first();
        if (await filters.count()) { await filters.click(); await audit.settle(root); report.states.push('more-filters'); }
        const mode = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
        if (await mode.count()) { await mode.click(); await audit.settle(root); report.states.push('groups-and-groupings'); }
        const url = audit.perfUrl(); url.pathname = '/local/groupimport/index.php';
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        const mass = page.locator('#local-groupimport-import');
        await expect(mass).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await audit.settle(mass); report.states.push('mass-import-initial');
        const usage = await page.coverage.stopCSSCoverage();
        report.coverage = usage.map(entry => {
            const ranges = [...entry.ranges].sort((a, b) => a.start - b.start);
            let usedCharacters = 0, usedBytes = 0, last = 0;
            for (const r of ranges) {
                const begin = Math.max(r.start, last);
                if (r.end > begin) { usedCharacters += r.end - begin; usedBytes += Buffer.byteLength(entry.text.slice(begin, r.end)); }
                last = Math.max(last, r.end);
            }
            return {path: entry.url ? new URL(entry.url).pathname : 'inline',
                sha256: crypto.createHash('sha256').update(entry.text).digest('hex'),
                bytes: Buffer.byteLength(entry.text), usedBytes, unusedObservedBytes: Buffer.byteLength(entry.text) - usedBytes,
                characters: entry.text.length, usedCharacters, includesPlugin: entry.text.includes('local-groupimport'),
                attribution: entry.url.includes('/theme/') ? 'whole Moodle theme bundle, not isolated plugin transfer' : 'stylesheet',
                ranges};
        });
        report.completed = true;
        report.caveat = 'Unused in these four FR1280 states is not dead; modals/mobile/palette/pseudo states excluded.';
        expect(report.coverage.some(c => c.includesPlugin)).toBe(true);
    } finally { fs.writeFileSync(info.outputPath('T053-coverage.json'), JSON.stringify(report, null, 2)); }
});
