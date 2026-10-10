// Authenticated read-only saved design proof, using the owned editor context.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(path.resolve(process.argv[2],'playwright'));
const transit=require(path.resolve(process.argv[3],'transit-js'));
assert.match(process.argv[4],/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const product=process.argv[5]==='product';
const get=(v,k)=>v?(v.rep||v).get(transit.keyword(k)):undefined;
const cases=product?[['b564c72c-f31f-81ec-8008-ad9958b272be',['7aaaed58-7fa9-80c8-8008-c51f3e500479','7aaaed58-7fa9-80c8-8008-c51f3edd44a7']]]:[
 ['4ee6f77a-1dfb-809b-8008-c1eac9c6142e',['bc076afe-ee85-8033-8008-c51c23c4352f','bc076afe-ee85-8033-8008-c51c257a9108']],
 ['4ee6f77a-1dfb-809b-8008-c1eac9c2959e',['bc076afe-ee85-8033-8008-c51d2e536923','bc076afe-ee85-8033-8008-c51d2e8b01ff']]
];
const labels=['Démarrer la démonstration','Démarrer la démonstration','Démarrer la démonstration','En cours','Rejouer la démonstration'];
const providers=['c403923b-827e-80b7-8008-bbd346b9408e','c403923b-827e-80b7-8008-bbd36eedb6d6','37222e98-689a-801a-8008-bbd39a6a948b','37222e98-689a-801a-8008-bbd3f1c039c5','c403923b-827e-80b7-8008-bbd346b9408e'];
const textContent=n=>{if(!n)return'';return get(n,'text')||Array.from(get(n,'children')||[]).map(textContent).join('');};
(async()=>{const b=await chromium.connectOverCDP(process.argv[4],{timeout:10000});try{
 const file=product?'b564c72c-f31f-81ec-8008-ad9958b272bd':'40e06342-8830-80d6-8008-96572effc11c';
 const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes(file));assert.ok(page);
 const response=await page.context().request.get(new URL('/api/rpc/command/get-file?id='+file,page.url()).href,{timeout:45000});assert.equal(response.status(),200);
 const saved=transit.reader('json').read(await response.text());let controls=0;
 for(const [pageId,ids]of cases){const objects=get(get(get(saved,'data'),'pages-index').get(transit.uuid(pageId)),'objects');
  for(const id of ids){const host=objects.get(transit.uuid(id));assert.ok(host);const children=Array.from(get(host,'shapes')||[]);assert.equal(children.length,5);
   const hr=get(host,'selrect');
   for(let i=0;i<5;i++){const item=objects.get(children[i]);assert.equal(get(item,'component-id').toString(),providers[i]);const rect=get(item,'selrect');assert.ok(Math.abs(get(rect,'height')-30.4)<.001);
    assert.ok(Math.abs(get(rect,'x')-get(hr,'x')-24)<.001,'Source-backed horizontal inset');
    assert.ok(Math.abs(get(rect,'y')-get(hr,'y')-(24+i*48))<.001,'Source-backed state row');
    assert.ok(get(rect,'x')+get(rect,'width')<=get(hr,'x')+get(hr,'width')+.001,'Control contained in host');
    assert.ok(get(rect,'y')+get(rect,'height')<=get(hr,'y')+get(hr,'height')+.001,'Control contained vertically');
    const text=Array.from(get(item,'shapes')).map(id=>objects.get(id)).find(n=>get(n,'type').toString()===':text');assert.ok(text);assert.equal(textContent(get(text,'content')),labels[i]);
    const tr=get(text,'selrect');assert.ok(get(tr,'x')>=get(rect,'x')&&get(tr,'x')+get(tr,'width')<=get(rect,'x')+get(rect,'width')+.001);
    assert.equal(get(item,'opacity'),i===3?.62:1);controls++;
   }
  }
 }console.log(JSON.stringify({savedHosts:product?2:4,linkedControls:controls,heightPx:30.4,paintedLabelsRequireRaster:true,nativeProof:false,humanAccepted:false}));
}finally{b._connection.close();}})().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
