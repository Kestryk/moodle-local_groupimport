const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');

test('K15-07 stable scroll semantic palette popovers',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);
 if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];
 const eventLog=[];await page.exposeFunction('qaK1507Event',event=>eventLog.push(event));await page.addInitScript(()=>{addEventListener('scroll',()=>window.qaK1507Event({type:'scroll',time:performance.now(),y:scrollY}),true);document.addEventListener('mouseenter',e=>{if(e.target.matches?.('[data-easystud-open-user]'))window.qaK1507Event({type:'eye-enter',time:performance.now(),y:scrollY});},true);});
 const save=()=>fs.writeFileSync(info.outputPath('palette.json'),JSON.stringify({rows,errors,writes,eventLog},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 const root=page.locator('#local-groupimport-easystud');
 await page.setViewportSize({width:1280,height:1000});
 await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
 if(await page.locator('#username').count()){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
  await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
 }
 await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
 await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
 await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
 const original=await root.getAttribute('data-easyedu-custom-rails'),originalStyle=await root.getAttribute('style');
 const defaultRoles=JSON.parse(execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'palette-native-default-roles.php'),'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle'],{encoding:'utf8',timeout:30000}));
 try{
  for(const width of [1280,390])for(const palette of ['default','configured-test']){
   await page.setViewportSize({width,height:1000});
   if(width===390){await root.locator('[data-easystud-mobile-view="participants"]').click();}
   await root.evaluate((n,{style,palette,roles})=>{n.setAttribute('style',style||'');if(palette==='default')Object.entries(roles).forEach(([key,value])=>n.style.setProperty(key,value));},{style:originalStyle,palette,roles:defaultRoles});
   await root.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
   const start=rows.length;
  const eye=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible [data-easystud-open-user]').first();
  for(const marker of ['', 'primary', 'success', 'primary success']){
   await eye.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForFunction(()=>{const value=scrollX+':'+scrollY;const state=window.qaK1507Scroll||(window.qaK1507Scroll={value,stable:0});state.stable=state.value===value?state.stable+1:0;state.value=value;return state.stable>=8;},null,{polling:'raf',timeout:5000});await page.evaluate(()=>delete window.qaK1507Scroll);await expect(page.locator('.local-groupimport-easystud-hover-popover')).toHaveCount(0);
   await root.evaluate((n,value)=>{if(value)n.setAttribute('data-easyedu-custom-rails',value);else n.removeAttribute('data-easyedu-custom-rails');},marker);
   await eye.hover();const tip=page.locator('.local-groupimport-easystud-hover-popover');await expect(tip).toBeVisible();await tip.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
   const row=await tip.evaluate((n,marker)=>{
    const c=getComputedStyle(n),r=n.getBoundingClientRect();
    const ctx=document.createElement('canvas').getContext('2d');
    const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
    const resolve=color=>{const x=document.createElement('span');x.style.color=color;n.appendChild(x);const result=getComputedStyle(x).color;x.remove();return rgb(result);};
    const luminance=color=>color.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
    const contrast=color=>1.05/(luminance(color)+0.05);
    const role=marker.includes('primary')?'--easyedu-primary-strong':'--easyedu-accent';
    return {marker,relayed:n.getAttribute('data-easyedu-custom-palette')||'',background:c.backgroundImage,text:rgb(c.color),glow:c.getPropertyValue('--easyedu-tooltip-glow').trim(),arrow:c.getPropertyValue('--easyedu-tooltip-arrow-bg').trim(),roleRGB:resolve('var('+role+')'),roleWhiteContrast:contrast(resolve('var('+role+')')),arrowWhiteContrast:contrast(resolve('var(--easyedu-tooltip-arrow-bg)')),geometry:{width:r.width,height:r.height,padding:c.padding,borderRadius:c.borderRadius}};
   },marker);row.width=width;row.palette=palette;rows.push(row);save();
   expect(row.relayed).toBe(marker);expect(row.text).toEqual([255,255,255]);
   if(marker){expect(row.glow).toBe('transparent');expect(row.roleWhiteContrast).toBeGreaterThanOrEqual(4.5);expect(row.arrowWhiteContrast).toBeGreaterThanOrEqual(4.5);expect(row.background).not.toBe(rows.slice(start).find(r=>r.marker==='').background);}
   else {expect(row.background).toContain('rgb(24, 58, 89)');expect(row.background).toContain('rgb(31, 107, 87)');}
   expect(row.geometry).toEqual(rows.slice(start).find(r=>r.marker==='').geometry);
   if(marker==='primary')await page.screenshot({path:info.outputPath('popover-'+palette+'-'+width+'.png')});
  }
  expect(rows.slice(start).find(r=>r.marker==='primary success').background).toBe(rows.slice(start).find(r=>r.marker==='primary').background);
  }expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{await root.evaluate((n,value)=>{if(value===null)n.removeAttribute('data-easyedu-custom-rails');else n.setAttribute('data-easyedu-custom-rails',value);},original);await root.evaluate((n,value)=>{if(value===null)n.removeAttribute('style');else n.setAttribute('style',value);},originalStyle);save();}
});
