// Read-only local-supervised Penpot persistence check. No screenshots, editor
// writes, version creation, Moodle access or persisted authentication state.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.ok(process.argv[2] && process.argv[3] && process.argv[4],
    'Usage: node audit-saved-mass-report-lanes.cjs <playwright-modules> <transit-modules> <local-cdp-url>');
assert.match(process.argv[4], /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const fileId = '220f6449-533e-815b-8008-ad9958d032a1';
const pageId = '220f6449-533e-815b-8008-ad9958d032a2';
const suffixes = [
    ['b2b5b5c6be2d', 'b2b5b5e2d6fe', 'b2b5b6005ce3', 'b2b5b620e4bb'],
    ['b31141f747f2', 'b31141f747f3', 'b31141f747f4', 'b31141f747f5'],
    ['b3117fddb7f1', 'b3117fddb7f2', 'b3117fddb7f3', 'b3117fddb7f4'],
];
const providers = ['ac7b918b1f89', 'ac7b926467c9', 'ac785f7e5e78', 'ac7865903b58']
    .map(id => `5866ed4a-7d30-8093-8008-${id}`);
const widths = [[328, 328, 676, 676], [416, 416, 864, 864], [326, 326, 326, 326]];
const read = (value, field) => (value.rep || value).get(transit.keyword(field));

(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4]);
    let checks = 0;
    try {
        const pages = browser.contexts().flatMap(context => context.pages()).filter(page => {
            const url = new URL(page.url());
            return url.origin === 'https://design.penpot.app' && url.hash.includes(`file-id=${fileId}`);
        });
        assert.equal(pages.length, 1, 'Exactly one owned EasyStud page must be open');
        const response = await pages[0].evaluate(async id => {
            const result = await fetch(`/api/rpc/command/get-file?id=${id}`, {
                signal: AbortSignal.timeout(12000),
            });
            return {status: result.status, body: await result.text()};
        }, fileId);
        assert.equal(response.status, 200, 'Saved-file readback');
        const file = transit.reader('json').read(response.body);
        const data = read(file, 'data');
        const page = read(data, 'pages-index').get(transit.uuid(pageId));
        const objects = read(page, 'objects');
        const object = id => objects.get(transit.uuid(id));
        for (const [density, rows] of suffixes.entries()) {
            for (const [role, suffix] of rows.entries()) {
                const id = `01e728c3-f1ef-80b3-8008-${suffix}`, shape = object(id);
                const summary = role < 2;
                assert.equal(String(read(shape, 'component-id')), providers[role], `${id}: provider`);
                assert.equal(read(shape, 'width'), widths[density][role], `${id}: root width`);
                assert.equal(read(shape, 'height'), summary ? 116 : density === 2 ? 104 : 72, `${id}: root height`);
                checks += 3;
                const children = read(shape, 'shapes').map(childId => objects.get(childId));
                const texts = children.filter(child => String(read(child, 'type')) === ':text' && !read(child, 'hidden'));
                assert.equal(texts.length, 2, `${id}: original visible text rows`);
                checks++;
                for (const child of texts) {
                    const x = read(child, 'x') - read(shape, 'x');
                    assert.ok(x >= 0 && x + read(child, 'width') <= read(shape, 'width') + 0.001,
                        `${id}: saved text lane containment`);
                    checks++;
                }
                assert.equal(children.filter(child => !read(child, 'hidden') &&
                    String(read(child, 'component-id')) === '32eadb6d-165e-803e-8008-988f81ba407e').length,
                0, `${id}: report has no notification Close`);
                checks++;
            }
        }
        console.log(`PASS ${checks} saved-file checks, 12 Desktop/Tablet/Mobile report instances; providers and root dimensions retained. No writes or native Moodle proof.`);
    } finally {
        // Disconnect this helper only; keep the user's dedicated browser alive.
        await browser.close();
    }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
