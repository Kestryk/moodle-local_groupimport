// Summarize existing external counters only; never read rendered HTML or credentials.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2]);
const measurements = fs.readdirSync(root).filter(name => name.endsWith('-baseline.json')).map(name => {
    const rawPath = path.join(root, name);
    const measurement = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(rawPath.replace('-baseline.json', '-fixture.json'), 'utf8'));
    return {...measurement, rawPath, cleanup: manifest.cleanup};
}).sort((a, b) => a.participants - b.participants);
if (measurements.length !== 4 || measurements.some(m => !m.measurementComplete || !m.cleanup.complete)) {
    throw new Error('Require all four completed and cleaned measurements.');
}
const hashesEqual = measurements.every(m => JSON.stringify(m.runtimeHashes) === JSON.stringify(measurements[0].runtimeHashes));
const summary = {lot: 'T052-bis', runtimeHead: measurements[0].runtimeHead, measuredCodeIdentical: hashesEqual,
    byteSumsExact: measurements.every(m => m.server[0].decomposition.exactByteSum),
    cleanupComplete: true, curve: measurements.filter(m => m.mode === 'curve').map(m => ({
        participants: m.participants, htmlBytes: m.server[0].htmlBytes,
        sourceElements: m.server[0].decomposition.sourceElements, liveDomElements: m.browser.domElements,
        readyMs: m.browser.readyMs, observedMs: m.browser.observationMs, state: m.browser.state,
        longTasksMs: m.browser.longTasks.reduce((sum, e) => sum + e.durationMs, 0),
        exceedsThirtySeconds: m.exceedsThirtySeconds, exceedsFiveMegabytes: m.exceedsFiveMegabytes,
    })), regions800: measurements.find(m => m.participants === 800).server[0].decomposition.regions,
    instances800: measurements.find(m => m.participants === 800).server[0].decomposition.instances,
    thresholds: {bytes: 5000000, readyMs: 30000,
        crossing: 'at or below 100 participants; fixed 150 groups/40 groupings; lower exact crossing not measured'},
    rawPath: path.join(root, 'RAW-T052-BIS-2026-10-12.json')};
if (!hashesEqual || !summary.byteSumsExact) throw new Error('Source comparability/byte attribution failed.');
fs.writeFileSync(summary.rawPath, JSON.stringify({summary, measurements}, null, 2));
console.log(JSON.stringify(summary));
