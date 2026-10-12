// T052-bis: one existing native test, parametrized fixture, full source-byte attribution.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');

async function run(page, testInfo, expect) {
    const manifestPath = process.env.EASYEDU_PERF_MANIFEST;
    const fixture = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const runtime = path.join(process.env.EASYEDU_PERF_MOODLE_ROOT, 'local', 'groupimport');
    const head = spawnSync('git', ['-C', runtime, 'rev-parse', 'HEAD'], {encoding: 'utf8'});
    const result = {lot: 'T052-bis', participants: fixture.userIds.length,
        groups: fixture.groupIds.length, groupings: fixture.groupingIds.length,
        mode: process.env.EASYEDU_PERF_MODE, runtimeHead: head.stdout.trim(), server: [],
        runtimeHashes: Object.fromEntries(['manage.php', 'templates/manage.mustache', 'amd/build/course_manager.min.js',
            'classes/service/course_structure.php'].map(file => [file,
            createHash('sha256').update(fs.readFileSync(path.join(runtime, file))).digest('hex')])),
        errors: [], measurementComplete: false, readinessPassed: null};
    const save = () => {
        fs.writeFileSync(testInfo.outputPath(`t052-bis-${result.participants}.json`), JSON.stringify(result, null, 2));
        fs.writeFileSync(process.env.EASYEDU_PERF_BASELINE, JSON.stringify(result, null, 2));
    };
    page.on('pageerror', error => result.errors.push(error.message));
    try {
        for (const surface of ['manage', 'course-state']) {
            const output = testInfo.outputPath(`t052-bis-${surface}.json`);
            const child = spawnSync(process.env.EASYEDU_PERF_PHP, [path.join(__dirname, 'measure.php'),
                '--moodle-root', process.env.EASYEDU_PERF_MOODLE_ROOT, '--manifest', manifestPath,
                '--output', output, '--case', surface], {encoding: 'utf8', timeout: 120000, windowsHide: true});
            expect(child.status, surface + ' worker exit').toBe(0);
            const measurement = JSON.parse(fs.readFileSync(output, 'utf8'));
            result.server.push(measurement);
            save();
            expect(measurement.passed, surface + ' PHP result').toBe(true);
            if (surface === 'manage') expect(measurement.decomposition.exactByteSum).toBe(true);
        }
        if (result.mode === 'regions') {
            result.measurementComplete = true;
            return;
        }
        const manager = new URL('/local/groupimport/manage.php', process.env.EASYEDU_MOODLE_URL);
        manager.searchParams.set('id', String(fixture.courseId));
        await page.goto(new URL('/login/index.php', manager).toString(), {waitUntil: 'domcontentloaded'});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
        }
        await page.addInitScript(() => {
            window.easyeduCurve = {longTasks: [], readyMs: null, states: []};
            if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
                new PerformanceObserver(list => list.getEntries().forEach(e => {
                    window.easyeduCurve.longTasks.push({startMs: e.startTime, durationMs: e.duration});
                })).observe({type: 'longtask', buffered: true});
            }
            document.addEventListener('DOMContentLoaded', () => {
                const root = document.getElementById('local-groupimport-easystud');
                if (!root) return;
                const observer = new MutationObserver(() => {
                    const state = root.dataset.easystudLoadingState;
                    window.easyeduCurve.states.push({state, atMs: performance.now()});
                    if (state === 'ready' && window.easyeduCurve.readyMs === null) {
                        window.easyeduCurve.readyMs = performance.now();
                        observer.disconnect();
                    }
                });
                observer.observe(root, {attributes: true, attributeFilter: ['data-easystud-loading-state']});
                window.setTimeout(() => observer.disconnect(), 120000);
            }, {once: true});
        });
        await page.setViewportSize({width: 1280, height: 800});
        await page.emulateMedia({reducedMotion: 'no-preference'});
        const response = await page.goto(manager.toString(), {waitUntil: 'domcontentloaded'});
        expect(response.status()).toBe(200);
        try {
            await expect.poll(() => page.locator('#local-groupimport-easystud').getAttribute('data-easystud-loading-state'),
                {timeout: 30000}).toBe('ready');
        } catch {
            result.readinessDeadlineFailed = true;
        }
        result.browser = await page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            const root = document.getElementById('local-groupimport-easystud');
            return {domElements: document.querySelectorAll('*').length, state: root.dataset.easystudLoadingState,
                sourceTransferBytes: nav.transferSize, decodedBodyBytes: nav.decodedBodySize,
                responseMs: nav.responseStart - nav.requestStart, domContentLoadedMs: nav.domContentLoadedEventEnd,
                observationMs: performance.now(), ...window.easyeduCurve};
        });
        result.readinessPassed = result.browser.readyMs !== null && result.browser.readyMs <= 30000;
        result.exceedsFiveMegabytes = result.server[0].htmlBytes > 5000000;
        result.exceedsThirtySeconds = !result.readinessPassed;
        result.measurementComplete = true;
        // Readiness failure is an expected baseline finding; retain it explicitly
        // while allowing the supervisor to finish other load sizes and cleanup.
        expect(result.errors, 'Page errors').toEqual([]);
    } finally {
        save();
    }
}

module.exports = {run};
