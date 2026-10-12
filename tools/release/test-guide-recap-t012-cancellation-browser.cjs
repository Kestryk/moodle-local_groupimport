// Real localized template/CSS and generated Guide+Motion AMD, no Moodle/auth.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const [pw,mustache,php,output]=process.argv.slice(2),root=path.resolve(__dirname,'../..');
const {chromium}=require(pw),render={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(mustache,'utf8').replace('export default mustache;','module.exports=mustache;'),render);
assert.ok(output&&!fs.existsSync(output));
const template=fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const loader=`window.amd={};window.define=(...a)=>{const name=typeof a[0]==='string'?a.shift():'anonymous',deps=Array.isArray(a[0])?a.shift():[],factory=a[0],exports={};const value=factory(...deps.map(d=>d==='exports'?exports:amd[d]));amd[name]=value||exports;};`;
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),records=[];try{
 for(const language of ['en','fr'])for(const width of [1280,768,390])for(const motion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({body:'<html></html>'}));await page.goto('http://recap-isolated.test');
  const payload=JSON.parse(execFileSync(php,[path.join(__dirname,'guide-demonstration-entry-fixture.php'),language],{encoding:'utf8'})).templateData;
  await page.setContent('<style>*{box-sizing:border-box}'+css+'</style><div class="easyedu-ui path-local-groupimport local-groupimport-easystud">'+render.module.exports.render(template,payload)+'</div>');
  await page.addScriptTag({content:loader});await page.addScriptTag({content:fs.readFileSync(path.join(root,'amd/build/motion.min.js'),'utf8')});
  await page.addScriptTag({content:fs.readFileSync(path.join(root,'amd/build/easyedu_guide.min.js'),'utf8')});
  const index=await page.locator('[data-easyedu-guide-slide]').evaluateAll(ns=>ns.find(n=>n.querySelector('[data-easyedu-guide-scene="membership"]')).getAttribute('data-easyedu-guide-slide'));
  await page.evaluate(index=>{const Guide=amd['local_groupimport/easyedu_guide'];if(typeof amd['local_groupimport/motion'].disclosePanel!=='function')throw Error('Missing callable Motion');Guide.init('[data-easyedu-guide-root]',{firstVisit:false,storageKey:'recap.qa'});window.Guide=Guide;},index);
  await page.locator('[data-easyedu-guide-root] > [data-easyedu-guide-open]').click();
  const modal=page.locator('[data-easyedu-guide-modal]');await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
  const scene=modal.locator('[data-easyedu-guide-scene="membership"]');await scene.waitFor({state:'visible'});
  await expectSettled(modal);
  const recap=scene.locator('[data-guide-recap]'),toggle=recap.locator('[data-guide-recap-toggle]'),body=recap.locator('[data-guide-recap-body]');
  // Isolated disclosure starts from the real initialized markup. Final-scene
  // reveal/choreography is a separate native gate, not manufactured here.
  await recap.evaluate(n=>{n.hidden=false;n.style.opacity='1';});
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.ok(await toggle.getAttribute('aria-controls'));
  const panelId=await body.getAttribute('id');assert.equal(await toggle.getAttribute('aria-controls'),panelId);
  await toggle.click();
  if(motion==='no-preference')assert.equal(await body.evaluate(n=>n.classList.contains('is-easyedu-disclosing')),true);
  await body.waitFor({state:'hidden'});assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.press('Enter');await body.waitFor({state:'visible'});await expectSettled(body);assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  if(motion==='no-preference'){await toggle.click();await page.waitForTimeout(100);await toggle.click();await expectSettled(body);assert.equal(await toggle.getAttribute('aria-expanded'),'true');}
  // Execute real generated Guide commands during a shared body effect; no
  // artificial Moodle event or forced animation finish. Source remains unchanged.
  await toggle.click();await scene.locator('[data-guide-scene-command="reset"]').click();await recap.waitFor({state:'hidden'});
  const reset=await body.evaluate(n=>({hidden:n.hidden,open:n.classList.contains('is-open'),effects:n.getAnimations().length,styles:n.style.cssText}));
  assert.equal(reset.hidden,false);assert.equal(reset.open,true);assert.equal(reset.effects,0);assert.equal(reset.styles,'');
  await recap.evaluate(n=>{n.hidden=false;n.style.opacity='1';});
  await page.evaluate(()=>document.body.classList.add('easyedu-motion-disabled'));
  await toggle.click();await body.waitFor({state:'hidden'});assert.equal(await body.evaluate(n=>n.getAnimations().length),0);
  await toggle.press('Enter');assert.equal(await body.evaluate(n=>n.getAnimations().length),0);
  await page.evaluate(()=>document.body.classList.remove('easyedu-motion-disabled'));
  await toggle.click();
  await page.evaluate(()=>Guide.destroy('[data-easyedu-guide-root]'));
  assert.equal(await body.evaluate(n=>n.getAnimations().length),0);
  assert.equal(await body.evaluate(n=>n.classList.contains('is-easyedu-disclosing')),false);
  assert.equal(await body.evaluate(n=>n.style.cssText),'');assert.deepEqual(errors,[]);
  records.push({language,width,motion,openCloseKeyboard:true,reversal:motion==='no-preference',reset,adminPolicyStatic:true,destroyCancelled:true,errors});await page.close();
 }
 fs.writeFileSync(output,JSON.stringify({records,nativeMoodleVerified:false,humanAccepted:false},null,2),{flag:'wx'});console.log('PASS '+records.length+' real AMD/template isolated recap cases');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
async function expectSettled(locator){await locator.page().waitForFunction(n=>n.getAnimations({subtree:true}).filter(a=>a.effect.getComputedTiming().iterations!==Infinity&&['running','paused'].includes(a.playState)).length===0,await locator.elementHandle());}
