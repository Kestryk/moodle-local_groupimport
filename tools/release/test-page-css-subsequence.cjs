const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const postcss=require(process.argv[2]);const root=path.resolve(__dirname,'../..');
const baseline=postcss.parse(fs.readFileSync(process.argv[3],'utf8').replace(/\r\n/g,'\n'));
const canonical=new Map();
baseline.walkRules(r=>{for(const s of postcss.list.comma(r.selector)){const k=s+'|'+ancestry(r);const list=canonical.get(k)||[];list.push(r.nodes.map(n=>n.toString().replace(/\[\[font:local_groupimport\|([^\]]+)\]\]/g,'../fonts/$1')).join(';'));canonical.set(k,list);}});
function ancestry(n){const a=[];for(let p=n.parent;p;p=p.parent)if(p.type==='atrule')a.unshift('@'+p.name+' '+p.params);return a.join('|');}
const reports=[];
for(const file of ['student-management','mass-import','administration']){
 const ast=postcss.parse(fs.readFileSync(path.join(root,'styles',file+'.css'),'utf8').replace(/\r\n/g,'\n'));const cursors=new Map();let count=0;
 ast.walkRules(r=>{for(const s of postcss.list.comma(r.selector)){const k=s+'|'+ancestry(r),decl=r.nodes.map(n=>n.toString()).join(';'),options=canonical.get(k)||[];const start=cursors.get(k)||0;const found=options.indexOf(decl,start);assert(found>=0,file+': changed selector/declarations '+s);cursors.set(k,found+1);count++;}});
 reports.push({file,unchangedOrderedSelectorOccurrences:count});
}
assert.equal(postcss.parse(fs.readFileSync(path.join(root,'styles.css'),'utf8')).nodes.filter(n=>n.type!=='comment').length,0);
console.log(JSON.stringify({passed:true,reports,globalRules:0}));
