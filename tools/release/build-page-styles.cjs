'use strict';
// Compile once, then retain ordered rule subsequences for each accessible page.
// Never regroup declarations or move rules across media/supports boundaries.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {compactDeclarations}=require('./build-styles.cjs');
const root=path.resolve(__dirname,'../..');
function targets(selector){
 const sm=/local-groupimport-easystud(?!-admin)|easyedu-guide|local-groupimport-tutorial/.test(selector);
 const admin=/local-groupimport-admin|page-admin-setting-local_groupimport|easyedu-welcome-reset/.test(selector);
 const mass=/local-groupimport-import|path-local-groupimport-index|local-groupimport-easystud__navigation/.test(selector);
 // Mixed consumer selectors retain their shared declarations on every named consumer.
 return sm||admin||mass?{sm,admin,mass}:{sm:true,admin:true,mass:true};
}
function build(sassModule,postcssModule){
 const sass=require(path.resolve(sassModule)),postcss=require(path.resolve(postcssModule));
 assert(sass.info.includes('1.79.1'));
 const css=compactDeclarations(sass.compile(path.join(root,'scss/easystud.scss'),{style:'expanded',charset:false,sourceMap:false,logger:sass.Logger.silent}).css);
 const parsed=postcss.parse(css);const report={sourceBytes:Buffer.byteLength(css),pages:{}};
 fs.mkdirSync(path.join(root,'styles'),{recursive:true});
 for(const [surface,name] of Object.entries({sm:'student-management',mass:'mass-import',admin:'administration'})){
  const ast=parsed.clone();let kept=0,removed=0;
  ast.walkRules(rule=>{
   if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;
   const selectors=postcss.list.comma(rule.selector);const selected=selectors.filter(s=>targets(s)[surface]);
   removed+=selectors.length-selected.length;kept+=selected.length;
   if(!selected.length)rule.remove();else rule.selector=selected.join(',\n');
  });
  ast.walkAtRules(at=>{if(/keyframes$/.test(at.name)&&/guide|tutorial/i.test(at.params)&&surface!=='sm')at.remove();});
  // Remove empty conditional groups without altering the retained order.
  for(let pass=0;pass<3;pass++)ast.walkAtRules(at=>{if(at.nodes&&!at.nodes.length)at.remove();});
  ast.walkDecls(decl=>{decl.value=decl.value.replace(/\[\[font:local_groupimport\|([^\]]+)\]\]/g,'../fonts/$1');});
  const output=ast.toString();assert(!output.includes('[[font:'));
  fs.writeFileSync(path.join(root,'styles',name+'.css'),output);
  report.pages[name]={bytes:Buffer.byteLength(output),keptSelectors:kept,removedForeignSelectors:removed};
 }
 fs.writeFileSync(path.join(root,'styles.css'),'/* EasyStud has no site-wide presentation rules. Page CSS is requested explicitly. */\n');
 return report;
}
if(require.main===module){const [sass,postcss]=process.argv.slice(2);if(!sass||!postcss)throw Error('Pass Sass1.79.1 and PostCSS package paths');console.log(JSON.stringify(build(sass,postcss)));}
module.exports={build,targets};
