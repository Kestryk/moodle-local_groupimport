// Exact saved product links, geometry and recoverable predecessors; read-only.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
assert.equal(process.argv.length, 5, 'Usage: <playwright-modules> <transit-modules> <owned-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const get = (value, key) => (value.rep || value).get(transit.keyword(key));
const record = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../docs/testing/guide-progress-product-2026-10-10.json'), 'utf8'));
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    try {
        const page = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes(record.file));
        assert.ok(page, 'Owned Guide editor');
        const response = await page.context().request.get(new URL('/api/rpc/command/get-file?id=' + record.file, page.url()).href,
            {timeout: 45000});
        assert.equal(response.status(), 200);
        const saved = transit.reader('json').read(await response.text());
        const objects = get(get(get(saved, 'data'), 'pages-index').get(transit.uuid(record.page)), 'objects');
        const shape = id => {const s = objects.get(transit.uuid(id));assert.ok(s, 'Saved ' + id);return s;};
        for (const item of record.replacements) {
            const root = shape(item.linked), indicator = shape(item.indicator);
            assert.equal(String(get(root, 'component-file')), '40e06342-8830-80d6-8008-96572effc11c');
            assert.equal(String(get(root, 'component-id')), item.component);
            assert.equal(String(get(root, 'parent-id')), item.before.parent);
            const rect = get(root, 'selrect');
            for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(get(rect, key) - item.before[key]) < .01);
            assert.equal(get(get(root, 'fills')[0], 'fill-color').toLowerCase(), '#eef8f2');
            assert.equal(get(get(root, 'strokes')[0], 'stroke-color').toLowerCase(), '#cde3db');
            assert.equal(get(get(indicator, 'fills')[0], 'fill-color').toLowerCase(), '#1b7f5a');
            assert.ok(Math.abs(get(get(indicator, 'selrect'), 'width') - item.before.valueWidth) < .01);
            assert.equal(get(shape(item.before.id), 'hidden'), true);
            assert.equal(get(shape(item.before.value), 'hidden'), true);
        }
        console.log('PASS seven saved Foundation-linked product tracks: exact positions, fractions, paint and hidden predecessors.');
    } finally {browser._connection.close();}
})().then(() => process.exit(0)).catch(error => {console.error(error.message);process.exit(1);});
