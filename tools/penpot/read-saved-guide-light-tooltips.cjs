// Read-only proof of the two exact linked Light-family usages, not all Guide.
const assert = require('node:assert/strict'), path = require('node:path');
assert.equal(process.argv.length, 5);
assert.match(process.argv[4], /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const transit = require(path.resolve(process.argv[3], 'transit-js'));
const get = (value, key) => (value.rep || value).get(transit.keyword(key));
const file = 'b564c72c-f31f-81ec-8008-ad9958b272bd';
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[4], {timeout:10000});
    try {
        const page = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes(file));
        assert.ok(page);
        const response = await page.context().request.get(new URL('/api/rpc/command/get-file?id=' + file, page.url()).href, {timeout:45000});
        assert.equal(response.status(), 200);
        const saved = transit.reader('json').read(await response.text());
        const objects = get(get(get(saved, 'data'), 'pages-index').get(transit.uuid('b564c72c-f31f-81ec-8008-ad9958b272be')), 'objects');
        const cases = [
            ['bc7c574d-fc32-80da-8008-c507250d72a8', '8a2f9f7d-feb6-80ca-8008-9b9a134ce7d0',162,38,'11.84','700','Read a participant card'],
            ['bc7c574d-fc32-80da-8008-c507254ccf53', '8a2f9f7d-feb6-80ca-8008-9b9a1386e287',304,68,'12.16','600','Understand participant cards,groups and groupings']
        ].map(([id, provider, width, height, size, weight, copy]) => {
            const node = objects.get(transit.uuid(id)); assert.ok(node);
            assert.equal(String(get(node,'component-id')),provider);
            assert.equal(String(get(node,'component-file')),'40e06342-8830-80d6-8008-96572effc11c');
            const rect = get(node,'selrect'); assert.equal(get(rect,'width'),width); assert.equal(get(rect,'height'),height);
            const children = get(node,'shapes').map(id => objects.get(id));
            const text = children.find(n => String(get(n,'type')) === ':text');
            const runs = []; const visit = n => {if(get(n,'text')!==undefined)runs.push(n);(get(n,'children')||[]).forEach(visit);};
            visit(get(text,'content')); assert.equal(runs.map(n=>get(n,'text')).join(''),copy);
            runs.forEach(n => {assert.equal(String(get(n,'font-size')),size);assert.equal(String(get(n,'font-weight')),weight);});
            const surface = children.find(n => get(n,'name') === 'Surface');
            assert.equal(get(get(surface,'strokes')[0],'stroke-color'),'#cfe0ec');
            assert.ok(get(surface,'fills').some(fill=>get(fill,'fill-color')==='#f8fbfd'));
            return {id,provider,width,height,saved:true};
        });
        console.log(JSON.stringify({cases,nativeMoodleProof:false,humanAccepted:false}));
    } finally {browser._connection.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
