const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),norm=t=>t.replace(/\r\n/g,'\n');
const read=(r,f)=>norm(fs.readFileSync(path.join(r,f),'utf8')),before=(r,p,f)=>norm(execFileSync('git',['show',p+':'+f],{cwd:r,encoding:'utf8',maxBuffer:8*1024*1024}));
for(const f of ['amd/src/course_manager.js','amd/src/motion.js','amd/build/motion.min.js','templates/manage.mustache','classes/local/guide_discovery.php','manage.php','lang/en/local_groupimport.php','lang/fr/local_groupimport.php'])assert.equal(read(root,f),before(root,'dbaa237',f),f);
const stripEngine=t=>t
 .replace("import {disclosePanel, cancel as cancelRecapPanel} from '../../../motion/amd/src/easyedu_motion';\n",'')
 .replace(/let recapPanelSequence = 0;[\s\S]*?(?=const stopDiscoveryScene = root => \{)/,'')
 .replace("  root.querySelectorAll('[data-guide-recap-body]').forEach(cancelRecapPanel);\n",'')
 .replace('prepareRecapDisclosure(recap); ','')
 .replace(/    const recapToggle = event.target.closest\('\[data-guide-recap-toggle\]'\);[\s\S]*?(?=    const sceneCommand =)/,'');
assert.equal(stripEngine(read(kit,'guide/amd/src/easyedu_guide.js')),before(kit,'78d7dd5','guide/amd/src/easyedu_guide.js'),'Complete canonical engine except explicit recap bridge');
const stripCss=css=>css.replace(/[^{}]+\{[^{}]*\}/g,b=>/\.easyedu-guide-scene__recap-(?:toggle|body)/.test(b.slice(0,b.indexOf('{')))?'':b).replace(/\s+/g,' ').trim();
assert.equal(stripCss(read(root,'styles.css')),stripCss(before(root,'dbaa237','styles.css')),'Complete unrelated CSS/typography/cards/scenes');
const stripTemplate=t=>t.replace(/<section class="easyedu-guide-scene__recap" data-guide-recap hidden>[\s\S]*?<\/section>/g,'RECAP');
assert.equal(stripTemplate(read(kit,'guide/templates/easyedu_guide.mustache')),stripTemplate(before(kit,'78d7dd5','guide/templates/easyedu_guide.mustache')),'Complete template outside two recap regions');
assert.equal(read(root,'easyedu-guide-kit/amd/src/easyedu_guide.js'),read(kit,'guide/amd/src/easyedu_guide.js'));
assert.equal(read(root,'easyedu-guide-kit/templates/easyedu_guide.mustache'),read(kit,'guide/templates/easyedu_guide.mustache'));
assert.equal(read(root,'scss/easyedu/components/_guide-discovery.scss'),read(kit,'scss/easyedu/components/_guide-discovery.scss'));
console.log('PASS complete engine except recap bridge, complete unrelated CSS/template/type, native business/Motion/curriculum unchanged and canonical parity');
