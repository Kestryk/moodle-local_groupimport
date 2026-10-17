const {expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const {login,ready,settle}=require('./k16-sort-copy-helper.cjs');
const evidence='C:/dev/Moodle 51 Perf/moodle/local/recette-guide-20261017';
module.exports=async({page,browser},info,cells,levels=['full','reduced','minimal'])=>{
 testTimeout(info);fs.mkdirSync(evidence,{recursive:true});
 const report={source:'d44585d838ceb7b8e659c18c7ab3415741bcd7e5',checks:[],errors:[],consoleErrors:[],blockedWrites:[],completed:false};
 const save=()=>fs.writeFileSync(info.outputPath('guide-refonte.json'),JSON.stringify(report,null,2));
 save();const url=await login(page),cookies=await page.context().cookies();
 let captureTail=Promise.resolve(); const captureOne=async(p,row)=>{const file=path.join(evidence,'captures.json'),index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
  if(index.length>=6||index.some(x=>x.lot===row.lot))return;const name='fail-'+(index.length+1)+'-'+row.lot.replaceAll('/','-')+'-'+row.lang+'-'+row.width+'.png';row.capture=info.outputPath(name);await p.screenshot({path:row.capture});index.push({lot:row.lot,path:row.capture});fs.writeFileSync(file,JSON.stringify(index,null,2));};
 const capture=(p,row)=>{const next=captureTail.then(()=>captureOne(p,row));captureTail=next.catch(()=>{});return next;};
 const exercise=async(lang,width,level)=>{
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390,isMobile:width===390,locale:lang});await context.addCookies(cookies);const p=await context.newPage();
  const tag={lang,width,level,touch:width===390};p.on('pageerror',e=>{report.errors.push({...tag,error:e.message});save();});p.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push({...tag,error:m.text()});save();}});
  await p.route('**/local/groupimport/ajax.php*',r=>{if(r.request().method()==='GET')return r.continue();report.blockedWrites.push({...tag,data:r.request().postData()});save();return r.abort();});
  const check=async(lot,point,fn)=>{const row={...tag,lot,point,status:'RUNNING',measure:{}};report.checks.push(row);save();try{await fn(row);row.status=row.notApplicable?'N/A':'PASS';}catch(e){row.status='FAIL';row.error=e.message;await capture(p,row).catch(()=>{});}save();return row;};
  try{
   const prerequisite={...tag,lot:'READY',point:'native load',status:'RUNNING',measure:{}};report.checks.push(prerequisite);save();
   const failed=[];p.on('requestfailed',r=>failed.push({url:r.url().split('?')[0],error:r.failure()?.errorText}));let readyTimer;
   let root;
   try{root=await Promise.race([ready(p,new URL(url),lang,width),new Promise((_,reject)=>{readyTimer=setTimeout(()=>reject(Error('Native ready prerequisite exceeded 120s')),120000);})]);prerequisite.status='PASS';}
   catch(e){prerequisite.status='FAIL';prerequisite.error=e.message;prerequisite.measure={url:p.url(),failed,dom:await p.evaluate(()=>({title:document.title,root:document.querySelector('#local-groupimport-easystud')?.getAttributeNames().filter(a=>a.startsWith('data-')).map(a=>[a,document.querySelector('#local-groupimport-easystud').getAttribute(a)]),guide:!!document.querySelector('[data-easyedu-guide-root]'),require:typeof window.require,scripts:[...document.scripts].map(s=>s.src).filter(Boolean).slice(-8)})).catch(()=>null)};throw e;}
   finally{clearTimeout(readyTimer);save();}p.setDefaultTimeout(10000);
   await root.evaluate(async(n,level)=>{const M=await new Promise(r=>require(['local_groupimport/motion'],r));M.setLevel(n,level);},level);
   if(!await p.locator('[data-easyedu-guide-open]:visible').count())await p.locator('[data-easyedu-navigation-open]:visible').first().click();await p.locator('[data-easyedu-guide-open]:visible').first().click();
   const modal=p.locator('[data-easyedu-guide-modal]:visible');await expect(modal).toBeVisible();await settle(modal);const nav=modal.locator('[data-easyedu-guide-nav-item]');
   const navIds=await nav.evaluateAll(ns=>ns.map(n=>n.getAttribute('data-easyedu-guide-nav-item')));const slides=[];
   await check('C-G7/J-G4','13 slides and Create third chapter',async row=>{row.measure.count=navIds.length;row.measure.labels=await nav.allTextContents();expect(navIds.length).toBe(13);expect(row.measure.labels[2]).toMatch(lang==='fr'?/Créer/:/Creat/);});
   for(let i=0;i<navIds.length;i++){
    await nav.nth(i).click();await settle(modal);const slide=modal.locator('[data-easyedu-guide-slide="'+navIds[i]+'"]');
    await check('C-G1/P-G6','slide '+(i+1)+' rhythm, pill visibility and containment',async row=>{
     row.measure=await slide.evaluate(n=>{const modal=n.closest('[data-easyedu-guide-modal]'),body=modal.querySelector('.easyedu-guide-modal__body'),head=modal.querySelector('.easyedu-guide-modal__header'),h=n.querySelector('h3,h2'),active=modal.querySelector('[data-easyedu-guide-nav-item][aria-current="step"]'),strip=active?.closest('[data-easyedu-guide-nav]'),a=active?.getBoundingClientRect(),b=strip?.getBoundingClientRect(),r=modal.getBoundingClientRect();
      const progress=[...modal.querySelectorAll('[data-easyedu-guide-progress-label]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.trim());
      return {pageScrollX:scrollX,pageOverflow:document.documentElement.scrollWidth-innerWidth,modalScroll:modal.scrollLeft,modalOverflow:modal.scrollWidth-modal.clientWidth,bodyScroll:body.scrollLeft,bodyHeight:body.getBoundingClientRect().height,modalRect:{x:r.x,y:r.y,width:r.width,height:r.height},headerHeight:head.getBoundingClientRect().height,
       lineHeight:getComputedStyle(body).getPropertyValue('--easyedu-line-height-body').trim(),measure:getComputedStyle(n.closest('[data-easyedu-guide-root]')).getPropertyValue('--easyedu-guide-reading-measure').trim(),title:h?{font:getComputedStyle(h).fontSize,line:getComputedStyle(h).lineHeight}:null,
       pill:a?{x:a.x,right:a.right,width:a.width,height:a.height,stripLeft:b.left,stripRight:b.right,stripScroll:strip.scrollLeft,visible:a.left>=b.left-.5&&a.right<=b.right+.5}:null,progress};});
     slides.push({slide:i+1,...row.measure});expect(row.measure.pageScrollX).toBe(0);expect(row.measure.pageOverflow).toBeLessThanOrEqual(1);expect(row.measure.modalScroll).toBe(0);expect(row.measure.bodyScroll).toBe(0);expect(row.measure.lineHeight).toBe('1.5');expect(row.measure.measure).toBe('38rem');if(row.measure.title){expect(row.measure.title.font).toBe('18px');expect(row.measure.title.line).toBe('24px');}expect(row.measure.pill.visible).toBe(true);
     if(width===390){expect(row.measure.headerHeight).toBe(56);if(i===2)expect(row.measure.progress).toContain('3 / 13');}
    });
    const scenes=slide.locator('[data-easyedu-guide-scene]');
    for(let j=0;j<await scenes.count();j++){
     const scene=scenes.nth(j),kind=await scene.getAttribute('data-easyedu-guide-scene');const start=scene.locator('[data-guide-scene-command="start"]');if(!await start.count())continue;
     const modes=await scene.locator('[data-guide-scene-command="add"],[data-guide-scene-command="move"]').count()?['add','move']:[null];
     for(const mode of modes)await check('J-G2/C-G5/J-G1/C-G6','slide '+(i+1)+' demo '+kind+' '+(mode||''),async row=>{
      if(mode)await scene.locator('[data-guide-scene-command="'+mode+'"]').click();await settle(scene);
      await scene.evaluate(n=>{n.__guideReceipt=[];const t=performance.now();n.__guideReceiptTimer=setInterval(()=>{
       const copy=n.querySelector('[data-guide-live-copy]'),activity=n.querySelector('[data-guide-activity]'),cursor=n.querySelector('[data-guide-cursor],[data-guide-inspection-cursor]'),touch=cursor?.querySelector('[data-guide-cursor-touch]'),mouse=cursor?.querySelector('.easyedu-guide-scene__cursor-mouse'),r=n.getBoundingClientRect();
       const vis=e=>!!e&&!e.hidden&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
       const animations=n.getAnimations({subtree:true}).filter(a=>a.playState==='running').map(a=>({duration:a.effect.getTiming().duration,iterations:a.effect.getTiming().iterations,frames:a.effect.getKeyframes()}));
       n.__guideReceipt.push({ms:performance.now()-t,phase:n.dataset.guidePhase,finished:n.dataset.guideSceneFinished,copy:copy?.textContent,copyDisplay:copy?getComputedStyle(copy).display:null,lineClamp:copy?getComputedStyle(copy).webkitLineClamp:null,whiteSpace:copy?getComputedStyle(copy).whiteSpace:null,
        activity:vis(activity),activityDisplay:activity?getComputedStyle(activity).display:null,cursorVisible:vis(cursor),touchVisible:vis(cursor)&&vis(touch),mouseVisible:vis(cursor)&&vis(mouse),rippleCount:n.querySelectorAll('[data-guide-cursor-ripple]').length,sceneWidth:r.width,sceneX:r.x,animations,
        panels:[...n.querySelectorAll('[data-guide-confirm],[data-guide-menu],[data-guide-inspection-panel],[data-guide-inspection-menu]')].filter(vis).map(e=>{const a=e.getBoundingClientRect(),b=n.closest('.easyedu-guide-modal__body').getBoundingClientRect();return {name:e.getAttributeNames().find(s=>/data-guide/.test(s)),x:a.x,right:a.right,y:a.y,bottom:a.bottom,bodyTop:b.top,bodyBottom:b.bottom};})});
      },100);});
      const began=Date.now();try{await start.click();await expect(scene).toHaveAttribute('data-guide-scene-finished','true',{timeout:65000});}finally{row.measure={kind,mode,elapsedMs:Date.now()-began,samples:await scene.evaluate(n=>{clearInterval(n.__guideReceiptTimer);return n.__guideReceipt;})};save();}
      const samples=row.measure.samples,anims=samples.flatMap(s=>s.animations);expect(samples.length).toBeGreaterThan(2);expect(anims.flatMap(a=>a.frames).some(f=>'height'in f)).toBe(false);
      expect(samples.every(s=>!s.copy||s.lineClamp==='none')).toBe(true);if(samples.some(s=>s.activity))expect(samples.filter(s=>s.activity).every(s=>s.activityDisplay==='inline-flex')).toBe(true);
      const pointers=samples.filter(s=>s.cursorVisible);if(pointers.length)expect(pointers.every(s=>(width<=1024?s.touchVisible&&!s.mouseVisible:s.mouseVisible&&!s.touchVisible))).toBe(true);
      if(level==='full'){expect(row.measure.elapsedMs).toBeGreaterThanOrEqual(22000);expect(row.measure.elapsedMs).toBeLessThanOrEqual(26250);}else if(level==='minimal')expect(anims).toHaveLength(0);
      else for(const a of anims){expect(Number(a.duration)).toBeLessThanOrEqual(120);expect(a.frames.some(f=>'transform'in f)).toBe(false);}
     });
    }
   }
   await check('C-G2/C-G3','responsive shell and scene layout across all slides',async row=>{row.measure.slides=slides;row.measure.touch=await p.evaluate(()=>({touch:matchMedia('(pointer:coarse)').matches,maxTouchPoints:navigator.maxTouchPoints}));if(width===768){expect(slides.every(s=>s.modalRect.height>=940)).toBe(true);}if(width===390)expect(row.measure.touch.maxTouchPoints).toBeGreaterThan(0);});
   await check('C-G2/C-G3','tablet two columns, stacked path card, compact scene and short badge',async row=>{
    row.measure=[];
    for(let i=0;i<navIds.length;i++){
     await nav.nth(i).click();await settle(modal);const slide=modal.locator('[data-easyedu-guide-slide="'+navIds[i]+'"]');
     row.measure.push(await slide.evaluate(n=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};const scene=n.querySelector('[data-easyedu-guide-scene]'),card=n.querySelector('.easyedu-guide-guided-card'),ex=n.querySelector('.easyedu-guide-slide__explanations,.easyedu-guide-introduction__topics'),body=n.closest('.easyedu-guide-modal__body');const short=scene?.querySelector('.easyedu-guide-scene__caption-short'),full=scene?.querySelector('.easyedu-guide-scene__caption-full');
      return {slide:n.getAttribute('data-easyedu-guide-slide'),scene:scene?{...rect(scene),padding:getComputedStyle(scene).padding,border:getComputedStyle(scene).borderTopWidth,body:rect(body)}:null,card:card?{...rect(card),columns:getComputedStyle(card).gridTemplateColumns}:null,explanations:ex?{columns:getComputedStyle(ex).gridTemplateColumns,...rect(ex)}:null,badge:short?{short:getComputedStyle(short).display,full:getComputedStyle(full).display,text:short.textContent}:null};}));
    }
    save();if(width===390){for(const m of row.measure.filter(m=>m.scene)){expect(m.scene.border).toBe('0px');expect(m.scene.padding).toBe('12px');if(m.badge){expect(m.badge.short).not.toBe('none');expect(m.badge.full).toBe('none');}}}
   });
   await modal.locator('[data-easyedu-guide-close]').first().click();
  }catch(e){report.checks.push({...tag,lot:'HARNESS/READY',point:'case prerequisite',status:'FAIL',error:e.message});save();}
  finally{await context.close();save();}
 };
 for(const [lang,width] of cells){
  // Three read-only browser contexts share the owned runtime lease; no business writes.
  await Promise.all(levels.map(level=>exercise(lang,width,level)));
 }
 report.completed=true;save();
};
function testTimeout(info){info.setTimeout(1700000);}
