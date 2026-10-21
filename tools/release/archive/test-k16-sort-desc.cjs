// Exercise production comparators with off-page ids, ties and membership-count sorts.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
function comparator(file, name) {
    const source = fs.readFileSync(file, 'utf8');
    const start = source.indexOf('export const ' + name + ' =');
    const end = source.indexOf('\n};', start) + 3;
    assert(start >= 0 && end > start);
    return vm.runInNewContext(source.slice(start, end).replace('export const ', 'const ') + ';' + name,
        {normalise: s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')});
}
const users = [
    {id: 9, fullname: 'Alpha', groupids: []}, {id: 4, fullname: 'Zulu', groupids: [1, 2]},
    {id: 7, fullname: 'Écho', groupids: [1]}, {id: 2, fullname: 'Alpha', groupids: [1]},
];
const model = {byId: new Map(users.map(u => [u.id, u])), groups: new Map(users.map(u =>
    [u.id, {name: u.fullname, memberids: u.groupids.map((_, i) => users[i].id)}]))};
const ids = users.map(u => u.id);
for (const [file, name] of [['participants', 'sortParticipantIds'], ['groups', 'sortGroupIds']]) {
    const sort = comparator('amd/src/local/sm/' + file + '.js', name);
    const result = mode => Array.from(sort(model, ids, mode));
    assert.deepEqual(result('alpha'), [9, 2, 7, 4]);
    assert.deepEqual(result('alpha-desc'), [4, 7, 9, 2]);
    assert.deepEqual(result('filled'), [4, 2, 7, 9]);
    assert.deepEqual(result('empty'), [9, 2, 7, 4]);
    assert.deepEqual(result('unknown'), result('alpha'), 'Existing unknown-mode fallback is unchanged');
    assert.deepEqual(ids, [9, 4, 7, 2], 'State order must not be mutated');
}
const source=fs.readFileSync('amd/src/local/cm/pagination.js','utf8');
const start=source.indexOf('export const sortListItems =');
const end=source.indexOf('\n};',start)+3;
assert(start>=0&&end>start);
const sortGroupings=vm.runInNewContext(source.slice(start,end).replace('export const ','const ')+';sortListItems',{
    getSortableItemName:n=>n.name,
    getSortableItemCount:()=>0,
});
for(const mode of ['alpha','alpha-desc','unknown']){
    const list={children:[{id:9,name:'alpha'},{id:4,name:'zulu'},{id:7,name:'echo'},{id:2,name:'alpha'}],
        getAttribute:()=>mode,querySelector:()=>null,
        insertBefore(node){this.children.splice(this.children.indexOf(node),1);this.children.push(node);}};
    list.children.forEach(n=>{n.matches=()=>true;});
    sortGroupings(list,{selector:'grouping'});
    assert.deepEqual(list.children.map(n=>n.id),mode==='alpha-desc'?[4,7,9,2]:[9,2,7,4]);
}
console.log('PASS three production list sorts: descending, stable ties, existing modes, fallback, immutable model ids');
