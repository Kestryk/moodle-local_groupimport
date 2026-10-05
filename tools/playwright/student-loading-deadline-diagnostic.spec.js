// Read-only startup diagnostic after SM-47 observed the existing fail-open deadline.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Student startup records deadline and native resource timing', async ({page}, testInfo) => {
    test.setTimeout(120000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', e => errors.push(e.message));
    const base = new URL('/local/groupimport/manage.php?id=5&easystudloadingdiagnostics=1',
        process.env.EASYEDU_MOODLE_URL).toString();
    await page.goto(base);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u => !u.pathname.includes('/login/'));
    }
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() === 'GET') await route.continue();
        else { blocked.push(route.request().method()); await route.abort('blockedbyclient'); }
    });
    await page.addInitScript(() => {
        window.easyeduStartupTiming = {longTasks: [], states: []};
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
            new PerformanceObserver(list => list.getEntries().forEach(e => {
                if (window.easyeduStartupTiming.longTasks.length < 80)
                    window.easyeduStartupTiming.longTasks.push({start: e.startTime, duration: e.duration});
            })).observe({type: 'longtask', buffered: true});
        }
        document.addEventListener('DOMContentLoaded', () => {
            const root = document.getElementById('local-groupimport-easystud');
            if (!root) return;
            const record = () => window.easyeduStartupTiming.states.push({t: performance.now(),
                state: root.dataset.easystudLoadingState,
                initialized: root.dataset.easystudManagerInitialised === '1',
                initializing: root.dataset.easystudManagerInitialising === '1'});
            record();
            const observer = new MutationObserver(record);
            observer.observe(root, {attributes: true, attributeFilter: ['data-easystud-loading-state',
                'data-easystud-manager-initialised', 'data-easystud-manager-initialising']});
            window.setTimeout(() => observer.disconnect(), 25000);
        }, {once: true});
    });
    try {
        await page.emulateMedia({reducedMotion: 'no-preference'});
        for (const height of [600, 1100]) {
            await page.setViewportSize({width: 768, height});
            await page.goto(base, {waitUntil: 'domcontentloaded'});
            const root = page.locator('#local-groupimport-easystud');
            await expect.poll(() => root.getAttribute('data-easystud-loading-state'),
                {timeout: 25000}).toMatch(/^(ready|degraded)$/);
            records.push(await root.evaluate((n, height) => {
                const controller = n.easystudLoadingController;
                const diagnostics = controller && controller.getDiagnostics();
                return {height, state: n.dataset.easystudLoadingState, ariaBusy: n.getAttribute('aria-busy'),
                    initialized: n.dataset.easystudManagerInitialised, fontStatus: document.fonts.status,
                    diagnostics: diagnostics ? diagnostics.snapshot() : [], timing: window.easyeduStartupTiming,
                    resources: performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script')
                        .map(r => ({pathname: new URL(r.name).pathname, start: r.startTime, duration: r.duration,
                            responseEnd: r.responseEnd, transferSize: r.transferSize})),
                    navigation: performance.getEntriesByType('navigation').map(r => ({responseEnd: r.responseEnd,
                        domContentLoaded: r.domContentLoadedEventEnd, duration: r.duration})),
                    realContentInert: n.querySelector('[data-easystud-real-content]').inert};
            }, height));
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
        for (const record of records) expect(record.state, 'Native startup deadline diagnostic').toBe('ready');
    } finally {
        fs.writeFileSync(testInfo.outputPath('student-startup-deadline.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
