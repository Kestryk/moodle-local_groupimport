const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');
const {randomBytes} = require('node:crypto');
const {spawnSync} = require('node:child_process');

async function run(page, testInfo, expect) {
    const fixture = JSON.parse(fs.readFileSync(process.env.EASYEDU_PERF_MANIFEST, 'utf8'));
    const root = process.env.EASYEDU_PERF_MOODLE_ROOT;
    const runtime = path.join(root, 'local', 'groupimport');
    const result = {lot: 'SM-RENDU-1-HTTP', participants: fixture.userIds.length,
        groups: fixture.groupIds.length, groupings: fixture.groupingIds.length, url: 'http://localhost:8051',
        identity: require('./runtime-identity.cjs').read(runtime), http: [], completed: false};
    const save = () => fs.writeFileSync(process.env.EASYEDU_PERF_BASELINE, JSON.stringify(result, null, 2));
    try {
        const parityPath = testInfo.outputPath('sm-parity.json');
        const parity = spawnSync(process.env.EASYEDU_PERF_PHP, [path.join(runtime, 'tools/sm/check-state.php'),
            '--moodle-root=' + root, '--courseid=' + fixture.courseId, '--output=' + parityPath],
        {encoding: 'utf8', windowsHide: true, timeout: 300000});
        result.parityProcessExit = parity.status;
        result.parity = JSON.parse(fs.readFileSync(parityPath, 'utf8'));
        save();
        expect(result.parity.parity).toBe('PASS');
        await page.goto('http://localhost:8051/login/index.php', {waitUntil: 'domcontentloaded'});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'}),
                page.locator('#loginbtn').click()]);
        }
        const sesskey = await page.evaluate(() => window.M.cfg.sesskey);
        const cookies = (await page.context().cookies('http://localhost:8051')).map(c => c.name + '=' + c.value).join('; ');
        for (const [surface, repeat] of [['state', 3], ['manage', 1]]) {
            for (let i = 0; i < repeat; i++) {
                const requestId = 'smperf-' + randomBytes(16).toString('hex');
                const url = surface === 'state' ? '/lib/ajax/service.php?sesskey=' + encodeURIComponent(sesskey) :
                    '/local/groupimport/manage.php?id=' + fixture.courseId;
                const body = surface === 'state' ? JSON.stringify([{index: 0, methodname: 'local_groupimport_get_state',
                    args: {courseid: fixture.courseId}}]) : null;
                const start = performance.now();
                const measurement = await new Promise((resolve, reject) => {
                    const request = http.request({hostname: 'localhost', port: 8051, path: url,
                        method: body ? 'POST' : 'GET', headers: {Cookie: cookies, 'Accept-Encoding': 'gzip',
                            'X-EasyEdu-Perf-Id': requestId, ...(body ? {'Content-Type': 'application/json',
                                'Content-Length': Buffer.byteLength(body)} : {})}}, response => {
                        let wireBytes = 0, rawBytes = 0;
                        const chunks = [];
                        const gzip = response.headers['content-encoding'] === 'gzip';
                        const stream = gzip ? response.pipe(zlib.createGunzip()) : response;
                        response.on('data', chunk => {wireBytes += chunk.length;});
                        stream.on('data', chunk => {rawBytes += chunk.length; if (surface === 'state') chunks.push(chunk);});
                        stream.on('error', error => {
                            if (surface === 'state') { reject(error); return; }
                            resolve({surface, sample: i, requestId, status: response.statusCode, gzip,
                                rawBytes, encodedBodyBytes: wireBytes, httpMs: performance.now() - start,
                                incompleteResponse: true, transportError: error.message});
                        });
                        stream.on('end', () => resolve({surface, sample: i, requestId, status: response.statusCode,
                            gzip, rawBytes, encodedBodyBytes: wireBytes, httpMs: performance.now() - start,
                            ...(surface === 'state' ? {response: JSON.parse(Buffer.concat(chunks).toString('utf8'))} : {})}));
                    });
                    request.setTimeout(360000, () => request.destroy(new Error('Owned Perf HTTP timeout')));
                    request.on('error', reject);
                    request.end(body);
                });
                const lines = fs.readFileSync(path.join(root, '..', 'sm-http-meter.jsonl'), 'utf8').trim().split('\n');
                measurement.server = lines.map(line => JSON.parse(line)).find(m => m.requestId === requestId);
                if (surface === 'state') {
                    const response = measurement.response;
                    measurement.apiError = response[0]?.error;
                    if (!measurement.apiError && response[0]?.data?.state) {
                        const state = JSON.parse(response[0].data.state);
                        measurement.stateBytes = Buffer.byteLength(response[0].data.state);
                        measurement.counts = state.meta.counts;
                    }
                    delete measurement.response;
                }
                result.http.push(measurement);
                save();
                if (surface === 'state') { expect(measurement.apiError).toBe(false); expect(measurement.status).toBe(200); }
            }
        }
        result.completed = true;
    } finally { save(); }
}
module.exports = {run};
