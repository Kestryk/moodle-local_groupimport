/* eslint-env node */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const old=file=>execFileSync('git',['show','49b840d:'+file],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replace(/\r\n/g,'\n');
const replacement='  // A targetless viewport refresh must not erase an explicit target queued\n'+
    '  // by the current step before its first paint (notably after reduced scroll).\n'+
    '  root.easyeduGuideRefreshTarget = target || root.easyeduGuideRefreshTarget || null;';
for(const file of ['amd/src/easyedu_guide.js','easyedu-guide-kit/amd/src/easyedu_guide.js']){
    assert.ok(read(file).replace(replacement,'  root.easyeduGuideRefreshTarget = target || null;')===old(file),
        'Only canonical queued-target preservation changes: '+file);
}
for(const file of ['amd/src/course_manager.js','amd/build/course_manager.min.js','amd/build/course_manager.min.js.map',
    'manage.php','classes/local/guide_discovery.php','styles.css','templates/easyedu_guide.mustache',
    'lang/en/local_groupimport.php','lang/fr/local_groupimport.php'])assert.ok(read(file)===old(file),'Unrelated source retained: '+file);
const map=JSON.parse(read('amd/build/easyedu_guide.min.js.map'));
assert.deepEqual(map.sources,['../src/easyedu_guide.js']);
assert.equal(map.sourcesContent,undefined,'Do not disclose original source inside public maps');
assert.ok(read('amd/build/easyedu_guide.min.js').includes('local_groupimport/easyedu_guide'),'Named Moodle AMD wrapping retained');
(async()=>{
    const terser=require(path.join(process.argv[2],'terser'));
    const expected=await terser.minify({'../src/easyedu_guide.js':read('amd/src/easyedu_guide.js').replace(
        'define([], function()','define("local_groupimport/easyedu_guide", [], function()')},
        {compress:true,mangle:false,sourceMap:{filename:'easyedu_guide.min.js',url:'easyedu_guide.min.js.map'}});
    assert.ok(read('amd/build/easyedu_guide.min.js')===expected.code+'\n','Exact deterministic named AMD');
    assert.ok(read('amd/build/easyedu_guide.min.js.map')===expected.map+'\n','Exact map without source disclosure');
    console.log('PASS exact canonical one-line scheduling adaptation/build; native adapters, styles, copy, paths and course commands unchanged.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
