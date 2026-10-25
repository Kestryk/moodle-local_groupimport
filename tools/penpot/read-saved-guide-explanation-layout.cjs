// Supervised owned-editor readback only; no auth export, design or Moodle writes.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length, 5, 'Usage: <playwright-modules> <transit-modules> <owned-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const get = (v, k) => (v.rep || v).get(transit.keyword(k));
const files = [
    {id: '40e06342-8830-80d6-8008-96572effc11c', pages: [
        {id: '4ee6f77a-1dfb-809b-8008-c1eac9c6142e', roots: [
            'c53a1fb5-311f-80be-8008-c2c99195de69', 'c53a1fb5-311f-80be-8008-c2c993aea248',
            '1b9939cf-2f95-805b-8008-c38268dcea49', '1b9939cf-2f95-805b-8008-c3829149de6c']},
        {id: '4ee6f77a-1dfb-809b-8008-c1eac9c2959e', roots: [
            'c53a1fb5-311f-80be-8008-c2caa0e772ce', 'c53a1fb5-311f-80be-8008-c2caa1135062',
            '1b9939cf-2f95-805b-8008-c382a69317e9', '1b9939cf-2f95-805b-8008-c382a73ee969']} ]},
    {id: 'b564c72c-f31f-81ec-8008-ad9958b272bd', pages: [
        {id: 'b564c72c-f31f-81ec-8008-ad9958b272be', roots: [
            'c53a1fb5-311f-80be-8008-c2caece4dab5', 'c53a1fb5-311f-80be-8008-c2caed38db21',
            'c53a1fb5-311f-80be-8008-c30019a78292', 'c53a1fb5-311f-80be-8008-c3001a448158',
            'c53a1fb5-311f-80be-8008-c3001abc293c', 'c53a1fb5-311f-80be-8008-c3001b76a7d6',
            'c53a1fb5-311f-80be-8008-c3001c115c3d', 'c53a1fb5-311f-80be-8008-c3001cbd20b3']} ]}
];
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    try {
        const page = browser.contexts().flatMap(context => context.pages()).find(item => item.url().includes(files[1].id));
        assert.ok(page, 'Exact owned Guide editor required');
        const results = [];
        for (const file of files) {
            const response = await page.context().request.get(new URL('/api/rpc/command/get-file?id=' + file.id, page.url()).href,
                {timeout: 45000});
            assert.equal(response.status(), 200);
            const saved = transit.reader('json').read(await response.text());
            for (const record of file.pages) {
                const objects = get(get(get(saved, 'data'), 'pages-index').get(transit.uuid(record.id)), 'objects');
                const shape = id => {const value = objects.get(transit.uuid(id)); assert.ok(value, 'Saved shape ' + id); return value;};
                const rect = value => {
                    const r = get(value, 'selrect');
                    return Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, get(r, key)]));
                };
                for (const id of record.roots) {
                    const root = shape(id), box = rect(root);
                    assert.ok(Object.values(box).every(Number.isFinite), 'Decoded saved geometry');
                    const topics = get(root, 'shapes').map(child => shape(String(child)))
                        .filter(child => /^Topic \d+ \/ title$/.test(get(child, 'name')));
                    assert.ok(topics.length >= 3);
                    for (const title of topics) assert.ok(Math.abs(rect(title).x - box.x - 40) < 0.01, 'One reading lane ' + id);
                    assert.ok(box.height > 500, 'Expanded recipe saved ' + id);
                    if (file.id === files[1].id) assert.equal(String(get(root, 'component-file')), files[0].id, 'Linked Foundation source');
                    results.push({file: file.id, page: record.id, id, box, topics: topics.length});
                }
            }
        }
        console.log(JSON.stringify({savedGeometry: true, roots: results, rasterProof: false, nativeMoodleProof: false}, null, 2));
    } finally { browser._connection.close(); }
})().then(() => process.exit(0)).catch(error => {console.error(error.message); process.exit(1);});
