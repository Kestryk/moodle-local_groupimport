const {test,expect}=require('@playwright/test');const fs=require('node:fs'),path=require('node:path');
const recordRoot=path.join(process.env.LOCALAPPDATA,'EasyEdu','artifacts','easystud','css-v2-20261014');
test('V2 CSS transparent paint parity FR1280 FR390',async({page},info)=>{
 test.setTimeout(480000);page.setDefaultNavigationTimeout(60000);page.setDefaultTimeout(30000);
 const base=new URL(process.env.EASYEDU_MOODLE_URL);if(base.hostname!=='localhost'||base.port)throw Error('Principal only');
 const candidate=fs.existsSync(path.join(recordRoot,'verify-candidate'));const rows=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
 if(await page.locator('#username').count()){await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);await page.locator('#loginbtn').click({noWaitAfter:true});await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});}
 for(const [name,url,root] of [['sm','/local/groupimport/manage.php?id=5&lang=fr','#local-groupimport-easystud'],['import','/local/groupimport/index.php?id=5&lang=fr','.local-groupimport-import'],['admin','/admin/settings.php?section=local_groupimport&lang=fr','#adminsettings'],['outside','/my/?lang=fr','#page']]){
 await page.goto(new URL(url,base).href,{waitUntil:'domcontentloaded'});await expect(page.locator(root).first()).toBeVisible({timeout:60000});
 if(name==='sm')await expect(page.locator(root)).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
 if(name==='admin')await expect(page.locator('.easyedu-searchable-choice').first()).toBeVisible({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 for(const width of [1280,390]){await page.setViewportSize({width,height:1000});
 const sample=await page.locator(root).first().evaluate(async n=>{
 await Promise.all(n.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));
 const props=['font-family','font-size','font-weight','line-height','color','background-color','border-radius','padding','margin','display','gap','box-sizing'];
 return [...n.querySelectorAll('h1,h2,h3,p,button,input,select,.easyedu-searchable-choice__trigger')].filter(e=>e.getClientRects().length).slice(0,120).map(e=>({tag:e.tagName,cls:e.className,style:Object.fromEntries(props.map(p=>[p,getComputedStyle(e).getPropertyValue(p)]))}));});
 const key=name+'-'+width;fs.writeFileSync(info.outputPath(key+'.json'),JSON.stringify(sample,null,2));
 if(name!=='outside'){if(candidate){const normalize=nodes=>nodes.map(n=>({...n,style:{...n.style,'background-color':/^rgba\([\d.]+, [\d.]+, [\d.]+, 0\)$/.test(n.style['background-color'])?'rgba(0, 0, 0, 0)':n.style['background-color']}}));
const equivalent=await page.evaluate(()=>{const c=document.createElement('canvas'),x=c.getContext('2d');c.width=c.height=1;const values=['rgba(255, 255, 255, 0)','rgba(0, 0, 0, 0)'].map(v=>{x.clearRect(0,0,1,1);x.fillStyle=v;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data];});return JSON.stringify(values[0])===JSON.stringify(values[1]);});expect(equivalent).toBe(true);
expect(normalize(sample),key+' computed paint parity').toEqual(normalize(JSON.parse(fs.readFileSync(path.join(recordRoot,key+'.json'),'utf8'))));}else fs.writeFileSync(path.join(recordRoot,key+'.json'),JSON.stringify(sample));}
 if(candidate&&name==='outside'){const found=await page.evaluate(()=>[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].map(r=>r.cssText).filter(t=>/local-groupimport|easyedu-/i.test(t));}catch{return [];}}));expect(found).toEqual([]);}
 rows.push({name,width,nodes:sample.length,candidate});await page.screenshot({path:info.outputPath(key+'.png')});
 }
 }
 fs.writeFileSync(info.outputPath('summary.json'),JSON.stringify({rows,errors},null,2));expect(errors).toEqual([]);
});
