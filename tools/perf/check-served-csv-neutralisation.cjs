// Runs the exact served pure cell formatter; distinct from native download proof.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const [source,output]=process.argv.slice(2);
if(!source||!output)throw Error('Explicit served module and external JSON path required');
const text=fs.readFileSync(source,'utf8');
const match=text.match(/const getCsvValue = value => \{[\s\S]*?\n\};/);
assert.ok(match,'Served cell formatter exists');
const format=vm.runInNewContext(match[0]+'\ngetCsvValue');
const rows=[];
for(const value of ['=1+1','+1','-1','@A1','\t=1','\r=1','＝1','＋1','－1','＠A1']){
 const actual=format(value),expected='"\''+value.replace(/"/g,'""')+'"';
 assert.equal(actual,expected);rows.push({value,actual,pass:true});
}
for(const value of ['QA & < > " \'','ordinary',null,undefined]){
 const actual=format(value),expected='"'+(value??'').replace(/"/g,'""')+'"';
 assert.equal(actual,expected);rows.push({value:value??null,actual,pass:true});
}
fs.writeFileSync(output,JSON.stringify({source,scope:'served pure formatter; native export not certified',rows},null,2));
console.log('CSV neutralisation PASS '+rows.length+' cases');
