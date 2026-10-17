// Exact ordered cascade projection: remove only the enumerated dead branches and one priority.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),postcss=require('C:/dev/moodle51-build-501/node_modules/postcss');
const old=f=>execFileSync('git',['-C',root,'show','8129aef7:'+f],{encoding:'utf8',maxBuffer:8*1024*1024}).replace(/\r\n/g,'\n');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const prefix='.local-groupimport-easystud-easyedu-guide.easyedu-guide.easyedu-guide--discovery .easyedu-guide-scene';
const removedSelectors=[prefix+'[data-guide-mode=move] '+prefix+'__stage::after',prefix+'[data-guide-mode=actions] '+prefix+'__stage::after',prefix+'[data-guide-mobile-actions] '+prefix+'__menu'];
const projected=postcss.parse(old('styles/student-management.css'));let removed=0,priorities=0;
projected.walkRules(rule=>{const selectors=postcss.list.comma(rule.selector);if(selectors.some(s=>removedSelectors.includes(s))){
 assert(selectors.every(s=>removedSelectors.includes(s)));removed+=selectors.length;rule.remove();return;
}if(rule.selector==='.local-groupimport-easystud-action-grip')rule.walkDecls('margin',d=>{assert.equal(d.value,'0');assert.equal(d.important,true);d.important=false;priorities++;});});
function rows(css){const result=[];postcss.parse(css).walkRules(rule=>{const parents=[];for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule')parents.unshift([p.name,p.params]);result.push({parents,selector:rule.selector,body:rule.nodes.filter(n=>n.type!=='comment').map(n=>[n.prop,n.value,!!n.important])});});return result;}
assert.equal(removed,3);assert.equal(priorities,1);assert.deepEqual(rows(projected.toString()),rows(read('styles/student-management.css')));
for(const f of ['styles.css','styles/mass-import.css','styles/administration.css'])assert.equal(read(f),old(f),f+' unchanged');
assert(!fs.existsSync(path.join(root,'scss/components/_tutorial.scss')),'Historical tutorial stylesheet already removed by P2');
module.exports={removedSelectors};
if(require.main===module)console.log(JSON.stringify({passed:true,removedSelectors:removed,priorityChanges:priorities,rules:rows(projected.toString()).length}));
