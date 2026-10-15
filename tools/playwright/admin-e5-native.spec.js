const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

test('E5 native sections iso controls responsive and restored save',async({page},info)=>{
 test.setTimeout(900000);page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(180000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL||'');
 if(base.origin!=='http://localhost:8051')throw Error('Own8051 only');
 const url=new URL('/admin/settings.php?section=local_groupimport&lang=fr',base).href;
 const report={errors:[],rows:[],saveRoundTrip:[]};
 const save=()=>fs.writeFileSync(info.outputPath('e5-native.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 const ready=async()=>{
  await expect(page.locator('#page-admin-setting-local_groupimport')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:180000});
  await expect(page.locator('#adminsettings')).toHaveAttribute('data-easyedu-admin-layout','ready');
  await page.evaluate(()=>document.fonts.ready);
 };
 const settled=async()=>page.locator('#adminsettings').evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).filter(a=>a.effect&&Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
 const open=async()=>{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(page.url().includes('/login/')){
   await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(url,{waitUntil:'domcontentloaded'});
  }
  await ready();
 };
 for(const width of [1600,1280,768,390]){
  await page.setViewportSize({width,height:width===768?1024:width===390?844:1000});await open();
  const toggles=page.locator('.local-groupimport-admin-section__toggle');await expect(toggles).toHaveCount(5);
  const initial=await toggles.evaluateAll(ns=>ns.map(n=>n.getAttribute('aria-expanded')));
  expect(initial).toEqual(width<=768?['true','true','false','false','false']:Array(5).fill('true'));
  for(const t of await toggles.all())if(await t.getAttribute('aria-expanded')!=='true'){await t.click();await settled();}
  const row=await page.locator('#adminsettings').evaluate(n=>{
   const box=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,width:r.width,height:r.height,font:s.fontSize,weight:s.fontWeight,color:s.color,radius:s.borderRadius,border:s.borderColor};};
   const visible=e=>e.getClientRects().length&&!e.closest('[hidden]');
   return {form:box(n),headings:[...n.querySelectorAll('.local-groupimport-admin-section__toggle')].map(box),sections:[...n.querySelectorAll('.local-groupimport-admin-section')].map(box),
    choices:[...n.querySelectorAll('.easyedu-searchable-choice__trigger')].filter(visible).map(box),
    colors:[...n.querySelectorAll('.easyedu-color-picker__swatch,.easyedu-color-picker__hex,.easyedu-color-picker__restore')].filter(visible).map(box),
    rows:[...n.querySelectorAll('.form-item')].map(e=>({label:box(e.querySelector('.form-label')),control:box(e.querySelector('.form-setting'))})),
    switches:n.querySelectorAll('.local-groupimport-admin-settings__switch input[type="checkbox"]').length,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  report.rows.push({width,...row});save();expect(row.overflow).toBeLessThanOrEqual(1);expect(row.form.width).toBeLessThanOrEqual(1180);
  for(const h of row.headings){expect(h.font).toBe('20px');expect(h.weight).toBe('700');expect(h.color).toBe('rgb(18, 54, 77)');}
  for(const s of row.sections)expect(s.radius).toBe('13.44px');
  expect(row.switches).toBe(2);expect(row.choices.length).toBeGreaterThanOrEqual(4);
  for(const c of row.choices){expect(c.height).toBe(width<=768?44:38);expect(c.radius).toBe('11.52px');}
  for(const c of row.colors)expect(c.height).toBe(38);
  if(width>768){const xs=row.rows.map(r=>r.control.x);expect(Math.max(...xs)-Math.min(...xs)).toBeLessThanOrEqual(1);}
  else for(const r of row.rows)expect(Math.abs(r.label.x-r.control.x)).toBeLessThanOrEqual(1);
  if([1600,390].includes(width))await page.screenshot({path:info.outputPath('E5-admin-'+width+'.png')});
  // Native keyboard disclosure and checkbox are retained; do not submit the temporary toggle.
  const checkbox=page.locator('#id_s_local_groupimport_showcompleteview'),wasChecked=await checkbox.isChecked();await checkbox.focus();await page.keyboard.press('Space');expect(await checkbox.isChecked()).toBe(!wasChecked);await page.keyboard.press('Space');
  await toggles.nth(2).focus();await page.keyboard.press('Enter');await settled();await expect(toggles.nth(2)).toHaveAttribute('aria-expanded','false');await page.keyboard.press('Enter');await settled();await expect(toggles.nth(2)).toHaveAttribute('aria-expanded','true');
 }
 await page.setViewportSize({width:1280,height:1000});await open();
 const motion=()=>page.locator('#admin-motionlevel');
 const original=await motion().locator('select').inputValue();
 const choose=async value=>{
  const native=motion().locator('select'),label=await native.locator('option[value="'+value+'"]').innerText();
  await motion().locator('.easyedu-searchable-choice__trigger').click();await motion().getByRole('button',{name:label,exact:true}).click();await expect(native).toHaveValue(value);
 };
 const submit=async()=>{await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#adminsettings button[type="submit"],#adminsettings input[type="submit"]').first().click()]);await open();};
 try{
  const alternate=original==='full'?'reduced':'full';await choose(alternate);await submit();expect(await motion().locator('select').inputValue()).toBe(alternate);report.saveRoundTrip.push({changed:true,value:alternate});save();
 }finally{
  await choose(original);await submit();expect(await motion().locator('select').inputValue()).toBe(original);report.saveRoundTrip.push({restored:true,value:original});save();
 }
 for(const width of [1600,1280,768,390]){
  await page.setViewportSize({width,height:1000});await page.goto(new URL('/local/groupimport/index.php?id='+base.searchParams.get('id')+'&lang=fr',base).href,{waitUntil:'domcontentloaded'});
  await expect(page.locator('.local-groupimport-import')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:180000});
  const titles=await page.locator('.local-groupimport-import-card__title:visible').evaluateAll(ns=>ns.map(n=>({font:getComputedStyle(n).fontSize,weight:getComputedStyle(n).fontWeight,color:getComputedStyle(n).color})));
  report.rows.push({width,surface:'Mass Import',titles});save();expect(titles.length).toBeGreaterThanOrEqual(2);for(const t of titles){expect(t.font).toBe('20px');expect(t.weight).toBe('700');}
  if(width===390)await page.screenshot({path:info.outputPath('E5-mass-390.png')});
 }
 expect(report.errors).toEqual([]);
});
