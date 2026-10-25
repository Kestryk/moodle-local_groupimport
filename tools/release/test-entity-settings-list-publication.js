// Saved publication evidence only; never a live editor/native/human proof.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const kitRoot = process.argv[2];
assert(kitRoot, 'Supply canonical Kit checkout');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const json = relative => JSON.parse(read(relative));
const source = json('docs/testing/entity-settings-list-publication-2026-10-05.json');
const product = json('docs/testing/entity-settings-list-product-2026-10-05.json');
const settled = json('docs/testing/entity-settings-list-product-readback-2026-10-05.json');
const semantic = json('docs/testing/entity-settings-groupings-chip-2026-10-05.json');
const semanticProduct = json('docs/testing/entity-settings-groupings-product-2026-10-05.json');
for (const [file, blob] of [
    ['scss/easyedu/components/_entity-metadata.scss', source.source.entityMetadataBlob],
    ['scss/easyedu/components/_modals.scss', source.source.modalsBlob],
]) {
    assert.equal(execFileSync('git', ['hash-object', file], {cwd: root}).toString().trim(), blob);
    assert.equal(read(file), fs.readFileSync(path.join(kitRoot, file), 'utf8').replace(/\r\n/g, '\n'));
}
assert.equal(source.source.newScssDeclarations, 0);
assert.equal(source.standardPending, false);
assert.equal(source.productPending, false);
assert.equal(product.semanticGroupingsChipProviderPending, false);
assert.equal(product.finalExportsPending, false);
assert.equal(semantic.match, true);
assert.deepEqual(semantic.sourceFingerprint, semantic.standardFingerprint);
assert.equal(product.semanticGroupingsChipProvider, semantic.component);
assert.equal(semanticProduct.provider, semantic.component);
assert(Math.abs(semanticProduct.deltaX) <= 0.1);
assert(Math.abs(semanticProduct.deltaY) <= 0.1);
assert.equal(source.pairs.length, 4);
for (const pair of source.pairs) assert.equal(pair.match, true);
assert.equal(product.localMasters, 0);
assert.equal(product.partialReconciled, true);
assert.equal(product.finalGeometryPending, false);
assert.equal(product.metadata.rows.length, 2);
assert.deepEqual(product.full.map(s => [s.kind, s.count, s.rows.length]),
    [['members', 3, 3], ['groupings', 1, 1], ['groups', 2, 2]]);
for (const section of product.full) assert.equal(section.archiveHidden, true);
assert.deepEqual(product.full[0].names, ['Alice Martin', 'Samira Benali', 'Alex Dupont']);
assert.deepEqual(product.full[1].ids, ['YEAR-2026']);
assert.deepEqual(product.full[2].members, [3, 8]);
assert.equal(product.full[0].clip, true, 'Native max-height is a scrolling excerpt, not lost entries');
assert.deepEqual(product.typeReadback,
    {family: 'Inter', primarySize: 13.44, primaryWeight: 600, chipSize: 12.16, chipWeight: 600, headerSize: 14.08});
for (const item of [...settled.geometry.full, ...settled.geometry.cards]) assert.deepEqual(item.overflows, []);
for (const section of settled.product.full) {
    assert(section.archiveHidden);
    const primaryTexts = section.texts.filter(t => t.size === '13.44');
    assert.equal(primaryTexts.length, section.count);
    for (const text of primaryTexts) {
        assert.equal(text.font, 'Inter');
        assert.equal(text.weight, '600');
    }
}
for (const record of [source, product, settled]) {
    assert.equal(record.humanVisualValidated, false);
    assert.equal(record.nativeStyleChanged, false);
}
console.log('PASS saved Settings-list/row paired and product evidence; pending gates remain explicit. Not fresh editor/native/human acceptance.');
