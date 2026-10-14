// Principal-only evidence successor: preserve the predecessor and capture both
// mobile languages before the strict peer-size assertion. No product injection.
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const settle=n=>n.evaluate(async root=>{await document.fonts.ready;await Promise.all(root.getAnimations({subtree:true})
 .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
const metrics=n=>n.evaluate(el=>{const s=getComputedStyle(el);return {height:el.getBoundingClientRect().height,
 padding:s.padding,radius:s.borderRadius,font:s.font,minHeight:s.minHeight,border:s.borderWidth};});
test('K16 principal ready single mode mobile evidence FR EN390',async({page},info)=>{
 test.setTimeout(180000);page.setDefaultTimeout(60000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);
 if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const report={cases:[],errors:[],writes:[],mode:'on-demand',predecessor:'claude-bascule-principal-ready-native.spec.js:73'};
 const save=()=>fs.writeFileSync(info.outputPath('k16-principal.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/lib/ajax/service.php*',route=>{
  const calls=route.request().postDataJSON()||[];
  const writes=calls.map(c=>c.methodname||'').filter(n=>n.startsWith('local_groupimport_')&&!/_(get|list)_/.test(n));
  if(writes.length){report.writes.push(writes);return route.abort('blockedbyclient');}return route.continue();
 });
 await page.route('**/local/groupimport/**',route=>{
  if(route.request().method()!=='GET'){report.writes.push(new URL(route.request().url()).pathname);return route.abort('blockedbyclient');}
  return route.continue();
 });
 try{
  await page.setViewportSize({width:390,height:1000});
  await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
  if(await page.locator('#username').count()){
   await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
   await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
   await page.locator('#loginbtn').click({noWaitAfter:true});
   await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});
  }
  // Drain login's destination before capturing a separately owned document.
  const root=page.locator('#local-groupimport-easystud');
  if(page.url().includes('/local/groupimport/manage.php'))await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  for(const language of ['fr','en']){
   url.searchParams.set('lang',language);await page.goto(url.href,{waitUntil:'domcontentloaded'});
   await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
   await expect(root).toHaveAttribute('data-easystud-rendering-mode','reactive');
   await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language+'(?:-|$)'));
   const search=root.locator('[data-easystud-search]:visible');await search.fill('a');
   const reset=root.locator('[data-easystud-reset-filters]:visible');await expect(reset).toBeVisible();await settle(root);
   const row={language,width:390,reset:await metrics(reset)};report.cases.push(row);save();
   await reset.click();await expect(search).toHaveValue('');
   await root.locator('[data-easystud-mobile-view="groupings"]:visible').click();await settle(root);
   const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').first();
   row.groupingId=await grouping.getAttribute('data-easystud-grouping-id');
   await grouping.locator(':scope > [data-easystud-card-menu]:visible,:scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first().click();
   const action=root.locator('[data-easystud-context-menu].is-mobile-sheet [data-easystud-context-action="grouping-search-groups"]');
   await expect(action).toHaveText(language==='fr'?'Rechercher des groupes':'Search groups');await action.click();
   const panel=grouping.locator('[data-easystud-container-search-panel]');await expect(panel).toBeVisible();await settle(panel);
   await expect(panel.locator('[data-easystud-container-group-search]')).toBeFocused();
   const cancel=panel.locator('[data-easystud-container-search-cancel]');await expect(cancel).toBeVisible();
   row.cancel=await metrics(cancel);save();await page.screenshot({path:info.outputPath(language+'-390-visible-cancel.png')});
   expect.soft(row.reset,language+' visible Cancel and Reset').toEqual(row.cancel);
   expect.soft(row.cancel.height,language+' Cancel height').toBe(38);
  }
  expect(report.errors).toEqual([]);expect(report.writes).toEqual([]);
 }finally{save();}
});

