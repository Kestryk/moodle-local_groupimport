const {test,expect}=require('@playwright/test'),fs=require('node:fs');
test('K16 complete pill rendering and glyph geometry',async({page},info)=>{
 test.setTimeout(900000);const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.origin!=='http://localhost')throw Error('Principal only');
 const rows=[],errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/ajax.php*',r=>{writes.push(r.request().url());return r.abort();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded'});}
 const root=page.locator('#local-groupimport-easystud');const save=()=>fs.writeFileSync(info.outputPath('pills-measures.json'),JSON.stringify({rows,errors,writes,humanAccepted:false},null,2));
 const settle=async()=>{await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 const measure=()=>root.locator('[data-easystud-user]').evaluateAll(ns=>{
  const painted=e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(p.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return e.getClientRects().length>0;};
  return ns.filter(painted).slice(0,4).map(n=>({groups:[...n.querySelectorAll('.local-groupimport-easystud-user__meta-tags')].filter(painted).map(c=>({
   width:c.clientWidth,realCount:c.querySelectorAll('.local-groupimport-easystud-token:not(.local-groupimport-easystud-token--empty):not([data-easystud-toggle-tags])').length,
   tokens:[...c.querySelectorAll('.local-groupimport-easystud-token')].filter(painted).map(t=>{const r=t.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(t);const text=range.getBoundingClientRect();return {text:t.textContent.trim(),title:t.title,toggle:t.hasAttribute('data-easystud-toggle-tags'),h:r.height,layoutHeight:t.offsetHeight,cssHeight:getComputedStyle(t).height,w:r.width,x:r.x,y:r.y,clipped:text.width>t.clientWidth+1||t.scrollWidth>t.clientWidth+1,expanded:t.getAttribute('aria-expanded'),dx:text.x+text.width/2-r.x-r.width/2,dy:text.y+text.height/2-r.y-r.height/2};})
  }))}));
 });
 try{for(const lang of ['fr','en'])for(const width of [1600,1280,768,390]){
  await page.setViewportSize({width,height:1000});const url=new URL(base);url.searchParams.set('lang',lang);await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});
  await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});await expect(root.locator('[data-easystud-user]').first()).toBeAttached({timeout:60000});
  await root.locator(width<=1024?'[data-easystud-mobile-view="participants"]':'[data-easystud-layout-mode="participants"]:visible').click();
  for(const density of ['initial','toggled']){
   if(density==='toggled')await root.locator('[data-easystud-density-toggle]').evaluate(n=>n.click());await settle();
   for(const expanded of [false,true]){
    if(expanded){for(const card of (await root.locator('[data-easystud-user]').all()).slice(0,4))for(const b of await card.locator('[data-easystud-toggle-tags]:visible').all())if(await b.getAttribute('aria-expanded')!=='true')await b.evaluate(n=>n.click());await settle();}
    const cards=await measure();rows.push({lang,width,density,expanded,cards});save();expect(cards.length).toBeGreaterThan(0);
    for(const c of cards)for(const g of c.groups){if(g.realCount)expect(g.tokens.filter(t=>!t.toggle).length).toBeGreaterThan(0);
     for(const t of g.tokens){expect(t.text).not.toBe('');expect(t.text).not.toBe('-');expect(t.layoutHeight).toBe(22);expect(t.cssHeight).toBe('22px');if(t.clipped){expect(t.text.length).toBeGreaterThan(35);expect(t.title).toBe(t.text);}else{expect(Math.abs(t.dx)).toBeLessThanOrEqual(.5);expect(Math.abs(t.dy)).toBeLessThanOrEqual(.5);} }
     if(expanded&&g.tokens.some(t=>t.expanded==='true'))expect(g.tokens.filter(t=>!t.toggle)).toHaveLength(g.realCount);
    }
   }
  }
  if(lang==='fr'&&[1600,390].includes(width))await root.locator('[data-easystud-user]').first().screenshot({path:info.outputPath('K16-pills-'+width+'.png')});
 }expect(errors).toEqual([]);expect(writes).toEqual([]);}finally{save();}
});
