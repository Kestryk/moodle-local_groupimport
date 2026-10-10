// Exact eight Foundation source/Standard titles; no product/full-page claim.
const assert=require('node:assert/strict'),path=require('node:path');
assert.ok(process.argv.length===5||process.argv[5]==='product');
assert.match(process.argv[4],/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium}=require(path.resolve(process.argv[2],'playwright'));
const transit=require(path.resolve(process.argv[3],'transit-js'));
const get=(v,k)=>(v.rep||v).get(transit.keyword(k));
const product=process.argv[5]==='product';
const file=product?'b564c72c-f31f-81ec-8008-ad9958b272bd':'40e06342-8830-80d6-8008-96572effc11c';
const cases=product? [['b564c72c-f31f-81ec-8008-ad9958b272be',[
 'c53a1fb5-311f-80be-8008-c2caecbd4146','c53a1fb5-311f-80be-8008-c2caed14af41',
 'c53a1fb5-311f-80be-8008-c300197dc0e5','c53a1fb5-311f-80be-8008-c3001a1d0a8d',
 'c53a1fb5-311f-80be-8008-c3001a9f2c81','c53a1fb5-311f-80be-8008-c3001b41ca81',
 'c53a1fb5-311f-80be-8008-c3001bec87d3','c53a1fb5-311f-80be-8008-c3001c93fbe9']]]:[
 ['4ee6f77a-1dfb-809b-8008-c1eac9c6142e',['c53a1fb5-311f-80be-8008-c2c99195de69','c53a1fb5-311f-80be-8008-c2c993aea248','1b9939cf-2f95-805b-8008-c38268dcea49','1b9939cf-2f95-805b-8008-c3829149de6c']],
 ['4ee6f77a-1dfb-809b-8008-c1eac9c2959e',['c53a1fb5-311f-80be-8008-c2caa0e772ce','c53a1fb5-311f-80be-8008-c2caa1135062','1b9939cf-2f95-805b-8008-c382a69317e9','1b9939cf-2f95-805b-8008-c382a73ee969']]
];
(async()=>{const browser=await chromium.connectOverCDP(process.argv[4],{timeout:10000});try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes(file));assert.ok(page);
 const response=await page.context().request.get(new URL('/api/rpc/command/get-file?id='+file,page.url()).href,{timeout:45000});assert.equal(response.status(),200);
 const saved=transit.reader('json').read(await response.text()),out=[];
 for(const [pageId,ids]of cases){const objects=get(get(get(saved,'data'),'pages-index').get(transit.uuid(pageId)),'objects');for(const id of ids){
  const root=objects.get(transit.uuid(id));assert.ok(root);
  const children=[];const collect=n=>{for(const id of get(n,'shapes')||[]){const child=objects.get(id);children.push(child);collect(child);}};collect(root);
  const title=children.find(n=>get(n,'name')==='Intro / title');assert.ok(title);
  const runs=[],nodes=[];const visit=n=>{nodes.push(n);if(get(n,'text')!==undefined)runs.push(n);(get(n,'children')||[]).forEach(visit);};visit(get(title,'content'));
  const copy=runs.map(n=>get(n,'text')).join('');
  if(product){assert.ok(['Comment utiliser ce guide','Lire une carte participant','Lire une carte groupe','Lire une carte groupement'].includes(copy));
   const provider=children.find(n=>String(get(n,'component-file'))==='40e06342-8830-80d6-8008-96572effc11c'&&
    ['c53a1fb5-311f-80be-8008-c2ca9350451f','c53a1fb5-311f-80be-8008-c2ca939e1281'].includes(String(get(n,'component-id'))));assert.ok(provider,'Retained Foundation introduction link');
  }else assert.equal(copy,'Comment utiliser ce guide');
  for(const n of runs){assert.equal(get(n,'font-family'),'Inter');assert.equal(String(get(n,'font-size')),'16');assert.equal(String(get(n,'font-weight')),'600');assert.equal(String(get(n,'line-height')),'1.2');}
  const fills=[get(title,'fills'),...nodes.map(n=>get(n,'fills'))].find(v=>v?.length);
  const direct=get(title,'fill-color')||nodes.map(n=>get(n,'fill-color')).find(Boolean);
  assert.equal(fills?.length ? get(fills[0],'fill-color') : direct,'#0b5ea8','Saved text colour');
  const r=get(title,'selrect');assert.ok(get(r,'width')>=309);assert.ok(get(r,'height')>=19.2);
  out.push({root:id,title:String(get(title,'id')),savedTypePaint:true});
 }}console.log(JSON.stringify({cases:out,productPropagation:product,rasterProof:false,nativeProof:false,humanAccepted:false}));
}finally{browser._connection.close();}})().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
