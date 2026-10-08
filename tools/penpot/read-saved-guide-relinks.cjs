// Local-supervised, read-only saved-file gate for the exact G9 product links.
// No editor/Moodle writes, authentication export or browser/profile teardown.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.ok(process.argv[2] && process.argv[3] && process.argv[4],
    'Usage: node read-saved-guide-relinks.cjs <playwright-modules> <transit-modules> <local-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const recordName = process.argv[5] || 'guide-g9-product-relinks-2026-10-08.json';
assert.ok(['guide-g9-product-relinks-2026-10-08.json',
    'guide-g10-b-product-links-2026-10-08.json',
    'guide-g10-c-product-links-2026-10-08.json',
    'guide-g10-e-product-links-2026-10-08.json',
    'guide-g9-product-relinks-tranche2-2026-10-08.json',
    'guide-g9-product-relinks-tranche3-2026-10-08.json',
    'guide-g9-quiet-transfer-2026-10-08.json',
    'guide-g9-quiet-guide-relinks-2026-10-08.json',
    'guide-keyboard-candidate-2026-10-08.json'].includes(recordName), 'Exact owned evidence record');
const expected = require(path.resolve(__dirname, '../../docs/testing', recordName));
const read = (value, field) => (value.rep || value).get(transit.keyword(field));
const geometry = (shape, field) => {
    let value = read(shape, field);
    if (!Number.isFinite(value) && String(read(shape, 'type')) === ':path' && read(shape, 'selrect')) {
        value = read(read(shape, 'selrect'), field);
    }
    assert.ok(Number.isFinite(value), `${String(read(shape, 'id'))}: numeric ${field}`);
    return value;
};
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    let descendants = 0, archives = 0;
    try {
        const tabs = browser.contexts().flatMap(context => context.pages()).filter(page => {
            const url = new URL(page.url());
            return url.origin === 'https://design.penpot.app' && url.hash.includes(expected.fileId);
        });
        assert.equal(tabs.length, 1, 'Exactly one owned Guide tab');
        const response = await tabs[0].evaluate(async id => {
            const result = await fetch(`/api/rpc/command/get-file?id=${id}`, {signal: AbortSignal.timeout(45000)});
            return {status: result.status, body: await result.text()};
        }, expected.fileId);
        assert.equal(response.status, 200);
        const data = read(transit.reader('json').read(response.body), 'data');
        const objects = read(read(data, 'pages-index').get(transit.uuid(expected.pageId)), 'objects');
        const object = id => objects.get(transit.uuid(id));
        for (const item of expected.components) {
            const root = object(item.id);
            assert.ok(root, 'Exact saved instance exists');
            assert.equal(String(read(root, 'component-id')), item.componentId, 'Foundation link persisted');
            assert.equal(String(read(root, 'component-file')), '40e06342-8830-80d6-8008-96572effc11c');
            for (const field of ['x', 'y', 'width', 'height']) {
                assert.ok(Math.abs(geometry(root, field) - item[field]) < 0.05, `Saved ${field}`);
            }
            const walk = (shape, parentHidden) => {
                const hidden = parentHidden || read(shape, 'hidden');
                if (!hidden) {
                    for (const [axis, size] of [['x', 'width'], ['y', 'height']]) {
                        const inset = geometry(shape, axis) - geometry(root, axis);
                        assert.ok(inset >= -0.05 && inset + geometry(shape, size) <= geometry(root, size) + 0.05,
                            `${String(read(shape, 'id'))}: saved containment`);
                    }
                    descendants++;
                }
                for (const id of read(shape, 'shapes') || []) walk(objects.get(id), hidden);
            };
            walk(root, false);
            if (expected.instructionOverrides?.[item.id]) {
                const instruction = (read(root, 'shapes') || []).map(id => objects.get(id))
                    .find(shape => read(shape, 'name') === 'Instruction');
                assert.ok(instruction, 'Saved instruction exists');
                const text = node => read(node, 'text') || (read(node, 'children') || []).map(text).join('');
                assert.equal(text(read(instruction, 'content')), expected.instructionOverrides[item.id],
                    `${item.id}: saved product instruction override`);
            }
            for (const archive of item.archived) {
                assert.ok(object(archive.id), 'Original retained');
                assert.equal(read(object(archive.id), 'hidden'), true, 'Original archived, not deleted');
                archives++;
            }
        }
        for (const moved of expected.mobileDestinationShift) {
            assert.ok(Math.abs(geometry(object(moved.id), 'y') - moved.toY) < 0.05, 'Mobile dialog clearance saved');
        }
        if (expected.practiceLayout) {
            const layout = expected.practiceLayout;
            for (const field of ['x', 'y', 'width', 'height']) {
                assert.ok(Math.abs(geometry(object(layout.boardId), field) - layout.after[field]) < 0.05,
                    `Practice board saved ${field}`);
            }
            for (const child of layout.finalChildren) {
                const saved = object(child.id);
                assert.ok(saved, 'Retained Practice child exists');
                for (const field of ['x', 'y', 'width', 'height']) {
                    assert.ok(Math.abs(geometry(saved, field) - child[field]) < 0.05, `Practice child ${field}`);
                }
                assert.equal(Boolean(read(saved, 'hidden')), child.hidden, 'Practice archive state saved');
            }
            assert.equal(read(object(layout.replayId), 'hidden'), true, 'Unused Practice Replay archived');
            assert.equal(Boolean(read(object(layout.resetId), 'hidden')), false, 'Practice clear action retained');
        }
        for (const fit of expected.descriptionFit || []) {
            assert.ok(Math.abs(geometry(object(fit.id), 'height') - fit.toHeight) < 0.05,
                'Multiline description intrinsic height saved');
        }
        for (const copy of expected.quietCopies || []) {
            assert.equal(read(object(copy.oldId), 'hidden'), true, 'Original utility action archived');
            assert.ok(copy.fingerprintMatches, 'Accepted source comparison passed in editor');
            for (const child of copy.descendants) {
                const saved = object(child.id);
                assert.ok(saved, 'Quiet descendant saved');
                for (const field of ['x', 'y', 'width', 'height']) {
                    assert.ok(Math.abs(geometry(saved, field) - child[field]) < 0.05, `Quiet child ${field}`);
                }
                assert.equal(Boolean(read(saved, 'hidden')), child.hidden, 'Quiet visibility saved');
                if (child.componentId) {
                    assert.equal(String(read(saved, 'component-id')), child.componentId, 'Quiet primitive provider saved');
                    assert.equal(String(read(saved, 'component-file')), '40e06342-8830-80d6-8008-96572effc11c');
                }
            }
        }
        if (expected.temporaryTransfer) {
            const transfer = expected.temporaryTransfer;
            assert.deepEqual(transfer.fingerprintDifferences, [], 'Source-preserving editor comparison');
            const main = object(transfer.mainId);
            assert.ok(main, 'Temporary main saved');
            assert.equal(String(read(main, 'component-id')), transfer.componentId, 'Temporary provider saved');
            assert.equal(String(read(main, 'component-file')), expected.fileId, 'Owned local provider only');
            for (const child of transfer.descendants) {
                const saved = object(child.id);
                assert.ok(saved, 'Transfer descendant retained');
                for (const field of ['x', 'y', 'width', 'height']) {
                    assert.ok(Math.abs(geometry(saved, field) - child[field]) < 0.05, `Transfer child ${field}`);
                }
                assert.equal(Boolean(read(saved, 'hidden')), child.hidden, 'Transfer visibility saved');
                if (child.componentId) {
                    assert.equal(String(read(saved, 'component-id')), child.componentId, 'Transfer primitive link saved');
                }
            }
        }
        if (expected.temporaryCleanup && expected.cleanupIds) {
            assert.ok(!object(expected.cleanupIds.mainId), 'Exact temporary main removed from saved page');
            assert.ok(!object(expected.cleanupIds.hostId), 'Exact empty transfer host removed from saved page');
            assert.ok(object(expected.cleanupIds.acceptedSourceId), 'Accepted source retained');
            const temporary = read(data, 'components')?.get(transit.uuid(expected.cleanupIds.componentId));
            assert.ok(!temporary || read(temporary, 'deleted') === true, 'No active temporary provider remains');
        }
        for (const rule of expected.ruleUpdates || []) {
            const shape = object(rule.id);
            assert.ok(shape, 'Exact Guide rule saved');
            for (const field of ['x', 'y', 'width', 'height']) {
                assert.ok(Math.abs(geometry(shape, field) - rule.after[field]) < 0.05, `Guide rule ${field}`);
            }
            const text = node => read(node, 'text') || (read(node, 'children') || []).map(text).join('');
            assert.equal(text(read(shape, 'content')), rule.after.text, 'Exact Guide rule copy saved');
        }
        console.log(JSON.stringify({passed: true, roots: expected.components.length, descendants, archives,
            relocatedDestinationShapes: expected.mobileDestinationShift.length, editorWrites: 0, moodleWrites: 0,
            practiceChildren: expected.practiceLayout?.finalChildren.length || 0,
            descriptionFits: expected.descriptionFit?.length || 0,
            quietCopies: expected.quietCopies?.length || 0,
            savedDocumentaryRules: expected.ruleUpdates?.length || 0,
            temporaryTransferDescendants: expected.temporaryTransfer?.descendants.length || 0,
            helperDisconnected: true, scope: 'Exact saved links/geometry/archive retention only; no native or human acceptance.'}));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
