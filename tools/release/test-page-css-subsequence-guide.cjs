const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const postcss=require(process.argv[2]);const root=path.resolve(__dirname,'../..');
// I9 (21/10): page CSS is minified in production (tools/release/minify-css.cjs, whitespace and
// comments only). Normalize both sides through it before comparing, so the minifier's
// whitespace collapsing does not register as a changed declaration; selector/declaration
// identity and order are still enforced byte-for-byte otherwise.
const {minifyCss}=require('./minify-css.cjs');
function normalize(declText){return declText?minifyCss(declText):declText;}
const baseline=postcss.parse(fs.readFileSync(process.argv[3],'utf8'));
const canonical=new Map();
baseline.walkRules(r=>{for(const s of postcss.list.comma(r.selector)){const k=normalize(s)+'|'+ancestry(r);const list=canonical.get(k)||[];list.push(normalize(r.nodes.map(n=>n.toString().replace(/\[\[font:local_groupimport\|([^\]]+)\]\]/g,'../fonts/$1')).join(';')));canonical.set(k,list);}});
function ancestry(n){const a=[];for(let p=n.parent;p;p=p.parent)if(p.type==='atrule')a.unshift('@'+p.name+' '+normalize(p.params));return a.join('|');}
const reports=[];
for(const file of ['student-management','mass-import','administration','guide']){
 const ast=postcss.parse(fs.readFileSync(path.join(root,'styles',file+'.css'),'utf8'));const cursors=new Map();let count=0;
 ast.walkRules(r=>{for(const s of postcss.list.comma(r.selector)){const k=normalize(s)+'|'+ancestry(r),decl=normalize(r.nodes.map(n=>n.toString()).join(';')),options=canonical.get(k)||[];const start=cursors.get(k)||0;const found=options.indexOf(decl,start);assert(found>=0,file+': changed selector/declarations '+s);cursors.set(k,found+1);count++;}});
 reports.push({file,unchangedOrderedSelectorOccurrences:count});
}
assert.equal(postcss.parse(fs.readFileSync(path.join(root,'styles.css'),'utf8')).nodes.filter(n=>n.type!=='comment').length,0);
console.log(JSON.stringify({passed:true,reports,globalRules:0}));
// Successor (GMI-C1): the Mass Import Guide sheet only carries Guide selectors, and Mass Import requests it.
const guide=postcss.parse(fs.readFileSync(path.join(root,'styles','guide.css'),'utf8'));let foreign=0,total=0;
guide.walkRules(r=>{if(r.parent.type==='atrule'&&/keyframes$/.test(r.parent.name))return;for(const s of postcss.list.comma(r.selector)){total++;if(!/easyedu-guide|local-groupimport-tutorial/.test(s))foreign++;}});
if(foreign)throw Error('guide.css carries '+foreign+' non-Guide selectors');
const index=fs.readFileSync(path.join(root,'index.php'),'utf8');
if(!index.includes("styles/guide.css")||!index.includes("styles/mass-import.css"))throw Error('index.php must request mass-import.css and guide.css');
if(fs.readFileSync(path.join(root,'manage.php'),'utf8').includes('styles/guide.css'))throw Error('Student Management must not request guide.css');
console.log(JSON.stringify({guideSelectors:total,foreignSelectors:0,massImportRequestsGuide:true,studentManagementUnchanged:true}));
