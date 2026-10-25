'use strict';
/** T056: discover/hash existing immutable source contracts and compare geometry.
 * A candidate capture is NOT a human-approved visual baseline.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
function catalogue(repo = root) {
    return fs.readdirSync(path.join(repo, 'tools/release')).filter(n => /^test-.*-contract.*\.(ps1|cjs)$/.test(n))
        .sort().map(name => {
            const source = fs.readFileSync(path.join(repo, 'tools/release', name), 'utf8');
            return {file: 'tools/release/' + name,
                sha256: crypto.createHash('sha256').update(source).digest('hex'),
                kind: 'existing-static-contract',
                requiresKit: /Mandatory[^\n]*\$KitRoot|\$KitRoot[^\n]*Mandatory/.test(source),
                historicalPins: /rev-parse|generatedCssBlob|consumerSync|hash-object/.test(source),
                browserReferences: [...new Set(source.match(/[\w-]+\.spec\.js/g) || [])],
                executed: false};
        });
}
function compare(before, after, tolerance = 0.5) {
    const failures = [];
    if (before.length !== after.length) failures.push({kind: 'sample-count', before: before.length, after: after.length});
    for (let i = 0; i < Math.min(before.length, after.length); i++) {
        for (const key of ['family', 'size', 'weight', 'color', 'background', 'radius', 'gap', 'align', 'justify'])
            if (before[i][key] !== after[i][key]) failures.push({index: i, key, before: before[i][key], after: after[i][key]});
        for (const key of ['x', 'y', 'width', 'height']) if (Math.abs(before[i][key] - after[i][key]) > tolerance)
            failures.push({index: i, key, before: before[i][key], after: after[i][key]});
    }
    return failures;
}
if (require.main === module) {
    if (process.argv.includes('--self-test')) {
        assert.equal(compare([{width: 20}], [{width: 20.4}]).length, 0);
        assert.equal(compare([{width: 20}], [{width: 21}]).length, 1);
        assert.equal(compare([], [{}]).length, 1);
        assert.equal(compare([{color: 'red'}], [{color: 'blue'}]).length, 1);
        console.log(JSON.stringify({task: 'T056', selfTest: 'PASS', checks: 4}));
    } else {
        const entries = catalogue();
        const report = {task: 'T056', contracts: entries.length, entries};
        const out = process.argv.indexOf('--output');
        if (out >= 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify(report, null, 2));
        console.log(JSON.stringify({task: 'T056', contracts: entries.length, sourceContractsExecuted: false}));
    }
}
module.exports = {catalogue, compare};
