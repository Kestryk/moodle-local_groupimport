const fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path');
const [base,course,evidence,label='result']=process.argv.slice(2);
if(!base || !course || !evidence || !path.isAbsolute(evidence)) throw Error('Pass base URL, course id, absolute evidence directory and optional label');
const version=process.env.MOODLE_TEST_BRANCH || 'native';
const out=evidence;fs.mkdirSync(out,{recursive:true});
const report={version,label,base,cases:[],errors:[],console:[],phase:'init'};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const save=()=>fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(report,null,2));
async function snap(page){return page.evaluate(()=>{
 const card=document.querySelector('#local-groupimport-easystud [data-selectable-type="participant"]');
 const rect=e=>{const r=e?.getBoundingClientRect();return r?[r.x,r.y,r.width,r.height]:null;};
 return {releaseBarrier:typeof document.querySelector("[data-easyedu-guide-root]")?.easyeduGuideFullscreen?.isHostParked==="function",fullscreen:!!document.fullscreenElement,parked:document.querySelectorAll('[data-easyedu-guide-parked]').length,
  card:rect(card),scroll:[scrollX,scrollY],root:rect(document.querySelector('#local-groupimport-easystud')),
  scrollports:['page','topofscroll'].map(id=>{const e=document.getElementById(id);return {id,top:e?.scrollTop,height:e?.scrollHeight};})};
});}
async function openGuide(page){
 if(!await page.locator('[data-easyedu-guide-open]:visible').count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
 await page.locator('[data-easyedu-guide-open]:visible').first().click();await page.locator('[data-easyedu-guide-modal]:visible').waitFor();await wait(450);
 await page.evaluate(()=>document.querySelector('#local-groupimport-easystud [data-selectable-type="participant"]').scrollIntoView({block:'center',behavior:'instant'}));
}
(async()=>{let browser;try{
 browser=await chromium.launch({executablePath:process.env.QA_CHROME_EXECUTABLE || undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1600,height:1000},recordVideo:{dir:out+'/'+label+'-video',size:{width:1600,height:1000}}});
 await context.addInitScript(()=>{
  window.guideProbe={samples:[],events:[]};
  for(const name of ['fullscreenchange','fullscreenerror'])document.addEventListener(name,()=>window.guideProbe.events.push({name,t:performance.now(),fullscreen:!!document.fullscreenElement}));
  document.addEventListener('click',e=>{if(!e.target.closest('[data-easyedu-guide-close]'))return;
   const start=performance.now();window.guideProbe.samples=[];
   const sample=()=>{
    const card=document.querySelector('#local-groupimport-easystud [data-selectable-type="participant"]'),r=card?.getBoundingClientRect();
    const modal=document.querySelector('[data-easyedu-guide-modal]'),m=modal?.getBoundingClientRect();
    window.guideProbe.samples.push({t:performance.now()-start,card:r?[r.x,r.y,r.width,r.height]:null,scroll:[scrollX,scrollY],
     parked:document.querySelectorAll('[data-easyedu-guide-parked]').length,modalHidden:modal?.hidden,modalOpacity:modal?getComputedStyle(modal).opacity:null,
     modal:m?[m.x,m.y,m.width,m.height]:null,fullscreen:!!document.fullscreenElement});
    if(performance.now()-start<1500)requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  },true);
 });
 const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(180000);
 page.on('pageerror',e=>{report.errors.push({phase:report.phase,message:e.message,stack:e.stack});save();});
 page.on('console',e=>{if(e.type()==='error')report.console.push({phase:report.phase,text:e.text()});});
 report.phase='login';save();
 for(let attempt=1;attempt<=3;attempt++){
  await page.goto(base+'/local/groupimport/manage.php?id='+course+'&lang=fr',{waitUntil:'domcontentloaded'});
  if(await page.locator('#username').count()){
   await page.locator('#username').fill(process.env.EASYEDU_TEACHER_USERNAME);await page.locator('#login input[type=password]').fill(process.env.EASYEDU_TEACHER_PASSWORD);
   await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'}),page.locator('#loginbtn').click({noWaitAfter:true})]);await page.waitForLoadState('domcontentloaded');
  }
  if(!page.url().includes('/login/'))break;
 }
 await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState==='ready',null,{timeout:240000});
 await wait(700);
 for(const mode of ['ordinary','native-close','native-exit-then-close','native-exit-then-close-reduced','native-exit-then-close-minimal']){
  report.phase=mode;save();await page.evaluate(level=>{document.querySelector('[data-easyedu-guide-root]').setAttribute('data-easyedu-motion-level',level);},mode.endsWith('-minimal')?'minimal':mode.endsWith('-reduced')?'reduced':'full');await openGuide(page);
  const row={mode,before:await snap(page)};report.cases.push(row);
  if(mode!=='ordinary'){
   await page.locator('[data-easyedu-guide-fullscreen]:visible').click();await page.waitForFunction(()=>!!document.fullscreenElement);await wait(500);
   row.native=await snap(page);if(!row.native.parked)throw Error('No native parking');
  }
  if(mode.startsWith('native-exit-then-close')){
   await page.evaluate(()=>document.exitFullscreen());
   row.justExited=await snap(page);
  }
  await page.locator('[data-easyedu-guide-close]:visible').first().click();
  await page.locator('[data-easyedu-guide-modal]:visible').waitFor({state:'hidden'});await wait(1600);
  row.after=await snap(page);row.probe=await page.evaluate(()=>window.guideProbe);
  const ss=row.probe.samples,hidden=ss.find(s=>s.modalHidden),unpark=ss.find(s=>s.parked===0);
  row.measure={hiddenAt:hidden?.t,unparkAt:unpark?.t,exposureMs:hidden&&unpark?Math.max(0,unpark.t-hidden.t):null,
   hiddenWithParked:ss.filter(s=>s.modalHidden&&s.parked>0).length,cardDelta:row.after.card.map((v,i)=>v-row.before.card[i]),
   scrollDelta:row.after.scroll.map((v,i)=>v-row.before.scroll[i])};
  row.pass=!!hidden&&!!unpark&&!row.measure.hiddenWithParked&&row.measure.cardDelta.every(v=>Math.abs(v)<=0.5)&&row.after.parked===0;
  if(!row.pass)process.exitCode=1;save();await page.screenshot({path:out+'/'+label+'-'+mode+'.png'});
 }
 await context.close();
}catch(e){report.failure={phase:report.phase,message:e.message,stack:e.stack};process.exitCode=1;}
finally{if(browser)await browser.close();report.finished=new Date().toISOString();save();console.log(JSON.stringify({version,label,cases:report.cases.map(c=>({mode:c.mode,pass:c.pass,measure:c.measure})),failure:report.failure,errors:report.errors.length}));}})();
