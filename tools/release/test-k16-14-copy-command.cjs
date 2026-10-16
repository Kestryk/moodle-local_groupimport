// Exercise the real Move-dialog command builder with repeated source pairs.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('amd/src/local/cm/move_modal.js','utf8');
const start=source.indexOf('            const pairs = memberSnapshot;');
const end=source.indexOf('            chooser.close();',start);
assert(start>=0&&end>start);
const pairs=Object.freeze([
    Object.freeze({groupid:'11',userid:'21',fullname:'One'}),
    Object.freeze({groupid:'12',userid:'21',fullname:'One'}),
    Object.freeze({groupid:'12',userid:'22',fullname:'Two'}),
]);
for(const checked of [false,true]){
    const result=vm.runInNewContext(source.slice(start,end)+';({payload,users})',{
        memberSnapshot:pairs,removeOrigin:{checked},courseId:7,value:'13',
    });
    const payload=JSON.parse(JSON.stringify(result.payload));
    if(checked){
        assert.deepEqual(payload,{courseid:7,action:'addusers',groupid:'13',userids:['21','22']});
        assert(!('groupids' in payload),'Copies must never submit source-removal pairs');
    }else{
        assert.deepEqual(payload,{courseid:7,action:'movemembers',destinationid:'13',
            groupids:['11','12','12'],userids:['21','21','22']});
    }
    assert.equal(result.users.length,2,'One destination rendering per distinct participant');
    assert.equal(pairs.length,3,'The immutable source selection is preserved');
}
console.log('PASS production Move command: copy uses existing addusers, deduplicates users across origins; move pairs unchanged');
