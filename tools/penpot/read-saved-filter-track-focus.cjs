// Read-only recovery of the guarded SM-65 publication after a timeout.
// Auth/whole Transit payload stay process-local. Do not replay unknown writes.
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
assert.match(process.argv[4], /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const read = (value, key) => (value.rep || value).get(transit.keyword(key));
const file = '40e06342-8830-80d6-8008-96572effc11c';
const page = '3ade82ad-bce8-8059-8008-9c07259b5c06';
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout: 10000});
    try {
        const pages = browser.contexts().flatMap(context => context.pages())
            .filter(page => new URL(page.url()).origin === 'https://design.penpot.app');
        assert.equal(pages.length, 1, 'Exactly one owned design tab');
        const response = await pages[0].evaluate(async id => {
            const response = await fetch(`/api/rpc/command/get-file?id=${id}`, {signal: AbortSignal.timeout(45000)});
            return {status: response.status, body: await response.text()};
        }, file);
        assert.equal(response.status, 200);
        const data = read(transit.reader('json').read(response.body), 'data');
        const objects = read(read(data, 'pages-index').get(transit.uuid(page)), 'objects');
        const root = objects.get(transit.uuid('00000000-0000-0000-0000-000000000000'));
        assert.ok(root, 'Saved page root present');
        const node = id => objects.get(typeof id === 'string' ? transit.uuid(id) : id);
        const simplify = (shape, depth) => ({id: String(read(shape, 'id')), name: read(shape, 'name'),
            width: read(shape, 'width'), height: read(shape, 'height'),
            component: String(read(shape, 'component-id') || ''),
            strokeCount: (read(shape, 'strokes') || []).length,
            children: depth ? Array.from(read(shape, 'shapes') || []).map(id => simplify(node(id), depth - 1)) : undefined});
        const hosts = Array.from(read(root, 'shapes') || []).map(node)
            .filter(shape => read(shape, 'name') === 'Filter controls — Track-only keyboard focus');
        console.log(JSON.stringify({file, page, publicationHosts: hosts.map(shape => simplify(shape, 3)),
            preservedLegacyFocus: simplify(node('cf371b29-2e8e-8011-8008-bdb6194bf2ce'), 1),
            scope: 'Saved source objects only; no paired/native/human acceptance asserted.'}));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
