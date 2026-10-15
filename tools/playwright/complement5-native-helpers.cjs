// Five independently selected recipes. Run only after N1 publishes the full requested bundle.
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const literal='QA & < > " \'',groupingLiteral='QA Grouping & < > " \'';
const settle=async root=>{
 await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);
};
async function setup(page,info){
 const runtime='C:/dev/Moodle 51 Perf/moodle/local/groupimport/';
 for(const [path,token] of [['amd/src/local/cm/selection_controls.js','event.altKey'],['amd/src/local/cm/layout.js','revealChangedPanelActions'],['amd/src/motion.js','export const showMenu']])if(!fs.readFileSync(runtime+path,'utf8').includes(token))throw Error('Publish and synchronise the complete Complement5 bundle before replay: '+path);
 const servedState=fs.readFileSync('C:/dev/Moodle 51 Perf/moodle/local/groupimport/classes/service/course_state.php','utf8');
 for(const kind of ['group','grouping'])if(!servedState.includes("format_string($"+kind+"->name, true, ['context' => $context, 'escape' => false])"))throw Error('Publish and synchronise S9 before the Complement3 recipes');
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 if(url.origin!=='http://localhost:8051'||Number(url.searchParams.get('id'))<=5)throw Error('Manifested8051 disposable course required');
 const report={course:Number(url.searchParams.get('id')),errors:[],blocked:[],rows:[],harmony:[]};
 const save=()=>fs.writeFileSync(info.outputPath('complement3.json'),JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()==='GET')return r.continue();report.blocked.push(r.request().url());save();return r.abort();});
 const root=page.locator('#local-groupimport-easystud');
 const open=async(width,height=1000)=>{await page.setViewportSize({width,height});await page.goto(url.href,{waitUntil:'domcontentloaded'});
  if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});await page.goto(url.href,{waitUntil:'domcontentloaded'});}
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await settle(root);
 };
 const view=async(mode,width)=>{const selector=width<=1024?'[data-easystud-mobile-view="'+(mode==='structure'?'groupings':mode)+'"]:visible':'[data-easystud-layout-mode="'+mode+'"]:visible';await root.locator(selector).click();await settle(root);};
 const harmony=async(width,label)=>{
  await view('participants',width);
  const participant=root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();
  const collect=async(card,type)=>{await expect(card).toBeVisible();const items=await card.evaluate(n=>[...n.querySelectorAll('.local-groupimport-easystud-token,.badge,[data-easystud-participant-profile="badge"]')].filter(e=>!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim(),class:e.className,x:r.x,y:r.y,width:r.width,height:r.height};}));
   const adjacent=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(Math.abs((a.y+a.height/2)-(b.y+b.height/2))<=3)adjacent.push({a:a.text,b:b.text,delta:Math.abs(a.height-b.height)});}
   report.harmony.push({label,width,type,items,adjacent,maxDelta:adjacent.length?Math.max(...adjacent.map(p=>p.delta)):null});save();
  };
  await collect(participant,'participant');await view(width<=1024?'groups':'structure',width);
  await collect(root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first(),'group');
  if(width<=1024)await view('structure',width);
  await collect(root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').filter({has:page.getByText(groupingLiteral,{exact:true})}).first(),'grouping');
 };
 const finish=()=>{save();expect(report.errors).toEqual([]);expect(report.blocked).toEqual([]);for(const row of report.harmony)for(const p of row.adjacent)expect(p.delta,`${row.label}/${row.width}/${row.type}: ${p.a} / ${p.b}`).toBeLessThanOrEqual(1);};
 return {url,root,report,save,open,view,harmony,finish};
}
async function recipe(page,info,perform){test.setTimeout(480000);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);const ctx=await setup(page,info);try{await perform(ctx);ctx.finish();}finally{ctx.save();await page.screenshot({path:info.outputPath('last-state.png')}).catch(()=>{});}}

module.exports={setup,recipe,settle,literal,groupingLiteral};
