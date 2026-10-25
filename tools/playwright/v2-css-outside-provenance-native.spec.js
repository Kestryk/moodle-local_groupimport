const {test,expect}=require('@playwright/test');const fs=require('node:fs'),path=require('node:path');
const artifacts=path.join(process.env.LOCALAPPDATA,'EasyEdu/artifacts/easystud/css-v2-20261014');
test('V2 outside stylesheet provenance',async({page},info)=>{
 test.setTimeout(480000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('paired.json'),JSON.stringify({rows,errors,writes},null,2));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()!=='GET'){writes.push(r.request().url());return r.abort();}return r.continue();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 await page.goto(new URL('/my/?lang=fr',base).href,{waitUntil:'networkidle'});
 for(const width of [1280,390]){
 await page.setViewportSize({width,height:1000});
 const evidence=await page.evaluate(async()=>{
 const sheets=[...document.styleSheets];const matches=[];const guides=[];
 for(const sheet of sheets){const walk=rules=>{for(const rule of rules){if(rule.selectorText){if(/local-groupimport|easystud/i.test(rule.selectorText))matches.push({href:sheet.href,selector:rule.selectorText});if(/easyedu-guide-highlight/.test(rule.selectorText))guides.push(rule.selectorText);}if(rule.cssRules)walk(rule.cssRules);}};walk(sheet.cssRules);}
 const explicit=[...document.querySelectorAll('link[rel="stylesheet"]')].map(n=>n.href).filter(h=>h.includes('/local/groupimport/styles/'));
 const global=await (await fetch('/local/groupimport/styles.css')).text();
 const isolated=new CSSStyleSheet();isolated.replaceSync(global);
 const ccb=await (await fetch('/local/course_banner_builder/styles.css')).text();
 return {matches,explicit,globalRules:isolated.cssRules.length,foreignGuideSelectors:guides,ccbContainsGuide:ccb.includes('.easyedu-guide-highlight')};
 });
 rows.push({name:'outside',width,...evidence});save();
 expect(evidence.matches).toEqual([]);expect(evidence.explicit).toEqual([]);expect(evidence.globalRules).toBe(0);
 if(evidence.foreignGuideSelectors.length)expect(evidence.ccbContainsGuide).toBe(true);
 }
 expect(writes).toEqual([]);save();
});