const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Served pending fonts compositor capture native8051',async({page},info)=>{
 test.setTimeout(180000);page.setDefaultNavigationTimeout(60000);
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');if(url.origin!=='http://localhost:8051'||Number(url.searchParams.get('id'))<=5)throw Error('Owned fixture required');
 const report={errors:[]};const save=()=>fs.writeFileSync(info.outputPath('loading-polish.json'),JSON.stringify(report,null,2));page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url.href,{waitUntil:'domcontentloaded'});if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});}
 await page.setViewportSize({width:1280,height:1000});
 let releaseFonts,releaseAmd;const fontGate=new Promise(r=>releaseFonts=r),amdGate=new Promise(r=>releaseAmd=r);
 await page.route(/\.(woff2?|ttf)(\?|$)/,async r=>{await fontGate;await r.continue();});
 await page.route('**/lib/requirejs.php*',async r=>{await amdGate;await r.continue();});
 await page.addInitScript(()=>{window.qaFrames=[];const start=performance.now();const sample=()=>{
  const root=document.querySelector('#local-groupimport-easystud');if(root){const visible=n=>{if(!n||n.closest('[hidden]'))return false;const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};const p=root.querySelector('[data-easystud-sm-loading="participants"]'),g=root.querySelector('[data-easystud-participant-groups-panel] [data-easystud-sm-loading="groups"]');window.qaFrames.push({ms:performance.now()-start,p:visible(p),g:visible(g),frame:root.getAttribute('data-easystud-manager-frame')});}if(performance.now()-start<12000)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 try{
  await page.goto(url.href,{waitUntil:'commit'});
  await expect(page.locator('#local-groupimport-easystud [data-easystud-sm-loading="participants"]')).toBeVisible({timeout:30000});
  await expect.poll(()=>page.evaluate(()=>window.qaFrames?.filter(x=>x.p||x.g).length||0)).toBeGreaterThan(2);
  report.frames=await page.evaluate(()=>window.qaFrames);report.firstVisible=report.frames.find(x=>x.p||x.g);save();expect(report.firstVisible.p).toBe(true);expect(report.firstVisible.g).toBe(true);expect(report.frames.filter(x=>x.p!==x.g)).toEqual([]);
  report.fonts=await page.evaluate(()=>({pending:document.documentElement.classList.contains('easyedu-icon-font-pending'),icons:[...document.querySelectorAll('#local-groupimport-easystud .fa')].slice(0,20).map(n=>({visibility:getComputedStyle(n,'::before').visibility,content:getComputedStyle(n,'::before').content}))}));save();
  expect(report.fonts.pending).toBe(true);expect(report.fonts.icons.length).toBeGreaterThan(0);expect(report.fonts.icons.every(n=>n.visibility==='hidden')).toBe(true);
  const cdp=await page.context().newCDPSession(page);const shot=await cdp.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(info.outputPath('pending-font-columns.png'),Buffer.from(shot.data,'base64'));await cdp.detach();releaseFonts();releaseAmd();
  await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.evaluate(()=>document.fonts.ready);await expect(page.locator('html')).not.toHaveClass(/easyedu-icon-font-pending/);await page.screenshot({path:info.outputPath('ready-font-columns.png')});expect(report.errors).toEqual([]);
 }finally{releaseFonts();releaseAmd();save();}
});

