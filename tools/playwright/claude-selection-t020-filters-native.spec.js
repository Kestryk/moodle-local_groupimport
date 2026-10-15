const {test,expect}=require('@playwright/test');const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('Claude selection T020 filter and palette relay with lift',async({page},info)=>{
 test.setTimeout(360000);page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port||base.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const config=(action,saved)=>JSON.parse(execFileSync(process.env.EASYEDU_PHP_EXECUTABLE,[path.join(__dirname,'t020-complete-view-config.php'),process.env.EASYEDU_MOODLE_ROOT,action,...(saved?[JSON.stringify(saved)]:[])],{encoding:'utf8',timeout:30000}));
 const rows=[],errors=[],writes=[];let saved,restored;const save=()=>fs.writeFileSync(info.outputPath('integration.json'),JSON.stringify({rows,errors,writes,saved,restored},null,2));
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.route('**/lib/ajax/service.php*',r=>{const calls=r.request().postDataJSON()||[];if(calls.some(c=>/^local_groupimport_sm_/.test(c.methodname)&&!/_(get|list)_/.test(c.methodname))){writes.push(calls.map(c=>c.methodname));return r.abort();}return r.continue();});
 const root=page.locator('#local-groupimport-easystud');
 const settle=async()=>{await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);};
 const open=async()=>{await page.goto(base.href,{waitUntil:'domcontentloaded'});if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(base.href,{waitUntil:'domcontentloaded'});}await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle();};
 try{
  saved=config('read');save();config('enable');
  for(const width of [1600,1920]){
   await page.setViewportSize({width,height:1000});await open();await root.locator('[data-easystud-layout-mode="both"]:visible').click();await settle();
   const row={stage:'complete',width};rows.push(row);
   const sample=()=>root.evaluate(n=>{
    const list=n.querySelector('[data-easystud-participant-list]'),tree=n.querySelector('[data-easystud-tree]'),groupings=tree.querySelector('.local-groupimport-easystud-tree__groupings');
    const visible=e=>!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length&&e.getBoundingClientRect().width>1;
    const first=(node,selector)=>[...node.querySelectorAll(selector)].find(visible);
    const participantBar=first(list,':scope > [data-easystud-pagination="top"]');
    const structureBar=first(tree,':scope > [data-easystud-pagination="top"]')||first(groupings,':scope > [data-easystud-pagination="top"]');
    const participant=first(list,'[data-easystud-user],[data-easystud-empty-state]');
    const structure=first(tree,'.local-groupimport-easystud-tree__section--ungrouped,.local-groupimport-easystud-tree__section[data-easystud-grouping-id],[data-easystud-empty-state]');
    if(!participantBar||!structureBar||!participant||!structure)return {missing:true};
    const y=e=>e.getBoundingClientRect().top;return {layoutWidth:n.querySelector('.local-groupimport-easystud__layout').clientWidth,barDelta:y(participantBar)-y(structureBar),entryDelta:y(participant)-y(structure),participantBar:y(participantBar),structureBar:y(structureBar),participant:y(participant),structure:y(structure)};
   });
   await expect.poll(async()=>{row.geometry=await sample();save();return row.geometry.missing?Infinity:Math.max(Math.abs(row.geometry.barDelta),Math.abs(row.geometry.entryDelta));},{timeout:12000,intervals:[100]}).toBeLessThanOrEqual(2);
   expect(row.geometry.layoutWidth).toBeGreaterThanOrEqual(1400);
   await root.locator('[data-easystud-participant-list] > [data-easystud-pagination="top"]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('complete-'+width+'.png')});
  }
  await page.setViewportSize({width:1600,height:1000});await open();await root.locator('[data-easystud-layout-mode="participants"]:visible').click();await settle();
  const cards=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');expect(await cards.count()).toBeGreaterThanOrEqual(5);
  const selected=()=>cards.evaluateAll(nodes=>nodes.filter(n=>n.classList.contains('is-selected')).map(n=>n.getAttribute('data-user-id')));
  const click=async(index,modifiers=[])=>{await cards.nth(index).locator('.local-groupimport-easystud-user__name').click({modifiers});await settle();};
  await click(0);expect((await selected()).length).toBe(1);await click(1,['Control']);expect((await selected()).length).toBe(2);await click(2,['Meta']);expect((await selected()).length).toBe(3);await click(4,['Shift']);expect((await selected()).length).toBe(5);
  await cards.nth(4).focus();await expect(cards.nth(4)).toBeFocused();await page.keyboard.press('Space');await settle();expect((await selected()).length).toBe(4);rows.push({stage:'selection',control:true,metaEventOnWindows:true,shift:true,space:true,selected:await selected()});save();
  await open();await root.locator('[data-easystud-layout-mode="participants"]:visible').click();await settle();
  const roleSelect=root.locator('[data-easystud-role-filter]');const roles=await roleSelect.evaluate(n=>[...n.options].map(o=>({value:o.value,label:o.text})));const teacher=roles.find(o=>/enseignant|teacher/i.test(o.label));expect(teacher).toBeTruthy();expect(teacher.value).toMatch(/^\d+$/);
  const initial=await cards.count();await root.locator('[data-easystud-advanced-filters-toggle="participants"]').click();await root.locator('[data-easystud-role-choice="'+teacher.value+'"]').click();await settle();
  expect(await roleSelect.evaluate(n=>[...n.selectedOptions].map(o=>o.value))).toContain(teacher.value);const filtered=await cards.count();expect(filtered).toBeGreaterThan(0);expect(filtered).toBeLessThan(initial);rows.push({stage:'role',teacher,initial,filtered});save();
  await cards.first().locator('[data-easystud-open-user]').hover();const tip=page.locator('.local-groupimport-easystud-hover-popover');await expect(tip).toBeVisible();
  const relay=await root.evaluate(n=>{const t=document.querySelector('.local-groupimport-easystud-hover-popover');const keys=[...n.style].filter(k=>/^--easyedu-(primary|accent|success|info)(-|$)/.test(k));return {rootMarker:n.getAttribute('data-easyedu-custom-rails')||'',tipMarker:t.getAttribute('data-easyedu-custom-palette')||'',keys:keys.length,mismatches:keys.filter(k=>n.style.getPropertyValue(k)!==t.style.getPropertyValue(k))};});rows.push({stage:'palette-relay',...relay});save();expect(relay.keys).toBeGreaterThan(0);expect(relay.mismatches).toEqual([]);expect(relay.tipMarker).toBe(relay.rootMarker);
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{if(saved){restored=config('restore',saved);save();expect(restored).toEqual(saved);}else save();}
});
