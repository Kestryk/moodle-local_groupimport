const {test,expect}=require('@playwright/test');const fs=require('node:fs'),path=require('node:path');
const artifacts=path.join(process.env.LOCALAPPDATA,'EasyEdu/artifacts/easystud/css-v2-20261014');
test('V2 ready pages CSSOM parity',async({page},info)=>{
 test.setTimeout(480000);page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const rows=[],errors=[],writes=[];const save=()=>fs.writeFileSync(info.outputPath('paired.json'),JSON.stringify({rows,errors,writes},null,2));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/local/groupimport/**',r=>{if(r.request().method()!=='GET'){writes.push(r.request().url());return r.abort();}return r.continue();});
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 const sample=()=>page.evaluate(()=>{
 const props=['display','visibility','font-family','font-size','font-weight','line-height','color','background-color','border-radius','padding','margin','gap','width','height'];
 return [...document.querySelectorAll('#local-groupimport-easystud h2,#local-groupimport-easystud button,[data-easystud-role-toggle-wrap],.local-groupimport-import button,#adminsettings .easyedu-searchable-choice__trigger')].map(n=>({tag:n.tagName,cls:n.className,hidden:n.hidden,visible:!!n.getClientRects().length,styles:Object.fromEntries(props.map(p=>{let v=getComputedStyle(n).getPropertyValue(p);if(/^rgba\([\d.]+, [\d.]+, [\d.]+, 0\)$/.test(v))v='transparent';return [p,v];}))}));});
 const settle=async()=>{await page.evaluate(()=>document.fonts.ready);let last='',stable=0;await expect.poll(async()=>{const value=JSON.stringify(await sample());stable=value===last?stable+1:0;last=value;return stable;},{timeout:15000,intervals:[100]}).toBeGreaterThanOrEqual(3);};
 try{for(const [name,url,root] of [['import','/local/groupimport/index.php?id=5&lang=fr','.local-groupimport-import'],['admin','/admin/settings.php?section=local_groupimport&lang=fr','#adminsettings'],['outside','/my/?lang=fr','#page']]){
 await page.goto(new URL(url,base).href,{waitUntil:'domcontentloaded'});await expect(page.locator(root).first()).toBeVisible({timeout:60000});
 if(name==='sm'||name==='import')await expect(page.locator(root)).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
 if(name==='admin')await expect(page.locator('.easyedu-searchable-choice').first()).toBeVisible({timeout:60000});
 for(const width of [1280,390]){await page.setViewportSize({width,height:1000});await settle();const current=await sample();
 if(name==='outside'){const rules=await page.evaluate(()=>{const found=[];const walk=rs=>{for(const r of rs){if(/local-groupimport|easyedu-/i.test(r.cssText))found.push(r.cssText.slice(0,160));}};for(const s of document.styleSheets){try{walk(s.cssRules);}catch(e){throw Error('Unreadable stylesheet '+s.href);}}return found;});expect(rules).toEqual([]);rows.push({name,width,globalRules:rules.length});save();continue;}
 const reference=fs.readFileSync(path.join(artifacts,name==='sm'?'3cbb03cf.css':'baseline.css'),'utf8').replace(/\[\[font:local_groupimport\|([^\]]+)\]\]/g,base.origin+'/local/groupimport/fonts/$1');
 await page.evaluate(css=>{document.querySelectorAll('link[href*="/local/groupimport/styles/"]').forEach(n=>{if(!n.sheet)throw Error("Missing loaded page stylesheet");n.sheet.disabled=true;});const s=document.createElement('style');s.id='qa-v2-reference';s.textContent=css;document.head.append(s);window.dispatchEvent(new Event('resize'));},reference);
 await settle();const old=await sample();fs.writeFileSync(info.outputPath(name+'-'+width+'-reference.json'),JSON.stringify(old,null,2));fs.writeFileSync(info.outputPath(name+'-'+width+'-current.json'),JSON.stringify(current,null,2));
 await page.evaluate(()=>{document.getElementById('qa-v2-reference').remove();document.querySelectorAll('link[href*="/local/groupimport/styles/"]').forEach(n=>{if(!n.sheet)throw Error("Missing restored page stylesheet");n.sheet.disabled=false;});window.dispatchEvent(new Event('resize'));});await settle();
 const restored=await sample();fs.writeFileSync(info.outputPath(name+"-"+width+"-restored.json"),JSON.stringify(restored,null,2));rows.push({name,width,nodes:current.length,reference:name==='sm'?'3cbb03cf':'pre-V2',matched:JSON.stringify(restored)===JSON.stringify(old)});save();
 expect(restored,name+width+' paired computed styles').toEqual(old);await page.screenshot({path:info.outputPath(name+'-'+width+'.png')});
 }
 }expect(errors).toEqual([]);expect(writes).toEqual([]);
 }finally{save();}
});
