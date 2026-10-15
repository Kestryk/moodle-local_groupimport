const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('Served page CSS polish and CSV security native8051',async({page},info)=>{
 test.setTimeout(480000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');const course=Number(base.searchParams.get('id'));
 if(base.origin!=='http://localhost:8051'||course===5||!course)throw Error('Dedicated manifested course required');
 const report={course,errors:[],blocked:[],rows:[]};const save=()=>fs.writeFileSync(info.outputPath('polish-security.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()!=='GET'){report.blocked.push(r.request().url());save();return r.abort();}return r.continue();});
 await page.goto(base.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});}
 await page.addInitScript(()=>{
  window.qaColumnFrames=[];const start=performance.now();
  const sample=()=>{const root=document.querySelector('#local-groupimport-easystud');if(root){const shown=s=>{const n=root.querySelector(s);if(!n)return false;const c=getComputedStyle(n),r=n.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity)>0&&r.width>0&&r.height>0;};window.qaColumnFrames.push({ms:performance.now()-start,participants:shown('[data-easystud-participant-list]'),groups:shown('[data-easystud-participant-groups-panel]'),ready:root.dataset.easystudLoadingState});if(root.dataset.easystudLoadingState==='ready')return;}if(performance.now()-start<15000)requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 const root=page.locator('#local-groupimport-easystud');
 try{
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:1000});await page.goto(base.href,{waitUntil:'domcontentloaded'});await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.evaluate(()=>document.fonts.ready);
  const row={width,columns:await page.evaluate(()=>window.qaColumnFrames)};report.rows.push(row);save();
  const view=root.locator(width<768?'[data-easystud-mobile-view="groups"]:visible':'[data-easystud-layout-mode="structure"]:visible');await view.click();
  const card=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first();await expect(card).toBeVisible();
  const toggle=card.locator('[data-easystud-group-members-toggle]').first();
  if(await toggle.getAttribute('aria-expanded')==='true')await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
  row.folded=await card.boundingBox();await page.screenshot({path:info.outputPath('groups-folded-'+width+'.png')});
  const select=card.locator('[data-easystud-group-select-all]:visible').first();
  await select.click();await expect(toggle).toHaveAttribute('aria-expanded','true');row.selectAllExpands=true;
  await expect(card.locator('[data-easystud-member-id]:visible')).not.toHaveCount(0);row.expanded=await card.boundingBox();
  const label=root.getByText('QA & < > " \'',{exact:true});await expect(label.first()).toBeVisible();row.literalLabel=await label.first().innerText();expect(row.literalLabel).toBe('QA & < > " \'');
  row.geometry=await root.evaluate(n=>({viewportOverflow:document.documentElement.scrollWidth-innerWidth,scrollContainers:[...document.querySelectorAll('body *')].filter(x=>{const s=getComputedStyle(x);return /(auto|scroll)/.test(s.overflowY)&&x.scrollHeight>x.clientHeight+2&&x.clientHeight>300;}).map(x=>({tag:x.tagName,class:x.className,height:x.clientHeight,scrollHeight:x.scrollHeight})),fontsReady:document.fonts.status}));expect(row.geometry.viewportOverflow).toBeLessThanOrEqual(1);save();
  await page.screenshot({path:info.outputPath('groups-expanded-'+width+'.png')});
  if(width===1280){
   const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').filter({has:page.getByText('QA Source Structure',{exact:true})}).first();
   const direct=grouping.locator('[data-easystud-open-advanced-settings]:visible');
   if(await direct.count())await direct.first().click();else{await grouping.locator('[data-easystud-card-menu]:visible').first().click();await root.locator('[data-easystud-context-action="grouping-open-advanced-settings"]:visible').click();}
   const editor=root.locator('[data-easystud-editor-context="grouping"]');await expect(editor).toBeVisible();
   const section=editor.locator('[data-easystud-settings-list-section]').filter({has:page.getByText('=1+1',{exact:true})}).first();
   const downloadPromise=page.waitForEvent('download');await section.locator('[data-easystud-settings-export]').click();const download=await downloadPromise;
   const exportPath=info.outputPath('grouping-export.csv');await download.saveAs(exportPath);const csv=fs.readFileSync(exportPath,'utf8');
   expect(csv).toContain('"\'=1+1"');expect(csv).toContain('QA & < > "" \'');expect(csv).not.toContain('&amp;');row.csv={formulaQuoted:true,literalLabels:true};save();
   await editor.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]').click();
  }else{
   await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
   const participant=root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();
   const eye=participant.locator('[data-easystud-open-user]:visible').first();
   row.eye=await eye.boundingBox();await expect(eye).toBeVisible();
   await participant.locator('[data-easystud-card-menu]:visible').click();
   const menu=root.locator('[data-easystud-context-menu]');await expect(menu).toBeVisible();
   row.menuMotion=await menu.evaluate(n=>({animations:n.getAnimations({subtree:true}).map(a=>({name:a.animationName,timing:a.effect.getComputedTiming()})),transition:getComputedStyle(n).transitionDuration,animation:getComputedStyle(n).animationDuration}));save();
   expect(row.menuMotion.transition!=='0s'||row.menuMotion.animation!=='0s'||row.menuMotion.animations.length>0).toBe(true);
   await page.screenshot({path:info.outputPath('mobile-menu.png')});await root.locator('[data-easystud-context-close]').click();
  }
 }
 for(const [name,path,selector] of [['mass','/local/groupimport/index.php?id='+course+'&lang=fr','.local-groupimport-import'],['admin','/admin/settings.php?section=local_groupimport&lang=fr','#adminsettings'],['outside','/my/?lang=fr','#page']]){
  await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});await expect(page.locator(selector).first()).toBeVisible({timeout:60000});
  for(const width of [1280,390]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);
   const row=await page.evaluate(({name,width,selector})=>{const rules=[];for(const sheet of document.styleSheets){try{for(const r of sheet.cssRules){if(/local-groupimport|data-easystud/.test(r.cssText))rules.push(r.cssText.slice(0,120));}}catch(e){throw Error('Unreadable CSS '+sheet.href);}}return {name,width,rules:rules.length,viewportOverflow:document.documentElement.scrollWidth-innerWidth,font:getComputedStyle(document.querySelector(selector)).fontSize,styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.href).filter(s=>s.includes('/local/groupimport/'))};},{name,width,selector});
   report.rows.push(row);save();expect(row.viewportOverflow).toBeLessThanOrEqual(1);if(name==='outside')expect(row.rules).toBe(0);if(name==='mass')expect(row.font).toBe('16px');await page.screenshot({path:info.outputPath(name+'-'+width+'.png')});
  }
 }
 expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);
 }finally{save();}
});


