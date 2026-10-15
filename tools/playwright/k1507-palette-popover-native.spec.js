const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

test('K15-07 native semantic palette popovers',async({page},info)=>{
 test.setTimeout(180000);page.setDefaultTimeout(25000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);
 if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[],writes=[];
 const save=()=>fs.writeFileSync(info.outputPath('palette.json'),JSON.stringify({rows,errors,writes},null,2));
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
 const cards=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');
 const selected=()=>cards.evaluateAll(nodes=>nodes.filter(n=>n.classList.contains('is-selected')).length);
 const select=async(index,modifiers=[])=>cards.nth(index).locator('.local-groupimport-easystud-user__name').click({modifiers});
 expect(await cards.count()).toBeGreaterThanOrEqual(5);
 await select(0);expect(await selected()).toBe(1);await select(1,['Control']);expect(await selected()).toBe(2);
 await select(2,['Meta']);expect(await selected()).toBe(3);await select(4,['Shift']);expect(await selected()).toBe(5);
 await cards.nth(4).focus();await expect(cards.nth(4)).toBeFocused();await page.keyboard.press('Space');expect(await selected()).toBe(4);
 rows.push({stage:'selection',control:true,metaEventOnWindows:true,shift:true,space:true});save();
 const roleSelect=root.locator('[data-easystud-role-filter]');
 const teacher=await roleSelect.evaluate(n=>[...n.options].map(o=>({value:o.value,label:o.text})).find(o=>/enseignant|teacher/i.test(o.label)));
 expect(teacher).toBeTruthy();expect(teacher.value).toMatch(/^\d+$/);const initial=await cards.count();
 await root.locator('[data-easystud-advanced-filters-toggle="participants"]').click();await root.locator('[data-easystud-role-choice="'+teacher.value+'"]').click();
 await expect.poll(()=>cards.count()).toBeLessThan(initial);expect(await cards.count()).toBeGreaterThan(0);
 expect(await roleSelect.evaluate(n=>[...n.selectedOptions].map(o=>o.value))).toContain(teacher.value);
 rows.push({stage:'role',teacher,initial,filtered:await cards.count()});save();
 const original=await root.getAttribute('data-easyedu-custom-rails');
 try{
  const eye=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible [data-easystud-open-user]').first();
  for(const marker of ['', 'primary', 'success', 'primary success']){
   await root.locator('.local-groupimport-easystud__panel-heading').first().hover();
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
   },marker);rows.push(row);save();
   expect(row.relayed).toBe(marker);expect(row.text).toEqual([255,255,255]);
   if(marker){expect(row.glow).toBe('transparent');expect(row.roleWhiteContrast).toBeGreaterThanOrEqual(4.5);expect(row.arrowWhiteContrast).toBeGreaterThanOrEqual(4.5);expect(row.background).not.toBe(rows.find(r=>r.marker==='').background);}
   else {expect(row.background).toContain('rgb(24, 58, 89)');expect(row.background).toContain('rgb(31, 107, 87)');}
   expect(row.geometry).toEqual(rows.find(r=>r.marker==='').geometry);
   await page.screenshot({path:info.outputPath('popover-'+(marker.replaceAll(' ','-')||'classic')+'-1280.png')});
  }
  expect(rows.find(r=>r.marker==='primary success').background).toBe(rows.find(r=>r.marker==='primary').background);expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{await root.evaluate((n,value)=>{if(value===null)n.removeAttribute('data-easyedu-custom-rails');else n.setAttribute('data-easyedu-custom-rails',value);},original);save();}
});
