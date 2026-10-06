const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),baseline='19ea9f8ebc496f13b06a697d903c1be520e588ff';
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const old=f=>execFileSync('git',['show',`${baseline}:${f}`],{cwd:root}).toString().replace(/\r\n/g,'\n');
const before='            clear: labels.clearfilterselection,\n        });';
const after='            clear: labels.clearfilterselection,\n        }, {motion: Motion});';
assert.equal(old('amd/src/course_manager.js').split(before).length,2);
assert.ok(read('amd/src/course_manager.js')===old('amd/src/course_manager.js').replace(before,after),
 'Only shared Motion dependency on filter choice call; every other controller/Guide/command unchanged');
for(const f of['styles.css','templates/manage.mustache','js/loading_state_bootstrap.js',
 'amd/src/motion.js','amd/build/motion.min.js','amd/src/searchable_choices.js',
 'amd/build/searchable_choices.min.js','scss/easyedu/components/_searchable-choices.scss',
 'ajax.php','classes/service/membership_transfer.php'])assert.ok(read(f)===old(f),`${f}: complete identity`);
const source=read('amd/src/course_manager.js');
const start=source.indexOf('const bindSearchableFilters ='),end=source.indexOf('\n};',start)+3;
const block=source.slice(start,end)+'\nbindSearchableFilters;';
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
console.log('PASS one shared Motion injection/four filter families; entire other source/CSS/choices/Motion/data unchanged.');
