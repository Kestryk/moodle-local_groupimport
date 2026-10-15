const {expect}=require('@playwright/test'),path=require('node:path'),{execFileSync}=require('node:child_process');
const labels={full:/^Complètes/,reduced:/^Réduites/,minimal:/^Minimales/};
async function savedMotionChoice(page,root){
 if(!require('node:fs').readFileSync('C:/dev/Moodle 51 Perf/moodle/local/groupimport/lib.php','utf8').includes('easyedu_motion_level'))throw Error('Publish M1 personal preference before animation replay');
 if(!process.env.PLAYWRIGHT_OUTPUT_DIR)throw Error('Supervised output required for durable preference restoration');
 const stateFile=path.resolve(process.env.PLAYWRIGHT_OUTPUT_DIR,'../m1-state.json');
 const state=(action,extra=[])=>JSON.parse(execFileSync('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe',[path.join(__dirname,'../perf/m1-recipe-state.php'),'--state='+stateFile,'--action='+action,...extra],{encoding:'utf8',timeout:30000}));
 state('begin',['--userid='+await root.getAttribute('data-easystud-user-key')]);
 return {restore:()=>state('restore'),choose:async level=>{
  if(!Object.hasOwn(labels,level))throw Error('Explicit M1 level required');
  const entry=()=>page.getByRole('button',{name:'Affichage et animations',exact:true}).or(page.getByRole('menuitem',{name:'Affichage et animations',exact:true})).or(page.getByRole('link',{name:'Affichage et animations',exact:true})).first();
  if(!await entry().count())await page.locator('[data-easyedu-navigation-open]:visible').first().click();
  await entry().click();const dialog=page.getByRole('dialog',{name:'Affichage et animations',exact:true});await expect(dialog).toBeVisible();const origin=await page.evaluate(()=>performance.timeOrigin);
  await dialog.getByRole('radio',{name:labels[level]}).check();await expect(root).toHaveAttribute('data-easyedu-motion-level',level);await expect.poll(()=>state('inspect').preference).toBe(level);expect(await page.evaluate(()=>performance.timeOrigin)).toBe(origin);
  if(await dialog.isVisible())await dialog.getByRole('button',{name:/^(Fermer|Annuler)$/}).first().click();await expect(dialog).toBeHidden();
 }};
}
module.exports={savedMotionChoice};
