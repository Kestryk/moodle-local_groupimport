const fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path');
const [,,base,modulePath,passwordFile,output]=process.argv;
assert(base&&modulePath&&passwordFile&&output, 'Usage: node test-participant-density-native.cjs <pool URL> <Playwright module> <admin secret file> <new output directory>');
const url=new URL(base);assert.equal(url.hostname,'localhost');assert(['8052','8054','8055'].includes(url.port), 'Allocated pool copy only');
assert(path.isAbsolute(output), 'Absolute output path required');
assert(!fs.existsSync(output), 'Retain previous run artifacts');fs.mkdirSync(output,{recursive:true});
const {chromium}=require(path.resolve(modulePath));
const phase='native',strict=true,out={phase,rows:[],errors:[]};
const save=()=>fs.writeFileSync(output+'/'+phase+'.json',JSON.stringify(out,null,2));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>out.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')out.errors.push(m.text());});
 try{
 const secret=fs.readFileSync(passwordFile,'utf8').trim();
 const login=await context.request.get(base+'/login/index.php',{timeout:180000});
 const token=(await login.text()).match(/name="logintoken" value="([^"]+)"/)[1];
 await context.request.post(base+'/login/index.php',{form:{username:'admin',password:secret,logintoken:token},maxRedirects:0});
 for(const lang of ['en','fr'])for(const width of [1600,390]){
  await page.setViewportSize({width,height:1000});
  await page.goto(base+'/local/groupimport/manage.php?id=71&lang='+lang,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudSmReady==='1',null,{timeout:180000});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished));});
  const toggle=page.locator('[data-easystud-density-toggle]');
  // Mobile uses the existing drawer proxy when the desktop toolbar is hidden.
  let action=toggle;
  if(!await action.isVisible())action=page.locator('[data-easystud-mobile-membership-toggle]:visible');
  assert.equal(await action.getAttribute('aria-pressed'),'true');
  const cards=page.locator('[data-easystud-participant-list] [data-easystud-user]');
  const ids=await cards.evaluateAll(nodes=>nodes.slice(0,4).map(n=>n.dataset.userId));
  async function trace(name,click){
   await page.evaluate(({ids,name})=>{
    const root=document.querySelector('#local-groupimport-easystud'),list=root.querySelector('[data-easystud-participant-list]');
    const cards=()=>ids.map(id=>list.querySelector('[data-user-id="'+id+'"]'));
    window.k20Trace={name,frames:[],animations:[],mutations:[]};const trace=window.k20Trace,seen=new WeakSet(),start=performance.now();
    const observer=new MutationObserver(records=>trace.mutations.push({t:performance.now()-start,n:records.length}));
    observer.observe(list,{attributes:true,childList:true,subtree:true,attributeFilter:['hidden','class','style','data-expanded']});
    const sample=()=>{
     const t=performance.now()-start;
     trace.frames.push({t,listHeight:list.getBoundingClientRect().height,opacity:getComputedStyle(list).opacity,count:list.querySelectorAll('[data-easystud-user]').length,cards:cards().map(card=>({h:card.getBoundingClientRect().height,scroll:card.scrollHeight,tokens:[...card.querySelectorAll('.local-groupimport-easystud-user__meta-tags')].map(c=>({visible:[...c.querySelectorAll('span.local-groupimport-easystud-token')].filter(n=>!n.hidden&&n.getClientRects().length).length,total:c.querySelectorAll('span.local-groupimport-easystud-token').length,toggle:c.querySelector('button')?.textContent}))}))});
     for(const a of list.getAnimations({subtree:true})){if(!seen.has(a)){seen.add(a);trace.animations.push({t,target:a.effect.target===list?'list':a.effect.target.className,frames:a.effect.getKeyframes(),timing:a.effect.getTiming()});}}
     if(t<1500)requestAnimationFrame(sample);else{observer.disconnect();trace.done=true;}
    };sample();
   },{ids,name});
   await click();
   await page.waitForFunction(()=>window.k20Trace.done,null,{timeout:10000});
   const trace=await page.evaluate(()=>window.k20Trace);
   const first=trace.frames[0],last=trace.frames.at(-1);
   const overshoot=ids.map((_,i)=>Math.max(...trace.frames.map(f=>f.cards[i].h))-Math.max(first.cards[i].h,last.cards[i].h));
   const lateResize=trace.animations.filter(a=>a.target==='list'&&a.frames.some(f=>f.height)).map(a=>({target:a.frames.at(-1).height,actual:last.listHeight,difference:Math.abs(parseFloat(a.frames.at(-1).height)-last.listHeight)}));
   const direction=last.listHeight>=first.listHeight?1:-1;
   const reverse=Math.max(0,...trace.frames.slice(1).map((f,i)=>direction*(trace.frames[i].listHeight-f.listHeight)));
   const record={lang,width,name,ids,initialCount:first.count,finalCount:last.count,initial:first.cards.map(c=>c.h),final:last.cards.map(c=>c.h),overshoot,lateResize,reverse,trace};
   out.rows.push(record);save();
   if(strict){assert.equal(lateResize.length,1,'One height animation in full Motion');assert(reverse<=.5,'One direction, no second resize');assert(overshoot.every(d=>d<=1),name+' overshoot '+overshoot);assert(lateResize.every(r=>r.difference<=1),name+' target mismatch '+JSON.stringify(lateResize));assert.equal(last.count,width===1600&&name.endsWith('close')?20:15,'Preserve density-specific page size');}
   return record;
  }
  await trace('full-details-open',()=>action.click());
  if(lang==='en')await page.screenshot({path:output+'/'+phase+'-en-'+width+'.png'});
  action=await toggle.isVisible()?toggle:page.locator('[data-easystud-mobile-membership-toggle]:visible');
  await trace('full-details-close',()=>action.click());
 }
 assert.equal(out.errors.length,0,JSON.stringify(out.errors));out.status='PASS';save();
 console.log(JSON.stringify({status:out.status,rows:out.rows.map(({trace,...r})=>r),errors:out.errors.length}));
 }catch(e){out.status='FAIL';out.failure=e.stack;save();throw e;}finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
