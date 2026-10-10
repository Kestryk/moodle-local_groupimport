// Isolated compiled shared recipe, no Moodle session or simulated scene state.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
assert.ok(process.argv[2],'Supply Playwright module path');
const {chromium}=require(process.argv[2]);
const root=path.resolve(__dirname,'../..'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});let cases=0;try{
 for(const width of [1280,768,390])for(const mode of ['playing','paused','reduce','disabled']){
  const page=await browser.newPage({viewport:{width,height:700},reducedMotion:mode==='reduce'?'reduce':'no-preference'});
  await page.setContent('<style>'+css+'</style><div class="local-groupimport-easystud easyedu-ui"><div class="local-groupimport-easystud-easyedu-guide easyedu-guide--discovery" '+
   (mode==='disabled'?'data-easyedu-motion-policy="disabled"':'')+'><div class="easyedu-guide-scene__live" data-guide-playback-state="'+mode+'">'+
   '<span class="easyedu-guide-scene__live-content"><span>Read this explanation</span><span class="easyedu-guide-scene__activity" aria-hidden="true"><span></span><span></span><span></span></span></span></div></div></div>');
  const result=await page.locator('.easyedu-guide-scene__activity').evaluate(node=>{
   const dots=[...node.children],animations=dots.flatMap(dot=>dot.getAnimations());
   const samples=[];
   for(const time of [0,120,270,450,630,900,1350]){
    animations.forEach(a=>{a.pause();a.currentTime=time;});
    const rects=dots.map(dot=>{const r=dot.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,opacity:getComputedStyle(dot).opacity};});
    samples.push({time,rects,gaps:[rects[1].x-rects[0].x-rects[0].width,rects[2].x-rects[1].x-rects[1].width]});
   }
   return{display:getComputedStyle(node).display,width:node.getBoundingClientRect().width,
    animations:animations.length,delays:animations.map(a=>a.effect.getTiming().delay),samples};
  });
  // As a flex child, inline-grid computes to its blockified grid display.
  assert.equal(result.display,'grid');assert.equal(result.width,18);
  for(const sample of result.samples){sample.gaps.forEach(g=>assert.ok(Math.abs(g-3)<.0001));sample.rects.forEach(r=>{assert.ok(Math.abs(r.width-4)<.0001);assert.ok(Math.abs(r.height-4)<.0001);});}
  if(mode==='playing'){
   assert.equal(result.animations,3);assert.deepEqual(result.delays,[0,180,360]);
   assert.ok(result.samples.some(s=>new Set(s.rects.map(r=>r.y)).size>1),'Staggered visible vertical bounce');
  }else assert.equal(result.animations,0,mode+' static policy');
  cases++;await page.close();
 }console.log('PASS '+cases+' three-width playing/paused/reduced/disabled dot recipes; equal painted gaps at seven phases.');
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
