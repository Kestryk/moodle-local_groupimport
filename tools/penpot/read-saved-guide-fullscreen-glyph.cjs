// Local-supervised read-only proof. No editor, auth export, Moodle or media writes.
const assert=require('node:assert/strict'),path=require('node:path');
assert.ok(process.argv[2]&&process.argv[3]&&process.argv[4],
 'Usage: node read-saved-guide-fullscreen-glyph.cjs <playwright-modules> <transit-modules> <owned-cdp-url>');
assert.match(process.argv[4],/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium}=require(path.resolve(process.argv[2],'playwright'));
const transit=require(path.resolve(process.argv[3],'transit-js'));
const record=require('../../docs/testing/guide-fullscreen-product-relinks-2026-10-10.json');
const get=(v,k)=>(v.rep||v).get(transit.keyword(k));
const rect=s=>{const r=get(s,'selrect');return Object.fromEntries(['x','y','width','height'].map(k=>[k,get(r,k)]));};
const near=(a,b,label)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<0.001,label);
(async()=>{
 const browser=await chromium.connectOverCDP(process.argv[4],{timeout:10000});
 try{
  const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes(record.fileId));
  assert.ok(page,'Exact owned Guide editor required');
  const response=await page.context().request.get('https://design.penpot.app/api/rpc/command/get-file?id='+record.fileId,{timeout:45000});
  assert.equal(response.status(),200);
  const file=transit.reader('json').read(await response.text());
  const objects=get(get(get(file,'data'),'pages-index').get(transit.uuid(record.pageId)),'objects');
  const shape=id=>{const s=objects.get(transit.uuid(id));assert.ok(s,id+' saved');return s;};
  const provider=(id,expected)=>{
   const s=shape(id);assert.equal(String(get(s,'component-id')),expected);
   assert.equal(String(get(s,'component-file')),record.foundationFileId);
   near(rect(s).width,12.48,id+' slot density');return s;
  };
  const pairs=record.controls.map(c=>{
   provider(c.slot,c.provider);const frame=rect(shape(c.id)),p=shape(c.path),ink=rect(p);
   near(frame.width,30.4,'Small frame');near(frame.height,30.4,'Small frame height');
   near(ink.width,7.8,'Scaled path width');near(ink.height,7.8,'Scaled path height');
   const dx=ink.x+ink.width/2-frame.x-frame.width/2,dy=ink.y+ink.height/2-frame.y-frame.height/2;
   near(dx,0,'Paint centre x');near(dy,0,'Paint centre y');
   const stroke=get(p,'strokes')[0];near(get(stroke,'stroke-width'),0.975,'Scaled stroke');
   assert.equal(get(stroke,'stroke-color'),'#0b5ea8');assert.equal(get(p,'fills').length,0);
   return{id:c.id,path:c.path,frameSize:frame.width,pathSize:ink.width,stroke:get(stroke,'stroke-width'),dx,dy};
  });
  record.closeSlots.forEach(id=>provider(id,record.closeProvider));
  assert.equal(get(provider(record.hiddenCompassSlot,record.hiddenCompassProvider),'hidden'),true);
  console.log(JSON.stringify({savedServerGeometryVerified:true,linkedSlots:12,fullscreenPairs:pairs,editorWrites:false,moodleWrites:false},null,2));
 }finally{browser._connection.close();}
})().then(()=>process.exit(0)).catch(error=>{console.error(error.message);process.exit(1)});
