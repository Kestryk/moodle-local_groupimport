// Local-supervised, read-only Foundation persistence gate. No editor, Moodle,
// auth-state export or screenshot writes. Disconnect only this CDP helper.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.ok(process.argv[2] && process.argv[3] && process.argv[4],
    'Usage: node read-saved-guide-discovery.cjs <playwright-modules> <transit-modules> <local-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const recordName = process.argv[5] || 'guide-g9-foundations-publication-2026-10-08.json';
assert.ok(['guide-g9-foundations-publication-2026-10-08.json',
    'guide-common-introduction-foundations-2026-10-09.json',
    'guide-g10-c-foundations-2026-10-08.json',
    'guide-g10-e-foundations-2026-10-08.json',
    'guide-g10-g-welcome-foundations-2026-10-08.json',
    'guide-g10-h-foundations-2026-10-08.json',
    'guide-g9-quiet-foundation-publication-2026-10-08.json'].includes(recordName), 'Exact owned publication record');
const evidence = require(path.resolve(__dirname, '../../docs/testing', recordName));
const read = (value, field) => (value.rep || value).get(transit.keyword(field));
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 0.05, label);
const geometry = (shape, field) => {
    let value = read(shape, field);
    // Saved Path geometry lives in Penpot's tagged selection rectangle;
    // the plugin getter exposes it as x/y/width/height. Null is never zero.
    if (!Number.isFinite(value) && String(read(shape, 'type')) === ':path' && read(shape, 'selrect')) {
        value = read(read(shape, 'selrect'), field);
    }
    assert.ok(Number.isFinite(value), `${String(read(shape, 'id'))}: numeric ${field} required`);
    return value;
};

(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    let roots = 0, descendants = 0;
    try {
        const pages = browser.contexts().flatMap(context => context.pages()).filter(page => {
            const url = new URL(page.url());
            const ownedFile = process.argv[6] === 'guide-context-request' &&
                ['guide-g10-e-foundations-2026-10-08.json',
                    'guide-common-introduction-foundations-2026-10-09.json',
                    'guide-g10-h-foundations-2026-10-08.json'].includes(recordName) ?
                'b564c72c-f31f-81ec-8008-ad9958b272bd' : evidence.fileId;
            return url.origin === 'https://design.penpot.app' && url.hash.includes(ownedFile);
        });
        assert.equal(pages.length, 1, 'Exactly one owned Foundations tab');
        const response = ['context-request','guide-context-request'].includes(process.argv[6]) ? await (async() => {
            // Supervised read-only fallback when the renderer is suspended.
            // Reuse the owned browser context; never export cookies/auth state.
            const result = await pages[0].context().request.get(
                `https://design.penpot.app/api/rpc/command/get-file?id=${evidence.fileId}`, {timeout: 45000});
            return {status: result.status(), body: await result.text()};
        })() : await pages[0].evaluate(async id => {
            const result = await fetch(`/api/rpc/command/get-file?id=${id}`, {signal: AbortSignal.timeout(45000)});
            return {status: result.status, body: await result.text()};
        }, evidence.fileId);
        assert.equal(response.status, 200, 'Saved-file readback');
        const data = read(transit.reader('json').read(response.body), 'data');
        const index = read(data, 'pages-index');
        for (const [pageId, key] of [[evidence.standardPageId, 'standardId'], [evidence.libraryPageId, 'mainId']]) {
            const objects = read(index.get(transit.uuid(pageId)), 'objects');
            for (const expected of evidence.components) {
                const root = objects.get(transit.uuid(expected[key]));
                assert.ok(root, `${expected[key]}: saved root exists`);
                assert.equal(String(read(root, 'component-id')), expected.componentId, 'Canonical provider persisted');
                close(read(root, 'width'), expected.width, 'Saved width');
                close(read(root, 'height'), expected.height, 'Saved height');
                const walk = (shape, ancestorHidden) => {
                    const hidden = ancestorHidden || read(shape, 'hidden');
                    if (!hidden) {
                        for (const axis of ['x', 'y']) {
                            const dimension = axis === 'x' ? 'width' : 'height';
                            const relative = geometry(shape, axis) - geometry(root, axis);
                            assert.ok(relative >= -0.05 && relative + geometry(shape, dimension) <= geometry(root, dimension) + 0.05,
                                `${String(read(shape, 'id'))}: saved ${axis} relative=${relative}, size=${geometry(shape, dimension)}, root=${geometry(root, dimension)}`);
                        }
                        descendants++;
                    }
                    for (const id of read(shape, 'shapes') || []) {
                        const child = objects.get(id);
                        assert.ok(child, 'Saved child reference resolves');
                        walk(child, hidden);
                    }
                };
                walk(root, false);
                roots++;
            }
        }
        console.log(JSON.stringify({passed: true, fileId: evidence.fileId, roots, descendants,
            scope: 'Saved IDs, canonical links, sizes and descendant containment only; editor fingerprints, raster and human acceptance are separate.',
            editorWrites: 0, moodleWrites: 0, helperDisconnected: true}));
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
