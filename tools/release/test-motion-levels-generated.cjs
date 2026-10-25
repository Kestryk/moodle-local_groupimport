// Execute the generated Moodle AMD, including native keyframes handed to WAAPI.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const attrs=new Map(),classes=new Set(),calls=[],events=[];
const node={
 getAttribute:k=>attrs.get(k)||null,setAttribute:(k,v)=>attrs.set(k,v),
 closest:selector=>selector.includes('motion-level')&&attrs.has('data-easyedu-motion-level')?node:
  selector.includes('respect-system-motion')&&attrs.has('data-easyedu-respect-system-motion')?node:
  selector.includes('motion-policy')&&attrs.has('data-easyedu-motion-policy')?node:null,
 classList:{contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},
 style:{setProperty:()=>{},removeProperty:()=>{}},
 dispatchEvent:e=>events.push(e),getAnimations:()=>[],
 animate:(frames,options)=>{calls.push({frames,options});return {finished:Promise.resolve(),cancel(){}};},
};
const document={body:{classList:node.classList},querySelector:s=>node.closest(s),querySelectorAll:()=>[node]};
let api;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../amd/build/motion.min.js'),'utf8'),{
 window:{matchMedia:()=>({matches:true})},document,
 CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
 define:(name,deps,factory)=>{assert.equal(name,'local_groupimport/motion');api={};factory(api);},
});
(async()=>{
 for(const key of ['getLevel','setLevel','scrollBehavior','respectsSystemMotion'])assert.equal(typeof api[key],'function',key);
 assert.equal(api.getLevel(node),'full','OS reduction ignored by default');
 assert.equal(api.respectsSystemMotion(node),false);
 for(const level of ['full','reduced','minimal']){
  calls.length=0;assert.equal(api.setLevel(node,level),level);assert.equal(api.getLevel(node),level);
  assert.equal(api.scrollBehavior(node),level==='full'?'smooth':'auto');
  assert.equal(attrs.get('data-easyedu-motion-policy'),level==='minimal'?'disabled':'enabled');
  await api.enter(node,{duration:220,distance:'12px'});
  if(level==='minimal')assert.equal(calls.length,0);
  else {
   assert.equal(calls.length,1);assert.equal(calls[0].options.duration,level==='full'?220:120);
   if(level==='reduced'){assert.equal(calls[0].options.delay,0);assert.ok(calls[0].frames.every(f=>!('transform'in f)&&!('height'in f)));}
   else assert.ok(calls[0].frames.some(f=>f.transform.includes('12px')));
  }
 }
 assert.equal(api.setLevel(node,'unexpected'),null);assert.equal(api.getLevel(node),'minimal');
 api.setLevel(node,'full');attrs.set('data-easyedu-respect-system-motion','1');assert.equal(api.getLevel(node),'reduced');
 attrs.delete('data-easyedu-respect-system-motion');attrs.delete('data-easyedu-motion-level');attrs.set('data-easyedu-motion-policy','disabled');assert.equal(api.getLevel(node),'minimal');
 assert.ok(events.every(e=>e.type==='easyedu:motionlevelchange'));
 console.log('Generated Motion: exports, three levels, fade-only120ms, no animation minimal, OS opt-in, fallback PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
