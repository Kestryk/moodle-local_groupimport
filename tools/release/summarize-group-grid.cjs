const fs = require('node:fs'), assert = require('node:assert/strict');
const before = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const after = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const audit = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
assert.equal(before.rows.length, 16); assert.equal(after.rows.length, 24); assert.equal(after.strict, true);
assert.deepEqual(after.errors, []); assert.deepEqual(after.writes, []);
assert.deepEqual(audit.filter(r => r.status === 'FAIL'), []);
for (const lang of ['fr','en']) for (const width of [1600,1280,768,390]) {
    const cells = after.rows.filter(r => r.lang === lang && r.width === width);
    assert.equal(cells.length, 3);
    assert.equal(cells.filter(c => c.panel === 'groups' && c.empty).length, 1);
    assert.equal(cells.filter(c => c.panel === 'groups' && !c.empty).length, 1);
    cells.forEach(c => {
        assert(c.checkSpread <= .5 && c.textSpread <= .5 && c.rightSpread <= .5 && c.headerDy <= .5);
        assert.equal(c.stacked, false);
    });
    const footer = cells.find(c => c.panel === 'ungrouped-footer');
    assert(footer.reveal.hit && footer.select.hit);
    assert.equal(footer.reveal.height, 32); assert.equal(footer.select.height, 32);
    assert(Math.abs(footer.reveal.centre - footer.footerCentre) <= .5);
}
const maxima = report => Object.fromEntries(['checkSpread','textSpread','rightSpread','headerDy'].map(k => [k, Math.max(...report.rows.map(r => r[k]))]));
const out = {passed:true, before:maxima(before), after:maxima(after), samples:24, cells:8,
    emptyAndFull:true, footerHitPairs:8, footerControlHeights:[32], footerOverlaps:0, auditFailures:0, humanAccepted:false};
fs.writeFileSync(process.argv[5], JSON.stringify(out,null,2)); console.log(JSON.stringify(out));
