// Saved catalogue evidence guard, not a live editor/native browser test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kitRoot = process.argv[2];
assert(kitRoot, 'Supply the canonical Kit checkout');
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const evidence = JSON.parse(read('docs/testing/student-entity-metadata-penpot-2026-10-05.json'));
const {basis, product, readback} = evidence;
assert.equal(basis.freshNativeRun, false);
const modulePath = 'scss/easyedu/components/_entity-metadata.scss';
assert.equal(basis.metadataBlob, execFileSync('git', ['hash-object', modulePath], {cwd: root}).toString().trim());
assert.equal(read(modulePath), fs.readFileSync(path.join(kitRoot, modulePath), 'utf8').replace(/\r\n/g, '\n'));
assert.equal(readback.humanVisualValidated, false);
assert.equal(readback.sourceFoundationUpdated, false, 'Pending source publication must not be claimed as complete');
assert(product.archiveHidden && product.groupingOriginalHidden);
assert.deepEqual(product.sections.map(s => [s.title, s.count, s.rows]),
    [['Members', 1, 1], ['Groupings', 0, 0], ['Groups', 1, 1]]);
assert.equal(product.rows.length, 2);
for (const row of product.rows) assert.equal(row.chips, 2);
assert.equal(product.chipProviders.length, 4);
for (const primary of product.primaries) {
    assert.equal(primary.font, 13.44);
    assert.equal(primary.weight, 600); // Recorded native 650 -> supported Penpot 600.
    assert.equal(primary.colour, '#334b61');
}
assert.equal(product.headerCentres.length, 4);
for (const centre of product.headerCentres) {
    assert(Math.abs(centre.titleDelta) <= readback.tolerance);
    assert(Math.abs(centre.glyphDelta) <= readback.tolerance);
}
assert.equal(readback.visibleDescendantOverflows, 0);
assert.equal(readback.visibleTextPaintOverflows, 0);
assert(readback.finalGroupExportInspected && readback.finalGroupingExportInspected);
assert.equal(readback.localComponentMastersCreated, 0);
assert(evidence.nextSourcePublication.length > 0);
const builder = read('amd/src/course_manager.js');
const start = builder.indexOf('const renderAdvancedListSection =');
const end = builder.indexOf('const exporttable =', start);
const markup = builder.slice(start, end);
assert(markup.includes('list-item-primary') && markup.includes('list-item-meta'));
assert(markup.indexOf('list-item-primary') < markup.lastIndexOf('list-item-meta'));
assert(markup.includes('const count = rows.length;'));
console.log('PASS: saved metadata anatomy/paint evidence; source publication and human acceptance stay open. Not a fresh editor/native test.');
