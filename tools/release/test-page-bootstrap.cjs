const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const calls=[],element={dataset:{},textContent:JSON.stringify({guide:['#guide',{label:'<x> & "é"',paths:{a:['one']}}],manager:['root',5,{cardstrings:{name:'Participant…'}}]})};let exported;
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../amd/build/page_bootstrap.min.js'),'utf8'),{document:{getElementById:id=>id==='config'?element:null},define:(name,deps,factory)=>{exported=factory({init:(...args)=>calls.push(['guide',args])},{init:(...args)=>calls.push(['manager',args])},{init:()=>{}});}});
exported.init('config');exported.init('config');assert.equal(calls.length,2);assert.equal(JSON.stringify(calls),JSON.stringify([['guide',JSON.parse(element.textContent).guide],['manager',JSON.parse(element.textContent).manager]]));
assert.throws(()=>exported.init('absent'),/missing/);element.dataset={};element.textContent='{"guide":{},"manager":[]}';assert.throws(()=>exported.init('config'),/invalid/);assert.equal(calls.length,2);
console.log('Page bootstrap config integrity, order, idempotency and invalid payload PASS');
