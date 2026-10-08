// Local-supervised, read-only saved-file gate for the exact G9 product links.
// No editor/Moodle writes, authentication export or browser/profile teardown.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.ok(process.argv[2] && process.argv[3] && process.argv[4],
    'Usage: node read-saved-guide-relinks.cjs <playwright-modules> <transit-modules> <local-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const expected = require('../../docs/testing/guide-g9-product-relinks-2026-10-08.json');
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
            for (const archive of item.archived) {
                assert.ok(object(archive.id), 'Original retained');
                assert.equal(read(object(archive.id), 'hidden'), true, 'Original archived, not deleted');
                archives++;
            }
        }
        for (const moved of expected.mobileDestinationShift) {
            assert.ok(Math.abs(geometry(object(moved.id), 'y') - moved.toY) < 0.05, 'Mobile dialog clearance saved');
        }
        console.log(JSON.stringify({passed: true, roots: expected.components.length, descendants, archives,
            relocatedDestinationShapes: expected.mobileDestinationShift.length, editorWrites: 0, moodleWrites: 0,
            helperDisconnected: true, scope: 'Exact saved links/geometry/archive retention only; no native or human acceptance.'}));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
