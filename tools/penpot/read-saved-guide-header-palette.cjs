// Read saved source-linked paint references only; not full Guide modal parity.
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const get = (value, key) => value ? (value.rep || value).get(transit.keyword(key)) : undefined;
assert.match(process.argv[4], /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
(async () => {
    const browser = await chromium.connectOverCDP(process.argv[4]);
    try {
        const file = 'b564c72c-f31f-81ec-8008-ad9958b272bd';
        const editor = browser.contexts().flatMap(context => context.pages()).find(page => page.url().includes(file));
        assert.ok(editor);
        const response = await editor.context().request.get(new URL('/api/rpc/command/get-file?id=' + file, editor.url()).href);
        assert.equal(response.status(), 200);
        const saved = transit.reader('json').read(await response.text());
        const page = get(get(saved, 'data'), 'pages-index').get(transit.uuid('b564c72c-f31f-81ec-8008-ad9958b272be'));
        const objects = get(page, 'objects');
        const rows = [];
        for (const [id, provider] of [
            ['7aaaed58-7fa9-80c8-8008-c5284ccec0a8', 'f02e60c2-e6ba-8015-8008-bf70d6dac52f'],
            ['7aaaed58-7fa9-80c8-8008-c5284da0ed66', 'f02e60c2-e6ba-8015-8008-bf70d79c6c6c']
        ]) {
            const root = objects.get(transit.uuid(id));
            assert.ok(root);
            assert.equal(get(root, 'component-id').toString(), provider);
            assert.equal(get(root, 'component-file').toString(), '40e06342-8830-80d6-8008-96572effc11c');
            const bounds = get(root, 'selrect');
            assert.equal(get(bounds, 'height'), 64);
            assert.equal(get(root, 'show-content'), false, 'Provider intentionally clips the preserved modal body');
            const header = Array.from(get(root, 'shapes')).map(child => objects.get(child)).find(shape => get(shape, 'name') === 'shared header');
            assert.ok(header);
            const fills = Array.from(get(header, 'fills'));
            const radial = get(fills[0], 'fill-color-gradient');
            const first = Array.from(get(radial, 'stops'))[0];
            assert.equal(get(first, 'color'), '#7b3f98');
            assert.equal(get(first, 'opacity'), .13);
            rows.push({id, provider, width: get(bounds, 'width'), height: 64, linkedPaint: true});
        }
        console.log(JSON.stringify({savedReferences: rows, nativeProof: false, fullGuideGeometryParity: false, humanAccepted: false}));
    } finally { browser._connection.close(); }
})().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
