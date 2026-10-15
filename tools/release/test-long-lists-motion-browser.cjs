/* eslint-env node */
// Exercise the real disclosure binding with an explicitly pinned integration Motion source.
// This isolates JS compatibility; it is not proof of published M1 server attributes/CSS.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(path.join(path.resolve(process.argv[2]),'playwright'));
const root=path.resolve(__dirname,'../..'),motionPath=path.resolve(process.argv[3]),output=path.resolve(process.argv[4]);
if(!output.toLowerCase().startsWith('c:\\dev\\artifacts\\'))throw Error('External result required');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const esm=s=>s.replace(/^import .*;$/gm,'').replace(/^export const /gm,'const ');
const motion=read(motionPath);assert(motion.includes("const levels = ['full', 'reduced', 'minimal']"));
const policy=esm(read(path.join(root,'amd/src/local/sm/list_windows.js')));
const binding=esm(read(path.join(root,'amd/src/local/cm/long_lists.js')));
const report={motionPath,motionSha256:crypto.createHash('sha256').update(fs.readFileSync(motionPath)).digest('hex'),rows:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const width of [1280,390])for(const system of ['no-preference','reduce'])for(const level of ['full','reduced','minimal']){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:system});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.setContent(`<main id="local-groupimport-easystud" data-easyedu-motion-level="${level}">
    <section id="owner"><ul data-easystud-group-members></ul></section></main>`);
   await page.addStyleTag({content:'li{height:40px}ul{padding:0;margin:0}li input{width:20px;height:20px}'});
   await page.addScriptTag({content:`(()=>{${esm(motion)};window.integrationMotion={resize,enter,timing,getLevel};})();`});
   await page.addScriptTag({content:`(()=>{
    ${policy}
    const Motion=window.integrationMotion,selectedClass='is-selected';
    const countLabel=(template,count)=>(template||'').replace('__count__',String(count));
    const getLabels=()=>({longlistshown:'__shown__ of __total__ shown',longlistmore:'Show __step__ more · __remaining__ remaining',longlistall:'View all (__total__)',longlistaddedmembers:'__count__ more members displayed',showless:'Reduce'});
    const requestGuideHighlightRefresh=()=>{};
    ${binding}
    const root=document.querySelector('main'),owner=document.querySelector('#owner'),list=owner.querySelector('ul');
    const render=()=>{const state=listWindow('members',60,owner.easystudMemberLimit);list.replaceChildren();
     for(let i=0;i<state.shown;i++){const row=document.createElement('li');row.dataset.easystudMemberId=i+1;const input=document.createElement('input');input.type='checkbox';input.setAttribute('aria-label','Member '+(i+1));row.append(input);list.append(row);}
     syncLongListFooter(owner,'members',state);};
    render();window.framesRecorded=[];const native=Element.prototype.animate;
    Element.prototype.animate=function(frames,options){window.framesRecorded.push({frames,options});return native.call(this,frames,options);};
    bindLongLists(root,{members:render});
   })();`});
   await page.locator('[data-easystud-long-list-action="more"]').click();
   await page.waitForFunction(()=>document.activeElement?.closest('[data-easystud-member-id]')?.dataset.easystudMemberId==='9');
   const row=await page.evaluate(()=>({count:document.querySelectorAll('[data-easystud-member-id]').length,
    live:document.querySelector('[aria-live]').textContent,frames:window.framesRecorded,level:window.integrationMotion.getLevel(document.querySelector('ul'))}));
   assert.equal(row.count,18);assert.equal(row.live,'10 more members displayed');assert.equal(row.level,level);
   if(level==='full')assert(row.frames.some(f=>f.frames.some(k=>k.height)), 'full height transition missing');
   if(level==='reduced'){
    assert.equal(row.frames.length,10);
    row.frames.forEach(f=>{assert(f.options.duration<=120);f.frames.forEach(k=>{
     assert.equal(k.height,undefined);assert.equal(k.transform,undefined);assert.notEqual(k.opacity,undefined);
    });});
   }
   if(level==='minimal')assert.equal(row.frames.length,0,'minimal must be immediate');
   report.rows.push({width,system,level,animations:row.frames.length,count:row.count,live:row.live});
   await page.close();
  }
  assert.deepEqual(report.errors,[]);report.passed=true;
 }finally{fs.writeFileSync(output,JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({passed:report.passed,cells:report.rows.length,errors:report.errors.length,motionSha256:report.motionSha256}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
