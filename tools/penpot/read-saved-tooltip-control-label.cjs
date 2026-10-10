// Read-only persisted source/Standard parity. Does not certify raster or behavior.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length, 5, 'Usage: <playwright-modules> <transit-modules> <owned-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const get = (value, key) => (value.rep || value).get(transit.keyword(key));
const fileId = '40e06342-8830-80d6-8008-96572effc11c';
const sourcePage = '8a2f9f7d-feb6-80ca-8008-9b9a11d71189';
const standardPage = '8bd32c67-a6b0-80dd-8008-9a0d4cd34aea';
const cases = [
    ['Short', 'bc7c574d-fc32-80da-8008-c4f05aa57ec2', 'bc7c574d-fc32-80da-8008-c4f05a8ad557',
        'bc7c574d-fc32-80da-8008-c4f155c30960', 40.4608, 'View participant details'],
    ['Wrapped', 'bc7c574d-fc32-80da-8008-c4f05abd2c85', 'bc7c574d-fc32-80da-8008-c4f05aa7d95e',
        'bc7c574d-fc32-80da-8008-c4f155d8205d', 57.2416, 'Search and choose the destination group']
];
const close = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < .001,
    'Finite geometry parity: ' + actual + ' vs ' + expected);
const plain = value => JSON.stringify(value);
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    try {
        const page = browser.contexts().flatMap(context => context.pages()).find(p => p.url().includes(fileId));
        assert.ok(page, 'Exact owned Foundations editor');
        const response = await page.context().request.get(new URL('/api/rpc/command/get-file?id=' + fileId, page.url()).href,
            {timeout: 45000});
        assert.equal(response.status(), 200);
        const saved = transit.reader('json').read(await response.text());
        const objects = pageId => get(get(get(saved, 'data'), 'pages-index').get(transit.uuid(pageId)), 'objects');
        const results = cases.map(([name, provider, mainId, copyId, height, label]) => {
            const roots = [[sourcePage, mainId], [standardPage, copyId]].map(([pageId, id]) => {
                const list = objects(pageId);
                const root = list.get(transit.uuid(id));
                assert.ok(root, 'Persisted tooltip ' + id);
                assert.equal(String(get(root, 'component-id')), provider);
                const rect = get(root, 'selrect');
                close(get(rect, 'width'), 240); close(get(rect, 'height'), height);
                const children = get(root, 'shapes').map(child => list.get(child));
                assert.equal(children.length, 3);
                const text = children.find(child => get(child, 'type').toString() === ':text');
                assert.ok(text, 'Text child');
                const content = get(text, 'content');
                const runs = [];
                const visit = node => { if (get(node, 'text') !== undefined) runs.push(node);
                    (get(node, 'children') || []).forEach(visit); };
                visit(content);
                assert.equal(runs.map(run => get(run, 'text')).join(' ').replace(/\s+/g, ' ').trim(), label);
                runs.forEach(run => { assert.equal(String(get(run, 'font-size')), '12.16');
                    assert.equal(String(get(run, 'font-weight')), '500');
                    assert.equal(String(get(run, 'line-height')), '1.38'); });
                const fingerprint = children.map(child => {
                    const childRect = get(child, 'selrect');
                    return {name:get(child, 'name'), x:get(childRect, 'x') - get(rect, 'x'),
                        y:get(childRect, 'y') - get(rect, 'y'), width:get(childRect, 'width'), height:get(childRect, 'height'),
                        fills:plain(get(child, 'fills')), strokes:plain(get(child, 'strokes')), content:plain(get(child, 'content'))};
                });
                return {id, fingerprint};
            });
            roots[0].fingerprint.forEach((child, i) => {
                const peer = roots[1].fingerprint[i];
                for (const key of ['x', 'y', 'width', 'height']) close(peer[key], child[key]);
                for (const key of ['name', 'fills', 'strokes', 'content']) assert.equal(peer[key], child[key]);
            });
            return {name, provider, main:mainId, standard:copyId, savedGeometryPaintTypeParity:true};
        });
        console.log(JSON.stringify({cases:results, rasterProof:false, guideBehavior:false, nativeProof:false, humanAccepted:false}, null, 2));
    } finally { browser._connection.close(); }
})().then(() => process.exit(0)).catch(error => {console.error(error.message);process.exit(1);});
