'use strict';
// Native authenticated regression: no HTML reconstruction or style injection.
// Arguments: absolute Playwright module, local base URL, admin secret file, external output, phase.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [pw, base, secretFile, output, phase='candidate'] = process.argv.slice(2);
assert.ok([pw,secretFile,output].every(p=>p&&path.isAbsolute(p)));
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert.match(phase,/^[a-z0-9-]+$/i);
fs.mkdirSync(output,{recursive:true});
const {chromium} = require(pw);
const out = output;

const stage = name => fs.appendFileSync(out+'/'+phase+'-stages.jsonl',JSON.stringify({name,at:new Date().toISOString()})+'\n');
const matrix = true;
const report = {phase, rows: [], errors: []};
(async () => {
 const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
 const auth=out+'/auth-state.json'; const context = await browser.newContext({viewport: {width: 1600, height: 1000},...(fs.existsSync(auth)?{storageState:auth}:{})});
 const page = await context.newPage(); page.setDefaultTimeout(120000);
 page.on('pageerror', error => report.errors.push(error.message));
 page.on('console', msg => {if (msg.type() === 'error') report.errors.push(msg.text());});
 try {
  if(!fs.existsSync(auth)){stage('login');
  const secret=fs.readFileSync(secretFile,'utf8').trim();
  const login=await context.request.get(base+'/login/index.php',{timeout:120000});
  const token=(await login.text()).match(/name="logintoken" value="([^"]+)"/)[1];
  const logged=await context.request.post(base+'/login/index.php',{form:{username:'admin',password:secret,logintoken:token},maxRedirects:0,timeout:120000});
  if(![302,303].includes(logged.status()))throw new Error('Login failed: HTTP '+logged.status());
  await context.storageState({path:auth});} stage('logged-in'); for (const surface of matrix?['sm','mass']:['sm']) for (const lang of matrix ? ['en','fr'] : ['en']) {
   await page.setViewportSize({width:1600,height:1000});
   await page.goto(base+'/local/groupimport/'+(surface==='sm'?'manage.php':'index.php')+'?id=71&lang='+lang,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>document.querySelector('[data-easyedu-guide-root]')?.easyeduGuideConfig,null,{timeout:180000});
   stage('ready-'+lang); await page.locator('[data-easyedu-guide-open]:visible').first().click();
   const index = await page.locator('[data-easyedu-guide-specimen="ready"]').evaluate(n=>n.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
   stage('recap-index-'+index); await page.locator('[data-easyedu-guide-nav-item="'+index+'"]').first().click();
   await page.locator('[data-easyedu-guide-specimen="ready"]').waitFor({state:'visible'});
   for (const width of matrix ? [1600,1280,768,390] : [1600,390]) {
    await page.setViewportSize({width,height:width<1000?1000:1000});
    await page.evaluate(async()=>{await document.fonts.ready; const a=document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity); await Promise.allSettled(a.map(a=>a.finished));});
    const measurement = await page.locator('[data-easyedu-guide-specimen="ready"]').evaluate(root=>{
     const box = n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     return [...root.querySelectorAll('.easyedu-guide-spec__tile')].map(tile=>{
      const desc=tile.querySelector('.easyedu-information__description'), title=tile.querySelector('.easyedu-information__title');
      const range=document.createRange();range.selectNodeContents(desc);
      const t=box(tile), d=box(desc), text=box(range), cs=getComputedStyle(desc), tc=getComputedStyle(tile);
      return {title:title.textContent.trim(),text:desc.textContent.trim(),tile:t,description:d,paint:text,
       overflowRight:Math.max(0,text.right-t.right),overflowLeft:Math.max(0,t.x-text.x),
       contentOverflowRight:Math.max(0,text.right-(t.right-parseFloat(tc.paddingRight)-parseFloat(tc.borderRightWidth))),
       style:{display:tc.display,gridTemplateColumns:tc.gridTemplateColumns,gridTemplateRows:tc.gridTemplateRows,padding:tc.padding,
        minWidth:cs.minWidth,width:cs.width,boxSizing:cs.boxSizing,margin:cs.margin,padding:cs.padding,whiteSpace:cs.whiteSpace,
        overflowWrap:cs.overflowWrap,wordBreak:cs.wordBreak,gridColumn:cs.gridColumn,font:cs.font}};
     });
    });
    report.rows.push({surface,lang,width,tiles:measurement}); stage(lang+'/'+width); fs.writeFileSync(out+'/'+phase+'-progress.json',JSON.stringify(report,null,2));
    if(lang==='en'&&(width===1600||width===390)) await page.screenshot({path:out+'/'+phase+'-'+surface+'-'+lang+'-'+width+'.png'});
   }
  }
  assert.equal(report.rows.length,16,'Both native Guides, two languages, four widths');
  assert.deepEqual(report.errors,[],'No console or page errors');
  for(const row of report.rows){
   assert.ok(row.tiles.length>=4,'Actual recap populated');
   for(const tile of row.tiles){
    assert.equal(tile.style.whiteSpace,'normal',row.surface+'/'+row.lang+'/'+row.width+': '+tile.title);
    assert.ok(tile.overflowRight<=0.5&&tile.overflowLeft<=0.5&&tile.contentOverflowRight<=0.5,'Paint inside padded tile: '+tile.title);
    assert.ok(tile.paint.bottom<=tile.tile.bottom+0.5,'No vertical tile overflow: '+tile.title);
   }
  }
  report.status='PASS';
 } catch(error) {report.status='FAIL'; report.url=page.url();report.failure={message:error.message,stack:error.stack};process.exitCode=1;}
 finally {fs.writeFileSync(out+'/'+phase+'.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
 console.log(JSON.stringify({phase,cases:report.rows.length,errors:report.errors,failure:report.failure,
  maxOverflow:Math.max(...report.rows.flatMap(r=>r.tiles.map(t=>t.overflowRight)))}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
