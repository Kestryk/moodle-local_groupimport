// Entire unrelated engine/CSS preservation, compared to the review's pinned base.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const kit=path.resolve(process.argv[2]),root=path.resolve(__dirname,'../..');
const norm=s=>s.replace(/\r\n/g,'\n');
const old=(repo,pin,file)=>norm(execFileSync('git',['show',pin+':'+file],{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024}));
const current=(repo,file)=>norm(fs.readFileSync(path.join(repo,file),'utf8'));
const omit=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return text.slice(0,a)+text.slice(b);};
const controller='guide/amd/src/easyedu_guide.js';
assert.equal(omit(current(kit,controller),'const playDiscoveryScene =','const stopSlideTransition ='),
    omit(old(kit,'27045fe',controller),'const playDiscoveryScene =','const stopSlideTransition ='),'All guide navigation, paths, persistence and other controllers unchanged');
const css=current(root,'styles.css'),baseline=old(root,'6b3cd59','styles.css');
const start='.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery .easyedu-guide-scene__header,';
const end='.local-groupimport-easystud-easyedu-guide.easyedu-guide--discovery .easyedu-guide-scene__actions .btn[data-guide-scene-command=add],';
assert.equal(omit(css,start,end),omit(baseline,start,end),'Complete unrelated compiled CSS and Motion unchanged');
for(const file of ['amd/src/course_manager.js','amd/src/motion.js','classes/local/guide_discovery_activity.php']){
    if(fs.existsSync(path.join(root,file)))assert.equal(current(root,file),old(root,'6b3cd59',file),file+' unchanged');
}
let product=current(root,'classes/local/guide_discovery.php');
product=product.replace("            'comparelabel' => get_string('discovery_demo_compare', 'local_groupimport'),\n",'');
product=product.replace("            // The preceding membership paragraph already names Add/Move,\n            // source/destination and preserved memberships. Keep one explanation.\n            if ($kind === 'membership') {\n                $scene['introalreadyexplained'] = true;\n            }\n",'');
assert.equal(product,old(root,'6b3cd59','classes/local/guide_discovery.php'),'Complete curriculum, targets, adapters and path definitions preserved');
for(const file of ['scss/easyedu/components/_guide-discovery.scss','easyedu-guide-kit/amd/src/easyedu_guide.js','easyedu-guide-kit/templates/easyedu_guide.mustache']){
    const canonical=file.replace('scss/easyedu/','scss/easyedu/').replace('easyedu-guide-kit/','guide/');
    assert.equal(current(root,file),current(kit,canonical),file+' canonical parity');
}
console.log('PASS entire unrelated canonical engine, consumer commands/Motion, compiled CSS and embedded source parity.');
