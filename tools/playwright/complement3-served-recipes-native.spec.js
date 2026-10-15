// Five independently selected recipes. Run only after N1 publishes the full requested bundle.
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const literal='QA & < > " \'',groupingLiteral='QA Grouping & < > " \'';
const settle=async root=>{
 await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 await expect.poll(()=>root.evaluate(n=>n.easystudLayoutSwapping||0)).toBe(0);
};
async function setup(page,info){
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
test('Complement3 S9 literal card tooltip CSV and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1280,390]){await c.open(width);await c.view(width<=1024?'groups':'structure',width);
  const card=c.root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText(literal,{exact:true})}).first();await expect(card).toBeVisible();
  const name=card.locator('.local-groupimport-easystud-group__name');expect(await name.innerText()).toBe(literal);expect(await card.getAttribute('data-easystud-advanced-name')).toBe(literal);
  const alpha=c.root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').filter({has:page.getByText('QA Source Alpha',{exact:true})}).first();
  const expand=alpha.locator('[data-easystud-group-members-toggle]');if(await expand.getAttribute('aria-expanded')!=='true')await expand.click();await settle(c.root);
  const remove=alpha.locator('[data-easystud-member-id]').filter({hasText:literal}).locator('[data-easystud-remove-member]');await remove.scrollIntoViewIfNeeded();await settle(c.root);await remove.hover();const tip=page.locator('.local-groupimport-easystud-hover-popover');await expect(tip).toBeVisible();await expect(tip).toContainText(literal);await page.screenshot({path:info.outputPath('literal-tooltip-'+width+'.png')});
  await c.view('structure',width);const grouping=c.root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').filter({has:page.getByText(groupingLiteral,{exact:true})}).first();await expect(grouping).toBeVisible();
  const direct=grouping.locator('[data-easystud-open-advanced-settings]:visible');if(await direct.count())await direct.first().click();else{await grouping.locator('[data-easystud-card-menu]:visible').first().click();await c.root.locator('[data-easystud-context-action="grouping-open-advanced-settings"]:visible').click();}
  const editor=c.root.locator('[data-easystud-editor-context="grouping"]');await expect(editor).toBeVisible();
  const section=editor.locator('[data-easystud-settings-list-section]').filter({has:page.getByText('=1+1',{exact:true})}).first();const awaited=page.waitForEvent('download');await section.locator('[data-easystud-settings-export]').click();const download=await awaited,path=info.outputPath('literal-export-'+width+'.csv');await download.saveAs(path);const csv=fs.readFileSync(path,'utf8');expect(csv).toContain('"\'=1+1"');expect(csv).toContain('QA & < > "" \'');expect(csv).not.toContain('&amp;');
  c.report.rows.push({width,literalCard:true,literalTooltip:true,literalGrouping:true,csvFormulaStillNeutralised:true,csvLiteral:true});c.save();await editor.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]').click();await c.harmony(width,'S9');
 }
}));
test('Complement3 T020 strict settled two pixels and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1600,1920]){await c.open(width);await c.view('both',width);
  const sample=()=>c.root.evaluate(n=>{const visible=e=>e&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length>0;const first=(n,s)=>[...n.querySelectorAll(s)].find(visible);const list=n.querySelector('[data-easystud-participant-list]'),tree=n.querySelector('[data-easystud-tree]');const a=first(list,':scope > [data-easystud-pagination="top"]'),b=first(tree,'[data-easystud-pagination="top"]'),p=first(list,'[data-easystud-user]'),g=first(tree,'.local-groupimport-easystud-tree__section--ungrouped,.local-groupimport-easystud-tree__section[data-easystud-grouping-id]');if(!a||!b||!p||!g)return {missing:true};return {barDelta:a.getBoundingClientRect().y-b.getBoundingClientRect().y,cardDelta:p.getBoundingClientRect().y-g.getBoundingClientRect().y,layoutWidth:n.querySelector('.local-groupimport-easystud__layout').clientWidth};});
  let row;await expect.poll(async()=>{row=await sample();return row.missing?Infinity:Math.max(Math.abs(row.barDelta),Math.abs(row.cardDelta));},{timeout:12000}).toBeLessThanOrEqual(2);c.report.rows.push({width,...row});c.save();await page.screenshot({path:info.outputPath('T020-'+width+'.png')});await c.harmony(width,'T020');
 }
}));
test('Complement3 Mass Import root sixteen pixels and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [1280,390]){await c.open(width);await page.goto(new URL('/local/groupimport/index.php?id='+c.report.course+'&lang=fr',c.url).href,{waitUntil:'domcontentloaded'});const root=page.locator('.local-groupimport-import');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});await page.evaluate(()=>document.fonts.ready);const font=await root.evaluate(n=>getComputedStyle(n).fontSize);c.report.rows.push({width,font});c.save();await page.screenshot({path:info.outputPath('mass-'+width+'.png')});expect(font).toBe('16px');await c.open(width);await c.harmony(width,'Mass Import');}
}));
test('Complement3 participant eye mobile geometry and harmony',async({page},info)=>recipe(page,info,async c=>{
 for(const width of [390,768]){await c.open(width);await c.view('participants',width);const card=c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();await card.scrollIntoViewIfNeeded();await settle(c.root);
  const row=await card.evaluate(n=>{const eye=n.querySelector('[data-easystud-open-user]'),name=n.querySelector('.local-groupimport-easystud-user__name'),e=eye.getBoundingClientRect(),t=name.getBoundingClientRect(),r=n.getBoundingClientRect();const hit=document.elementFromPoint(e.x+e.width/2,e.y+e.height/2);return {eye:{x:e.x,y:e.y,width:e.width,height:e.height},name:{x:t.x,y:t.y,width:t.width,height:t.height},card:{x:r.x,y:r.y,width:r.width,height:r.height},centreDelta:(e.y+e.height/2)-(t.y+t.height/2),hit:eye.contains(hit)};});c.report.rows.push({width,...row});c.save();await page.screenshot({path:info.outputPath('eye-'+width+'.png')});expect(row.hit).toBe(true);expect(Math.abs(row.centreDelta),'eye/name vertical centres').toBeLessThanOrEqual(2);await c.harmony(width,'eye');}
}));
test('Complement3 mobile animations full reduced fades and harmony',async({page},info)=>recipe(page,info,async c=>{
 await page.addInitScript(()=>{const original=Element.prototype.animate;window.qaNativeAnimations=[];Element.prototype.animate=function(frames,options){const result=original.call(this,frames,options);window.qaNativeAnimations.push({at:performance.now(),tag:this.tagName,classes:this.className,mobileBar:this.hasAttribute('data-easystud-mobile-actions'),frames,options});return result;};});
 for(const reduced of ['no-preference','reduce']){await page.emulateMedia({reducedMotion:reduced});await c.open(390);await c.view('participants',390);await page.evaluate(()=>window.qaNativeAnimations=[]);
  await c.view('groups',390);const view=await page.evaluate(()=>window.qaNativeAnimations);await c.view('participants',390);await page.evaluate(()=>window.qaNativeAnimations=[]);
  const search=c.root.locator('[data-easystud-search]:visible');await search.fill('QA Guided One');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(1);await settle(c.root);const arrivals=await page.evaluate(()=>window.qaNativeAnimations);await search.fill('');await expect(c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible')).toHaveCount(4);await settle(c.root);await page.evaluate(()=>window.qaNativeAnimations=[]);
  await c.root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first().locator(':scope > .local-groupimport-easystud-selector').click();await expect(c.root.locator('[data-easystud-mobile-actions]')).toHaveAttribute('data-easystud-selection-bar','visible');await settle(c.root);await c.root.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]:visible').click();await expect(c.root.locator('[data-easystud-mobile-actions]')).toHaveAttribute('data-easystud-selection-bar','hidden');const bars=(await page.evaluate(()=>window.qaNativeAnimations)).filter(a=>a.mobileBar);
  c.report.rows.push({reduced,view,arrivals,bars});c.save();expect(view.length).toBeGreaterThan(0);expect(arrivals.some(a=>/easystud-user/.test(a.classes))).toBe(true);expect(bars.length).toBeGreaterThanOrEqual(2);
  const batches=[view,arrivals,bars];for(const batch of batches){const animations=batch.filter(a=>a.options&&[120,160,200].includes(a.options.duration));expect(animations.length).toBeGreaterThan(0);if(reduced==='reduce')for(const a of animations){expect(a.frames.every(f=>!Object.hasOwn(f,'transform'))).toBe(true);expect(a.options.duration).toBe(120);}else expect(animations.some(a=>a.frames.some(f=>f.transform&&f.transform!=='none'))).toBe(true);}
  await c.harmony(390,'animations '+reduced);await page.screenshot({path:info.outputPath('animations-'+reduced+'.png')});
 }
}));
