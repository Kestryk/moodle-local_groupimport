/* eslint-env node */
const fs = require('node:fs'), assert = require('node:assert/strict');
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(report.rows.length, 32);
assert.equal(report.deferred.length, 8);
assert.deepEqual(report.errors, []); assert.deepEqual(report.writes, []);
let pills = 0, real = 0, counters = 0, maxDx = 0, maxDy = 0, minGap = Infinity, maxCheckboxDy = 0;
const denseTotals = new Set();
for (const lang of ['fr', 'en']) for (const width of [1600, 1280, 768, 390]) {
    const states = report.rows.filter(r => r.lang === lang && r.width === width);
    assert.equal(states.length, 4);
    assert.equal(new Set(states.map(r => r.density + ':' + r.expanded)).size, 4);
    for (const state of states) for (const card of state.cards) {
        minGap = Math.min(minGap, card.checkboxGap);
        maxCheckboxDy = Math.max(maxCheckboxDy, Math.abs(card.checkboxDy));
        assert(card.checkboxGap >= 8 && Math.abs(card.checkboxDy) <= .5);
        for (const row of card.rows) {
            if (card.name.includes('Member 00')) denseTotals.add(row.total);
            const values = row.tokens.filter(t => !t.toggle), toggle = row.tokens.find(t => t.toggle);
            if (row.total) assert(values.length > 0);
            for (const token of row.tokens) {
                pills++; if (!token.toggle) real++;
                assert(token.text && !['-', '\u2212', '\u2014'].includes(token.text));
                assert.equal(token.title, token.text); assert.equal(token.height, 22); assert.equal(token.cssHeight, '22px');
                assert.equal(token.clipped, false);
                maxDx = Math.max(maxDx, Math.abs(token.dx)); maxDy = Math.max(maxDy, Math.abs(token.dy));
                assert(Math.abs(token.dx) <= .5 && Math.abs(token.dy) <= .5);
            }
            if (toggle && toggle.expanded !== 'true') {counters++; assert.equal(toggle.text, '+' + (row.total - values.length));}
        }
    }
}
assert(denseTotals.has(37) && denseTotals.has(11) && denseTotals.has(3));
const failures = report.audit.filter(r => r.status === 'FAIL');
assert.equal(failures.filter(r => !r.check.includes(' groupe ')).length, 0);
assert(failures.length <= 21);
const summary = {passed: true, states: 32, cardSamples: report.rows.reduce((n, r) => n + r.cards.length, 0),
    pills, real, counters, height: 22, maxDx, maxDy, minCheckboxGap: minGap, maxCheckboxDy,
    empty: 0, sentinel: 0, truncated: 0, deferredRealRequests: 8,
    denseTotals: [...denseTotals], auditGroupFailures: failures.length, auditOtherFailures: 0, humanAccepted: false};
fs.writeFileSync(process.argv[3], JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
