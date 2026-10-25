const fs=require('node:fs'),path=require('node:path');
const [modulePath,baseURL,output,phase='measure',course='5',editCourse='2']=process.argv.slice(2);
if(!path.isAbsolute(modulePath||'')||!path.isAbsolute(output||''))throw Error('Absolute Playwright module and output directory required');
if(!/^\d+$/.test(course)||!/^\d+$/.test(editCourse))throw Error('Numeric course ids required');
if(!process.env.EASYEDU_TEST_USER||!process.env.EASYEDU_TEST_PASSWORD)throw Error('Supply credentials through environment');
const target=new URL(baseURL);if(target.protocol!=='https:')throw Error('Expected HTTPS target');
const {chromium}=require(modulePath);fs.mkdirSync(output,{recursive:true});
const siteList=[target.hostname];
const widths=[1920,390];
const views=[['dashboard','/my/'],['course','/course/view.php?id='+course],['course-edit','/course/edit.php?id='+editCourse],
 ['participants','/user/index.php?id='+editCourse+'&local_groupimport_native=1'],['my-courses','/my/courses.php'],['administration','/admin/search.php']];
(async()=>{const b=await chromium.launch({headless:true});const out={phase,pages:[],errors:[],console:[],http:[]};
try{for(const site of siteList){const c=await b.newContext({viewport:{width:1920,height:1080}}),p=await c.newPage(),base=target.origin;
p.on('pageerror',e=>out.errors.push({site,url:p.url(),message:e.message}));p.on('console',m=>{if(m.type()==='error')out.console.push({site,message:m.text(),location:m.location()});});p.on('response',r=>{if(r.status()>=400)out.http.push({site,url:r.url(),status:r.status()});});
await p.goto(base+'/login/index.php',{waitUntil:'domcontentloaded',timeout:90000});await p.fill('#username',process.env.EASYEDU_TEST_USER);await p.fill('#password',process.env.EASYEDU_TEST_PASSWORD);
await Promise.all([p.waitForURL(u=>!u.pathname.includes('/login/'),{timeout:90000}),p.locator('#loginbtn').click()]);
for(const width of widths){await p.setViewportSize({width,height:1080});for(const [view,url] of views){
 await p.goto(base+url,{waitUntil:'networkidle',timeout:90000});await p.waitForTimeout(1200);
 for(let i=0;i<3;i++){const end=p.locator('[data-role="flexitour-step"] [data-role="end"]:visible');if(!await end.count())break;await end.first().click();await p.waitForTimeout(400);}
 // Exercise native disclosure/layout only; no Save or enrolment action is submitted.
 if(view==='course-edit'){const expand=p.locator('.collapsible-actions a.expandall:visible');if(await expand.count())await expand.first().click();await p.waitForTimeout(350);}
 const facts=await p.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id,cls:e.className,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,maxWidth:s.maxWidth,padding:s.padding,display:s.display,visibility:s.visibility,position:s.position};};
  const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
  const main=document.querySelector('#region-main'),outer=document.querySelector('#page.drawers .main-inner'),header=document.querySelector('#page-header'),banner=document.querySelector('.local-course-banner-builder-native-shell');
  const overflow=[...document.querySelectorAll('#region-main input:not([type=hidden]),#region-main select,#region-main textarea,#region-main .form-autocomplete-selection')].filter(visible).map(e=>{const r=e.getBoundingClientRect(),m=main?.getBoundingClientRect();return {tag:e.tagName,id:e.id,left:Math.max(0,(m?.x||0)-r.x),right:Math.max(0,r.right-(m?.right||innerWidth)),w:r.width};}).filter(r=>r.left>.5||r.right>.5);
  return {url:location.href,body:{id:document.body.id,cls:document.body.className},outer:outer&&rect(outer),main:main&&rect(main),header:header&&rect(header),banner:banner&&rect(banner),heading:[...document.querySelectorAll('#page-header h1')].map(e=>({...rect(e),text:e.textContent.trim(),visible:visible(e)})),
   bannerBeforeHeader:!!banner&&!!header&&!!(banner.compareDocumentPosition(header)&Node.DOCUMENT_POSITION_FOLLOWING),
   viewport:{w:innerWidth,scrollWidth:document.documentElement.scrollWidth},overflow,
   drawers:[...document.querySelectorAll('.drawer.drawer-left,.drawer.drawer-right,.drawer-toggles button')].map(e=>({...rect(e),visible:visible(e)})),
   forms:[...document.querySelectorAll('#region-main .fitem')].filter(visible).slice(0,25).map(e=>({row:rect(e),label:e.querySelector('.col-form-label')&&rect(e.querySelector('.col-form-label')),content:e.querySelector('.felement')&&rect(e.querySelector('.felement'))})),
   fatal:document.body.textContent.includes('Fatal error:')};
 });
 if(view==='participants'&&new URL(facts.url).pathname!=='/user/index.php')throw Error('Native Participants redirected');
 const item={site,width,view,...facts};out.pages.push(item);
 await p.screenshot({path:path.join(output,`${phase}-${site}-${width}-${view}.png`)});
 if(view==='participants'){
  const toggle=p.locator('#region-main [data-bs-toggle="dropdown"]:visible,#region-main [data-toggle="dropdown"]:visible').first();
  if(await toggle.count()){await toggle.click();await p.waitForTimeout(250);item.menu=await p.evaluate(()=>[...document.querySelectorAll('.dropdown-menu.show')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,position:s.position,painted:document.elementFromPoint(Math.min(innerWidth-1,r.x+10),Math.min(innerHeight-1,r.y+10))?.closest('.dropdown-menu')===e};}));await p.screenshot({path:path.join(output,`${phase}-${site}-${width}-${view}-menu.png`)});}
 }
 fs.writeFileSync(path.join(output,phase+'.json'),JSON.stringify(out,null,2));
}}await c.close();}}finally{await b.close();fs.writeFileSync(path.join(output,phase+'.json'),JSON.stringify(out,null,2));}
console.log(JSON.stringify({phase,pages:out.pages.length,errors:out.errors,console:out.console,http:out.http}));})().catch(e=>{console.error(e.message);process.exitCode=1;});
