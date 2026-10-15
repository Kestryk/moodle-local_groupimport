const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
if(!process.argv[2])throw Error('Supply terser toolchain directory.');const terser=require(path.join(path.resolve(process.argv[2]),'terser'));
const root=path.resolve(__dirname,'../..');
(async()=>{const source=fs.readFileSync(path.join(root,'amd/src/card_title_accent.js'),'utf8').replace(/\r\n/g,'\n');
assert.equal(source.split('export const init =').length,2);
const input='define("local_groupimport/card_title_accent",[],function(){\n'+source.replace('export const init =','const init =')+'\nreturn {init};\n});';
const result=await terser.minify({'../src/card_title_accent.js':input},{compress:true,mangle:false,sourceMap:{filename:'card_title_accent.min.js',url:'card_title_accent.min.js.map'}});
vm.runInNewContext(result.code,{define:(name,deps,factory)=>{assert.equal(name,'local_groupimport/card_title_accent');assert.equal(typeof factory().init,'function');}});
fs.writeFileSync(path.join(root,'amd/build/card_title_accent.min.js'),result.code+'\n');fs.writeFileSync(path.join(root,'amd/build/card_title_accent.min.js.map'),result.map+'\n');console.log('Card title accent named AMD/map PASS');})().catch(e=>{console.error(e);process.exitCode=1;});
