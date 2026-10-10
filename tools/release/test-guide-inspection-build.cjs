// Source/build and bounded CSS regression. No Moodle bootstrap or course write.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const postcss = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const baseline = '1af4b341c83a32ccc1909c44357f085a68384cec';
const read = file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const old = file=>execFileSync('git',['show',baseline + ':' + file],
    {cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replace(/\r\n/g,'\n');
const source = read('amd/src/easyedu_guide.js');
const map = JSON.parse(read('amd/build/easyedu_guide.min.js.map'));
assert.deepEqual(map.sources,['../src/easyedu_guide.js']);
assert.ok(read('amd/build/easyedu_guide.min.js').includes('local_groupimport/easyedu_guide'));
for (const file of ['classes/local/guide_discovery.php','lang/en/local_groupimport.php','lang/fr/local_groupimport.php']) {
    assert.equal(read(file),old(file),'Curriculum/paths/localization adapter unchanged: ' + file);
}
const textarea = /data-easystud-paste-box|data-easystud-group-email-box|data-easystud-grouping-groups-box|easyedu-message-dialog__field/;
const fingerprint = css=>{
    const rules=[];
    postcss.parse(css).walkRules(rule=>{
        if (rule.selector.includes('easyedu-guide')) return;
        const parents=[];
        for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule')parents.unshift([p.name,p.params]);
        const declarations=(rule.nodes||[]).filter(n=>n.type==='decl').filter(n=>
            !(textarea.test(rule.selector) && /^(font(?:-|$)|line-height$)/.test(n.prop)))
            .map(n=>[n.prop,n.value,!!n.important]);
        if(declarations.length)rules.push({selector:rule.selector,parents,declarations});
    });
    return rules;
};
const currentCSS=fingerprint(read('styles.css')),previousCSS=fingerprint(old('styles.css'));
assert.equal(currentCSS.length,previousCSS.length,'Non-Guide rule count');
currentCSS.forEach((rule,index)=>assert.deepEqual(rule,previousCSS[index],
    'Non-Guide CSS rule unchanged at index' + index + ': ' + rule.selector));
// The existing builder intentionally omits sourcesContent. Reproduce both
// artifacts from the named source; do not add source disclosure to the package.
(async()=>{
    const terser=require(path.join(path.dirname(process.argv[2]),'terser'));
    const expected=await terser.minify({'../src/easyedu_guide.js':source.replace('define([], function()',
        'define("local_groupimport/easyedu_guide", [], function()')},{compress:true,mangle:false,
        sourceMap:{filename:'easyedu_guide.min.js',url:'easyedu_guide.min.js.map'}});
    assert.equal(read('amd/build/easyedu_guide.min.js'),expected.code+'\n');
    assert.equal(read('amd/build/easyedu_guide.min.js.map'),expected.map+'\n');
    console.log('PASS deterministic AMD/map build; unchanged adapters; non-Guide CSS except scoped textarea typography');
})().catch(error=>{console.error(error);process.exitCode=1;});
