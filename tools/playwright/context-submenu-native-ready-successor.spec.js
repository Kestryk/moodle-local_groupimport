const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {openContextSubmenu,inspectContextSubmenus}=require('./context-submenu-ready-helper.cjs');
const settle=n=>n.evaluate(async root=>{await document.fonts.ready;await Promise.all(root.getAnimations({subtree:true})
 .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
test('Context submenu native ready routes copy add group grouping desktop mobile',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(60000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);
 if(url.hostname!=='localhost'||url.port!=='8051'||url.searchParams.get('id')!=='5')throw Error('Own8051 course5 only');
 url.searchParams.set('lang','fr');const rows=[],errors=[],writes=[];
 const save=()=>fs.writeFileSync(info.outputPath('context-submenus.json'),JSON.stringify({rows,errors,writes},null,2));
 page.on('pageerror',e=>{errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()!=='GET'){writes.push(new URL(route.request().url()).pathname);save();return route.abort('blockedbyclient');}return route.continue();
 });
 await page.route('**/lib/ajax/service.php*',route=>{
  const calls=route.request().postDataJSON()||[],mutation=calls.filter(c=>(c.methodname||'').startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname));
  if(mutation.length){writes.push(mutation.map(c=>c.methodname));save();return route.abort('blockedbyclient');}return route.continue();
 });
 const root=page.locator('#local-groupimport-easystud'),menu=root.locator('[data-easystud-context-menu]');
 try{
  await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
  if(await page.locator('#username').count()){
   await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
  }
  if(page.url().includes('/local/groupimport/manage.php'))await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  await page.goto(url.href,{waitUntil:'domcontentloaded'});await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  for(const width of [1280,390])for(const kind of ['participant','group','grouping']){
   await page.setViewportSize({width,height:1000});await settle(root);
   const clear=root.locator('[data-easystud-clear-all-selection]:visible, [data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').first();if(await clear.count())await clear.click();
   await root.locator(width===390?'[data-easystud-mobile-view="'+kind+'s"]:visible':'[data-easystud-layout-mode="'+(kind==='participant'?'participants':'structure')+'"]:visible').click();await settle(root);
   const card=root.locator(kind==='participant'?'[data-easystud-participant-list] [data-easystud-user]:visible':kind==='group'?'[data-easystud-structure-groups] [data-easystud-group-id]:visible':'[data-easystud-tree] [data-easystud-grouping-id]:visible').first();
   await expect(card).toBeVisible();await card.scrollIntoViewIfNeeded();await settle(root);
   if(width===390)await card.locator(kind==='participant'?':scope > [data-easystud-card-menu]':':scope > .local-groupimport-easystud-'+kind+'__header > [data-easystud-card-menu]').click();
   else await card.locator(kind==='participant'?'.local-groupimport-easystud-user__name':'.local-groupimport-easystud-'+kind+'__name').first().click({button:'right'});
   await expect(menu).toBeVisible();await settle(menu);
   const row={width,kind,topLevel:await menu.locator('[data-easystud-context-action]:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.easystudContextAction)),submenus:await inspectContextSubmenus(menu)};rows.push(row);save();
   const copy=await openContextSubmenu(root,'copy-'+kind+'-id');await expect(copy).toBeVisible();
   await copy.focus();await copy.press('Escape');await expect(menu).toBeVisible();
   if(kind!=='participant'){
    const family=kind==='group'?'add-participants':'add-groups',copied=kind==='group'?'group-add-copied-users':'grouping-add-copied-groups';
    await openContextSubmenu(root,copied);row.copiedActionVisible=true;
    const submenu=menu.locator('[data-easystud-context-submenu="'+family+'"]');
    row.submenuLayout=await submenu.evaluate(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {position:s.position,left:r.left,right:r.right,width:innerWidth};});
    expect(row.submenuLayout.position).toBe(width===390?'static':'fixed');
    const advanced=menu.locator('[data-easystud-context-action="'+kind+'-open-advanced-settings"]');
    if(await advanced.isVisible()){expect(await advanced.evaluate(n=>!!n.closest('[data-easystud-context-submenu]'))).toBe(false);row.advancedTopLevel=true;}
    await page.screenshot({path:info.outputPath(kind+'-'+width+'-submenu.png')});
    const action=await openContextSubmenu(root,kind==='group'?'group-paste-emails':'grouping-paste-groups');await action.click();await expect(menu).toBeHidden();
    const panel=card.locator(kind==='group'?'[data-easystud-group-email-panel]':'[data-easystud-grouping-groups-panel]');await expect(panel).toBeVisible();await settle(panel);
    const input=panel.locator(kind==='group'?'[data-easystud-group-email-box]':'[data-easystud-grouping-groups-box]');await expect(input).toBeFocused();
    await panel.locator(kind==='group'?'[data-easystud-cancel-group-email]':'[data-easystud-cancel-grouping-groups]').click();await expect(panel).toBeHidden();row.panelOpenedAndCancelled=true;
   }else{if(width===390)await menu.locator('[data-easystud-context-close]').click();else await page.keyboard.press('Escape');await expect(menu).toBeHidden();}
   row.complete=true;save();
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
