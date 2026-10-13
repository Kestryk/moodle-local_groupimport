const {test,expect}=require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs=require('node:fs');

// local-supervised read-only strict contrast successor, not human acceptance.
test('View toggle preserves readable icon contrast through selected-state transitions',async({page},info)=>{
 test.setTimeout(180000);const rows=[],errors=[],blocked=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:900});
 await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});
  await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
  await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
 }
 page.setDefaultTimeout(15000);
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()==='GET')return r.continue();blocked.push('plugin write');return r.abort('blockedbyclient');});
 await page.route('**/lib/ajax/service.php*',r=>{
  if(r.request().method()!=='POST')return r.continue();const names=r.request().postDataJSON().map(c=>c.methodname);
  if(names.every(n=>n==='core_message_get_unsent_message'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(names.map(()=>({error:false,data:{}})))});
  if(areSafeAjaxReads(names, ['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']))return r.continue();
  blocked.push(names);return r.abort('blockedbyclient');
 });
 const root=page.locator('#local-groupimport-easystud');
 try{
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  const locale=new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
  await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+locale+'(?:-|$)'));
  await expect(root.locator('.easyedu-workspace-view-switcher--stable-icon')).toHaveCount(1);
  for(const mode of ['participants','structure','participants','structure']){
   const target=root.locator('[data-easystud-layout-mode="'+mode+'"]');await expect(target).toBeVisible();
   if(await target.getAttribute('aria-pressed')==='true')continue;
   await target.hover();
   await target.evaluate(async button=>{await Promise.all(button.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
   await target.evaluate(button=>{
    const glyph=button.querySelector('.fa');if(!glyph)throw Error('Native tiled icon absent');
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const luminance=s=>{if(!CSS.supports('color',s))throw Error('Unsupported colour');ctx.clearRect(0,0,1,1);ctx.fillStyle=s;ctx.fillRect(0,0,1,1);const rgba=[...ctx.getImageData(0,0,1,1).data];if(rgba[3]!==255)throw Error('Unexpected alpha');const c=rgba.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
    let active=true,raf;window.viewPaintFrames=[];
    const sample=()=>{if(!active)return;const s=getComputedStyle(glyph),fg=s.color,bg=s.backgroundColor,a=luminance(fg),b=luminance(bg);
     window.viewPaintFrames.push({time:performance.now(),pressed:button.getAttribute('aria-pressed'),fg,bg,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});raf=requestAnimationFrame(sample);};
    window.stopViewPaint=()=>{active=false;cancelAnimationFrame(raf);};sample();
   });
   await target.click();await expect(target).toHaveAttribute('aria-pressed','true');
   await root.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const frames=await page.evaluate(()=>{window.stopViewPaint();return window.viewPaintFrames;});
   rows.push({mode,frames,minContrast:Math.min(...frames.map(f=>f.contrast))});
   expect(Math.min(...frames.map(f=>f.contrast))).toBeGreaterThanOrEqual(3);
   expect(frames.length).toBeGreaterThan(1);expect(frames.at(-1).pressed).toBe('true');
  }
  expect(rows.length).toBeGreaterThan(1);expect(errors).toEqual([]);expect(blocked).toEqual([]);
 }finally{
  await page.evaluate(()=>window.stopViewPaint?.()).catch(()=>{});
  fs.writeFileSync(info.outputPath('view-toggle-paint-readable-native.json'),JSON.stringify({rows,errors,blocked,businessWrites:false,contrastGate:true},null,2));
 }
});
