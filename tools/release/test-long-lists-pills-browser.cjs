/* eslint-env node */
// Compiled Kit consumer CSS and the actual pill window: desktop6 / compact one line.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(path.resolve(process.argv[2]),'playwright'));
const root=path.resolve(__dirname,'../..'),output=path.resolve(process.argv[3]);
if(!output.toLowerCase().startsWith('c:\\dev\\artifacts\\'))throw Error('External result required');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const esm=s=>s.replace(/^import .*;$/gm,'').replace(/^export const /gm,'const ');
const report={rows:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const width of [1280,768,390]){
   const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
   await page.setContent('<main id="local-groupimport-easystud" class="local-groupimport-easystud"><article data-easystud-user data-user-id="7"><div class="local-groupimport-easystud-user__meta"><div id="tags" class="local-groupimport-easystud-user__meta-tags" style="display:flex;width:280px;max-width:100%;gap:4px" data-easystud-token-class="local-groupimport-easystud-token local-groupimport-easystud-token--group"></div></div></article></main>');
   await page.addStyleTag({content:read('styles/student-management.css')});
   await page.addScriptTag({content:`(()=>{
    ${esm(read('amd/src/local/sm/list_windows.js'))}
    const getLabels=()=>({showless:'Reduce',longlistall:'View all (__total__)'});
    const isResponsiveWorkspace=()=>window.matchMedia('(max-width:1024px)').matches;
    ${esm(read('amd/src/local/cm/long_lists.js'))}
    window.pillWindow=syncTagWindow;
   })();`});
   for(const count of [1,6,15,31]){
    const row=await page.evaluate(count=>{
     const node=document.querySelector('#tags');node.replaceChildren();
     node.setAttribute('data-easystud-long-tags',JSON.stringify(Array.from({length:count},(_,i)=>'Long group '+i+' <&> "\'')));
     window.pillWindow(node);
     const metrics=()=>{const tokens=Array.from(node.querySelectorAll('span'));const button=node.querySelector('button');return {
      count:tokens.length,hidden:tokens.filter(n=>n.hidden).length,tops:tokens.concat(button&&!button.hidden?[button]:[]).map(n=>n.getBoundingClientRect().top),
      heights:tokens.map(n=>n.getBoundingClientRect().height),overflow:node.scrollWidth-node.clientWidth,
      all:button?.getAttribute('data-easystud-open-user')};};
     const closed=metrics();const button=node.querySelector('button');
     let expanded=null,restored=null;
     if(button&&count>1&&count<=30){button.setAttribute('data-expanded','1');window.pillWindow(node);expanded=metrics();
      button.setAttribute('data-expanded','0');window.pillWindow(node);restored=metrics();}
     return {count,closed,expanded,restored};
    },count);
    assert.equal(row.closed.hidden,0);assert.equal(row.closed.count,width>1024?Math.min(count,6):Math.min(count,row.closed.count));
    assert(row.closed.count>=1&&row.closed.count<=6);row.closed.heights.forEach(h=>assert(Math.abs(h-22)<=1));
    if(width<=1024){assert(Math.max(...row.closed.tops)-Math.min(...row.closed.tops)<=1);assert(row.closed.overflow<=1);}
    if(row.expanded){assert.equal(row.expanded.count,count);assert.equal(row.restored.count,row.closed.count);assert.equal(row.restored.hidden,0);}
    if(count>30)assert.equal(row.closed.all,'7');
    report.rows.push({width,...row});
   }
   await page.close();
  }
  assert.deepEqual(report.errors,[]);report.passed=true;
 }finally{fs.writeFileSync(output,JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({passed:report.passed,cases:report.rows.length,errors:report.errors.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
