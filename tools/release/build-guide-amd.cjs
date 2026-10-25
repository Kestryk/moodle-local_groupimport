// Deterministic generated AMD/map; toolchain path supplied by the caller.
require('./verify-build-versions.cjs').assertNode();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
if(!process.argv[2])throw Error('Supply the directory containing terser.');
const terser=require(path.join(path.resolve(process.argv[2]),'terser'));
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'amd/src/easyedu_guide.js'),'utf8').replace(/\r\n/g,'\n');
const boundary="define(['local_groupimport/motion', 'local_groupimport/easyedu_bubble'], function(Motion, EasyeduBubble)";
assert.equal(source.split(boundary).length,2,'Exactly one current Guide AMD dependency boundary required');
(async()=>{const result=await terser.minify({'../src/easyedu_guide.js':source.replace(boundary,'define("local_groupimport/easyedu_guide", ["local_groupimport/motion","local_groupimport/easyedu_bubble"], function(Motion, EasyeduBubble)')},
 {compress:true,mangle:false,sourceMap:{filename:'easyedu_guide.min.js',url:'easyedu_guide.min.js.map'}});
let exported;
vm.runInNewContext(result.code,{define:(name,deps,factory)=>{
 assert.equal(name,'local_groupimport/easyedu_guide');assert.equal(JSON.stringify(deps),'["local_groupimport/motion","local_groupimport/easyedu_bubble"]');
 exported=factory({disclosePanel:()=>Promise.resolve(true),cancel:()=>{}},{createBubbleController:()=>({})});
}});
for(const name of ['destroy','getPathContext','getPathContextToken','setPathContext','init'])assert.equal(typeof exported[name],'function',name+' callable');
for(const [file,content]of [['easyedu_guide.min.js',result.code],['easyedu_guide.min.js.map',result.map]])fs.writeFileSync(path.join(root,'amd/build',file),content+'\n');
console.log('Built named Guide AMD and map without sourcesContent.');})().catch(e=>{console.error(e);process.exitCode=1;});
