const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {login,ready,settle}=require('./k16-sort-copy-helper.cjs');
test('Guide refonte strict responsive geometry native',async({page,browser},info)=>{
 test.setTimeout(1700000);const report={source:'d44585d8',checks:[],errors:[],consoleErrors:[]};const save=()=>fs.writeFileSync(info.outputPath('guide-geometry.json'),JSON.stringify(report,null,2));
 const url=await login(page),cookies=await page.context().cookies();
 for(const lang of ['fr','en'])for(const width of [1600,1280,768,390]){
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});await context.addCookies(cookies);const p=await context.newPage();
  p.on('pageerror',e=>{report.errors.push({lang,width,error:e.message});save();});p.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push({lang,width,error:m.text()});save();}});
  try{
   const root=await boundedReady(p,new URL(url),lang,width);p.setDefaultTimeout(10000);
   for(const level of ['full','reduced','minimal']){
    await root.evaluate(async(n,l)=>{const M=await new Promise(r=>require(['local_groupimport/motion'],r));M.setLevel(n,l);},level);
    if(!await p.locator('[data-easyedu-guide-open]:visible').count())await p.locator('[data-easyedu-navigation-open]:visible').first().click();await p.locator('[data-easyedu-guide-open]:visible').first().click();
    const modal=p.locator('[data-easyedu-guide-modal]:visible'),nav=modal.locator('[data-easyedu-guide-nav-item]');await expect(modal).toBeVisible();await settle(modal);
    const row={lang,width,level,lot:'C-G1/C-G2/C-G3/P-G6',point:'13 slides: title, layout, numeric pills and stable arrows',status:'RUNNING',measure:[]};report.checks.push(row);save();
    try{
     const count=await nav.count();expect(count).toBe(13);let baseline;
     for(let i=0;i<count;i++){
      await nav.nth(i).click();await settle(modal);row.currentSlide=i+1;row.pending='pill visibility';save();
      try{await expect.poll(()=>nav.nth(i).evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('[data-easyedu-guide-nav]').getBoundingClientRect();return a.left>=b.left-.5&&a.right<=b.right+.5;}),{timeout:2500}).toBe(true);}catch(e){(row.pillTimeouts||=[]).push({slide:i+1,error:e.message});}
      row.pending=null;const sample=await modal.evaluate(n=>{
       const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};const visible=e=>!!e&&!e.hidden&&e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none';
       const slide=[...n.querySelectorAll('[data-easyedu-guide-slide]')].find(visible),title=slide.querySelector('.easyedu-guide-slide__header h3'),strip=n.querySelector('[data-easyedu-guide-nav]'),header=n.querySelector('.easyedu-guide-modal__header'),arrow=n.querySelector('[data-easyedu-guide-nav-next]');
       const body=n.querySelector('.easyedu-guide-modal__body'),dialog=n.querySelector('.easyedu-guide-modal__dialog'),scene=slide.querySelector('[data-easyedu-guide-scene]'),path=slide.querySelector('.easyedu-guide-guided-card');const explanation=slide.querySelector('.easyedu-guide-introduction__topics');
       return {modal:rect(n),dialog:{...rect(dialog),borderLeft:parseFloat(getComputedStyle(dialog).borderLeftWidth),borderRight:parseFloat(getComputedStyle(dialog).borderRightWidth)},header:rect(header),arrow:rect(arrow),scrolls:{page:scrollX,modal:n.scrollLeft,dialog:dialog.scrollLeft,body:body.scrollLeft},pageOverflow:document.documentElement.scrollWidth-innerWidth,
        title:title?{font:getComputedStyle(title).fontSize,line:getComputedStyle(title).lineHeight}:null,bodyLine:getComputedStyle(body).getPropertyValue('--easyedu-line-height-body').trim(),measure:getComputedStyle(n.closest('[data-easyedu-guide-root]')).getPropertyValue('--easyedu-guide-reading-measure').trim(),
        reading:[...slide.querySelectorAll(':scope > div > p:not([class])')].filter(visible).map(e=>({...rect(e),font:getComputedStyle(e).fontSize,line:getComputedStyle(e).lineHeight,maxWidth:getComputedStyle(e).maxInlineSize,text:e.textContent.slice(0,100)})),
        pills:[...strip.querySelectorAll('[data-easyedu-guide-nav-item]')].map(e=>({...rect(e),active:e.getAttribute('aria-current')==='step',text:e.textContent.trim(),number:e.querySelector('.easyedu-guide-nav-item__number')?.textContent.trim()})),strip:rect(strip),stripScroll:strip.scrollLeft,
        ancestorScrolls:(()=>{const a=[];for(let p=strip.parentElement;p;p=p.parentElement)a.push({tag:p.tagName,class:p.className,scrollLeft:p.scrollLeft});return a;})(),
        scene:scene?{...rect(scene),border:getComputedStyle(scene).borderTopWidth,padding:getComputedStyle(scene).padding}:null,
        explanation:explanation?{...rect(explanation),columns:getComputedStyle(explanation).gridTemplateColumns,children:[...explanation.children].map(e=>rect(e))}:null,
        path:path?{...rect(path),columns:getComputedStyle(path).gridTemplateColumns,startRow:getComputedStyle(path.querySelector('[data-easyedu-guide-start-path]')||path).gridRowStart}:null};
      });row.measure.push({slide:i+1,...sample});save();baseline||=sample;
     }
     row.footerNavigation=[];
     for(const direction of ['previous','next'])for(let i=0;i<count-1;i++){
      await modal.locator('[data-easyedu-guide-'+direction+']:visible').click();await settle(modal);
      await expect.poll(()=>modal.evaluate(n=>{const a=n.querySelector('[data-easyedu-guide-nav-item][aria-current="step"]').getBoundingClientRect(),b=n.querySelector('[data-easyedu-guide-nav]').getBoundingClientRect();return a.left>=b.left-.5&&a.right<=b.right+.5;}),{timeout:2500}).toBe(true);
      row.footerNavigation.push(await modal.evaluate(n=>{const dialog=n.querySelector('.easyedu-guide-modal__dialog'),arrow=n.querySelector('[data-easyedu-guide-nav-next]'),pill=n.querySelector('[data-easyedu-guide-nav-item][aria-current="step"]');return {active:pill.getAttribute('data-easyedu-guide-nav-item'),dialogX:dialog.getBoundingClientRect().x,arrowX:arrow.getBoundingClientRect().x,scrollX,pageScroll:document.scrollingElement.scrollLeft,modalScroll:n.scrollLeft};}));save();
     }
     expect(row.footerNavigation.every(s=>s.scrollX===0&&s.pageScroll===0&&s.modalScroll===0&&Math.abs(s.dialogX-baseline.dialog.x)<=.5&&Math.abs(s.arrowX-baseline.arrow.x)<=.5)).toBe(true);
     expect(row.pillTimeouts||[]).toEqual([]);
     for(const sample of row.measure){
      expect(sample.scrolls).toEqual({page:0,modal:0,dialog:0,body:0});expect(sample.ancestorScrolls.every(a=>a.scrollLeft===0)).toBe(true);expect(sample.pageOverflow).toBeLessThanOrEqual(1);expect(Math.abs(sample.modal.x-baseline.modal.x)).toBeLessThanOrEqual(.5);expect(Math.abs(sample.dialog.x-baseline.dialog.x)).toBeLessThanOrEqual(.5);if(sample.arrow.width>0&&baseline.arrow.width>0)expect(Math.abs(sample.arrow.x-baseline.arrow.x)).toBeLessThanOrEqual(.5);
      expect(sample.bodyLine).toBe('1.5');expect(sample.measure).toBe('38rem');if(sample.title){expect(sample.title.font).toBe('18px');expect(sample.title.line).toBe('24px');}for(const p of sample.reading){expect(p.width).toBeLessThanOrEqual(608.5);expect(Math.abs(parseFloat(p.line)/parseFloat(p.font)-1.5)).toBeLessThanOrEqual(.01);}
      const active=sample.pills.find(p=>p.active);expect(active.x).toBeGreaterThanOrEqual(sample.strip.x-.5);expect(active.right).toBeLessThanOrEqual(sample.strip.right+.5);
      if(width===390){expect(sample.header.height).toBe(56);sample.pills.forEach((pill,i)=>expect(pill.number).toBe(String(i+1)));expect(active.width).toBeGreaterThan(44);for(const pill of sample.pills.filter(p=>!p.active)){expect(pill.width).toBe(44);expect(pill.height).toBeGreaterThanOrEqual(44);}
       if(sample.scene){expect(Math.abs(sample.scene.width-(sample.dialog.width-sample.dialog.borderLeft-sample.dialog.borderRight))).toBeLessThanOrEqual(.5);expect(sample.scene.border).toBe('0px');expect(sample.scene.padding).toBe('12px');}}
      if(width===768){expect(sample.dialog.height).toBeGreaterThanOrEqual(940);if(sample.explanation&&sample.explanation.children.length>1)expect(sample.explanation.columns.split(' ').length).toBe(2);}
     }row.status='PASS';
    }catch(e){row.status='FAIL';row.error=e.message;
     const file='C:/dev/Moodle 51 Perf/moodle/local/recette-guide-20261017/captures.json',index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
     if(index.length<6&&!index.some(x=>x.lot==='strict-geometry')){row.capture=info.outputPath('failure-geometry-'+lang+'-'+width+'-'+level+'.png');await p.screenshot({path:row.capture});index.push({lot:'strict-geometry',path:row.capture});fs.writeFileSync(file,JSON.stringify(index,null,2));}
     save();}
    await modal.locator('[data-easyedu-guide-close]').first().click();
   }
  }catch(e){report.checks.push({lang,width,lot:'READY',point:'geometry prerequisite',status:'FAIL',error:e.message});save();}
  finally{await context.close();}
 }
 report.completed=true;save();
});

async function boundedReady(page,url,lang,width){let timer;try{return await Promise.race([ready(page,url,lang,width),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native readiness exceeded 120s')),120000);})]);}finally{clearTimeout(timer);}}
