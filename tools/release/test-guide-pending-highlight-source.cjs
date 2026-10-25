/* eslint-env node */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
for(const file of ['amd/src/easyedu_guide.js','easyedu-guide-kit/amd/src/easyedu_guide.js']) {
    assert.ok(read(file).includes('root.easyeduGuideRefreshTarget = target || root.easyeduGuideRefreshTarget || null;'),
        'Explicit queued target is preserved: '+file);
}
require('./test-guide-pending-highlight-diagnostic.cjs');
const map=JSON.parse(read('amd/build/easyedu_guide.min.js.map'));
assert.deepEqual(map.sources,['../src/easyedu_guide.js']);
assert.equal(map.sourcesContent,undefined,'Do not disclose original source inside public maps');
assert.ok(read('amd/build/easyedu_guide.min.js').includes('local_groupimport/easyedu_guide'),'Named Moodle AMD wrapping retained');
(async()=>{
    const terser=require(path.join(process.argv[2],'terser'));
    const expected=await terser.minify({'../src/easyedu_guide.js':read('amd/src/easyedu_guide.js').replace(
        "define(['local_groupimport/motion', 'local_groupimport/easyedu_bubble'], function(Motion, EasyeduBubble)",
        'define("local_groupimport/easyedu_guide", ["local_groupimport/motion","local_groupimport/easyedu_bubble"], function(Motion, EasyeduBubble)')},
        {compress:true,mangle:false,sourceMap:{filename:'easyedu_guide.min.js',url:'easyedu_guide.min.js.map'}});
    assert.ok(read('amd/build/easyedu_guide.min.js')===expected.code+'\n','Exact deterministic named AMD');
    assert.ok(read('amd/build/easyedu_guide.min.js.map')===expected.map+'\n','Exact map without source disclosure');
    console.log('PASS queued-target behavior and exact current named AMD/map; public sourcesContent absence retained.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
