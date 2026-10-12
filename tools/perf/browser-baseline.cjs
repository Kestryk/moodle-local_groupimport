// T052 extension of the existing Student startup diagnostic. No product JS changes.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');

async function runBaseline(page, testInfo, expect) {
    if (['regions', 'curve', 'details'].includes(process.env.EASYEDU_PERF_MODE)) {
        await require('./region-curve.cjs').run(page, testInfo, expect);
        return;
    }
    const manifestPath = process.env.EASYEDU_PERF_MANIFEST;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const outputDirectory = testInfo.outputPath('t052');
    fs.mkdirSync(outputDirectory, {recursive: true});
    const records = [], errors = [], server = [], failures = [];
    const baseline = {lot: 'T052', level: 0, passed: false, fixture: {
        users: manifest.userIds.length, groups: manifest.groupIds.length,
        groupings: manifest.groupingIds.length,
    }, server, browser: records, errors, failures, measurementComplete: false};
    const rootPath = process.env.EASYEDU_PERF_MOODLE_ROOT;
    const runtime = path.join(rootPath, 'local', 'groupimport');
    const revision = spawnSync('git', ['-C', runtime, 'rev-parse', 'HEAD'], {encoding: 'utf8'});
    expect(revision.status).toBe(0);
    baseline.runtimeHead = revision.stdout.trim();
    baseline.sourceHead = process.env.EASYEDU_PERF_SOURCE_HEAD;
    baseline.runtimeHashes = Object.fromEntries(['manage.php', 'ajax.php', 'index.php',
        'classes/service/course_structure.php'].map(file => [file,
        createHash('sha256').update(fs.readFileSync(path.join(runtime, file))).digest('hex')]));
    page.on('pageerror', error => errors.push(error.message));
    const manager = new URL('/local/groupimport/manage.php', process.env.EASYEDU_MOODLE_URL);
    manager.searchParams.set('id', String(manifest.courseId));
    // Authenticate on the lightweight login page, not an extra 43MB workspace.
    await page.goto(new URL('/login/index.php', manager).toString(), {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
    }
    await page.addInitScript(() => {
        window.easyeduPerfLongTasks = [];
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
            new PerformanceObserver(list => list.getEntries().forEach(entry => {
                window.easyeduPerfLongTasks.push({startMs: entry.startTime, durationMs: entry.duration});
            })).observe({type: 'longtask', buffered: true});
        }
    });
    await page.setViewportSize({width: 1280, height: 800});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    try {
        const repeatedSetup = spawnSync(process.env.EASYEDU_PERF_PHP, [path.join(__dirname, 'create-fixture.php'),
            '--moodle-root', rootPath, '--manifest', manifestPath, '--action', 'setup'],
        {encoding: 'utf8', timeout: 120000, windowsHide: true});
        expect(repeatedSetup.status, 'Fixture setup is idempotent').toBe(0);
        const repeatedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        baseline.fixture.idempotent = ['courseId', 'userIds', 'groupIds', 'groupingIds'].every(key =>
            JSON.stringify(manifest[key]) === JSON.stringify(repeatedManifest[key]));
        expect(baseline.fixture.idempotent).toBe(true);
        for (const surface of ['manage', 'course-state', 'addemails', 'duplicategroup', 'deletegroupings',
            'movemembers', 'import-preview', 'rollback']) {
            const output = path.join(outputDirectory, `${surface}.json`);
            const child = spawnSync(process.env.EASYEDU_PERF_PHP, [path.join(__dirname, 'measure.php'),
                '--moodle-root', rootPath, '--manifest', manifestPath, '--output', output, '--case', surface],
            {encoding: 'utf8', timeout: 120000, windowsHide: true});
            // Native page output is captured by PHP; only counters/outcomes are persisted.
            fs.writeFileSync(path.join(outputDirectory, `${surface}.process.json`), JSON.stringify({
                exitCode: child.status, signal: child.signal,
                error: child.error ? child.error.code : null,
            }, null, 2));
            expect(fs.existsSync(output), `${surface}: worker produced JSON`).toBe(true);
            const result = JSON.parse(fs.readFileSync(output, 'utf8'));
            server.push(result);
            expect(child.status, `${surface}: CLI process completed`).toBe(0);
            expect(result.passed, `${surface}: native functional outcome`).toBe(true);
        }
        baseline.stylesSourceBytes = fs.statSync(path.join(runtime, 'styles.css')).size;
        for (const [surface, pathname] of [['site-home', '/'], ['course', `/course/view.php?id=${manifest.courseId}`]]) {
            await page.goto(new URL(pathname, manager).toString(), {waitUntil: 'load'});
            const css = await page.evaluate(() => {
                const marker = '.local-groupimport-easystud';
                const sheets = [...document.styleSheets].filter(sheet => sheet.href);
                const plugin = sheets.flatMap(sheet => {
                    try {
                        const present = [...sheet.cssRules].some(rule => rule.cssText.includes(marker));
                        if (!present) return [];
                        const resource = performance.getEntriesByName(sheet.href)[0];
                        return [{pathname: new URL(sheet.href).pathname,
                            transferredBytes: resource ? resource.transferSize : null,
                            decodedBodyBytes: resource ? resource.decodedBodySize : null,
                            pluginRulesPresent: true}];
                    } catch { return []; }
                });
                return {pluginRulesPresent: plugin.length > 0, bundledStylesheets: plugin,
                    interpretation: 'Moodle bundles plugin styles; bytes describe the complete containing stylesheet.'};
            });
            records.push({surface, css});
        }
        for (let sample = 0; sample < 3; sample++) {
            const response = await page.goto(manager.toString(), {waitUntil: 'domcontentloaded'});
            expect(response.status()).toBe(200);
            const workspace = page.locator('#local-groupimport-easystud');
            let ready = true;
            try {
                await expect.poll(() => workspace.getAttribute('data-easystud-loading-state'),
                    {timeout: 30000}).toBe('ready');
            } catch {
                ready = false;
                failures.push({surface: 'manage', sample, reason: 'Native workspace did not become ready within 30000ms'});
            }
            await page.evaluate(() => document.fonts.ready);
            const record = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {surface: 'manage', domElements: document.querySelectorAll('*').length,
                    state: document.querySelector('#local-groupimport-easystud').dataset.easystudLoadingState,
                    initialized: document.querySelector('#local-groupimport-easystud').dataset.easystudManagerInitialised,
                    workspaceElements: document.querySelector('#local-groupimport-easystud').querySelectorAll('*').length,
                    responseMs: navigation.responseStart - navigation.requestStart,
                    responseEndMs: navigation.responseEnd,
                    domContentLoadedMs: navigation.domContentLoadedEventEnd,
                    readyObservedMs: performance.now(), transferredBytes: navigation.transferSize,
                    decodedBodyBytes: navigation.decodedBodySize,
                    longTasks: window.easyeduPerfLongTasks,
                    participantNodes: document.querySelectorAll('[data-easystud-user-id]').length};
            });
            record.sample = sample;
            record.readinessDeadlinePassed = ready;
            records.push(record);
            // The 43MB page may be evicted from Chromium's inspector cache.
            // Persist measured DOM/timing first; Resource Timing also reports
            // decoded body bytes without keeping the response itself in memory.
            fs.writeFileSync(testInfo.outputPath('t052-browser-progress.json'), JSON.stringify(records, null, 2));
            try {
                record.htmlBytes = (await response.body()).length;
                record.htmlBytesSource = 'response-body';
            } catch {
                record.htmlBytes = record.decodedBodyBytes || null;
                record.htmlBytesSource = 'navigation-decodedBodySize';
                record.inspectorBodyEvicted = true;
            }
            if (!ready) {
                baseline.skippedSamples = [1, 2].filter(index => index > sample);
                break; // Preserve the failed scale case; do not repeat unchanged failures.
            }
        }
        baseline.measurementComplete = true;
        expect(errors, 'Native page errors').toEqual([]);
        expect(failures, 'Native readiness regression remains open').toEqual([]);
        baseline.passed = true;
    } finally {
        fs.writeFileSync(testInfo.outputPath('baseline-2026-10-12.json'), JSON.stringify(baseline, null, 2));
        fs.writeFileSync(process.env.EASYEDU_PERF_BASELINE, JSON.stringify(baseline, null, 2));
    }
}

module.exports = {runBaseline};
