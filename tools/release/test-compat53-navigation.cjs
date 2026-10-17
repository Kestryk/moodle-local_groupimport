/* eslint-env node */
'use strict';
// Real adapter on synthetic legacy/React hosts. Routes are fulfilled in memory: no Moodle/network.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.argv[2],'playwright'));
const root=path.resolve(__dirname,'../..'),compiled=!process.argv[3],source=fs.readFileSync(process.argv[3] || path.join(root,'amd/build/navigation.min.js'),'utf8').replace(/\r\n/g,'\n');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});let cases=0;
 try{for(const host of ['secondary-navigation','secondarynav-tabbar']){
  const page=await browser.newPage();page.setDefaultTimeout(3000);let requests=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{requests++;return route.fulfill({contentType:'text/html',body:'<main><div class="'+host+'"><a id="early" href="/user/index.php?id=71">Participants</a><a id="bypass" href="/user/index.php?id=71&local_groupimport_native=1">Native</a><a id="other" href="/user/index.php?id=72">Other course</a></div><a id="outside" href="/user/index.php?id=71">Outside</a></main>'});});
  await page.goto('https://moodle.test/course/view.php?id=71');
  await page.evaluate(({source,compiled})=>{if(compiled){window.define=(name,deps,factory)=>{if(name!=='local_groupimport/navigation'||deps.length!==1||deps[0]!=='exports')throw Error('Unexpected compiled adapter boundary');const api={};factory(api);window.startAdapter=api.init;};Function(source)();delete window.define;}else{Function(source.replace('export const init =','window.startAdapter ='))();}window.startAdapter(71,'https://moodle.test/local/groupimport/manage.php?id=71','https://moodle.test/user/index.php?id=71&local_groupimport_native=1','EasyStud','Native');},{source,compiled});
  const href=id=>page.locator('#'+id).getAttribute('href');assert.equal(await href('early'),'https://moodle.test/local/groupimport/manage.php?id=71');
  assert((await href('bypass')).includes('local_groupimport_native=1'));assert.equal(await href('other'),'/user/index.php?id=72');assert.equal(await href('outside'),'/user/index.php?id=71');
  // Later than both existing enhancement timers; this used to miss the new React tab.
  await page.waitForTimeout(1200);
  await page.locator('.'+host).evaluate(node=>{node.innerHTML='<a id="late" class="mds-nav-pill" href="/user/index.php?id=71">Participants</a><a id="late-bypass" href="/user/index.php?id=71&local_groupimport_native=1">Native</a>';});
  await page.waitForFunction(()=>document.getElementById('late').href.includes('/local/groupimport/manage.php'));
  assert.equal(await href('late'),'https://moodle.test/local/groupimport/manage.php?id=71');assert((await href('late-bypass')).includes('local_groupimport_native=1'));
  assert.equal(await page.locator('#late').textContent(),'Participants');assert.equal(await page.locator('#late').getAttribute('class'),'mds-nav-pill');assert.deepEqual(errors,[]);assert.equal(requests,1);
  cases++;await page.close();
 }}finally{await browser.close();}
 console.log(JSON.stringify({passed:true,cases,compiled,legacyAndReactHosts:true,lateHydration:true,explicitBypassPreserved:true,zeroPageErrors:true,runtimeAccess:false}));
})().catch(e=>{console.error(e);process.exitCode=1;});
