const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle/local/groupimport/tools/playwright/node_modules/playwright');
const path=require('node:path');
const outputDir=process.env.EASYSTUD_K23_36_OUTPUT;
const repoRoot=path.resolve(__dirname,'../../..');
if(!outputDir||!path.isAbsolute(outputDir)||path.resolve(outputDir).toLowerCase().startsWith(repoRoot.toLowerCase())) {
    throw new Error('Set an absolute EASYSTUD_K23_36_OUTPUT outside Git');
}
fs.mkdirSync(outputDir,{recursive:true});
const label=process.argv[2]||'native',quick=process.argv.includes('--quick');
const result={label,rows:[],errors:[],console:[]};
const save=()=>fs.writeFileSync(`${outputDir}/${label}.json`,JSON.stringify(result,null,2));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const measure=()=>{
 const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:s.display,minWidth:s.minWidth,flex:s.flex,overflow:s.overflow,order:s.order};};
 const clip=e=>{let r=e.getBoundingClientRect(),left=0,right=innerWidth,top=0,bottom=innerHeight,anc=[];for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);anc.push({class:a.className,left:b.left,right:b.right,overflow:s.overflowX});}}return{left:Math.max(0,left-r.left),right:Math.max(0,r.right-right),anc};};
 const painted=c=>{if(!c.offsetParent)return false;for(let a=c;a&&a!==document.body;a=a.parentElement){const r=a.getBoundingClientRect(),s=getComputedStyle(a);if(r.width<1||s.visibility==='hidden'||s.display==='none')return false;}return true;};
 const cards=[...document.querySelectorAll('[data-easystud-group-id],[data-easystud-grouping-id]')].filter(painted).slice(0,35).map(c=>{
 const h=c.querySelector(':scope > .local-groupimport-easystud-group__header,:scope > .local-groupimport-easystud-grouping__header');if(!h)return null;
 const b=h.querySelector(':scope > .badge'),t=h.querySelector(':scope > [data-easystud-card-menu]');
 return{id:c.dataset.easystudGroupId||c.dataset.easystudGroupingId,type:c.hasAttribute('data-easystud-group-id')?'group':'grouping',card:box(c),header:box(h),badge:b&&b.offsetParent?box(b):null,toggle:t&&t.offsetParent&&!t.hidden?box(t):null,badgeClip:b&&b.offsetParent?clip(b):null,toggleClip:t&&t.offsetParent&&!t.hidden?clip(t):null,
 children:[...h.children].filter(e=>e.offsetParent&&!e.hidden).map(e=>({class:e.className,tag:e.tagName,...box(e)}))};}).filter(Boolean);
 return{cards,drawer:document.querySelector('#theme_boost-drawers-courseindex')?.className,responsive:document.querySelector('#local-groupimport-easystud')?.classList.contains('local-groupimport-easystud--responsive-workspace')};
};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(180000);
 page.on('pageerror',e=>{result.errors.push(e.message);save();});page.on('console',e=>{if(e.type()==='error'){result.console.push(e.text());save();}});
 const pass=/\$password\s*=\s*'([^']+)'/.exec(fs.readFileSync('C:/dev/tools/easystud-set-test-user.php','utf8'))[1];
 await page.goto('http://localhost:8054/login/index.php',{waitUntil:'domcontentloaded'});await page.locator('#username').fill('claude-sm-test');await page.locator('input[type=password]').fill(pass);
 await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'}),page.locator('#loginbtn').click({noWaitAfter:true})]);
 for(const lang of quick?['fr']:['fr','en']){
 await page.goto(`http://localhost:8054/local/groupimport/manage.php?id=71&lang=${lang}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState==='ready',null,{timeout:240000});
 for(const width of quick?[1050,1150,1280]:[1600,1280,1150,1050,1024,768,390]){
 await page.setViewportSize({width,height:1000});await wait(650);
 for(const drawerOpen of quick?[true]:[false,true]){
 const drawer=page.locator('#theme_boost-drawers-courseindex');
 const isOpen=await drawer.evaluate(e=>e.classList.contains('show'));
 if(isOpen!==drawerOpen){const b=drawerOpen?page.locator('.drawer-left-toggle button:visible, button[data-toggler="drawers"][data-target="theme_boost-drawers-courseindex"]:visible').first():drawer.locator('[data-action="closedrawer"]:visible').first();await b.click();await wait(550);}
 const responsive=await page.locator('#local-groupimport-easystud').evaluate(e=>e.classList.contains('local-groupimport-easystud--responsive-workspace'));
 // A mobile native drawer is an overlay; record that state then close it for actionable plugin tests.
 const drawerOverlay=drawerOpen&&width<=1024;
 if(drawerOverlay){await drawer.locator('[data-action="closedrawer"]:visible').first().click();await wait(400);}
 for(const view of responsive?['groups','groupings']:['participants','structure','participants','structure']){
 result.phase=`${lang}-${width}-${drawerOpen}-${view}`;console.log(result.phase);save();
 const control=page.locator(responsive?`[data-easystud-mobile-view="${view}"]:visible`:`[data-easystud-layout-mode="${view}"]:visible`).first();
 await page.evaluate(()=>{
 window.k36Frames=[];window.k36Stop=false;
 const tick=()=>{const root=document.querySelector('#local-groupimport-easystud');const cards=[...root.querySelectorAll('[data-easystud-group-id]')].filter(c=>c.offsetParent).slice(0,12).map(c=>{const h=c.querySelector(':scope > .local-groupimport-easystud-group__header'),b=h?.querySelector(':scope > .badge'),t=h?.querySelector(':scope > [data-easystud-card-menu]');if(!h||!b||!b.offsetParent)return null;const r=h.getBoundingClientRect(),br=b.getBoundingClientRect(),tr=t?.getBoundingClientRect();return{id:c.dataset.easystudGroupId,host:r.width,rightGap:r.right-br.right,y:br.y-r.y,badgeRight:br.right,overflow:Math.max(0,br.right-r.right),toggleVisible:!!t&&!t.hidden&&!!t.offsetParent,toggleRight:tr?.right};}).filter(Boolean);window.k36Frames.push({t:performance.now(),swapping:!!root.easystudLayoutSwapping,cards});if(!window.k36Stop&&window.k36Frames.length<140)requestAnimationFrame(tick);};requestAnimationFrame(tick);
 });
 await control.click();await wait(1100);await page.evaluate(()=>window.k36Stop=true);
 const row={lang,width,drawerOpen,drawerOverlay,view,...await page.evaluate(measure),frames:await page.evaluate(()=>window.k36Frames)};
 const toggle=page.locator(`${view==='groupings'?'[data-easystud-grouping-id]':'[data-easystud-group-id]'}:visible > ${view==='groupings'?'.local-groupimport-easystud-grouping__header':'.local-groupimport-easystud-group__header'} > [data-easystud-card-menu]:visible`).first();
 if(await toggle.count()){
 await toggle.click();await wait(450);row.menu=await page.evaluate(()=>{const e=[...document.querySelectorAll('[data-easystud-group-actions-menu],[data-easystud-context-menu]')].find(e=>!e.hidden&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0);if(!e)return null;const r=e.getBoundingClientRect(),fixed=getComputedStyle(e).position==='fixed';let left=0,right=innerWidth;const ancestors=[];for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);ancestors.push({class:a.className,x:b.x,right:b.right,overflow:s.overflowX});}}return{x:r.x,right:r.right,width:r.width,leftClip:Math.max(0,(fixed?0:left)-r.x),rightClip:Math.max(0,r.right-(fixed?innerWidth:right)),fixed,paintHits:fixed?[r.left+8,(r.left+r.right)/2,r.right-8].map(x=>e.contains(document.elementFromPoint(x,r.top+Math.min(r.height/2,70)))):null,ancestors};});
 if(quick&&view==='participants')await page.screenshot({path:`${outputDir}/${label}-${width}.png`});
 const backdrop=page.locator('[data-easystud-context-backdrop]:visible');if(await backdrop.count())await backdrop.click({position:{x:5,y:5}});else await toggle.click();await wait(300);
 }
 result.rows.push(row);save();
 }
 }
 }
 }
 }catch(e){result.failure={message:e.message,stack:e.stack};process.exitCode=1;}
 finally{save();await browser.close();}
})();
