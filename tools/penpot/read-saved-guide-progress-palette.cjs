// Read-only saved Foundations proof through the exact owned editor context.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length, 5, 'Usage: <playwright-modules> <transit-modules> <owned-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const get = (value, key) => (value.rep || value).get(transit.keyword(key));
const fileId = '40e06342-8830-80d6-8008-96572effc11c';
const cases = [
    ['4ee6f77a-1dfb-809b-8008-c1eac9c6142e', 'eae888bb-62c5-8040-8008-c4e4ad5fef02', 640, 'eae888bb-62c5-8040-8008-c4e4add20eb6'],
    ['4ee6f77a-1dfb-809b-8008-c1eac9c6142e', 'eae888bb-62c5-8040-8008-c4e4addf1588', 342, 'eae888bb-62c5-8040-8008-c4e4ae238bfc'],
    ['4ee6f77a-1dfb-809b-8008-c1eac9c2959e', 'eae888bb-62c5-8040-8008-c4e4bdb1c10d', 640, 'eae888bb-62c5-8040-8008-c4e4add20eb6'],
    ['4ee6f77a-1dfb-809b-8008-c1eac9c2959e', 'eae888bb-62c5-8040-8008-c4e4bdcc9c78', 342, 'eae888bb-62c5-8040-8008-c4e4ae238bfc']
];
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    try {
        const page = browser.contexts().flatMap(context => context.pages()).find(item => item.url().includes(fileId));
        assert.ok(page, 'Exact owned Foundations editor');
        const response = await page.context().request.get(new URL('/api/rpc/command/get-file?id=' + fileId, page.url()).href,
            {timeout: 45000});
        assert.equal(response.status(), 200);
        const saved = transit.reader('json').read(await response.text());
        const results = cases.map(([pageId, rootId, width, component]) => {
            const objects = get(get(get(saved, 'data'), 'pages-index').get(transit.uuid(pageId)), 'objects');
            const root = objects.get(transit.uuid(rootId));
            assert.ok(root, 'Saved source or linked Standard ' + rootId);
            const rect = get(root, 'selrect');
            assert.equal(get(rect, 'width'), width);
            assert.equal(get(rect, 'height'), 4);
            assert.equal(String(get(root, 'component-id')), component);
            assert.equal(get(get(root, 'fills')[0], 'fill-color').toLowerCase(), '#eef8f2');
            const border = get(root, 'strokes')[0];
            assert.equal(get(border, 'stroke-color').toLowerCase(), '#cde3db');
            assert.equal(get(border, 'stroke-width'), 1);
            const children = get(root, 'shapes');
            assert.equal(children.length, 1);
            const indicator = objects.get(children[0]);
            const indicatorRect = get(indicator, 'selrect');
            assert.ok(Math.abs(get(indicatorRect, 'width') - width * .6) < .01);
            assert.equal(get(indicatorRect, 'height'), 4);
            assert.equal(get(get(indicator, 'fills')[0], 'fill-color').toLowerCase(), '#1b7f5a');
            return {page: pageId, root: rootId, width, height: 4, component, savedPaint: true};
        });
        console.log(JSON.stringify({savedFoundations: results, productPublication: false,
            nativeMoodleProof: false, humanAccepted: false}, null, 2));
    } finally { browser._connection.close(); }
})().then(() => process.exit(0)).catch(error => {console.error(error.message);process.exit(1);});
