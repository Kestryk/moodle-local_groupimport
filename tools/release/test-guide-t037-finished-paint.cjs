// CSS-only successor: real localized template and current production styles.
// Synthetic paint states are NOT native playback or progression proof.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const [pw,mustache,php,output]=process.argv.slice(2),root=path.resolve(__dirname,'../..');
const {chromium}=require(pw),render={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(mustache,'utf8').replace('export default mustache;','module.exports=mustache;'),render);
assert.ok(output&&!fs.existsSync(output));
const template=fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),records=[];try{
 for(const language of ['en','fr'])for(const width of [1600,1280,768,390])for(const accent of ['#1b7f5a','#8b3470']){
  const page=await browser.newPage({viewport:{width,height:1000}});
  const payload=JSON.parse(execFileSync(php,[path.join(__dirname,'guide-demonstration-entry-fixture.php'),language],{encoding:'utf8'})).templateData;
  await page.setContent('<style>*{box-sizing:border-box}'+css+'</style><div class="easyedu-ui local-groupimport-easystud">'+render.module.exports.render(template,payload)+'</div>');
  const rows=await page.evaluate(accent=>{
   const root=document.querySelector('[data-easyedu-guide-root]');root.style.setProperty('--easyedu-accent',accent);
   const paint=n=>{const s=getComputedStyle(n);return{color:s.color,weight:s.fontWeight,font:s.fontFamily,size:s.fontSize,line:s.lineHeight};};
   const probe=document.createElement('span');probe.style.color=accent;root.append(probe);const expected=getComputedStyle(probe).color;probe.remove();
   return [...root.querySelectorAll('[data-guide-scene-header]')].map(header=>{
    const live=header.querySelector('[data-guide-live]'),copy=live.querySelector('[data-guide-live-copy]');
    header.dataset.guidePlaybackState='playing';live.dataset.guideLiveState='playing';const active=paint(copy);
    header.dataset.guidePlaybackState='finished';live.dataset.guideLiveState='finished';const finished=paint(copy);
    header.dataset.guidePlaybackState='idle';live.dataset.guideLiveState='idle';const reset=paint(copy);
    return{kind:header.closest('[data-easyedu-guide-scene]').dataset.easyeduGuideScene,active,finished,reset,expected,
     passed:finished.color===expected&&finished.weight==='700'&&active.color===reset.color&&active.weight===reset.weight&&active.font===finished.font&&active.size===finished.size&&active.line===finished.line};
   });
  },accent);
  assert.ok(rows.length>=4);records.push({language,width,accent,rows});await page.close();
 }
 fs.writeFileSync(output,JSON.stringify({records,nativeMoodleVerified:false,humanAccepted:false},null,2),{flag:'wx'});
 const failures=records.flatMap(r=>r.rows.filter(t=>!t.passed));assert.equal(failures.length,0,JSON.stringify(failures[0]));
 console.log('PASS '+records.length+' localized/width/palette isolated finished-paint cases');
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
