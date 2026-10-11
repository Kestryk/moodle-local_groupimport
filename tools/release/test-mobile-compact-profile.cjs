const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const old=f=>execFileSync('git',['show','80e9d2beec195b43d4b8fc9e3abe1b9f62a8ec51:'+f],{cwd:root,maxBuffer:32*1024*1024}).toString().replace(/\r\n/g,'\n');
const source=read('amd/src/course_manager.js');
const reconstructed=source.replace(' * Participant membership and optional profile slots opt in. Roles, name/email\n * and Grouping cards stay visible. Existing Motion measures the\n',
 ' * Only participant membership rows opt in. Roles, identity, profile fields and\n * Grouping cards are never hidden by this mode. Existing Motion measures the\n')
 .replace("        const rows = Array.from(card.querySelectorAll(\n            '[data-easystud-participant-memberships], [data-easystud-participant-profile]'\n        ));", "        const rows = Array.from(card.querySelectorAll('[data-easystud-participant-memberships]'));");
assert.equal(reconstructed,old('amd/src/course_manager.js'));
assert.equal(read('templates/manage.mustache').replace('                                                        data-easystud-participant-profile="badge"\n','').replace(' data-easystud-participant-profile="field"',''),old('templates/manage.mustache'));
for(const f of ['styles.css','manage.php','amd/src/motion.js','amd/src/easyedu_guide.js','settings.php'])assert.equal(read(f),old(f));
const a=source.indexOf('const syncParticipantDensity ='),b=source.indexOf('const bindOptionalTools =',a);
assert.ok(a>0&&b>a);let cases=0;
for(const width of [390,768,1024,1600]){
 let responsive=width<=1024,selected=[],calls=0;
 const classes=new Set(['local-groupimport-easystud--compact-users']);
 const cards=[0,1,2].map(id=>({id,rows:Array.from({length:4},()=>({hidden:false})),role:{hidden:false},identity:{hidden:false},querySelectorAll(s){assert.equal(s,'[data-easystud-participant-memberships], [data-easystud-participant-profile]');return this.rows;}}));
 const state={responsive:false,desktopCompact:true,mobileCompact:true,updateToggle(){}};
 const node={easystudParticipantDensity:state,classList:{contains:s=>classes.has(s),remove:s=>classes.delete(s),toggle:(s,v)=>v?classes.add(s):classes.delete(s)},querySelectorAll:s=>{assert.equal(s,'[data-easystud-participant-list] [data-easystud-user]');return cards;}};
 let sync=vm.runInNewContext(source.slice(a,b)+'\nsyncParticipantDensity;',{
  isResponsiveWorkspace:()=>responsive,compactClass:'local-groupimport-easystud--compact-users',getSelectedItems:()=>selected,
  syncParticipantTagOverflow(){},requestGuideHighlightRefresh(){},updateSelectionActions:()=>sync(node,{animate:false}),
  Motion:{timing:{normal:320},resize:(card,apply,options)=>{assert.equal(options.duration,320);calls++;apply();options.onComplete();}}
 });
 const check=expected=>{assert.deepEqual(cards.map(c=>c.rows.map(r=>r.hidden)),expected.map(v=>[v,v,v,v]));assert.ok(cards.every(c=>!c.role.hidden&&!c.identity.hidden));cases++;};
 sync(node,{animate:false});check(responsive?[true,true,true]:[false,false,false]);
 const before=calls;sync(node);assert.equal(calls,before);cases++;
 selected=[cards[0]];sync(node);check(responsive?[false,true,true]:[false,false,false]);
 selected=[cards[0],cards[1]];sync(node);check(responsive?[true,true,true]:[false,false,false]);
 selected=[cards[1]];sync(node);check(responsive?[true,false,true]:[false,false,false]);
 selected=[];sync(node);check(responsive?[true,true,true]:[false,false,false]);
 state.mobileCompact=false;sync(node);check([false,false,false]);
 responsive=false;sync(node);check([false,false,false]);assert.ok(classes.has('local-groupimport-easystud--compact-users'));
 responsive=true;state.mobileCompact=true;sync(node);check([true,true,true]);
}
let built;vm.runInNewContext(read('amd/build/course_manager.min.js'),{define:(name,deps,factory)=>{assert.equal(name,'local_groupimport/course_manager');built=factory({}, {}, {});}});assert.equal(typeof built.init,'function');
console.log('PASS '+cases+' isolated slot/density states; exact controller/template preservation; callable generated AMD; no native/human claim');
