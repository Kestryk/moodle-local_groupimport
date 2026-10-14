const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Claude submenus native trigger keyboard FR1280 FR390',async({page},info)=>{
 test.setTimeout(240000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);if(url.hostname!=='localhost'||url.port||url.searchParams.get('id')!=='5')throw Error('Principal course5 only');
 const rows=[],errors=[];const save=()=>fs.writeFileSync(info.outputPath('submenus.json'),JSON.stringify({rows,errors},null,2));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
 }
 const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
 try{for(const width of [1280,390]){
  await page.setViewportSize({width,height:1000});
  if(width===390)await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
  const card=root.locator('[data-easystud-user]:visible').first();await expect(card).toBeVisible();
  if(width<=1024) await card.locator('[data-easystud-card-menu]:visible').first().click();
  else await card.locator('.local-groupimport-easystud-user__headline').click({button:'right',position:{x:100,y:16}});
  const menu=root.locator('[data-easystud-context-menu]');await expect(menu).toBeVisible();
  const toggle=menu.locator('[data-easystud-context-submenu-toggle]:visible').first();await expect(toggle).toBeVisible();
  const key=await toggle.getAttribute('data-easystud-context-submenu-toggle');const sub=menu.locator('[data-easystud-context-submenu="'+key+'"]');
  await toggle.focus();await page.keyboard.press('ArrowRight');await expect(sub).toBeVisible();
  await expect(sub.locator('[data-easystud-context-action]:visible').first()).toBeFocused();
  await page.screenshot({path:info.outputPath('submenu-'+width+'.png')});
  await page.keyboard.press('ArrowLeft');await expect(sub).not.toBeVisible();await expect(toggle).toBeFocused();
  await toggle.click();await expect(sub).toBeVisible();await page.keyboard.press('Escape');await expect(sub).not.toBeVisible();
  await page.keyboard.press('Escape');await expect(menu).not.toBeVisible();
  rows.push({width,submenu:key,keyboard:true});save();
 }
 expect(errors).toEqual([]);
 }finally{save();}
});
