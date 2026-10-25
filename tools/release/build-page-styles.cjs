'use strict';
// Compile once, then retain ordered rule subsequences for each accessible page.
// Never regroup declarations or move rules across media/supports boundaries.
require('./verify-build-versions.cjs').assertNode();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {compactDeclarations}=require('./build-styles.cjs');
const root=path.resolve(__dirname,'../..');
// Guide-naming selectors (classed under easyedu-guide/local-groupimport-tutorial, including
// instances scoped under a page's own rail container, e.g. Student Management's own guide-launcher
// button) are always built into guide.css below. Historically Student Management also duplicated
// every one of them inline in its own sheet (1,617 identical rule bodies, 488,965 bytes — I9,
// RAPPORT-I9-X6-X7-20261022.md). K22 (Kevin 22/10, option 2 of that report) removes that
// duplication: guide.css becomes the sole source for Student Management's Guide content, and
// manage.php now requests guide.css alongside student-management.css (mirroring index.php, which
// already requested both for Mass Import since GMI-C1, 18/10). Mass Import's and Administration's
// own page-scoped Guide-launcher selectors are untouched by this change — they were never the
// duplication this batch targets, and GMI-C1 already made that call for Mass Import.
function guideTargets(selector){return /easyedu-guide|local-groupimport-tutorial/.test(selector);}
// Mass Import Guide specimens (GMI-C2, modifiers --mi*) are served by guide.css only: Student Management never shows them.
function massImportGuideOnly(selector){return /easyedu-guide-(spec|anatomy)--mi|easyedu-guide--mass-import/.test(selector);}
function targets(selector){
 if(massImportGuideOnly(selector))return {sm:false,admin:false,mass:false};
 const isGuide=guideTargets(selector);
 // .easyedu-ui--standalone only ever renders on the standalone reset_guide_welcome.php page
 // (templates/guide_welcome_reset.mustache: the settings-page copy passes inline=true and
 // never gets the class). Without this, the catch-all below ships its ~8 KB token block
 // (I9, 21/10) into Student Management and Mass Import where no element ever wears it.
 const admin=/local-groupimport-admin|page-admin-setting-local_groupimport|easyedu-welcome-reset|easyedu-ui--standalone/.test(selector);
 // K22-07: the shared Kit hover bubble (easyedu_bubble.js BUBBLE_CLASS) is also used on Mass Import
 // (Display preferences icon); without it the page showed a bare Bootstrap popover.
 const mass=/local-groupimport-import|path-local-groupimport-index|local-groupimport-easystud__navigation|local-groupimport-easystud-hover-popover/.test(selector);
 // K22 (22/10): never let a Guide-naming selector land in Student Management, even when it is
 // scoped under #local-groupimport-easystud (its own rail's guide-launcher button) — guide.css
 // alone covers it now. Mass Import and Administration keep their own independent match above.
 const sm=!isGuide&&/local-groupimport-easystud(?!-admin)/.test(selector);
 if(sm||admin||mass)return {sm,admin,mass};
 // Pure Guide content that matched no page-specific pattern belongs in guide.css only: never let
 // it fall through to the "shared across every page" catch-all below.
 if(isGuide)return {sm:false,admin:false,mass:false};
 // Mixed consumer selectors retain their shared declarations on every named consumer.
 return {sm:true,admin:true,mass:true};
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
