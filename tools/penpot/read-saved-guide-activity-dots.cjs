// Saved source/Standard dot geometry only, through the owned editor context.
const assert=require('node:assert/strict'),path=require('node:path');
assert.ok(process.argv.length===5||process.argv[5]==='product');assert.match(process.argv[4],/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium}=require(path.resolve(process.argv[2],'playwright'));
const transit=require(path.resolve(process.argv[3],'transit-js'));
const get=(v,k)=>(v.rep||v).get(transit.keyword(k));
const product=process.argv[5]==='product';
const file=product?'b564c72c-f31f-81ec-8008-ad9958b272bd':'40e06342-8830-80d6-8008-96572effc11c';
const cases=[
 ['4ee6f77a-1dfb-809b-8008-c1eac9c6142e',['4ee6f77a-1dfb-809b-8008-c1ed889a5627','4ee6f77a-1dfb-809b-8008-c1ed88b6c44a','e764db89-4cb1-80d0-8008-c25a8178bef6','e764db89-4cb1-80d0-8008-c25a819ee4bb']],
 ['4ee6f77a-1dfb-809b-8008-c1eac9c2959e',['4ee6f77a-1dfb-809b-8008-c1ef1f032598','4ee6f77a-1dfb-809b-8008-c1ef1f2c83e8','e764db89-4cb1-80d0-8008-c269cdb5b7e6','e764db89-4cb1-80d0-8008-c269cde4033c']]
];
(async()=>{const b=await chromium.connectOverCDP(process.argv[4],{timeout:10000});try{
 const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes(file));assert.ok(page);
 const response=await page.context().request.get(new URL('/api/rpc/command/get-file?id='+file,page.url()).href,{timeout:45000});assert.equal(response.status(),200);
 const saved=transit.reader('json').read(await response.text()),out=[];
 if(product){
  const objects=get(get(get(saved,'data'),'pages-index').get(transit.uuid('b564c72c-f31f-81ec-8008-ad9958b272be')),'objects');
  for(const ids of [['e764db89-4cb1-80d0-8008-c26ab25fcb74','e764db89-4cb1-80d0-8008-c26ab25fcb75','e764db89-4cb1-80d0-8008-c26ab2601aa4'],['e764db89-4cb1-80d0-8008-c26ab63f9089','e764db89-4cb1-80d0-8008-c26ab63f908a','e764db89-4cb1-80d0-8008-c26ab63fdc0b']]){
   const rects=ids.map(id=>{const n=objects.get(transit.uuid(id));assert.ok(n);return get(n,'selrect');});
   for(const r of rects){assert.equal(get(r,'width'),4);assert.equal(get(r,'height'),4);}
   for(let i=1;i<3;i++)assert.ok(Math.abs(get(rects[i],'x')-get(rects[i-1],'x')-7)<.001);
   out.push({ids,diameter:4,gap:3});
  }console.log(JSON.stringify({product:out,nativeProof:false,humanAccepted:false}));return;
 }
 for(const [pageId,ids]of cases){const objects=get(get(get(saved,'data'),'pages-index').get(transit.uuid(pageId)),'objects');for(const id of ids){
  const root=objects.get(transit.uuid(id));assert.ok(root);const dots=[];
  const walk=n=>{if(/^Activity dot/.test(get(n,'name')))dots.push(n);for(const id of get(n,'shapes')||[])walk(objects.get(id));};walk(root);
  assert.equal(dots.length,3);const rects=dots.map(n=>get(n,'selrect')).sort((a,b)=>get(a,'x')-get(b,'x'));
  for(const r of rects){assert.ok(Math.abs(get(r,'width')-4)<.001);assert.ok(Math.abs(get(r,'height')-4)<.001);}
  for(let i=1;i<3;i++)assert.ok(Math.abs(get(rects[i],'x')-get(rects[i-1],'x')-7)<.001);
  out.push({root:id,dots:3,diameter:4,gap:3});
 }}console.log(JSON.stringify({cases:out,sourceChanged:false,nativeProof:false,humanAccepted:false}));
}finally{b._connection.close();}})().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
