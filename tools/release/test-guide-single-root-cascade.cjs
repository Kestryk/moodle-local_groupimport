// Exact selector/declaration/cascade proof for one-root Guide consolidation.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const postcss=require(path.resolve(process.argv[2]));const root=path.resolve(__dirname,'../..');
const old=f=>execFileSync('git',['-C',root,'show','fcf11a6f:'+f],{encoding:'utf8',maxBuffer:8*1024*1024}).replace(/\r\n/g,'\n');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const weak='.local-groupimport-easystud-easyedu-guide',page='.path-local-groupimport .easyedu-guide',single=weak+'.easyedu-guide';
function rows(css,baseline){const out=[];postcss.parse(css).walkRules(rule=>{
 let selectors=postcss.list.comma(rule.selector);
 if(baseline&&selectors.some(s=>s.includes('.path-local-groupimport')&&s.includes('.easyedu-guide'))&&selectors.some(s=>s.includes(weak))){
  selectors=[...new Set(selectors.filter(s=>!s.includes('.path-local-groupimport:is('))
    .map(s=>s.split(page).join('@@ROOT@@').split(weak).join('@@ROOT@@').split('@@ROOT@@').join(single)))];
 }
 const parents=[];for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule')parents.unshift([p.name,p.params]);
 out.push({parents,selectors,body:rule.nodes.map(n=>n.toString())});
 });return out;}
const before=old('styles/student-management.css'),after=read('styles/student-management.css');
const a=rows(before,true),b=rows(after,false);if(JSON.stringify(a)!==JSON.stringify(b)){let i=0;while(i<Math.min(a.length,b.length)&&JSON.stringify(a[i])===JSON.stringify(b[i]))i++;throw Error('Rule '+i+' old='+JSON.stringify(a[i]).slice(0,900)+' new='+JSON.stringify(b[i]).slice(0,900));}
for(const f of ['styles.css','styles/mass-import.css','styles/administration.css'])assert.equal(read(f),old(f),f+' unchanged');
assert.equal(postcss.parse(read('styles.css')).nodes.filter(n=>n.type!=='comment').length,0);
assert(read('manage.php').includes("'rootclass' => 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery'"));
assert(read('templates/easyedu_guide.mustache').includes('class="easyedu-guide{{#rootclass}} {{rootclass}}'));
const nav=read('amd/src/local/cm/navigation.js');assert(nav.includes('document.body.appendChild(guideNode)'));assert(!nav.includes("guideNode.className ="));
assert(!read('scss/components/_easyedu-guide.scss').includes(page));
console.log(JSON.stringify({surface:'L1L2-Guide-root-cascade',passed:true,orderedRules:b.length,removedBytes:Buffer.byteLength(before)-Buffer.byteLength(after),globalRules:0,otherPagesUnchanged:3,runtimeAccess:false}));
