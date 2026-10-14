const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('Lift SM first card and field lane edges',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const rows=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const save=()=>fs.writeFileSync(info.outputPath('edges.json'),JSON.stringify({rows,errors},null,2));
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});}
 try{for(const width of [1600,1280,390]){
  await page.setViewportSize({width,height:1000});await page.goto(base.href,{waitUntil:'domcontentloaded'});const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
  for(const view of width===390?['participants','groups','groupings']:['participants','structure']){
   await root.locator('[data-easystud-'+(width===390?'mobile-view':'layout-mode')+'="'+view+'"]:visible').first().click();
   await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   const sample=await root.evaluate(n=>{
    const prefix='.local-groupimport-easystud';const visible=e=>{if(!e?.getClientRects().length||e.clientWidth<2)return false;for(let a=e;a;a=a.parentElement)if(getComputedStyle(a).opacity==='0'||getComputedStyle(a).visibility==='hidden')return false;return true;};
    const first=s=>[...n.querySelectorAll(s)].find(visible);const rect=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,width:b.width};};
    return [[prefix+'__filters > '+prefix+'__search-row','[data-easystud-participant-list] [data-easystud-user]','participants'],[prefix+'-create-card--group '+prefix+'-create-card__topline','[data-easystud-structure-groups] [data-easystud-group-id]','groups'],[prefix+'-create-card--grouping '+prefix+'-create-card__topline',prefix+'-tree__groupings [data-easystud-grouping-id]','groupings']].flatMap(([fieldSelector,cardSelector,entity])=>{const field=first(fieldSelector),card=first(cardSelector);return field&&card?[{entity,field:rect(field),card:rect(card)}]:[];});
   });rows.push({width,view,edges:sample});save();expect(sample.length).toBeGreaterThan(0);
   for(const edge of sample){expect(Math.abs(edge.field.left-edge.card.left),edge.entity+' leading').toBeLessThanOrEqual(1);expect(Math.abs(edge.field.right-edge.card.right),edge.entity+' trailing').toBeLessThanOrEqual(1);}
   const shot=root.locator(view==='participants'?'[data-easystud-participants-panel]':'[data-easystud-structure-panel]');await shot.screenshot({path:info.outputPath(view+'-'+width+'.png')});
  }
 }expect(errors).toEqual([]);}finally{save();}
});
