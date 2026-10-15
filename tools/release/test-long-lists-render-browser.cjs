/* eslint-env node */
// Real Moodle Mustache + actual card templates/renderers: bounded DOM and full detached totals.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(path.resolve(process.argv[2]),'playwright'));
const moodle=path.resolve(process.argv[3]),output=path.resolve(process.argv[4]),root=path.resolve(__dirname,'../..');
if(!output.toLowerCase().startsWith('c:\\dev\\artifacts\\'))throw Error('External result required');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const esm=s=>s.replace(/^import .*;$/gm,'').replace(/^export const /gm,'const ');
const report={rows:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.setContent('<main id="host"></main>');
  await page.addScriptTag({content:read(path.join(moodle,'lib/amd/src/mustache.js')).replace('export default mustache;','window.actualMustache=mustache;')});
  await page.addScriptTag({content:`(()=>{const Mustache=window.actualMustache;
   ${esm(read(path.join(root,'amd/src/local/sm/filter_engine.js')))}
   ${esm(read(path.join(root,'amd/src/local/sm/index.js')))}
   ${esm(read(path.join(root,'amd/src/local/sm/groups.js')))}
   window.actualGroups={buildGroupCardContext,renderGroupPage,getDetachedGroupCard,renderMissingMemberRows,getSelectedMemberRow};
  })();`});
  const template=read(path.join(root,'templates/sm/group_card.mustache'));
  for(const count of [0,1,8,9,50,60,120]){
   const row=await page.evaluate(({count,template})=>{
    const members=Array.from({length:count},(_,i)=>({id:i+1,fullname:'Member '+i+' <&> "\'',email:''}));
    const group={id:7,name:'Group <&> "\'',memberids:members.map(u=>u.id),groupingids:[]};
    const catalog=()=>({detached:new Map(),pageCards:new Map()});
    const model={groupSource:template,groups:new Map([[7,group]]),groupings:new Map(),byId:new Map(members.map(u=>[u.id,u])),
     groupStrings:{memberscount:'__count__ members'},strings:{},groupCatalogNames:new Map([[7,[]]]),
     groupTreeSearch:new Map([[7,'']]),groupSearch:new Map([[7,'']]),catalogs:{structure:catalog(),participants:catalog()}};
    const host=document.querySelector('#host');
    const [card]=window.actualGroups.renderGroupPage(model,host,'structure',[7]);
    const initial=card.querySelectorAll('[data-easystud-member-id]').length;
    const detached=window.actualGroups.getDetachedGroupCard(model,7,'structure');
    const expected=Math.min(18,count),wanted=members.slice(0,expected).map(u=>u.id);
    window.actualGroups.renderMissingMemberRows(model,card,wanted);
    const after=card.querySelectorAll('[data-easystud-member-id]').length;
    window.actualGroups.renderMissingMemberRows(model,card,members.slice(-1).map(u=>u.id));
    const searched=card.querySelectorAll('[data-easystud-member-id]').length;
    const proxy=count?window.actualGroups.getSelectedMemberRow(model,7,count,'structure'):null;
    const cached=count?window.actualGroups.getSelectedMemberRow(model,7,count,'structure'):null;
    return {count,initial,after,searched,detachedRows:detached.querySelectorAll('[data-easystud-member-id]').length,
     detachedTotal:detached.hasAttribute('data-easystud-member-total')?Number(detached.getAttribute('data-easystud-member-total')):initial,
     literal:card.querySelector('[data-easystud-member-id]')?.textContent.trim(),injected:host.querySelectorAll('script,b,img').length,
     proxyCached:proxy===cached,proxyTotal:proxy?.closest('[data-easystud-group-id]').getAttribute('data-easystud-member-total')};
   },{count,template});
   assert.equal(row.initial,Math.min(8,count));assert.equal(row.after,Math.min(18,count));assert.equal(row.searched,Math.min(1,count));
   assert.equal(row.detachedRows,Math.min(8,count));assert.equal(row.detachedTotal,count);assert.equal(row.injected,0);
   if(count){assert(row.literal.includes('<&> "\''));assert(row.proxyCached);if(count>1)assert.equal(Number(row.proxyTotal),count);}
   report.rows.push(row);
  }
  assert.deepEqual(report.errors,[]);report.passed=true;
 }finally{fs.writeFileSync(output,JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({passed:report.passed,cases:report.rows.length,errors:report.errors.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
