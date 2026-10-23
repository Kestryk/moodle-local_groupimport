const fs=require('fs');const {chromium}=require(process.env.EASYEDU_PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path');
const dir=process.env.EASYEDU_TEST_OUTPUT;
const fixturePath=process.env.EASYEDU_TEST_FIXTURE;
const base=process.env.EASYEDU_TEST_BASE_URL;
if (!dir || !fixturePath || !base || !path.isAbsolute(dir) || !path.isAbsolute(fixturePath)) {
 throw Error('Supply absolute EASYEDU_TEST_OUTPUT and EASYEDU_TEST_FIXTURE, and an owned EASYEDU_TEST_BASE_URL');
}
fs.mkdirSync(dir,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8').replace(/^\uFEFF/,''));const label=process.argv[2]||'inspect',quick=process.argv.includes('--inspect');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.EASYEDU_CHROME_PATH});const result={cases:[],errors:[],console:[]};try{
const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(90000);
page.on('pageerror',e=>result.errors.push({message:e.message,stack:e.stack}));page.on('console',m=>{if(m.type()==='error')result.console.push(m.text())});
console.log(label+': login');const login=await context.request.get(base+'/login/index.php',{timeout:60000});const token=(await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];if(!token)throw Error('Login token missing');await context.request.post(base+'/login/index.php',{timeout:60000,form:{username:fixture.username,password:fixture.password,logintoken:token}});console.log(label+': authenticated');
const plans=[['pfull-gempty','participants'],['pempty-gfull','participants'],['gfull-ggempty','structure'],['gempty-ggfull','structure'],['empty','participants'],['empty','structure'],['full','participants'],['full','structure']];
for(const lang of (quick?['en']:['fr','en']))for(const [name,view] of (quick?plans.slice(0,4):plans)){
 console.log(label+': document '+lang+' '+name);await page.setViewportSize({width:1600,height:1100});await page.goto(base+'/local/groupimport/manage.php?id='+fixture.courses[name]+'&lang='+lang,{waitUntil:'domcontentloaded'});console.log(label+': DOM '+page.url());
 await page.waitForFunction(()=>{const r=document.querySelector('#local-groupimport-easystud');return r?.dataset.easystudLoadingState==='ready'&&!r.classList.contains('is-action-busy')},{},{timeout:90000});
 for(const s of ['[data-easyedu-guide-welcome-dismiss]:visible','.drawer.show [data-action="closedrawer"]:visible']){const loc=page.locator(s);if(await loc.count())await loc.first().click({noWaitAfter:true})}
 await page.locator('[data-easystud-layout-mode="'+view+'"]').click();await page.waitForTimeout(3000);
 for(const width of (quick?[1600]:[1600,1280,768,390])){
  await page.setViewportSize({width,height:1100});await page.waitForTimeout(3000);
  const entities=view==='participants'?['participants','groups']:['groups','groupings'];const columns=[];
  for(const entity of entities){if(width<=1024){const b=page.locator('[data-easystud-mobile-view="'+entity+'"]:visible');if(await b.count())await b.click();await page.waitForTimeout(300);}
   const data=await page.evaluate(({entity,view,width})=>{
    const root=document.querySelector('#local-groupimport-easystud');const sel=entity==='participants'?'[data-easystud-participant-list]':entity==='groups'?(view==='participants'&&width>1024?'.local-groupimport-easystud-participant-groups__list':'.local-groupimport-easystud-structure-groups__list'):'.local-groupimport-easystud-tree__groupings';const list=root.querySelector(sel);
    const visible=e=>!!e&&!e.hidden&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none';
    const node=list&&[...list.children].find(e=>visible(e)&&e.matches('[data-easystud-user],[data-easystud-group-id],[data-easystud-grouping-id],[data-easystud-empty-state],[data-easystud-managed-empty]'));
    const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,padding:s.padding,margin:s.margin,display:s.display,alignItems:s.alignItems,justifyContent:s.justifyContent,alignContent:s.alignContent}};
    let range=null;if(node){const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let t;while(t=walker.nextNode()){if(t.textContent.trim()){const a=document.createRange();a.selectNodeContents(t);const r=a.getBoundingClientRect();if(r.height&&r.width){range={y:r.y,h:r.height,text:t.textContent.trim()};break}}}}
    const headers=entity==='participants'?root.querySelector('[data-easystud-filters]'):root.querySelector(entity==='groupings'?'.local-groupimport-easystud-create-card--grouping':view==='participants'&&width>1024?'.local-groupimport-easystud-participant-groups__create':'.local-groupimport-easystud-create-card--group');
    const bar=list?.querySelector(':scope > [data-easystud-pagination="top"]');
    return {entity,list:box(list),node:box(node),bar:box(bar),barChildren:bar?[...bar.children].map(box):[],emptyControls:bar?.classList.contains('is-empty')?[...bar.querySelectorAll('.local-groupimport-easystud-pagination__selection,.local-groupimport-easystud-pagination__tools')].map(e=>({inert:e.inert,visibility:getComputedStyle(e).visibility,tabbable:[...e.querySelectorAll('button,input,select,a[href]')].filter(b=>!b.disabled&&getComputedStyle(b).visibility==='visible'&&!b.closest('[inert]')).length})):[],empty:node?.matches('[data-easystud-empty-state],[data-easystud-managed-empty]'),className:node?.className,text:node?.textContent.trim(),range,header:box(headers),rootClass:root.className,mobile:root.dataset.easystudMobileViewActive,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
   },{entity,view,width});columns.push(data);
  }
  result.cases.push({lang,name,view,width,columns});fs.writeFileSync(dir+'/'+label+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify({lang,name,view,width,columns:columns.map(c=>({entity:c.entity,empty:c.empty,y:c.node?.y,listY:c.list?.y,textY:c.range?.y,header:c.header?.h}))}));
  if(quick||name==='pfull-gempty'&&width===1600)await page.screenshot({path:dir+'/'+label+'-'+lang+'-'+name+'-'+view+'-'+width+'.png',fullPage:true});
 }
}
}catch(e){result.failure={message:e.message,stack:e.stack};process.exitCode=1;}finally{fs.writeFileSync(dir+'/'+label+'.json',JSON.stringify(result,null,2));await browser.close();console.log(JSON.stringify({cases:result.cases.length,errors:result.errors,console:result.console,failure:result.failure}));}})();
