// Bounded saved-file audit. Cookie auth stays in the owned Penpot browser;
// Transit content is process-local, not written to disk or printed.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(path.resolve(process.argv[2],'playwright'));
const transit=require(path.resolve(process.argv[3],'transit-js'));
assert.match(process.argv[4],/^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
const foundation='40e06342-8830-80d6-8008-96572effc11c';
const product='220f6449-533e-815b-8008-ad9958d032a1';
const sourcePage='01c94d93-948c-803b-8008-9cf0d7cbfa22',standardPage='01c94d93-948c-803b-8008-9cf0d7c5a978';
const prefix='b8f49f05-1e1d-8037-8008-';
const pairs=[
    ['bf94e3f954b4','bf94de8c6ba1','bf95cdc19135',328,44.816],
    ['bf94e41337c4','bf94e07e9910','bf95cddfc734',676,40.848],
    ['bf94e430c8e6','bf94e2945198','bf95cdfcbd78',249.48,37.6],
    ['bf94e9788411','bf94e4b09909','bf95ce56c4ad',328,44.816],
    ['bf94e986d6b1','bf94e5bc2b7a','bf95ce6f3f1c',676,40.848],
    ['bf94e9a7c3f7','bf94e7dfb04c','bf95ce8775b4',249.48,37.6],
];
const productCopies=['bf97181d17a0','bf97185f05a6','bf971896e4c2','bf9718cd0348','bf971906e227','bf9719401c7d'];
const read=(value,key)=>(value.rep||value).get(transit.keyword(key));
(async()=>{
    const browser=await chromium.connectOverCDP(process.argv[4]);let checks=0;
    try{
        const pages=browser.contexts().flatMap(c=>c.pages()).filter(p=>new URL(p.url()).origin==='https://design.penpot.app');
        assert.equal(pages.length,1,'Exactly one owned design tab');
        const response=await pages[0].evaluate(async id=>{
            const r=await fetch(`/api/rpc/command/get-file?id=${id}`,{signal:AbortSignal.timeout(12000)});
            return {status:r.status,body:await r.text()};
        },foundation);
        assert.equal(response.status,200);checks++;
        const file=transit.reader('json').read(response.body),data=read(file,'data');
        const objects=id=>read(read(data,'pages-index').get(transit.uuid(id)),'objects');
        const source=objects(sourcePage),standard=objects(standardPage);
        for(const [provider,main,copy,w,h]of pairs){
            const a=source.get(transit.uuid(prefix+main)),b=standard.get(transit.uuid(prefix+copy));
            assert.ok(a&&b,'Recorded source and Standard saved');checks++;
            assert.equal(String(read(b,'component-id')),prefix+provider);checks++;
            for(const n of [a,b])for(const [key,value]of [['width',w],['height',h]]){
                assert.ok(Math.abs(read(n,key)-value)<1e-6,`${key}: exact recipe dimensions`);checks++;
            }
        }
        const productResponse=await pages[0].evaluate(async id=>{
            const r=await fetch(`/api/rpc/command/get-file?id=${id}`,{signal:AbortSignal.timeout(12000)});
            return {status:r.status,body:await r.text()};
        },product);
        assert.equal(productResponse.status,200);checks++;
        const productData=read(transit.reader('json').read(productResponse.body),'data');
        const productObjects=read(read(productData,'pages-index').get(transit.uuid('220f6449-533e-815b-8008-ad9958d032a2')),'objects');
        for(const [index,copy]of productCopies.entries()){
            const n=productObjects.get(transit.uuid(prefix+copy)),[provider,,,w,h]=pairs[index];
            assert.ok(n,'Recorded Product copy saved');checks++;
            assert.equal(String(read(n,'component-id')),prefix+provider);checks++;
            assert.equal(String(read(n,'component-file')),foundation);checks++;
            for(const [key,value]of [['width',w],['height',h]]){
                assert.ok(Math.abs(read(n,key)-value)<1e-6,`Product ${key}: exact recipe dimensions`);checks++;
            }
        }
        console.log(`PASS ${checks} authenticated saved-file assertions: six native-role providers, paired Standard and linked Product dimensions persisted. No editor/Guide/Moodle writes.`);
    }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
