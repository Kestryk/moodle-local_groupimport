const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {login,ready,settle}=require('./k16-sort-copy-helper.cjs');
test('Guide refonte painted pointer successor native',async({page,browser},info)=>{
 test.setTimeout(1700000);const report={checks:[],errors:[],consoleErrors:[],blockedWrites:[]};const save=()=>fs.writeFileSync(info.outputPath('guide-pointer.json'),JSON.stringify(report,null,2));
 const url=await login(page),cookies=await page.context().cookies();
 for(const lang of ['fr','en'])for(const width of [1600,1280,768,390]){
  await Promise.all(['full','reduced','minimal'].map(async level=>{
   const tag={lang,width,level},context=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390,isMobile:width===390});await context.addCookies(cookies);const p=await context.newPage();
   p.on('pageerror',e=>{report.errors.push({...tag,error:e.message});save();});p.on('console',m=>{if(m.type()==='error'){report.consoleErrors.push({...tag,error:m.text()});save();}});
   await p.route('**/local/groupimport/ajax.php*',r=>{if(r.request().method()==='GET')return r.continue();report.blockedWrites.push({...tag,action:new URLSearchParams(r.request().postData()||'').get('action')});save();return r.abort();});
   try{
    let timeout;const root=await Promise.race([ready(p,new URL(url),lang,width),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Pointer probe readiness exceeded120s')),120000);})]).finally(()=>clearTimeout(timeout));p.setDefaultTimeout(12000);
    await root.evaluate(async(n,l)=>{const M=await new Promise(r=>require(['local_groupimport/motion'],r));M.setLevel(n,l);},level);
    if(!await p.locator('[data-easyedu-guide-open]:visible').count())await p.locator('[data-easyedu-navigation-open]:visible').first().click();await p.locator('[data-easyedu-guide-open]:visible').first().click();
    const modal=p.locator('[data-easyedu-guide-modal]:visible'),nav=modal.locator('[data-easyedu-guide-nav-item]');await settle(modal);
    for(let i=0;i<await nav.count();i++){
     await nav.nth(i).click();await settle(modal);const slide=modal.locator('[data-easyedu-guide-slide]:visible'),scenes=slide.locator('[data-easyedu-guide-scene]');
     for(let j=0;j<await scenes.count();j++){
      const scene=scenes.nth(j);if(!await scene.locator('[data-guide-scene-command="start"]').count())continue;
      const kind=await scene.getAttribute('data-easyedu-guide-scene'),modes=await scene.locator('[data-guide-scene-command="add"]').count()?['add','move']:[null];
      for(const mode of modes){
       const row={...tag,lot:'J-G1/C-G6/J-G2',point:'slide '+(i+1)+' '+kind+' '+(mode||'')+' painted pointer first target',status:'RUNNING'};report.checks.push(row);save();
       try{
        if(mode)await scene.locator('[data-guide-scene-command="'+mode+'"]').click();await scene.locator('[data-guide-scene-command="start"]').click();
        const sample=()=>scene.evaluate((n,{kind,width})=>{
         const cursor=n.querySelector('[data-guide-cursor],[data-guide-inspection-cursor]'),touch=cursor?.querySelector('[data-guide-cursor-touch]'),mouse=cursor?.querySelector('.easyedu-guide-scene__cursor-mouse');
         const painted=e=>{if(!e)return false;const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let a=e;a&&a!==n.parentElement;a=a.parentElement){const s=getComputedStyle(a);if(a.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.95)return false;}return true;};
         const target=n.querySelector(kind==='simplecreate'?'[data-guide-simplecreate-input="group"]':kind==='inspection'?(width<=1024?'[data-guide-inspection-mobile-trigger]':'[data-guide-inspection-trigger]'):'[data-guide-person]');
         const disk=width<=1024?touch:mouse,paintedDisk=painted(disk),r=disk?.getBoundingClientRect(),a=target?.getBoundingClientRect(),c=cursor?.getBoundingClientRect();
         const point=r?{x:width<=1024?r.x+r.width/2:c.x,y:width<=1024?r.y+r.height/2:c.y}:null;
         const distance=point&&a?Math.hypot(Math.max(a.left-point.x,0,point.x-a.right),Math.max(a.top-point.y,0,point.y-a.bottom)):9999;
         return {kind,mode:n.getAttribute('data-guide-mode')||null,paintedDisk,touchPainted:painted(touch),mousePainted:painted(mouse),distance,point,target:a?{x:a.x,y:a.y,width:a.width,height:a.height}:null,parent:c?{width:c.width,height:c.height}:null,disk:r?{width:r.width,height:r.height}:null,phase:n.dataset.guidePhase};
        },{kind,width});
        await expect.poll(async()=>{row.measure=await sample();return row.measure.paintedDisk&&row.measure.distance<=2;},{timeout:14000}).toBe(true);
        row.measure.mode=mode;expect(width<=1024?row.measure.touchPainted&&!row.measure.mousePainted:row.measure.mousePainted&&!row.measure.touchPainted).toBe(true);row.status='PASS';
       }catch(e){row.status='FAIL';row.error=e.message;
        const file='C:/dev/Moodle 51 Perf/moodle/local/recette-guide-20261017/captures.json',index=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
        if(index.length<6&&!index.some(x=>x.lot==='painted-pointer')){const capture=info.outputPath('failure-painted-pointer-'+lang+'-'+width+'-'+level+'.png');index.push({lot:'painted-pointer',path:capture});fs.writeFileSync(file,JSON.stringify(index,null,2));row.capture=capture;await p.screenshot({path:capture});}
       }finally{save();await scene.locator('[data-guide-scene-command="reset"]').click();await settle(modal);}
      }
     }
    }
   }catch(e){report.checks.push({...tag,lot:'READY',point:'pointer prerequisite',status:'FAIL',error:e.message});save();}
   finally{await context.close();}
  }));
 }
 report.completed=true;save();
});
