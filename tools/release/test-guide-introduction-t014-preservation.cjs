const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),norm=t=>t.replace(/\r\n/g,'\n');
const read=(r,f)=>norm(fs.readFileSync(path.join(r,f),'utf8'));
const before=(r,p,f)=>norm(execFileSync('git',['show',p+':'+f],{cwd:r,encoding:'utf8',maxBuffer:8*1024*1024}));
for(const f of ['amd/src/easyedu_guide.js','amd/build/easyedu_guide.min.js','amd/src/course_manager.js','amd/src/motion.js','manage.php','templates/manage.mustache'])assert.equal(read(root,f),before(root,'7332375',f),f);
assert.equal(read(kit,'guide/amd/src/easyedu_guide.js'),before(kit,'cb9edab','guide/amd/src/easyedu_guide.js'));
const stripData=t=>t.replace(/    public static function common_introduction\(bool \$specimens = false\): array \{[\s\S]*?(?=    \/\*\* Prepend the four discovery lessons)/,'');
assert.equal(stripData(read(root,'classes/local/guide_discovery.php')),stripData(before(root,'7332375','classes/local/guide_discovery.php')));
for(const language of ['en','fr']){
 const f='lang/'+language+'/local_groupimport.php',line="$string['guideintro_specimen_preview'] = '"+(language==='fr'?'Aperçu':'Preview')+"';\n";
 assert.equal(read(root,f).replace(line,''),before(root,'7332375',f));
}
const strip=css=>css.replace(/[^{}]+\{[^{}]*\}/g,block=>{
 const selectors=block.slice(0,block.indexOf('{'));
 return /\.easyedu-guide-introduction__(?:specimen(?:-caption)?|controls|action)(?=[:,\s\[]|$)/.test(selectors)&&!selectors.includes('__topics')? '':block;
}).replace(/\s+/g,' ').trim();
assert.equal(strip(read(root,'styles.css')),strip(before(root,'7332375','styles.css')),'Complete unrelated CSS including headings/scene/Motion');
assert.equal(read(root,'scss/easyedu/components/_guide-discovery.scss'),read(kit,'scss/easyedu/components/_guide-discovery.scss'));
assert.equal(read(root,'easyedu-guide-kit/templates/easyedu_guide.mustache'),read(kit,'guide/templates/easyedu_guide.mustache'));
console.log('PASS: unrelated full CSS/type, complete engines/AMD/Motion/business/curriculum preserved; one optional specimen-data function and one caption string per locale.');
