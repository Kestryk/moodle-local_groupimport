// Actual opt-in template/AMD in isolated Chrome; no Moodle runtime or course data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.argv[2]);
const renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8').replace('export default mustache;', 'module.exports = mustache;'),renderer);
const mustache=renderer.module.exports;
const root=path.resolve(__dirname,'../..');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});let count=0;try{
 for(const language of ['en','fr'])for(const width of [1280,768,390])for(const reduced of [false,true]){
  const data=JSON.parse(execFileSync(process.argv[4],[path.join(__dirname,'guide-demonstration-entry-fixture.php'),language],{encoding:'utf8'}));
  assert.equal(data.productionPresentationOnly,true);
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:reduced?'reduce':'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({body:'<html></html>'}));await page.goto('http://manual-entry.test');
  await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}'+fs.readFileSync(path.join(root,'styles.css'),'utf8')+'</style><div class="local-groupimport-easystud easyedu-ui">'+mustache.render(fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8'),data.templateData)+'</div>');
  await page.addScriptTag({content:'window.define=(deps,factory)=>{window.Guide=factory();};\n'+fs.readFileSync(path.join(root,'amd/build/easyedu_guide.min.js'),'utf8').replace('define("local_groupimport/easyedu_guide",','define(')});
  await page.evaluate(()=>window.Guide.init('[data-easyedu-guide-root]',{storageKey:'isolated-manual-entry',firstVisit:false,narrationMinimumMs:200}));
  await page.locator('[data-easyedu-guide-open]').first().click();
  const modal=page.locator('[data-easyedu-guide-modal]');
  for(const slide of data.templateData.slides.filter(s=>s.discoveryscene?.manualstart)){
   await modal.locator(`[data-easyedu-guide-nav-item="${slide.index}"]`).click();
   const scene=modal.locator(`[data-easyedu-guide-slide="${slide.index}"] [data-easyedu-guide-scene]`),start=scene.locator('[data-guide-scene-command="start"]');
   const live=modal.locator(`[data-easyedu-guide-slide="${slide.index}"] [data-guide-live]`);
   await start.waitFor({state:'visible'});await page.waitForTimeout(150);
   assert.equal(await live.getAttribute('data-guide-playback-state'),'idle','No automatic entry');assert.equal(await scene.getAttribute('data-guide-phase'),null);
   assert.equal(await start.innerText(),slide.discoveryscene.startlabel);assert.equal(await start.isEnabled(),true);
   assert.equal(await scene.locator('[data-guide-scene-command="replay"]').count(),0,'No duplicate Replay');
   const paint=await start.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{h:r.height,font:s.fontSize,family:s.fontFamily,gap:s.columnGap,right:r.right,parentRight:n.parentElement.getBoundingClientRect().right};});
   assert.ok(Math.abs(paint.h-30.4)<.1);assert.equal(paint.font,'12.48px');assert.equal(paint.gap,'5.6px');assert.ok(paint.family.includes('Inter'));assert.ok(paint.right<=paint.parentRight+.1);
   if(slide.discoveryscene.kind==='membership'){
    await scene.locator('[data-guide-scene-command="move"]').click();assert.equal(await live.getAttribute('data-guide-playback-state'),'idle');assert.equal(await scene.getAttribute('data-guide-mode'),'move');
   }
   await start.click();
   if(!reduced){
    assert.equal(await start.isDisabled(),true);assert.equal(await start.innerText(),slide.discoveryscene.runninglabel);
    await live.locator('[data-guide-playback="pause"]').click();assert.equal(await live.getAttribute('data-guide-playback-state'),'paused');assert.equal(await start.isDisabled(),true);
    await live.locator('[data-guide-playback="pause"]').click();
    for(let guard=0;guard<12;guard++){
     await page.waitForFunction(n=>n.dataset.guidePlaybackState==='finished'||!n.querySelector('[data-guide-playback="next-phase"]').disabled,await live.elementHandle());
     if(await live.getAttribute('data-guide-playback-state')==='finished')break;
     await live.locator('[data-guide-playback="next-phase"]').click();
    }
   }
   await page.waitForFunction(n=>n.dataset.guidePlaybackState==='finished',await live.elementHandle());
   assert.equal(await start.innerText(),slide.discoveryscene.replaylabel);assert.equal(await start.isEnabled(),true);
   assert.equal(await scene.locator('[data-guide-recap]').isVisible(),true);
   await scene.locator('[data-guide-scene-command="reset"]').click();assert.equal(await live.getAttribute('data-guide-playback-state'),'idle');assert.equal(await start.innerText(),slide.discoveryscene.startlabel);
   await start.click();await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
   assert.equal(await scene.locator('[data-guide-ghost]').count(),0,'Departure clears drag ghost');
   await modal.locator(`[data-easyedu-guide-nav-item="${slide.index}"]`).click();assert.equal(await live.getAttribute('data-guide-playback-state'),'idle');
   count++;
  }
  assert.deepEqual(errors,[]);await page.evaluate(()=>window.Guide.destroy('[data-easyedu-guide-root]'));await page.close();
 }console.log('PASS '+count+' opt-in EN/FR three-width normal/reduced manual-entry scenarios; ready/start/pause/next/finish/reset/departure/re-entry and Small paint. Native activation not tested.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
