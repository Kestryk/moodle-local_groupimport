// I10: build the light static Guide facade (amd/src/guide_api.js) into its named AMD module.
// Usage: node tools/release/build-guide-api-amd.cjs <directory containing terser>
require('./verify-build-versions.cjs').assertNode();
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
if(!process.argv[2])throw Error('Supply the directory containing terser.');
const terser=require(path.join(path.resolve(process.argv[2]),'terser')),root=path.resolve(__dirname,'../..');
(async()=>{
 const source=fs.readFileSync(path.join(root,'amd/src/guide_api.js'),'utf8').replace(/\r\n/g,'\n');
 assert.ok(!source.includes("define(['local_groupimport/easyedu_guide'"),'The facade never depends statically on the engine.');
 const result=await terser.minify({'../src/guide_api.js':source.replace('define([','define("local_groupimport/guide_api", [')},{compress:true,mangle:false,sourceMap:{filename:'guide_api.min.js',url:'guide_api.min.js.map'}});
 vm.runInNewContext(result.code,{define:(name,deps,factory)=>{assert.equal(name,'local_groupimport/guide_api');assert.equal(JSON.stringify(deps),'["require","core/log"]');const api=factory(()=>{},{error:()=>{}});['init','destroy','load','isLoaded','getPathContext','getPathContextToken','setPathContext','guideModality'].forEach(key=>assert.equal(typeof api[key],'function',key));}});
 fs.writeFileSync(path.join(root,'amd/build/guide_api.min.js'),result.code+'\n');fs.writeFileSync(path.join(root,'amd/build/guide_api.min.js.map'),result.map+'\n');console.log('Guide API named AMD/map PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
