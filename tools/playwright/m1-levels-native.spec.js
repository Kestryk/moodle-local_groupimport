// Contract §7. Publication-gated, one supervised fixture/lease; no synthetic preference events.
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {setup}=require('./complement5-native-helpers.cjs');
const php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe';
const runtime='C:/dev/Moodle 51 Perf/moodle/local/groupimport/';
const levels=['full','reduced','minimal'],labels={full:/^Complètes/,reduced:/^Réduites/,minimal:/^Minimales/};
const scopes='.easyedu-ui,[data-easyedu-guide-root]';
const finiteSettle=async page=>page.evaluate(async selector=>{
 const animations=document.getAnimations().filter(a=>a.effect?.target?.closest?.(selector)&&Number.isFinite(a.effect.getComputedTiming().iterations));
 await Promise.race([Promise.all(animations.map(a=>a.finished.catch(()=>{}))),new Promise((_,reject)=>setTimeout(()=>reject(Error('M1 finite animations did not settle')),5000))]);
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
},scopes);
test('M1 three levels priority hot switch system ignored all surfaces CPU4',async({page,context},info)=>{
 test.setTimeout(1500000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 // Fail before mutable setup if M1 server/JS was not published. UI composition stays product-owned.
 if(!fs.readFileSync(runtime+'lib.php','utf8').includes('easyedu_motion_level')||
    !fs.readFileSync(runtime+'amd/src/motion.js','utf8').includes('data-easyedu-motion-level'))throw Error('Full M1/M2/M3 publication required');
 const c=await setup(page,info),report={cases:[],hotSwitches:[],samples:[],performance:[],errors:c.report.errors,blocked:c.report.blocked,migration:null,restoration:null};
 const save=()=>fs.writeFileSync(info.outputPath('m1-levels.json'),JSON.stringify(report,null,2));
 if(!process.env.PLAYWRIGHT_OUTPUT_DIR)throw Error('Supervised external output required');
 const stateFile=path.resolve(process.env.PLAYWRIGHT_OUTPUT_DIR,'../m1-state.json');
 const state=(action,more=[])=>JSON.parse(execFileSync(php,[path.join(__dirname,'../perf/m1-recipe-state.php'),'--state='+stateFile,'--action='+action,...more],{encoding:'utf8',timeout:30000}));
 const cdp=await context.newCDPSession(page);let stateSaved=false;
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(selector=>{
  window.qaM1={calls:[],active:[],readyMs:null,overflow:false,exhausted:false,keys:new Set()};
  const original=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){const animation=original.call(this,frames,options);if(this.closest(selector)){if(window.qaM1.calls.length<600)window.qaM1.calls.push({classes:this.className,frames:animation.effect.getKeyframes(),timing:animation.effect.getTiming()});else window.qaM1.overflow=true;}return animation;};
  const start=performance.now();
  const frame=()=>{const root=document.querySelector('#local-groupimport-easystud,.local-groupimport-import');if(root?.dataset.easystudLoadingState==='ready'&&window.qaM1.readyMs===null)window.qaM1.readyMs=performance.now();
   for(const a of document.getAnimations()){const target=a.effect?.target;if(!target?.closest?.(selector))continue;const value={classes:target.className,frames:a.effect.getKeyframes(),timing:a.effect.getTiming()};const key=JSON.stringify(value);if(!window.qaM1.keys.has(key)){window.qaM1.keys.add(key);if(window.qaM1.active.length<600)window.qaM1.active.push(value);else window.qaM1.overflow=true;}}
   if(performance.now()-start<180000)requestAnimationFrame(frame);else window.qaM1.exhausted=true;
  };requestAnimationFrame(frame);
 },scopes);
 const checkLevel=async(level,pageName)=>{
  const result=await page.evaluate(async({level,scopes})=>{
   const roots=[...document.querySelectorAll(scopes)].filter(n=>n.hasAttribute('data-easyedu-guide-root')||!n.parentElement?.closest('.easyedu-ui'));const Motion=await new Promise(resolve=>require(['local_groupimport/motion'],resolve));
   return {pageName:location.pathname,roots:roots.map(n=>({class:n.className,level:n.getAttribute('data-easyedu-motion-level'),policy:n.getAttribute('data-easyedu-motion-policy'),resolved:Motion.getLevel(n)})),body:{reduced:document.body.classList.contains('easyedu-motion-reduced'),minimal:document.body.classList.contains('easyedu-motion-disabled'),legacy:document.body.classList.contains('local-groupimport-motion-disabled')},scroll:Motion.scrollBehavior(roots[0]),system:matchMedia('(prefers-reduced-motion: reduce)').matches};
  },{level,scopes});
  report.samples.push({kind:'level',requested:level,pageName,...result});save();expect(result.roots.length).toBeGreaterThan(0);
  for(const r of result.roots){expect(r.level).toBe(level);expect(r.resolved).toBe(level);expect(r.policy).toBe(level==='minimal'?'disabled':'enabled');}
  expect(result.body.reduced).toBe(level==='reduced');expect(result.body.minimal).toBe(level==='minimal');expect(result.body.legacy).toBe(level==='minimal');expect(result.scroll).toBe(level==='full'?'smooth':'auto');
 };
 const audit=async(level,label)=>{
  await finiteSettle(page);
  const sample=await page.evaluate(selector=>{
   const q=window.qaM1;const active=document.getAnimations().filter(a=>a.effect?.target?.closest?.(selector)).map(a=>({classes:a.effect.target.className,frames:a.effect.getKeyframes(),timing:a.effect.getTiming()}));
   const effects=[...document.querySelectorAll(selector)].flatMap(root=>[root,...root.querySelectorAll('*')]).map(n=>{const s=getComputedStyle(n);return {classes:n.className,backdrop:s.backdropFilter,willChange:s.willChange,filter:s.filter};}).filter(e=>e.backdrop!=='none'||e.willChange!=='auto'||/drop-shadow/.test(e.filter));
   return {calls:q.calls,observed:q.active,active,effects,overflow:q.overflow,exhausted:q.exhausted};
  },scopes);report.samples.push({kind:'animation',level,label,...sample});save();expect(sample.overflow,'M1 observation capacity').toBe(false);expect(sample.exhausted,'M1 observation window').toBe(false);
  const records=[...sample.calls,...sample.observed,...sample.active];
  if(level==='minimal'){expect(sample.active).toEqual([]);expect(records).toEqual([]);expect(sample.effects).toEqual([]);}
  if(level==='reduced'){
   for(const a of records){expect(Number(a.timing.duration)).toBeLessThanOrEqual(120);expect(Number(a.timing.delay||0)).toBe(0);for(const f of a.frames)expect(Object.keys(f).filter(k=>!['opacity','offset','computedOffset','easing','composite'].includes(k))).toEqual([]);}
   expect(sample.effects.filter(e=>e.backdrop!=='none')).toEqual([]);
  }
 };
 const clearCapture=async()=>page.evaluate(()=>{window.qaM1.calls=[];window.qaM1.active=[];window.qaM1.overflow=false;window.qaM1.keys.clear();});
 const chooser=async choice=>{
  const entry=()=>page.getByRole('button',{name:'Affichage et animations',exact:true}).or(page.getByRole('menuitem',{name:'Affichage et animations',exact:true})).or(page.getByRole('link',{name:'Affichage et animations',exact:true})).first();
  if(!await entry().count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
  await entry().click();const dialog=page.getByRole('dialog',{name:'Affichage et animations',exact:true});await expect(dialog).toBeVisible();const origin=await page.evaluate(()=>performance.timeOrigin),before=state('inspect');
  if(choice==='default'){
   const reset=dialog.getByRole('link',{name:/Revenir à la valeur de l['’]établissement/}).or(dialog.getByRole('button',{name:/Revenir à la valeur de l['’]établissement/})).first();
   if(await reset.isEnabled())await reset.click();else expect([null,'default']).toContain(before.preference);
  }else await dialog.getByRole('radio',{name:labels[choice]}).check();
  const expected=choice==='default'?before.admin:choice;
  await expect(c.root).toHaveAttribute('data-easyedu-motion-level',expected);await expect.poll(()=>{const value=state('inspect').preference;return choice==='default'?[null,'default'].includes(value):value===choice;}).toBe(true);
  // No reload and real persisted preference are independently checked.
  const stored=state('inspect');expect(choice==='default'?[null,'default'].includes(stored.preference):stored.preference===choice).toBe(true);expect(await page.evaluate(()=>performance.timeOrigin)).toBe(origin);
  report.hotSwitches.push({choice,effective:expected,stored:stored.preference,sameDocument:true});save();
  if(await dialog.isVisible())await dialog.getByRole('button',{name:/^(Fermer|Annuler)$/}).first().click();await expect(dialog).toBeHidden();await clearCapture();await checkLevel(expected,'hot switch');
 };
 const openPage=async(name,width)=>{
  await page.setViewportSize({width,height:1000});const href=name==='manage'?c.url.href:new URL(name==='mass'?'/local/groupimport/index.php?id='+c.report.course+'&lang=fr':'/admin/settings.php?section=local_groupimport&lang=fr',c.url).href;
  await page.goto(href,{waitUntil:'domcontentloaded'});
  if(name!=='admin')await expect(page.locator(name==='manage'?'#local-groupimport-easystud':'.local-groupimport-import')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  else await expect(page.locator('#adminsettings')).toBeVisible();
  report.performance.push({page:name,width,cpuRate:4,readyMs:await page.evaluate(()=>window.qaM1.readyMs??performance.now()),productionGoalMs:5000,scope:'local CPU-throttled observation, not physical production acceptance'});save();
 };
 const guideDemo=async(level,width)=>{
  if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();await page.locator('[data-easyedu-guide-open]:visible').first().click();
  const modal=page.locator('[data-easyedu-guide-modal]:visible'),guide=modal.locator('xpath=ancestor::*[@data-easyedu-guide-root][1]');await expect(modal).toBeVisible();
  const index=await modal.locator('[data-guide-scene-command="start"]').first().evaluate(n=>n.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
  const slide=modal.locator('[data-easyedu-guide-slide="'+index+'"]'),scene=slide.locator('[data-easyedu-guide-scene]'),live=slide.locator('[data-guide-live]');
  const config=await guide.evaluate(n=>({minimum:n.easyeduGuideConfig?.narrationMinimumMs??null,words:n.easyeduGuideConfig?.narrationWordsPerMinute??null,lead:n.easyeduGuideConfig?.narrationLeadInMs??null}));
  if(report.guideReadingContract)expect(config).toEqual(report.guideReadingContract);else report.guideReadingContract=config;
  const source=fs.readFileSync(runtime+'amd/src/easyedu_guide.js','utf8'),minimum=config.minimum||Number(source.match(/narrationMinimumMs:\s*(\d+)/)?.[1]);expect(minimum).toBeGreaterThan(0);
  await clearCapture();const started=await page.evaluate(()=>performance.now());await scene.locator('[data-guide-scene-command="start"]').click();await expect(live).toHaveAttribute('data-guide-playback-state','playing');
  const next=live.locator('[data-guide-playback="next-phase"]');await expect(next).toBeEnabled({timeout:30000});const firstReadingMs=await page.evaluate(at=>performance.now()-at,started);expect(firstReadingMs).toBeGreaterThanOrEqual(minimum-120);
  for(let phase=0;phase<14&&await live.getAttribute('data-guide-playback-state')!=='finished';phase++){await page.waitForFunction(n=>n.dataset.guidePlaybackState==='finished'||!n.querySelector('[data-guide-playback="next-phase"]').disabled,await live.elementHandle(),{timeout:30000});if(await live.getAttribute('data-guide-playback-state')==='finished')break;await next.click();}
  await expect(live).toHaveAttribute('data-guide-playback-state','finished');report.samples.push({kind:'guide reading',level,width,index,config,minimum,firstReadingMs});save();await audit(level,'Guide demo '+width);await page.screenshot({path:info.outputPath('guide-'+report.cases.length+'-'+level+'-'+width+'.png')});await modal.locator('[data-easyedu-guide-close]').first().click();await expect(modal).toBeHidden();
 };
 try{
  await c.open(1280);const userId=await c.root.getAttribute('data-easystud-user-key');state('begin',['--userid='+userId]);stateSaved=true;
  report.migration=JSON.parse(execFileSync(php,[path.join(__dirname,'../perf/m1-migration-isolated.php'),runtime+'db/upgrade.php'],{encoding:'utf8',timeout:30000}));save();
  const matrix=[...levels.map(admin=>({origin:'admin default',admin,preference:'default',effective:admin})),...levels.map((preference,i)=>({origin:'user override',admin:levels[(i+2)%3],preference,effective:preference}))];
  for(const cell of matrix){state('admin',['--level='+cell.admin]);await c.open(1280);await chooser(cell.preference);report.cases.push(cell);save();
   for(const width of [1280,390])for(const name of ['manage','mass','admin']){
    await page.emulateMedia({reducedMotion:'no-preference'});await openPage(name,width);await checkLevel(cell.effective,name);await audit(cell.effective,name+' initial');
    for(const system of ['no-preference','reduce']){await page.emulateMedia({reducedMotion:system});await checkLevel(cell.effective,name+' system '+system);await clearCapture();
     if(name==='manage'){for(const mode of width>1024?['participants','both','structure']:['participants','groups','structure']){await c.view(mode,width);await audit(cell.effective,'view '+mode);await clearCapture();}
      await c.view('participants',width);const search=c.root.locator('[data-easystud-search]:visible');await search.fill('QA Guided One');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(1);await audit(cell.effective,'filtered arrival');await clearCapture();await search.fill('');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(4);
      if(system==='no-preference'){await guideDemo(cell.effective,width);await c.harmony(width,'M1 '+cell.origin+' '+cell.effective);}
     }else{const choice=page.locator('.easyedu-searchable-choice:visible').first();await choice.locator('.easyedu-searchable-choice__trigger').click();await expect(choice.locator('.easyedu-searchable-choice__panel')).toBeVisible();await audit(cell.effective,name+' menu open');await clearCapture();await page.keyboard.press('Escape');await expect(choice.locator('.easyedu-searchable-choice__panel')).toBeHidden();await audit(cell.effective,name+' menu close');}
    }
   }
  }
  expect(report.cases).toHaveLength(6);expect(report.samples.filter(s=>s.kind==='guide reading')).toHaveLength(12);c.finish();
 }finally{
  await page.screenshot({path:info.outputPath('m1-last-state.png'),timeout:5000}).catch(()=>{});
  try{if(stateSaved){report.restoration=state('restore');save();}}finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();save();}
 }
});
