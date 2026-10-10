// Exact bounded paint adaptation; no Moodle bootstrap or data mutation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base='dd7a3141cdf18a950051de51e130af9d0d252cd4';
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const old=f=>execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replace(/\r\n/g,'\n');
for(const file of ['amd/src/easyedu_guide.js','easyedu-guide-kit/amd/src/easyedu_guide.js']){
 const text=read(file),indent=file.startsWith('amd/')?'      ':'      ';
 const branch=/      const glyph = fullscreenButton\.querySelector\('\[data-easyedu-guide-fullscreen-glyph\]'\);\n      if \(glyph\) \{\n        glyph\.setAttribute\('d', state\.active \? glyph\.dataset\.exitPath : glyph\.dataset\.enterPath\);\n      \} else \{\n        const icon = fullscreenButton\.querySelector\('\.fa'\);\n        icon\?\.classList\.toggle\('fa-expand', !state\.active\);\n        icon\?\.classList\.toggle\('fa-compress', state\.active\);\n      \}/;
 assert.ok(branch.test(text),file+' bounded branch');
 assert.equal(text.replace(branch,indent+"const icon = fullscreenButton.querySelector('.fa');\n"+
  indent+"icon?.classList.toggle('fa-expand', !state.active);\n"+indent+"icon?.classList.toggle('fa-compress', state.active);"),old(file));
}
for(const file of ['templates/easyedu_guide.mustache','easyedu-guide-kit/templates/easyedu_guide.mustache']){
 const text=read(file),block=/                    \{\{#discoverypresentation\}\}\n[\s\S]*?                    \{\{\/discoverypresentation\}\}\n                    \{\{\^discoverypresentation\}\}<span class="fa fa-expand" aria-hidden="true"><\/span>\{\{\/discoverypresentation\}\}/;
 assert.ok(block.test(text),file+' opt-in SVG');
 assert.equal(text.replace(block,'                    <span class="fa fa-expand" aria-hidden="true"></span>'),old(file));
}
const cssRule='.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery .easyedu-guide-fullscreen-glyph,\n'+
 '.path-local-groupimport .easyedu-guide.easyedu-guide--discovery .easyedu-guide-fullscreen-glyph {\n'+
 '  display: block;\n  inline-size: 1em;\n  block-size: 1em;\n  flex: none;\n}\n';
assert.ok(read('styles.css').includes(cssRule));assert.equal(read('styles.css').replace(cssRule,''),old('styles.css'));
for(const file of ['manage.php','classes/local/guide_discovery.php','amd/src/course_manager.js',
 'easyedu-guide-kit/amd/src/easyedu_guide_fullscreen.js','lang/en/local_groupimport.php','lang/fr/local_groupimport.php'])
 assert.equal(read(file),old(file),'Native business/lifecycle/curriculum unchanged: '+file);
(async()=>{
 const terser=require(path.join(process.argv[2],'terser')),source=read('amd/src/easyedu_guide.js');
 const expected=await terser.minify({'../src/easyedu_guide.js':source.replace('define([], function()',
  'define("local_groupimport/easyedu_guide", [], function()')},{compress:true,mangle:false,
  sourceMap:{filename:'easyedu_guide.min.js',url:'easyedu_guide.min.js.map'}});
 assert.equal(read('amd/build/easyedu_guide.min.js'),expected.code+'\n');
 assert.equal(read('amd/build/easyedu_guide.min.js.map'),expected.map+'\n');
 console.log('PASS exact native/embedded adaptation, CSS-only glyph rule, deterministic AMD/map; business and Motion unchanged');
})().catch(error=>{console.error(error);process.exitCode=1;});
