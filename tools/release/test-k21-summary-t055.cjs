'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const source=fs.readFileSync(path.join(root,'amd/src/local/cm/group_cards.js'),'utf8');
 const start=source.indexOf('export const updateStructureSummary ='),end=source.indexOf('export const updateStructureEmptyState =');
 assert.ok(start>=0&&end>start,'T055 exported summary function required');
 const summary=source.slice(start,end).replace('export ','');
 const index=fs.readFileSync(path.join(root,'amd/src/local/sm/index.js'),'utf8');
 const count=index.slice(index.indexOf('export const countLabel ='),index.indexOf('export const normalise =')).replace('export ','');
 const browser=await chromium.launch();const records=[];
 try{
  for(const language of ['fr','en']){
   const php=JSON.parse(fs.readFileSync(path.join(process.argv[2],`es-k21-count-${language}.json`),'utf8'));
   const page=await browser.newPage();await page.setContent(`<html lang="${language}"><body></body></html>`);
   for(const n of [0,1,2,14,54])for(const state of ['ready','loading','no-raw']){
    const labels=php.records.filter(r=>r.count===n);
    const value=await page.evaluate(({summary,count,n,labels,state})=>{
     const root=document.createElement('div');root.innerHTML=labels.map(r=>`<span data-easystud-structure-count="${r.identifier==='groupscount'?'groups':'groupings'}" data-count-template="${r.template}">server value</span>`).join('');
     // Deliberately wrong rendered-DOM cardinality must never be used as a fallback.
     root.insertAdjacentHTML('beforeend','<div data-easystud-group-id="1"></div><div data-easystud-grouping-id="1"></div>');
     const model=state==='ready'?{raw:{groups:Array(n),groupings:Array(n)}}:state==='loading'?null:{};
     new Function('root','model',`${count}; const getOnDemandModel=()=>model; ${summary}; updateStructureSummary(root);`)(root,model);
     return [...root.querySelectorAll('[data-easystud-structure-count]')].map(n=>n.textContent);
    },{summary,count,n,labels,state});
    assert.deepEqual(value,state==='ready'?labels.map(r=>r.label):['server value','server value']);
    records.push({language,count:n,state,labels:value});
   }
   await page.close();
  }
  console.log('PASS30 T055 group_cards: FR/EN PHP count forms; null/incomplete model preserves server values despite wrong DOM counts.');
 }finally{fs.writeFileSync(process.argv[3],JSON.stringify(records,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
