// Deterministic generated AMD/map; toolchain path supplied by the caller.
const fs=require('node:fs'),path=require('node:path');
if(!process.argv[2])throw Error('Supply the directory containing terser.');
const terser=require(path.join(path.resolve(process.argv[2]),'terser'));
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'amd/src/easyedu_guide.js'),'utf8').replace(/\r\n/g,'\n');
(async()=>{const result=await terser.minify({'../src/easyedu_guide.js':source.replace('define([], function()','define("local_groupimport/easyedu_guide", [], function()')},
 {compress:true,mangle:false,sourceMap:{filename:'easyedu_guide.min.js',url:'easyedu_guide.min.js.map'}});
for(const [file,content]of [['easyedu_guide.min.js',result.code],['easyedu_guide.min.js.map',result.map]])fs.writeFileSync(path.join(root,'amd/build',file),content+'\n');
console.log('Built named Guide AMD and map without sourcesContent.');})().catch(e=>{console.error(e);process.exitCode=1;});
