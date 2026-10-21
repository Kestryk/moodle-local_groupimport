'use strict';
// Compile once, then retain ordered rule subsequences for each accessible page.
// Never regroup declarations or move rules across media/supports boundaries.
require('./verify-build-versions.cjs').assertNode();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {compactDeclarations}=require('./build-styles.cjs');
const root=path.resolve(__dirname,'../..');
// Guide rules requested only by Mass Import, as a separate sheet (GMI-C1, Kevin 18/10): selectors that
// name the Guide itself. Student Management keeps them in its own page CSS, unchanged.
function guideTargets(selector){return /easyedu-guide|local-groupimport-tutorial/.test(selector);}
// Mass Import Guide specimens (GMI-C2, modifiers --mi*) are served by guide.css only: Student Management never shows them.
function massImportGuideOnly(selector){return /easyedu-guide-(spec|anatomy)--mi|easyedu-guide--mass-import/.test(selector);}
function targets(selector){
 if(massImportGuideOnly(selector))return {sm:false,admin:false,mass:false};
 const sm=/local-groupimport-easystud(?!-admin)|easyedu-guide|local-groupimport-tutorial/.test(selector);
 // .easyedu-ui--standalone only ever renders on the standalone reset_guide_welcome.php page
 // (templates/guide_welcome_reset.mustache: the settings-page copy passes inline=true and
 // never gets the class). Without this, the catch-all below ships its ~8 KB token block
 // (I9, 21/10) into Student Management and Mass Import where no element ever wears it.
 const admin=/local-groupimport-admin|page-admin-setting-local_groupimport|easyedu-welcome-reset|easyedu-ui--standalone/.test(selector);
 const mass=/local-groupimport-import|path-local-groupimport-index|local-groupimport-easystud__navigation/.test(selector);
 // Mixed consumer selectors retain their shared declarations on every named consumer.
 return sm||admin||mass?{sm,admin,mass}:{sm:true,admin:true,mass:true};
}
// I9 (21/10): minify in production with the hand-rolled, selector/value-preserving pass in
// minify-css.cjs. A third-party minifier (clean-css 2.2.23, the only one in the recorded
// toolchain) was tried and rejected: it rewrites :is(...) selector lists into invalid CSS
// (unclosed-bracket parse errors once re-parsed) because it predates that selector syntax.
// options.minify===false (or --no-minify on the CLI) keeps the readable, dev/debug output.
const {minifyCss}=require('./minify-css.cjs');
function build(sassModule,postcssModule,options={}){
 const sass=require(path.resolve(sassModule)),postcss=require(path.resolve(postcssModule));
 require('./verify-build-versions.cjs').assertSass(sass);
 const css=compactDeclarations(sass.compile(path.join(root,'scss/easystud.scss'),{style:'expanded',charset:false,sourceMap:false,logger:sass.Logger.silent}).css);
 const parsed=postcss.parse(css);const report={sourceBytes:Buffer.byteLength(css),pages:{}};
 fs.mkdirSync(path.join(root,'styles'),{recursive:true});
 const minify=options.minify!==false;
 for(const [surface,name] of Object.entries({sm:'student-management',mass:'mass-import',admin:'administration',guide:'guide'})){
  const ast=parsed.clone();let kept=0,removed=0;
  ast.walkRules(rule=>{
   if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;
   const selectors=postcss.list.comma(rule.selector);const selected=selectors.filter(s=>surface==='guide'?guideTargets(s):targets(s)[surface]);
   removed+=selectors.length-selected.length;kept+=selected.length;
   if(!selected.length)rule.remove();else rule.selector=selected.join(',\n');
  });
  ast.walkAtRules(at=>{if(/keyframes$/.test(at.name)&&/guide|tutorial/i.test(at.params)&&surface!=='sm'&&surface!=='guide')at.remove();});
  // Remove empty conditional groups without altering the retained order.
  for(let pass=0;pass<3;pass++)ast.walkAtRules(at=>{if(at.nodes&&!at.nodes.length)at.remove();});
  ast.walkDecls(decl=>{decl.value=decl.value.replace(/\[\[font:local_groupimport\|([^\]]+)\]\]/g,'../fonts/$1');});
  let output=ast.toString();assert(!output.includes('[[font:'));
  const sourceBytes=Buffer.byteLength(output);
  if(minify)output=minifyCss(output);
  assert(!output.includes('[[font:'));
  fs.writeFileSync(path.join(root,'styles',name+'.css'),output);
  report.pages[name]={bytes:Buffer.byteLength(output),sourceBytes,keptSelectors:kept,removedForeignSelectors:removed,minified:minify};
 }
 fs.writeFileSync(path.join(root,'styles.css'),'/* EasyStud has no site-wide presentation rules. Page CSS is requested explicitly. */\n');
 return report;
}
if(require.main===module){
 const args=process.argv.slice(2).filter(a=>a!=='--no-minify');
 const [sass,postcss]=args;
 if(!sass||!postcss)throw Error('Pass Sass1.79.1 and PostCSS package paths');
 const minify=!process.argv.includes('--no-minify');
 console.log(JSON.stringify(build(sass,postcss,{minify})));
}
module.exports={build,targets,guideTargets};
