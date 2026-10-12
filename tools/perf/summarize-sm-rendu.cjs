// Condensed review plus referenced raw samples/cleanup, no HTML/authentication state.
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const output = process.argv[3];
if (!root || !output) throw new Error('Explicit evidence root and output file required.');
const runs = [];
for (const directory of ['800-final', '3000', '10000-stream-safe', '3000-stream-safe']) {
    const location = path.join(root, directory);
    if (!fs.existsSync(location)) continue;
    for (const file of fs.readdirSync(location).filter(name => name.endsWith('-baseline.json'))) {
        const baselinePath = path.join(location, file);
        const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        const manifestPath = baselinePath.replace('-baseline.json', '-fixture.json');
        const fixture = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const metadataPath = baselinePath.replace('-baseline.json', '-metadata-cleanup.json');
        runs.push({directory, baselinePath, manifestPath, baseline, cleanup: fixture.cleanup,
            metadataCleanup: fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : null,
            shape: {users: fixture.userIds.length, groups: fixture.groupIds.length,
                groupings: fixture.groupingIds.length}});
    }
}
const median = values => [...values].sort((a,b) => a-b)[Math.floor(values.length / 2)];
const summary = runs.map(run => ({directory: run.directory, ...run.shape, parity: run.baseline.parity?.parity,
    completed: run.baseline.completed, cleanup: run.cleanup,
    stateBytes: run.baseline.parity?.bytes.state, legacyStateBytes: run.baseline.parity?.bytes.legacystate,
    build: run.baseline.parity?.build,
    stateHttp: run.baseline.http.filter(m => m.surface === 'state').map(m => ({httpMs: m.httpMs,
        rawBytes: m.rawBytes, gzipBytes: m.encodedBodyBytes, actualGzip: m.gzip,
        reads: m.server?.sqlReadsTotal, writes: m.server?.sqlWritesTotal})),
    stateHttpMedianMs: median(run.baseline.http.filter(m => m.surface === 'state').map(m => m.httpMs)),
    legacyHttp: run.baseline.http.filter(m => m.surface === 'manage').map(m => ({...m,
        renderPassed: m.status === 200 && !m.incompleteResponse && !m.server?.fatalType,
        byteMeaning: m.server?.fatalType ? 'Error/partial response bytes, not complete legacy HTML' : 'Complete response bytes'})),
}));
fs.writeFileSync(output, JSON.stringify({summary, raw: runs}, null, 2));
process.stdout.write(JSON.stringify(summary, null, 2));
