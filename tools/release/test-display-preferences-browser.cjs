const fs = require('fs'), path = require('path'), cp = require('child_process');
const [playwrightPath, artifact, phpPath, chromePath] = process.argv.slice(2);
if (!playwrightPath || !artifact || !phpPath || !chromePath) { throw Error('Supply Playwright, external artifact root, PHP and Chrome paths.'); }
const {chromium} = require(playwrightPath);
const root = path.resolve(__dirname, '../..');
fs.mkdirSync(artifact, {recursive: true});
const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function render(file,lang) {
 const p = path.join(root,`lang/${lang}/local_groupimport.php`).replace(/\\/g,'/');
 const strings = JSON.parse(cp.execFileSync(phpPath,['-r',`define('MOODLE_INTERNAL', true); include '${p}'; echo json_encode($string, JSON_INVALID_UTF8_SUBSTITUTE);`]).toString());
 const core = {closebuttontitle: lang==='fr'?'Fermer':'Close',cancel:lang==='fr'?'Annuler':'Cancel',savechanges:lang==='fr'?'Enregistrer':'Save changes'};
 return fs.readFileSync(path.join(root,file),'utf8').replace(/{{![\s\S]*?}}/g,'').replace(/{{#str}}(.*?), (.*?){{\/str}}/g,(_,key,component)=>escape((component==='core'?core:strings)[key]||key));
}
(async()=>{
 const browser = await chromium.launch({executablePath:chromePath,headless:true});
 const results=[];
 try {
  for(const lang of ['fr','en'])for(const width of [1600,768,390]) {
   const page = await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   const html=render('templates/display_preferences.mustache',lang);
   await page.setContent('<div class="easyedu-ui local-groupimport-easystud" data-easyedu-motion-level="full"><button class="easyedu-direct-icon" data-easyedu-display-open data-easyedu-display-tooltip aria-label="Preferences"><span class="fa"></span></button></div>');
   await page.addStyleTag({content:fs.readFileSync(path.join(root,'styles/student-management.css'),'utf8')});
   await page.evaluate(({html})=>{
    window.saved=[];window.failSave=false;window.exports={};
    window.define=(name,deps,factory)=>{
     if(name==='local_groupimport/motion'){factory(window.motion={});return;}
     if(name==='local_groupimport/easyedu_bubble'){factory(window.bubbleModule={});return;}
     window.exports=factory({renderForPromise:async()=>({html,js:''}),appendNodeContents:(root,markup)=>root.insertAdjacentHTML('beforeend',markup)}, {setUserPreference:async(name,value)=>{if(window.failSave)throw Error('offline');window.saved.push({name,value});}}, {exception:error=>{throw error;}}, window.motion, window.bubbleModule);
    };
   },{html});
   await page.addScriptTag({content:fs.readFileSync(path.join(root,'amd/build/motion.min.js'),'utf8')});
   await page.addScriptTag({content:fs.readFileSync(path.join(root,'amd/build/easyedu_bubble.min.js'),'utf8')});
   await page.addScriptTag({content:fs.readFileSync(path.join(root,'amd/build/display_preferences.min.js'),'utf8')});
   await page.evaluate(()=>window.exports.init('reduced','default'));
   const trigger=page.locator('[data-easyedu-display-open]');
   await trigger.click();
   const dialog=page.locator('dialog'); await dialog.waitFor({state:'visible'});await page.waitForTimeout(220);
   if(!await dialog.locator('[value=reduced]').isChecked())throw Error('Default not selected');
   await dialog.locator('[value=minimal]').check();
   await dialog.locator('[data-easyedu-display-close]').last().click();await dialog.waitFor({state:'hidden'});
   if((await page.evaluate(()=>window.saved)).length)throw Error('Cancel wrote preference');
   await trigger.click();await dialog.waitFor({state:'visible'});await page.waitForTimeout(220);
   for(const level of ['full','minimal','reduced']) {
    await dialog.locator(`[value=${level}]`).check();await dialog.locator('[type=submit]').click();await dialog.waitFor({state:'hidden'});
    const actual=await page.locator('.easyedu-ui').getAttribute('data-easyedu-motion-level');if(actual!==level)throw Error('Hot switch '+actual);
    await trigger.click();await dialog.waitFor({state:'visible'});await page.waitForTimeout(220);
   }
   await dialog.locator('[data-easyedu-display-reset]').click();await dialog.locator('[type=submit]').click();await dialog.waitFor({state:'hidden'});
   if((await page.evaluate(()=>window.saved.at(-1).value))!=='default')throw Error('Reset did not save default');
   await trigger.click();await dialog.waitFor({state:'visible'});await page.waitForTimeout(220);
   await dialog.locator('[value=reduced]').click();await dialog.locator('[type=submit]').click();await dialog.waitFor({state:'hidden'});
   if((await page.evaluate(()=>window.saved.at(-1).value))!=='reduced')throw Error('Explicit checked radio did not override default');
   await trigger.click();await dialog.waitFor({state:'visible'});await page.waitForTimeout(220);
   await page.evaluate(()=>window.failSave=true);await dialog.locator('[value=full]').check();await dialog.locator('[type=submit]').click();
   await dialog.locator('[role=alert]').waitFor({state:'visible'});
   await page.evaluate(()=>window.failSave=false);
   const geometry=await dialog.evaluate(d=>{
    const rect=d.getBoundingClientRect();const form=d.querySelector('form');
    const body=d.querySelector('.easyedu-preferences-dialog__body');
    return {width:rect.width,height:rect.height,withinViewport:rect.left>=0&&rect.right<=innerWidth&&rect.top>=0&&rect.bottom<=innerHeight,
      bodyOverflow:body.scrollWidth-body.clientWidth,formOverflow:form.scrollWidth-form.clientWidth,
      radios:[...d.querySelectorAll('input')].map(r=>{const p=r.getBoundingClientRect();const b=getComputedStyle(r,'::before');return {width:p.width,height:p.height,dotWidth:parseFloat(b.width),dotHeight:parseFloat(b.height)};})};
   });
   if(!geometry.withinViewport||geometry.bodyOverflow>1||geometry.formOverflow>1)throw Error('Containment '+JSON.stringify(geometry));
   await page.screenshot({path:path.join(artifact,`isolated-${lang}-${width}.png`)});
   await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
   if(!await trigger.evaluate(e=>e===document.activeElement))throw Error('Focus not restored');
   if(errors.length)throw Error(errors.join(';'));
   results.push({lang,viewportWidth:width,...geometry,consoleErrors:0});await page.close();
  }
 } finally {await browser.close();fs.writeFileSync(path.join(artifact,'isolated.json'),JSON.stringify(results,null,2));}
 console.log(JSON.stringify({passed:results.length,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
