const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path');
const [base,course,out,label]=process.argv.slice(2);
if(!base || !course || !out || !path.isAbsolute(out) || !label)throw Error('Pass base URL, course id, absolute evidence directory and label');
fs.mkdirSync(out,{recursive:true});
const report={base,course,label,cases:[],errors:[],console:[],phase:'init'};
const save=()=>fs.writeFileSync(out+'/nav-lanes-'+label+'.json',JSON.stringify(report,null,2));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let browser;try{
browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME_EXECUTABLE || undefined});
const ctx=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1600,height:1000}}),page=await ctx.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(180000);
page.on('pageerror',e=>{report.errors.push({phase:report.phase,message:e.message,stack:e.stack});save();});
page.on('console',e=>{if(e.type()==='error')report.console.push({phase:report.phase,text:e.text(),location:e.location()});});
for(let attempt=0;attempt<3;attempt++){
 await page.goto(base+'/local/groupimport/manage.php?id='+course+'&lang=en',{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){
  await page.locator('#username').fill(process.env.QA_USERNAME);await page.locator('#login input[type=password]').fill(process.env.QA_PASSWORD);
  await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'}),page.locator('#loginbtn').click({noWaitAfter:true})]);await page.waitForLoadState('domcontentloaded');
 }
 if(!page.url().includes('/login/'))break;
}
for(const lang of ['fr','en'])for(const view of ['manage','index']){
report.phase=lang+'-'+view;save();
await page.goto(base+'/local/groupimport/'+view+'.php?id='+course+'&lang='+lang,{waitUntil:'domcontentloaded'});
if(view==='manage')await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState==='ready',null,{timeout:240000});
else await page.waitForFunction(()=>document.querySelector('.local-groupimport-import')&&!document.querySelector('.local-groupimport-import--loading'),null,{timeout:240000});
await page.waitForLoadState('load');await wait(600);
for(const width of [1600,768,390]){
report.phase=lang+'-'+view+'-'+width;await page.setViewportSize({width,height:1000});await wait(700);
const row={lang,view,width};report.cases.push(row);
row.lanes=await page.evaluate(()=>{
 const selectors=['.local-groupimport-easystud__panel','.local-groupimport-easystud__filters','.local-groupimport-easystud-participant-groups__create','.local-groupimport-easystud__participant-list','.local-groupimport-easystud-participant-groups__list','.local-groupimport-easystud-create-card--group','.local-groupimport-easystud-create-card--grouping','.local-groupimport-easystud-structure-groups','.local-groupimport-easystud-tree__groupings'];
 const root=document.querySelector('#local-groupimport-easystud');
 return {rootClass:root?.className,token:root?getComputedStyle(root).getPropertyValue('--easyedu-border').trim():null,surfaces:selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none';}).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {selector,border:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],color:s.borderRightColor,background:s.backgroundColor,rect:[r.x,r.y,r.width,r.height]};})),overflow:document.documentElement.scrollWidth-innerWidth};
});
const opener=page.locator('[data-easyedu-navigation-open]:visible').first();row.responsive=await opener.isVisible();
if(row.responsive){
 await opener.click();const panel=page.locator('[data-easyedu-navigation-panel][aria-hidden=false]');await panel.waitFor();await wait(500);
 row.nav=await panel.evaluate(panel=>{const scroll=panel.querySelector('[data-easyedu-navigation-panel-scroll]'),button=scroll.querySelector('[data-easyedu-display-open]'),title=scroll.querySelector('.easyedu-navigation__section-title'),item=scroll.querySelector('.easyedu-navigation__items .easyedu-navigation__item');const r=e=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height];};return{first:scroll.firstElementChild?.className,buttonClass:button.className,button:r(button),title:r(title),item:r(item),above:button.getBoundingClientRect().bottom<=title.getBoundingClientRect().top+0.5,sameWidth:Math.abs(button.getBoundingClientRect().width-item.getBoundingClientRect().width)<=0.5,text:button.textContent.trim(),overflow:panel.scrollWidth-panel.clientWidth};});
 row.nav.pass=row.nav.above&&row.nav.sameWidth&&row.nav.button[3]>=44&&row.nav.overflow===0;
 if(label==='after'&&!row.nav.pass)process.exitCode=1;
 if(lang==='fr'&&width===390)await page.screenshot({path:out+'/'+view+'-'+label+'-390.png'});
 await panel.locator('[data-easyedu-display-open]').click();
 await page.locator('[data-easyedu-display-dialog]:visible').waitFor();row.preferencesOpened=true;await page.keyboard.press('Escape');await wait(700);
 const close=page.locator('[data-easyedu-navigation-panel][aria-hidden=false] [data-easyedu-navigation-close]');if(await close.isVisible())await close.click();await wait(500);
}else{
 row.desktop=await page.locator('[data-easyedu-navigation-desktop]').evaluate(e=>{const b=e.getBoundingClientRect();return{rect:[b.x,b.y,b.width,b.height],preferences:e.querySelectorAll('[data-easyedu-display-open]').length,text:e.textContent.replace(/\s+/g,' ').trim()};});
}
save();
}
}
await ctx.close();
}catch(e){report.failure={phase:report.phase,message:e.message,stack:e.stack};process.exitCode=1;}finally{if(browser)await browser.close();report.finished=new Date().toISOString();save();console.log(JSON.stringify({base,label,cases:report.cases.length,errors:report.errors.length,failure:report.failure}));}})();
