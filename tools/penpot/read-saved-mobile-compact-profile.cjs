// Read-only saved successor for twelve existing Participant product usages.
const assert=require('node:assert/strict'),path=require('node:path');
assert.equal(process.argv.length,5,'Usage: <playwright modules> <transit modules> <owned CDP URL>');
assert.match(process.argv[4],/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/);
const {chromium}=require(path.resolve(process.argv[2],'playwright')),transit=require(path.resolve(process.argv[3],'transit-js'));
const get=(v,k)=>(v.rep||v).get(transit.keyword(k));
const previous=require('../../docs/testing/mobile-participant-memberships-final-2026-10-05.json');
(async()=>{const b=await chromium.connectOverCDP(process.argv[4]);try{
 const pages=b.contexts().flatMap(c=>c.pages()).filter(p=>p.url().includes('file-id='+previous.file));assert.equal(pages.length,1);
 const p=pages[0],r=await p.context().request.get(new URL('/api/rpc/command/get-file?id='+previous.file,p.url()).href);assert.equal(r.status(),200);
 const saved=transit.reader('json').read(await r.text());
 const objects=get(get(get(saved,'data'),'pages-index').get(transit.uuid(previous.page)),'objects');
 const rows=previous.records.map(c=>{
  const s=objects.get(transit.uuid(c.id));assert.ok(s);const rect=get(s,'selrect');assert.equal(get(rect,'width'),c.w);assert.equal(get(rect,'height'),c.h);
  const children=[...(get(s,'shapes')||[])].map(id=>objects.get(id));
  const profile=children.filter(n=>/\/ (?:Custom(?: label)?|Programme \/ (?:surface|label))$/.test(get(n,'name')));assert.equal(profile.length,3);
  profile.forEach(n=>assert.equal(!!get(n,'hidden'),!c.state.membershipsVisible));
  const roles=children.filter(n=>/\/ (?:Roles(?: label)?|Teacher \/ (?:surface|label))$/.test(get(n,'name')));assert.equal(roles.length,3);roles.forEach(n=>assert.equal(!!get(n,'hidden'),false));
  return{id:c.id,compact:!c.state.membershipsVisible,profileNodes:profile.map(n=>String(get(n,'id'))),rolesPreserved:true,geometryRetained:true};
 });
 assert.equal(rows.filter(r=>r.compact).length,8);
 console.log(JSON.stringify({rows,wholeCompositionCertified:false,nativeMoodle:false,humanAccepted:false}));
 }finally{await b.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
