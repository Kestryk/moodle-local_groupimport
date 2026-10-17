const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const REPO='C:/dev/worktrees/easystud-codex2-perf-v2-20261017',ROOT='C:/dev/Moodle 51 Perf/moodle',PHP='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe';
const safe=url=>{const u=new URL(url);for(const k of ['sesskey','token','wstoken','previewtoken'])u.searchParams.delete(k);return u.href;};
test('Performance V2 continuation native own8051',async({page},info)=>{
 test.setTimeout(1700000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(120000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL);if(base.origin!=='http://localhost:8051')throw Error('Own8051 only');
 const manifest=path.resolve(info.outputDir,'../..','fixture-manifest.json'),m=JSON.parse(fs.readFileSync(manifest));
 const evidence=path.resolve(info.outputDir,'../..'),runId=path.basename(evidence);
 const seedPath='C:/dev/Moodle 51 Perf/moodle/local/perf-v2-20261017/easystud/authenticated/easystud-authenticated-20261017T044811516Z-11012/playwright-output/perf-v2-resumed-native-Perf-2c211-d-comparison-native-own8051/perf-v2-raw.json';
 const seedFolder=path.dirname(path.dirname(seedPath));
 const candidates=fs.readdirSync(seedFolder,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>path.join(seedFolder,x.name,'perf-v2-raw.json')).filter(x=>fs.existsSync(x));
 if(candidates.length!==1)throw Error('Exactly one interrupted raw checkpoint required');
 const report=JSON.parse(fs.readFileSync(candidates[0],'utf8'));
 if(report.completed)throw Error('Completed campaign must not be repeated');
 report.continuation={seed:candidates[0],runId,fixtureCourses:m.courseIds,originalMeasured800Course:report.measured800Course};
 report.archivedIncomplete=report.measurements.filter(r=>r.status!=='PASS');
 report.measurements=report.measurements.filter(r=>r.status==='PASS');
 delete report.completed;
 fs.mkdirSync(info.outputDir,{recursive:true});const save=()=>fs.writeFileSync(info.outputPath('perf-v2-raw.json'),JSON.stringify(report,null,2));save();
 const php=(action,course)=>action==='purge'?JSON.parse(cp.execFileSync('powershell.exe',['-NoProfile','-File',path.join(REPO,'tools/playwright/perf-v2-purge.ps1'),'-ExpectedRunId',runId],{encoding:'utf8',timeout:120000})):JSON.parse(cp.execFileSync(PHP,[path.join(REPO,'tools/playwright/perf-v2-runtime.php'),'--action',action,'--manifest',manifest,...(course?['--course',String(course)]:[])],{encoding:'utf8',timeout:120000,maxBuffer:1000000}));
 const original=php('inspect',71),target800=original.available===false?m.mediumCourseId:71;report.originalCourse71=original;report.continuation.measured800Course=target800;
 const sync=(version,phase)=>{const out=cp.execFileSync('powershell.exe',['-NoProfile','-File',path.join(REPO,'tools/playwright/perf-v2-sync.ps1'),'-Version',version,'-Evidence',evidence,'-ExpectedRunId',runId,'-Phase',phase],{encoding:'utf8',timeout:180000,maxBuffer:1000000});report.sync.push({version,phase,result:out.trim()});save();};
 let current=null;page.on('pageerror',e=>{report.errors.push({current,error:e.message});save();});page.on('console',msg=>{if(msg.type()==='error'){report.consoleErrors.push({current,error:msg.text()});save();}});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded'}),page.locator('#loginbtn').click({noWaitAfter:true})]);}
 await page.addInitScript(()=>{
  window.perfV2={longTasks:[],search:[]};if(PerformanceObserver.supportedEntryTypes.includes('longtask'))new PerformanceObserver(l=>l.getEntries().forEach(e=>window.perfV2.longTasks.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});
  const observer=new MutationObserver(()=>{const r=document.querySelector('#local-groupimport-easystud,#local-groupimport-import');if(!r||r.dataset.easystudLoadingState!=='ready')return;if(r.id==='local-groupimport-easystud'&&r.dataset.easystudManagerInitialised!=='1')return;if(Array.from(r.querySelectorAll('[data-easystud-sm-loading]')).some(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height))return;window.perfV2.usableAtMs=performance.now();observer.disconnect();});observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-easystud-loading-state','data-easystud-manager-initialised','hidden','style']});
  document.addEventListener('input',e=>{if(!e.target.matches('[data-easystud-search]'))return;const r={start:performance.now(),length:e.target.value.length};window.perfV2.search.push(r);e.perfV2row=r;requestAnimationFrame(()=>requestAnimationFrame(()=>{r.paintedMs=performance.now()-r.start;}));},true);
  document.addEventListener('input',e=>{if(e.perfV2row)e.perfV2row.handlerMs=performance.now()-e.perfV2row.start;});
 });
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
 let requests=new Map(),collect=false;
 cdp.on('Network.requestWillBeSent',e=>{if(collect&&/^https?:/.test(e.request.url))requests.set(e.requestId,{url:safe(e.request.url),type:e.type,started:e.timestamp,method:e.request.method});});
 cdp.on('Network.requestServedFromCache',e=>{if(requests.has(e.requestId))requests.get(e.requestId).cached=true;});
 cdp.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{status:e.response.status,mime:e.response.mimeType,fromDiskCache:e.response.fromDiskCache,fromServiceWorker:e.response.fromServiceWorker,timing:e.response.timing,responseAt:e.timestamp});});
 cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{finished:e.timestamp,transferred:e.encodedDataLength,durationMs:(e.timestamp-r.started)*1000});});
 cdp.on('Network.dataReceived',e=>{const r=requests.get(e.requestId);if(r)r.decodedBytes=(r.decodedBytes||0)+e.dataLength;});
 const ready=async surface=>{
  const root=page.locator(surface==='mass-import'?'#local-groupimport-import':'#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
  if(surface!=='mass-import'){await expect(root).toHaveAttribute('data-easystud-manager-initialised','1',{timeout:90000});await expect(root.locator('[data-easystud-sm-loading]:visible')).toHaveCount(0,{timeout:90000});}
  return root;
 };
 const navigate=async(version,surface,course,width,temperature,sample)=>{
  current={version,surface,course,width,temperature,sample};const row={...current,status:'RUNNING'};report.measurements.push(row);save();requests=new Map();collect=true;
  try{
   const url=new URL('/local/groupimport/'+(surface==='mass-import'?'index.php':'manage.php'),base);url.searchParams.set('id',String(course));url.searchParams.set('lang','fr');
   await page.goto(url.href,{waitUntil:'domcontentloaded'});await ready(surface);row.usableMs=await page.evaluate(()=>window.perfV2.usableAtMs??performance.now());await page.waitForLoadState('load',{timeout:30000});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   row.browser=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0],paint=performance.getEntriesByType('paint');return {firstContentfulPaintMs:paint.find(e=>e.name==='first-contentful-paint')?.startTime??null,firstPaintMs:paint.find(e=>e.name==='first-paint')?.startTime??null,documentTtfbMs:nav.responseStart,domContentLoadedMs:nav.domContentLoadedEventEnd,documentBytes:nav.transferSize,documentDecodedBytes:nav.decodedBodySize,longTasks:window.perfV2.longTasks,elementCount:document.querySelectorAll('*').length,visibleSkeletons:Array.from(document.querySelectorAll('[data-easystud-sm-loading],[data-easystud-loading-skeleton]')).filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height&&getComputedStyle(n).display!=='none').length};});
   row.status='PASS';
  }catch(e){row.status='FAIL';row.error=e.message;row.capture=info.outputPath('failure-'+version+'-'+surface+'-'+width+'-'+temperature+'-'+sample+'.png');await page.screenshot({path:row.capture}).catch(()=>{});}
  collect=false;row.resources=Array.from(requests.values());row.requests=row.resources.length;row.jsTransferredBytes=row.resources.filter(r=>r.type==='Script').reduce((a,r)=>a+(r.transferred||0),0);row.cssTransferredBytes=row.resources.filter(r=>r.type==='Stylesheet').reduce((a,r)=>a+(r.transferred||0),0);
  row.getState=row.resources.filter(r=>r.url.includes('local_groupimport_get_state')).map(r=>({url:r.url,durationMs:r.durationMs,serverWaitTtfbMs:r.timing?Math.max(0,r.timing.receiveHeadersStart-r.timing.sendEnd):null,transferredBytes:r.transferred,decodedBytes:r.decodedBytes,cached:r.cached||r.fromDiskCache||false}));save();
 };
 try{
  for(const version of ['74323514','6c3ac95f']){
   if(report.measurements.filter(r=>r.version===version).length===60&&report.server.filter(r=>r.version===version).length===15&&report.search.filter(r=>r.version===version).length===60)continue;
   await page.goto('about:blank');sync(version,'deploy-'+version);
   for(const cid of [target800,m.smallCourseId,m.largeCourseId])report.metadata.push({version,...php('inspect',cid)});save();
   for(const width of [1600,390])for(const [surface,course] of [['sm-800',target800],['sm-small',m.smallCourseId],['mass-import',m.smallCourseId]]){
    await page.setViewportSize({width,height:1000});
    for(let sample=1;sample<=5;sample++){
     const previous=report.measurements.filter(r=>r.version===version&&r.surface===surface&&r.width===width&&r.sample===sample);
     if(previous.length===2&&previous.every(r=>r.status==='PASS'))continue;
     if(previous.length){report.archivedIncomplete.push(...previous);report.measurements=report.measurements.filter(r=>!previous.includes(r));}
     await page.goto('about:blank');php('purge');await cdp.send('Network.clearBrowserCache');await navigate(version,surface,course,width,'cold',sample);await navigate(version,surface,course,width,'warm',sample);
    }
   }
   for(const cid of [target800,m.smallCourseId,m.largeCourseId])for(let sample=1;sample<=5;sample++){const participants=cid===target800?800:cid===m.smallCourseId?30:3000;if(!report.server.some(r=>r.version===version&&r.participants===participants&&r.sample===sample))report.server.push({version,sample,...php('server',cid)});}save();
   for(const width of [1600,390])for(const cid of [target800,m.largeCourseId]){
    await page.setViewportSize({width,height:1000});await page.goto(new URL('/local/groupimport/manage.php?id='+cid+'&lang=fr',base).href,{waitUntil:'domcontentloaded'});const root=await ready('sm');
    const mobile=root.locator('[data-easystud-mobile-view=participants]:visible');if(await mobile.count())await mobile.click();else {const v=root.locator('[data-easystud-layout-mode=participants]:visible');if(await v.count())await v.click();}
    const search=root.locator('[data-easystud-search]');await expect(search).toBeVisible();
    for(const query of ['user','user 0',cid===target800?'user 0799':'user 2999'])for(let sample=1;sample<=5;sample++){
     if(report.search.some(r=>r.version===version&&r.width===width&&r.participants===(cid===target800?800:3000)&&r.query===query&&r.sample===sample))continue;
     await search.fill('');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>window.perfV2.search=[]);const start=Date.now();await search.pressSequentially(query,{delay:50});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const measure=await page.evaluate(()=>({events:window.perfV2.search,results:document.querySelectorAll('[data-easystud-participant-list] > [data-easystud-user]').length}));report.search.push({version,width,course:cid,participants:cid===target800?800:3000,query,sample,wallMs:Date.now()-start,...measure});save();
    }
   }
  }
  report.completed=true;
 }finally{
  await page.goto('about:blank').catch(()=>{});sync('74323514','restore-current');save();
 }
 expect(report.measurements).toHaveLength(120);expect(report.errors).toEqual([]);
});
