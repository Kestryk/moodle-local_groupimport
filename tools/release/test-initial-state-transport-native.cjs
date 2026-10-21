// Native transport candidate; headless, read-only, allocated pool copy only.
// Args: Playwright Chrome lease.json password-file output-dir course language width.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [pw,chrome,leaseFile,secret,root,courseValue,language,widthValue]=process.argv.slice(2);
for(const value of [pw,chrome,leaseFile,secret,root])assert(value&&path.isAbsolute(value),'Absolute paths required');
const lease=JSON.parse(fs.readFileSync(leaseFile,'utf8').replace(/^\uFEFF/,''));
assert([8052,8054,8055].includes(lease.port),'Allocated pool only');
assert(fs.readFileSync(path.join(lease.lock,'owner.txt'),'utf8').trim()==='Codex1 PERF getstate admin 20261021','Lease owner');
assert(!path.resolve(root).toLowerCase().startsWith(path.resolve(__dirname,'../..').toLowerCase()+path.sep),'Evidence outside source');
assert(['fr','en'].includes(language));
const course=Number(courseValue),testWidth=Number(widthValue),phase='native';
assert(Number.isInteger(course)&&course>1);assert([1600,390].includes(testWidth));
const {chromium}=require(pw),base='http://localhost:'+lease.port;
fs.mkdirSync(root,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 const out=[];
 try {
 for(const lang of [language])for(const width of [testWidth]) {
  const ctx=await browser.newContext({viewport:{width,height:1000},locale:lang==='fr'?'fr-FR':'en-GB'});
  try {
   const r=await ctx.request.get(base+'/login/index.php');
   const token=/name="logintoken" value="([^"]+)"/.exec(await r.text());assert(token);
   const login=await ctx.request.post(base+'/login/index.php',{form:{username:'admin',password:fs.readFileSync(secret,'utf8').trim(),logintoken:token[1]},maxRedirects:0});assert([302,303].includes(login.status()));
   const page=await ctx.newPage();const errors=[];let stateRequests=0;
   page.on('request',r=>{if(r.url().includes('/lib/ajax/service.php')){try{if((r.postDataJSON()||[]).some(c=>c.methodname==='local_groupimport_get_state'))stateRequests++;}catch(error){}}});
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   for(const [name,url]of [['manage',`/local/groupimport/manage.php?id=${course}`],['administration','/admin/settings.php?section=local_groupimport']]) {
    stateRequests=0;
    const response=await page.goto(base+url+'&lang='+lang,{waitUntil:'domcontentloaded',timeout:180000});
    if(name==='manage')await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudSmReady==='1',{},{timeout:180000});
    else await page.waitForFunction(()=>document.querySelector('#adminsettings')&&!document.body.classList.contains('local-groupimport-admin-settings-page--loading'),{},{timeout:180000});
    await page.waitForTimeout(1500);
    const data=await page.evaluate(name=>{
     const main=document.querySelector('#region-main');
     const selectors=name==='manage'?['[data-easystud-user]','.local-groupimport-easystud-panel','[data-easystud-catalog-search]']:['#adminsettings input','#adminsettings select','#adminsettings .form-label'];
     const samples=selectors.map(selector=>({selector,nodes:[...document.querySelectorAll(selector)].slice(0,10).map(n=>{
      const b=n.getBoundingClientRect(),s=getComputedStyle(n);
      return {text:n.textContent.trim(),value:n.matches('input,select')?n.value:null,box:[b.x,b.y,b.width,b.height],paint:[s.fontSize,s.lineHeight,s.padding,s.borderRadius,s.color,s.backgroundColor,s.display]};
     })}));
     return {title:document.title,overflow:document.documentElement.scrollWidth-innerWidth,samples,main:main?main.getBoundingClientRect().toJSON():null,
      form:name==='administration'?[...document.querySelectorAll('#adminsettings input,#adminsettings select')].filter(n=>n.name&&!/sesskey/.test(n.name)).map(n=>({name:n.name,type:n.type,value:n.value,checked:n.checked,options:n.options?[...n.options].map(o=>[o.value,o.textContent,o.selected]):null})):null};
    },name);
    let transport=null;
    if(name==='manage') {
     const html=await response.text();
     const seed=/<script[^>]*id="easystud-initial-state"[^>]*>([\s\S]*?)<\/script>/.exec(html);
     assert(seed,'seed missing');
     const initial=JSON.parse(seed[1]);
     assert.equal(stateRequests,0,'initial visit must avoid a second get_state request');
     assert.equal(await page.locator('#easystud-initial-state').count(),0,'single-use element consumed');
     const current=await page.evaluate(course=>new Promise((resolve,reject)=>require(['local_groupimport/local/sm/store'],store=>store.fetchState(course).then(resolve,reject))),course);
     assert.deepEqual(initial,current,'seed must equal ordinary service result');
     assert.equal(stateRequests,1,'explicit refresh still calls network');
     transport={initialRequests:0,refreshRequests:1,seedEqualService:true,consumed:true,counts:initial.meta.counts};
    }
    const shot=`${root}/${phase}-${name}-${lang}-${width}.png`;await page.screenshot({path:shot,fullPage:false});
    out.push({name,lang,width,data,transport,errors:errors.slice(),shot});
    fs.writeFileSync(`${root}/${phase}-${lang}-${width}-visual.json`,JSON.stringify(out,null,2));
    assert.deepEqual(errors,[],name+' console');
    console.log(phase,name,lang,width,'PASS');
   }
  }finally{await ctx.close();}
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
