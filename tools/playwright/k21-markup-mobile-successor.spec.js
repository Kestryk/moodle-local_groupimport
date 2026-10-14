const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {guideStorageKey,guideDiscoveryKey}=require('./guide-storage-helper.cjs');
test('K21 mobile native two count labels FR EN1280 390 served user keys',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultTimeout(60000);
 const url=new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL||'');
 if(url.hostname!=='localhost'||url.port!=='8051'||!Number(url.searchParams.get('id'))||url.searchParams.get('id')==='5')throw Error('Owned8051 fixture required');
 const report={cases:[],errors:[],blockedWrites:0};const save=()=>fs.writeFileSync(info.outputPath('k21-markup.json'),JSON.stringify(report,null,2));
 page.on('pageerror',error=>{report.errors.push(error.message);save();});
 await page.route('**/local/groupimport/**',route=>{if(route.request().method()==='GET')return route.continue();report.blockedWrites++;save();return route.abort('blockedbyclient');});
 await page.route('**/lib/ajax/service.php*',route=>{const writes=(route.request().postDataJSON()||[]).filter(c=>(c.methodname||'').startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname));if(writes.length){report.blockedWrites+=writes.length;save();return route.abort('blockedbyclient');}return route.continue();});
 await page.goto(url.href,{waitUntil:'domcontentloaded'});
 if(page.url().includes('/login/')){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit'});}
 try{
  for(const language of ['fr','en'])for(const width of [1280,390]){
   url.searchParams.set('lang',language);await page.setViewportSize({width,height:1000});await page.goto(url.href,{waitUntil:'domcontentloaded'});
   const root=page.locator('#local-groupimport-easystud');await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
   await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language+'(?:-|$)'));
   const storageKey=await guideStorageKey(page),discoveryKey=await guideDiscoveryKey(page);
   const view=width===390?'[data-easystud-mobile-view="groups"]:visible':'[data-easystud-layout-mode="structure"]:visible';
   await root.locator(view).first().click();
   const counters=root.locator('[data-easystud-structure-count]');await expect(counters).toHaveCount(2);
   await counters.first().scrollIntoViewIfNeeded();
   for(const [kind,text] of Object.entries(language==='fr'?{groupings:'2 groupements',groups:'3 groupes'}:{groupings:'2 groupings',groups:'3 groups'})){
    const label=root.locator('[data-easystud-structure-count="'+kind+'"]');await expect(label).toBeVisible();await expect(label).toHaveText(text);
    await expect(label).toHaveAttribute('data-count-template',/__count__.*\|.*__count__/);
   }
   const labels=await counters.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {kind:node.dataset.easystudStructureCount,text:node.textContent.trim(),template:node.dataset.countTemplate,x:r.x,right:r.right,width:r.width,height:r.height,overflow:node.scrollWidth-node.clientWidth};}));
   for(const label of labels){expect(label.x).toBeGreaterThanOrEqual(0);expect(label.right).toBeLessThanOrEqual(width);expect(label.height).toBeGreaterThan(0);expect(label.overflow).toBeLessThanOrEqual(1);}
   report.cases.push({language,width,labels,storageKey,discoveryKey});save();await page.screenshot({path:info.outputPath('k21-'+language+'-'+width+'.png')});
  }
  expect(report.errors).toEqual([]);expect(report.blockedWrites).toBe(0);expect(report.cases).toHaveLength(4);
 }finally{save();}
});
