const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Performance configuration C session-cache prerequisite native own8051',async({page},info)=>{
 test.setTimeout(300000);page.setDefaultNavigationTimeout(120000);
 const url=new URL(process.env.EASYEDU_MOODLE_URL);
 if(url.origin!=='http://localhost:8051')throw Error('Own8051 only');
 await page.setViewportSize({width:1600,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const result={phase:'C',source:'a5d0ffab',kind:'configuration-prerequisite-not-a-timing-sample',errors};
 const save=()=>fs.writeFileSync(info.outputPath('config-prerequisite.json'),JSON.stringify(result,null,2));
 fs.mkdirSync(info.outputDir,{recursive:true});save();
 try{
  await page.goto(url.origin+'/login/index.php',{waitUntil:'domcontentloaded'});
  await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
  await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
  const [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('/login/index.php')&&r.request().method()==='POST',{timeout:120000}),page.locator('#loginbtn').click({noWaitAfter:true})]);
  result.httpStatus=response.status();
  result.headers=Object.fromEntries(Object.entries(response.headers()).filter(([key])=>['cache-control','etag','expires','last-modified'].includes(key.toLowerCase())));
  await expect(page.locator('body')).toContainText('The session caches can not be in the session store',{timeout:30000});
  result.error='The session caches can not be in the session store when enable_read_only_sessions is enabled. Found: core/navigation_cache';
  result.navigationCacheNamed=await page.locator('body').innerText().then(t=>t.includes('core/navigation_cache'));
  result.capture=info.outputPath('C-session-cache-prerequisite.png');await page.screenshot({path:result.capture});
  result.completed=true;expect(result.httpStatus).toBe(500);expect(result.navigationCacheNamed).toBe(true);
 }finally{save();}
});
