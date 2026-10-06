// Read-only recovery after a partial acknowledged design write. Never export
// auth/full Transit payload or infer complete paired parity from provider IDs.
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
assert.match(process.argv[4], /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const read = (value, key) => (value.rep || value).get(transit.keyword(key));
const prefix = 'b8f49f05-1e1d-8037-8008-';
const verifySuccessor = process.argv[5] === '--verify-successor';
const expected = [[328, 43.28, 13.6], [676, 42.64, 11.52], [262.4, 37.6, 8]];
const scopes = [
    ['40e06342-8830-80d6-8008-96572effc11c', [
        ['Library', '01c94d93-948c-803b-8008-9cf0d7cbfa22',
            ['bf94de8c6ba1', 'bf94e07e9910', 'bf94e2945198', 'bf94e4b09909', 'bf94e5bc2b7a', 'bf94e7dfb04c']],
        ['Standard', '01c94d93-948c-803b-8008-9cf0d7c5a978',
            ['bf95cdc19135', 'bf95cddfc734', 'bf95cdfcbd78', 'bf95ce56c4ad', 'bf95ce6f3f1c', 'bf95ce8775b4']]]],
    ['220f6449-533e-815b-8008-ad9958d032a1', [
        ['Product', '220f6449-533e-815b-8008-ad9958d032a2',
            ['bf97181d17a0', 'bf97185f05a6', 'bf971896e4c2', 'bf9718cd0348', 'bf971906e227', 'bf9719401c7d']]]],
];
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4]);
    try {
        const pages = browser.contexts().flatMap(context => context.pages())
            .filter(page => new URL(page.url()).origin === 'https://design.penpot.app');
        assert.equal(pages.length, 1, 'Exactly one owned design tab');
        for (const [fileId, groups] of scopes) {
            const response = await pages[0].evaluate(async id => {
                const response = await fetch(`/api/rpc/command/get-file?id=${id}`, {signal: AbortSignal.timeout(45000)});
                return {status: response.status, body: await response.text()};
            }, fileId);
            assert.equal(response.status, 200);
            const data = read(transit.reader('json').read(response.body), 'data');
            for (const [scope, pageId, ids] of groups) {
                const objects = read(read(data, 'pages-index').get(transit.uuid(pageId)), 'objects');
                for (const [index, id] of ids.entries()) {
                    const node = objects.get(transit.uuid(prefix + id));
                    assert.ok(node, 'Recorded root is saved');
                    const children = Array.from(read(node, 'shapes') || []).map(childId => objects.get(childId));
                    if (verifySuccessor) {
                        const [width, height, radius] = expected[index % 3];
                        for (const [key, value] of [['width', width], ['height', height],
                            ['r1', radius], ['r2', radius], ['r3', radius], ['r4', radius]]) {
                            assert.ok(Math.abs(read(node, key) - value) < 1e-6, `${scope}:${id} ${key}`);
                        }
                        for (const child of children) {
                            assert.ok(read(child, 'x') >= read(node, 'x') - .01 &&
                                read(child, 'y') >= read(node, 'y') - .01 &&
                                read(child, 'x') + read(child, 'width') <= read(node, 'x') + width + .01 &&
                                read(child, 'y') + read(child, 'height') <= read(node, 'y') + height + .01,
                            'Actual saved child bounds stay contained');
                        }
                        if (index % 3 === 2) {
                            const [icon, label] = children;
                            assert.ok(Math.abs(read(icon, 'width') - 15) < 1e-6);
                            assert.ok(Math.abs(read(icon, 'height') - 15) < 1e-6);
                            assert.ok(Math.abs(read(label, 'x') - read(icon, 'x') - 15 - 10.4) < 1e-6);
                        }
                    }
                    const values = node => Object.fromEntries(['name', 'x', 'y', 'width', 'height', 'r1', 'r2', 'r3', 'r4']
                        .map(key => [key, read(node, key)]));
                    console.log(JSON.stringify({scope, id: prefix + id, ...values(node),
                        children: children.map(child => ({id: String(read(child, 'id')), ...values(child),
                            descendants: Array.from(read(child, 'shapes') || []).map(grandchildId =>
                                values(objects.get(grandchildId)))}))}));
                }
            }
        }
        console.log(verifySuccessor ?
            'PASS saved successor:18 bounded root dimensions/radii, child containment and six15px action slots/10.4px gaps. Full recursive paint/raster/human parity NOT asserted.' :
            'Saved readback complete:18 bounded roots; paired successor parity NOT asserted. No editor/Guide/Moodle writes.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
