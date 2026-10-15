const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
if(!process.argv[2])throw Error('Supply the directory containing terser.');
const terser=require(path.join(path.resolve(process.argv[2]),'terser')),root=path.resolve(__dirname,'../..');
(async()=>{
 const source=fs.readFileSync(path.join(root,'amd/src/page_bootstrap.js'),'utf8').replace(/\r\n/g,'\n');
 const result=await terser.minify({'../src/page_bootstrap.js':source.replace('define([','define("local_groupimport/page_bootstrap", [')},{compress:true,mangle:false,sourceMap:{filename:'page_bootstrap.min.js',url:'page_bootstrap.min.js.map'}});
 vm.runInNewContext(result.code,{define:(name,deps,factory)=>{assert.equal(name,'local_groupimport/page_bootstrap');assert.equal(JSON.stringify(deps),'["local_groupimport/easyedu_guide","local_groupimport/course_manager","local_groupimport/card_title_accent"]');assert.equal(typeof factory({},{},{}).init,'function');}});
 fs.writeFileSync(path.join(root,'amd/build/page_bootstrap.min.js'),result.code+'\n');fs.writeFileSync(path.join(root,'amd/build/page_bootstrap.min.js.map'),result.map+'\n');console.log('Page bootstrap named AMD/map PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
