const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),norm=t=>t.replace(/\r\n/g,'\n');
const read=(r,f)=>norm(fs.readFileSync(path.join(r,f),'utf8'));
const before=(r,p,f)=>norm(execFileSync('git',['show',p+':'+f],{cwd:r,encoding:'utf8',maxBuffer:8*1024*1024}));
for(const f of ['amd/src/easyedu_guide.js','amd/build/easyedu_guide.min.js','amd/src/course_manager.js','amd/src/motion.js'])assert.equal(read(root,f),before(root,'5188f61',f),f+' unchanged');
assert.equal(read(kit,'guide/amd/src/easyedu_guide.js'),before(kit,'9407d02','guide/amd/src/easyedu_guide.js'));
assert.equal(read(root,'classes/local/guide_discovery.php').replace("            'unchangedlabel' => get_string('discovery_demo_unchanged', 'local_groupimport'),\n",'').replace("            'expectedcompactlabel' => get_string('discovery_demo_expected_compact', 'local_groupimport'),\n",''),before(root,'5188f61','classes/local/guide_discovery.php'));
for(const language of ['en','fr']){
 const f='lang/'+language+'/local_groupimport.php',line="$string['discovery_demo_unchanged'] = '"+(language==='fr'?'inchangé':'unchanged')+"';\n";
 const expected="$string['discovery_demo_expected_compact'] = '"+(language==='fr'?'Résultat prévu':'Expected result')+"';\n";
 assert.equal(read(root,f).replace(line,'').replace(expected,''),before(root,'5188f61',f));
}
const strip=css=>css.replace(/[^{}]+\{[^{}]*\}/g,block=>/\.easyedu-guide-scene__(?:memberships\[data-guide-membership-preview\]|(?:unchanged|expected)-label--compact|header\[data-guide-playback-state=(?:"idle"|idle)\])/.test(block)?(block.includes('@media')?block.slice(0,block.indexOf('{')+1):''):block).replace(/@media[^{}]*\{\s*\}/g,'').replace(/\s+/g,' ').trim();
const normalizeLane=css=>css.replace(/margin-inline: -1rem;/g,'');
const actual=strip(normalizeLane(read(root,'styles.css'))),expected=strip(normalizeLane(before(root,'5188f61','styles.css')));
if(actual!==expected){let i=0;while(actual[i]===expected[i]&&i<Math.min(actual.length,expected.length))i++;throw Error('Unrelated CSS delta '+i+': '+actual.slice(i,i+160)+' / '+expected.slice(i,i+160));}
assert.equal(read(root,'scss/easyedu/components/_guide-discovery.scss'),read(kit,'scss/easyedu/components/_guide-discovery.scss'));
console.log('PASS mobile-preview-only CSS, full controllers/AMD/business/Motion/curriculum preservation; one localized caption addition and canonical parity.');
