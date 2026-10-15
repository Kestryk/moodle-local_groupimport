const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Served settled catalog selection role filtering default tooltip native8051',async({page},info)=>{
 test.setTimeout(360000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');if(base.origin!=='http://localhost:8051'||Number(base.searchParams.get('id'))<=5)throw Error('Disposable8051 required');
 const report={errors:[],blocked:[],rows:[]};const save=()=>fs.writeFileSync(info.outputPath('selection-filter.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/ajax.php*',r=>{report.blocked.push(r.request().url());save();return r.abort();});
 const root=page.locator('#local-groupimport-easystud');
 const ready=async()=>{await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.evaluate(()=>document.fonts.ready);};
 const open=async()=>{await page.goto(base.href,{waitUntil:'domcontentloaded'});if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(base.href,{waitUntil:'domcontentloaded'});}await ready();};
 const settle=async()=>root.evaluate(n=>Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{}))));
 const selection=async(cards,label)=>{
  const name=label==='participants'?'.local-groupimport-easystud-user__name':label==='groups'?'.local-groupimport-easystud-group__name':'.local-groupimport-easystud-member__name';
  const count=()=>cards.evaluateAll(ns=>ns.filter(n=>n.classList.contains('is-selected')).length);
  await expect.poll(()=>cards.count()).toBeGreaterThanOrEqual(3);
  await cards.nth(0).locator(name).click();await expect.poll(count).toBe(1);
  await cards.nth(1).locator(name).click({modifiers:['Control']});await expect.poll(count).toBe(2);
  await cards.nth(2).locator(name).click({modifiers:['Shift']});await expect.poll(count).toBe(3);
  report.rows.push({type:label,click:true,control:true,shift:true,selected:await count()});save();
 };
 try{
  await page.setViewportSize({width:1280,height:1000});await open();
  await root.locator('[data-easystud-layout-mode="participants"]:visible').click();await settle();
  const participants=root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');await selection(participants,'participants');
  const group=root.locator('[data-easystud-participant-groups-panel] [data-easystud-group-id]:visible').first();
  await group.locator('.local-groupimport-easystud-group__name').click({modifiers:['Control']});await expect(group).not.toHaveClass(/is-selected/);expect(await participants.locator(':scope.is-selected').count()).toBe(3);report.rows.push({mixedTypesRejected:true});save();
  await open();await root.locator('[data-easystud-layout-mode="structure"]:visible').click();await settle();
  const groups=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible');await selection(groups,'groups');
  await open();await root.locator('[data-easystud-layout-mode="structure"]:visible').click();await settle();
  const alpha=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first();
  await alpha.locator('[data-easystud-group-members-toggle]').click();await selection(alpha.locator('[data-easystud-member-id]:visible'),'members');
  await open();await root.locator('[data-easystud-layout-mode="participants"]:visible').click();await settle();
  const search=root.locator('[data-easystud-search]:visible');await search.fill('QA Guided One');await expect(participants).toHaveCount(1);await expect(participants.first()).toContainText('QA Guided One');await search.fill('');await expect(participants).toHaveCount(4);
  await root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').click();
  const roles=await root.locator('[data-easystud-role-filter]').evaluate(n=>[...n.options].map(o=>({value:o.value,label:o.textContent})));const teacher=roles.find(r=>/enseignant|teacher/i.test(r.label));expect(teacher).toBeTruthy();
  await root.locator('[data-easystud-role-choice="'+teacher.value+'"]:visible').click();await expect(participants).toHaveCount(1);await expect(participants).toContainText('QA Guided Four');report.rows.push({filterQueryExact:true,filterRole:teacher,expectedUser:'QA Guided Four'});save();
  await participants.first().locator('[data-easystud-open-user]').hover();const tip=page.locator('.local-groupimport-easystud-hover-popover');await expect(tip).toBeVisible();
  const palette=await tip.evaluate(n=>({marker:n.getAttribute('data-easyedu-custom-palette')||'',background:getComputedStyle(n).backgroundColor,border:getComputedStyle(n).borderLeftColor,success:getComputedStyle(n).getPropertyValue('--easyedu-success')}));report.rows.push({palette});save();expect(palette.marker).toBe('');
  await page.screenshot({path:info.outputPath('default-tooltip.png')});
  await open();await root.locator('[data-easystud-layout-mode="participants"]:visible').click();await settle();const card=participants.first(),avatar=card.locator('.local-groupimport-easystud-user__avatar');
  await avatar.hover();await card.evaluate(n=>{window.qaDrag=[];for(const type of ['dragstart','dragend'])n.addEventListener(type,e=>window.qaDrag.push({type,trusted:e.isTrusted}));});
  const a=await avatar.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+50,a.y+a.height/2+30,{steps:8});await page.mouse.move(20,50,{steps:5});await page.mouse.up();
  const drag=await page.evaluate(()=>window.qaDrag);report.rows.push({drag});save();expect(drag.map(d=>d.type)).toEqual(['dragstart','dragend']);expect(drag.every(d=>d.trusted)).toBe(true);
  expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
 }finally{await page.screenshot({path:info.outputPath('last-state.png')}).catch(()=>{});save();}
});

