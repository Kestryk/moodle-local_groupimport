// Offline rendering of the actual PHP Guide programme and Mustache; no Moodle runtime.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const [playwrightRoot,php,mustacheSource,output]=process.argv.slice(2);const {chromium}=require(path.join(playwrightRoot,'playwright'));
const root=path.resolve(__dirname,'../..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const renderer={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(mustacheSource,'utf8').replace('export default mustache;','module.exports = mustache;'),renderer);
const old=execFileSync('git',['-C',root,'show','fcf11a6f:styles/student-management.css'],{encoding:'utf8',maxBuffer:8*1024*1024}),current=read('styles/student-management.css');
const report={rows:[],errors:[],runtimeAccess:false};
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const lang of ['fr','en']){
 const data=JSON.parse(execFileSync(php,[path.join(root,'tools/release/guide-current-curriculum-fixture.php'),lang],{encoding:'utf8',maxBuffer:8*1024*1024})).templateData;
 const html=require('./fixtures/mustache_partials.cjs')(renderer.module.exports, root).render(read('templates/easyedu_guide.mustache'),data,name=>read('templates/'+name.split('/').pop()+'.mustache'));
 for(const width of [1280,768,390]){const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));await page.route('**/*',route=>route.abort());
 await page.setContent('<body class="path-local-groupimport"><main id="local-groupimport-easystud" class="easyedu-ui local-groupimport-easystud">'+html+'</main></body>');
 await page.addStyleTag({content:'[hidden]{display:none!important}*{animation:none!important;transition:none!important}'});
 const style=await page.addStyleTag({content:old});
 for(const portal of [false,true]){
 await page.evaluate(portal=>{const root=document.querySelector('[data-easyedu-guide-root]');(portal?document.body:document.querySelector('main')).append(root);root.querySelectorAll('[hidden]').forEach(n=>n.hidden=false);},portal);
 const snapshot=()=>page.evaluate(()=>Array.from(document.querySelector('[data-easyedu-guide-root]').querySelectorAll('*')).map(n=>{const c=getComputedStyle(n);return ['display','position','width','height','padding','margin','gap','fontSize','lineHeight','color','backgroundColor','borderRadius','borderWidth','transform','opacity','visibility'].map(p=>c[p]);}));
 await style.evaluate((node,css)=>node.textContent=css,old);const a=await snapshot();await style.evaluate((node,css)=>node.textContent=css,current);const b=await snapshot();
 if(JSON.stringify(a)!==JSON.stringify(b)){let i=0;while(JSON.stringify(a[i])===JSON.stringify(b[i]))i++;throw Error('Computed difference '+lang+'/'+width+'/portal='+portal+' element '+i+' '+JSON.stringify(a[i])+' '+JSON.stringify(b[i]));}
 report.rows.push({lang,width,portal,elements:a.length,passed:true});
 }await page.close();}
}assert.deepEqual(report.errors,[]);report.passed=true;
}finally{fs.writeFileSync(output,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({passed:report.passed,cases:report.rows.length,elements:report.rows[0].elements,errors:report.errors.length}));})().catch(e=>{console.error(e.message);process.exitCode=1;});
