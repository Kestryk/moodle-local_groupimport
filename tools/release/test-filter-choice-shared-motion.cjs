const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const declarations=require('./lib/js-declarations.cjs');
const block=declarations(root,'amd/src/local/cm/filters.js',['bindSearchableFilters'])+'\nbindSearchableFilters;';
const labels={roles:'Roles',groups:'Groups',groupings:'Groupings',searchfilteroptions:'Search',
 nofilteroptions:'No match',filterany:'Any',filterselectioncount:'__count__ selected',clearfilterselection:'Clear'};
const items=['role','group','grouping','catalog'].map(type=>({type,matches:selector=>
 (selector==='[data-easystud-role-filter]'&&type==='role')||(selector==='[data-easystud-group-filter]'&&type==='group')}));
const calls=[],controllers=new WeakMap(),Motion={disclosePanel(){},cancel(){}};
const bind=vm.runInNewContext(block,{getLabels:()=>labels,Motion,filterChoiceControllers:controllers,
 enhanceMultipleSelect:(select,copy,options)=>{const classes=[];const control={host:{classList:{add:c=>classes.push(c)},hidden:false}};
 calls.push({select,copy,options,classes,control});return control;}});
bind({querySelectorAll:()=>items});assert.equal(calls.length,4);
for(const call of calls){assert.equal(call.options.motion,Motion);assert.deepEqual(call.classes,['easyedu-searchable-choice--compact']);
 assert.equal(call.copy.clear,'Clear');assert.equal(call.control.host.hidden,call.select.type==='role');
 assert.equal(controllers.get(call.select),call.control);}
console.log('PASS current shared Motion injection and four filter families; obsolete whole-monolith freeze retired.');
