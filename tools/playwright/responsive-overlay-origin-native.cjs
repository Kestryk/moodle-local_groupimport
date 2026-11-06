'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwrightPath, secretPath, root, base, course, executablePath] = process.argv.slice(2);
assert(playwrightPath && secretPath && path.isAbsolute(root) && base && /^\d+$/.test(course),
    'Pass Playwright package, external secret env, absolute evidence directory, local base URL, course id and optional browser executable.');
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local supervised test only.');
const {chromium} = require(playwrightPath);
const phase = 'native';
const secret = fs.readFileSync(secretPath, 'utf8');
const password = secret.match(/^EASYSTUD_TEST_PASSWORD\s*=\s*(.*)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2');
if (!password) throw Error('Clé de compte de test absente.');
const report = {errors: [], rows: []};
fs.mkdirSync(root, {recursive: true});
const safe = text => String(text).replace(/([?&](?:sesskey|token|logintoken)=)[^&]+/ig, '$1[redacted]');
(async () => {
 const browser = await chromium.launch({...(executablePath ? {executablePath} : {}), headless: true});
 try {
  const context = await browser.newContext({viewport: {width: 375, height: 900}});
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push({type:'js', message: safe(e.message)}));
  page.on('response', r => {if(r.status()>=400)report.errors.push({type:'http',status:r.status(),url:safe(r.url())});});
  await page.goto(base + '/login/index.php', {waitUntil:'domcontentloaded', timeout:45000});
  await page.locator('input[name=username]').fill('claude-sm-test');
  await page.locator('input[name=password]').fill(password);
  await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'), {waitUntil:'commit',timeout:45000}),page.locator('#loginbtn').click()]);
  for (const lang of ['fr','en']) for (const width of [375,768,1600]) {
   await page.setViewportSize({width,height:900});
   await page.goto(`${base}/local/groupimport/manage.php?id=${course}&lang=${lang}`, {waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState==='ready',null,{timeout:90000});
   report.rows.push({width,stage:'ready',data:await page.evaluate(()=>({
    title:document.title, workspace:document.querySelector('.local-groupimport-easystud__panel')?.getBoundingClientRect().toJSON(), notices:[...document.querySelectorAll('.debuggingmessage')].map(n=>n.textContent.trim()),
    nav:[...document.querySelectorAll('[data-easyedu-navigation-trigger],.easyedu-navigation__trigger,[data-easyedu-navigation-panel],.easyedu-navigation__panel,.navbar')].map(n=>({
     tag:n.tagName,cls:n.className,attributes:[...n.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')).map(a=>[a.name,a.value]),rect:n.getBoundingClientRect().toJSON(),position:getComputedStyle(n).position,top:getComputedStyle(n).top,bottom:getComputedStyle(n).bottom
    })), buttons:[...document.querySelectorAll('button')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height;}).map(n=>({cls:n.className,text:n.textContent.trim().slice(0,65),title:n.title,aria:n.getAttribute('aria-label')})).slice(0,28)
   }))});
   await page.screenshot({path:path.join(root,`${phase}-${lang}-${width}-ready.png`)});
   const measure=async family => {
    await page.waitForTimeout(650);
    const row=await page.evaluate(family=>{
     const rect=n=>n?.getBoundingClientRect().toJSON();
     const selectors={navigation:'.easyedu-navigation__panel',context:'.local-groupimport-easystud-context-menu:not([hidden])',clipboard:'.local-groupimport-easystud-modal:not([hidden]) .local-groupimport-easystud-modal__dialog',preferences:'dialog.easyedu-preferences-dialog[open]'};
     const el=document.querySelector(selectors[family]);const r=rect(el),navbar=rect(document.querySelector('.navbar'));
     const command=el?.querySelector('button'),cr=rect(command);const hit=cr?document.elementFromPoint(cr.x+cr.width/2,cr.y+cr.height/2):null;
     const title=el?.querySelector('h2,h3,h4,strong'),tr=rect(title);
     const titleHittable=tr?[tr.left+2,tr.left+tr.width/2,tr.right-2].every(x=>{const p=document.elementFromPoint(x,tr.top+tr.height/2);return title===p||title.contains(p);}):null;
     return{family,navbar,rect:r,offset:r?r.top-navbar.bottom:null,position:el?getComputedStyle(el).position:null,selector:selectors[family],classes:el?.className,
      command:cr,commandHittable:command?command===hit||command.contains(hit):null,
      title:tr,titleHittable,
      origin:el?getComputedStyle(el).getPropertyValue('--easyedu-overlay-block-start'):null,
      notices:[...document.querySelectorAll('.debuggingmessage')].map(n=>n.textContent.trim()),
      rootDocumentOverflow:document.documentElement.scrollWidth-innerWidth};
    },family);
    report.rows.push({width,lang,...row});
    await page.screenshot({path:path.join(root,`${phase}-${lang}-${width}-${family}.png`)});
   };
   if(width===1600){continue;}
   const trigger=page.locator('.easyedu-navigation__trigger:visible');
   await trigger.click();
   await page.waitForTimeout(650);
   report.rows.push({width,stage:'nav-open',data:await page.evaluate(()=>({
    panels:[...document.querySelectorAll('.easyedu-navigation__panel,.easyedu-navigation__trigger,.navbar')].map(n=>({cls:n.className,rect:n.getBoundingClientRect().toJSON(),position:getComputedStyle(n).position,top:getComputedStyle(n).top,transform:getComputedStyle(n).transform})),
    ancestors:[...document.querySelectorAll('.easyedu-navigation__panel')].map(n=>{let rows=[];for(let p=n.parentElement;p;p=p.parentElement){let c=getComputedStyle(p);rows.push({tag:p.tagName,id:p.id,cls:p.className,transform:c.transform,contain:c.contain,filter:c.filter,position:c.position});}return rows;})
   }))});
   await measure('navigation');
   await page.locator('[data-easyedu-navigation-close]').click();await page.waitForTimeout(350);
   await page.locator('.local-groupimport-easystud-card-menu:visible').first().click();
   await measure('context');
   await page.keyboard.press('Escape');await page.waitForTimeout(350);
   assert(await page.locator('.easyedu-guide__launcher--floating').evaluate(n=>getComputedStyle(n).visibility!=='hidden'), 'Floating Guide restored after menu closes');
   await trigger.click();await page.waitForTimeout(350);
   await page.locator('.easyedu-navigation__panel [data-easyedu-navigation-action]').first().click();
   await measure('clipboard');
   await page.keyboard.press('Escape');await page.waitForTimeout(350);
   await trigger.click();await page.waitForTimeout(350);
   await page.locator('.easyedu-navigation__preferences-drawer button').click();
   await measure('preferences');
  }
  assert.equal(report.errors.length, 0, 'No JS/HTTP errors');
  const panels = report.rows.filter(row => row.family);
  assert.equal(panels.length, 16, 'All four families in both languages and compact widths');
  for (const row of panels) {
   assert(row.rect && row.offset >= -0.5, `${row.lang}/${row.width}/${row.family}: below host navigation`);
   assert(row.offset <= 17, `${row.lang}/${row.width}/${row.family}: top origin, not centred or bottom anchored`);
   assert(row.rect.bottom <= 900.5, `${row.lang}/${row.width}/${row.family}: contained in viewport`);
   assert.equal(row.commandHittable, true, `${row.lang}/${row.width}/${row.family}: first command is actually hittable`);
   if(row.title)assert.equal(row.titleHittable,true,`${row.lang}/${row.width}/${row.family}: title edge and centre are not obscured`);
   assert.equal(row.notices.length, 0, 'No Moodle debugging message');
  }
  report.passed = true;
 } catch(e){report.failure=safe(e.message);process.exitCode=1;}
 finally{await browser.close();fs.writeFileSync(path.join(root,`${phase}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify({phase,rows:report.rows.filter(r=>r.family).map(({width,lang,family,offset,rect,commandHittable})=>({width,lang,family,offset,top:rect?.top,bottom:rect?.bottom,commandHittable})),errors:report.errors,failure:report.failure}));}
})();
