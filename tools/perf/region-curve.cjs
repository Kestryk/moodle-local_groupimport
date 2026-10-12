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
        if (result.mode === 'sql') {
            result.lot = 'AP-E5';
            result.sourceDirty = spawnSync('git', ['-C', path.resolve(__dirname, '..', '..'), 'status', '--porcelain'],
                {encoding: 'utf8', windowsHide: true}).stdout.trim().length > 0;
            result.sourceHashes = Object.fromEntries(['ajax.php', 'index.php', 'classes/local/batch_reader.php',
                'classes/service/membership_transfer.php'].map(file => [file, createHash('sha256')
                .update(fs.readFileSync(path.join(__dirname, '..', '..', file))).digest('hex')]));
            result.comparisons = [];
            for (const surface of ['addemails', 'duplicategroup', 'deletegroupings', 'movemembers',
                'import-preview', 'rollback']) {
                const records = [];
                for (const variant of ['before', 'after']) {
                    const output = testInfo.outputPath(`sql-${surface}-${variant}.json`);
                    const args = [path.join(__dirname, 'measure.php'), '--moodle-root', process.env.EASYEDU_PERF_MOODLE_ROOT,
                        '--manifest', manifestPath, '--output', output, '--case', surface];
                    if (variant === 'after') args.push('--entry-root', path.resolve(__dirname, '..', '..'));
                    const child = spawnSync(process.env.EASYEDU_PERF_PHP, args,
                        {encoding: 'utf8', timeout: 120000, windowsHide: true});
                    expect(child.status, `${surface}/${variant} worker exit`).toBe(0);
                    const measurement = JSON.parse(fs.readFileSync(output, 'utf8'));
                    records.push(measurement);
                    result.server.push({...measurement, variant});
                    save();
                    expect(measurement.passed, `${surface}/${variant} result`).toBe(true);
                }
                const equal = JSON.stringify(records[0].outcome.functional) === JSON.stringify(records[1].outcome.functional);
                result.comparisons.push({surface, equal, beforeReads: records[0].sqlReads, afterReads: records[1].sqlReads,
                    beforeMs: records[0].generationMs, afterMs: records[1].generationMs});
                save();
                expect(equal, surface + ' strict logical response/memberships/messages equality').toBe(true);
            }
            const edgeOutput = testInfo.outputPath('sql-edge-checks.json');
            const edge = spawnSync(process.env.EASYEDU_PERF_PHP, [path.join(__dirname, 'verify-batch-edges.php'),
                '--moodle-root', process.env.EASYEDU_PERF_MOODLE_ROOT, '--manifest', manifestPath,
                '--before-root', runtime, '--after-root', path.resolve(__dirname, '..', '..'), '--output', edgeOutput],
            {encoding: 'utf8', timeout: 120000, windowsHide: true});
            result.edges = JSON.parse(fs.readFileSync(edgeOutput, 'utf8'));
            save();
            expect(edge.status, 'Native edge worker exit').toBe(0);
            expect(result.edges.passed, 'Native edge-case equality').toBe(true);
            result.measurementComplete = true;
            return;
        }
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
        if (result.mode === 'details') {
            const candidate = path.resolve(__dirname, '..', '..');
            result.lot = 'AP-E6-server';
            const variants = [
                ['manage-source-full', 'manage', false], ['manage-source-deferred', 'manage', true],
                ['state-source-full', 'course-state', false], ['state-source-deferred', 'course-state', true],
                ['userdetails-checks', 'userdetails-checks', false],
            ];
            for (const [label, surface, deferred] of variants) {
                const output = testInfo.outputPath(label + '.json');
                const args = [path.join(__dirname, 'measure.php'), '--moodle-root', process.env.EASYEDU_PERF_MOODLE_ROOT,
                    '--manifest', manifestPath, '--output', output, '--case', surface, '--service-root', candidate];
                if (deferred) args.push('--defer-details');
                const child = spawnSync(process.env.EASYEDU_PERF_PHP, args,
                    {encoding: 'utf8', timeout: 120000, windowsHide: true});
                expect(child.status, label + ' process exit').toBe(0);
                const measurement = JSON.parse(fs.readFileSync(output, 'utf8'));
                result.server.push({...measurement, variant: label});
                save();
                expect(measurement.passed, label + ' native API checks').toBe(true);
            }
            const full = result.server.find(m => m.variant === 'manage-source-full');
            const light = result.server.find(m => m.variant === 'manage-source-deferred');
            result.byteGain = full.htmlBytes - light.htmlBytes;
            result.byteGainPercent = result.byteGain / full.htmlBytes * 100;
            result.defaultStateMatchesServed = result.server.find(m => m.variant === 'state-source-full').outcome.payloadHash ===
                result.server.find(m => m.surface === 'course-state' && !m.sourceCandidate).outcome.payloadHash;
            expect(result.defaultStateMatchesServed).toBe(true);
            expect(result.byteGain).toBeGreaterThan(0);
            result.activation = 'Source/native API candidate only; persisted option unchanged; default off; no browser activation.';
        }
        if (result.mode === 'regions' || result.mode === 'details') {
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
