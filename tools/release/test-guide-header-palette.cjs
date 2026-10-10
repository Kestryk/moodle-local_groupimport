// Actual consumer rendering and portal helper, isolated from Moodle and settings.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.argv[2]),root=path.resolve(__dirname,'../..');
const renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8').replace('export default mustache;','module.exports = mustache;'),renderer);
const data=JSON.parse(execFileSync(process.argv[4],[path.join(__dirname,'guide-current-curriculum-fixture.php'),'en'],{encoding:'utf8'}));
const manager=fs.readFileSync(path.join(root,'amd/src/course_manager.js'),'utf8');
const first=manager.indexOf('    const preserveGuidePortalTheme = () => {'),last=manager.indexOf('    const syncGuideLauncher',first);
assert.ok(first>=0&&last>first);const relay=manager.slice(first,last),audit=process.argv.includes('--audit');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'}),rows=[];try{
 for(const width of [1280,768,390])for(const palette of [
  {name:'default',roles:'',primary:'#0f6cbf',chosen:'#0f6cbf',soft:'#e8f4ff'},
  {name:'purple',roles:'primary',primary:'#6d28d9',chosen:'#7c3aed',soft:'#f5f0ff'},
  {name:'orange',roles:'primary',primary:'#94420a',chosen:'#f59e0b',soft:'#fcf1e7'},
  {name:'restore',roles:'',primary:'#0f6cbf',chosen:'#0f6cbf',soft:'#e8f4ff'}
 ]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}'+fs.readFileSync(path.join(root,'styles.css'),'utf8')+'</style><div id="workspace" class="local-groupimport-easystud easyedu-ui" data-easyedu-dialog-palette="'+palette.roles+'" style="--easyedu-primary:'+palette.primary+';--easyedu-primary-chosen:'+palette.chosen+';--easyedu-primary-soft:'+palette.soft+'">'+renderer.module.exports.render(fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8'),data.templateData)+'</div>');
  await page.locator('[data-easyedu-guide-modal]').evaluate(n=>{n.hidden=false;});
  for(const portalled of [false,true]){
   if(portalled)await page.evaluate(relay=>{const guideNode=document.querySelector('[data-easyedu-guide-root]');Function('guideNode',relay+'\npreserveGuidePortalTheme();')(guideNode);document.body.appendChild(guideNode);},relay);
   const paint=await page.locator('[data-easyedu-guide-root]').evaluate(node=>{
    const probe=document.createElement('span');node.appendChild(probe);
    const expected=(property,value)=>{probe.style[property]=value;return getComputedStyle(probe)[property];};
    const header=node.querySelector('.easyedu-guide-modal__header'),icon=node.querySelector('.easyedu-guide-modal__hero-icon');
    const button=node.querySelector('[data-guide-scene-command="start"]'),title=node.querySelector('.easyedu-guide-modal__title-wrap h2');
    const result={header:getComputedStyle(header).backgroundImage,expectedHeader:expected('backgroundImage','var(--easyedu-dialog-palette-primary-header, var(--easyedu-modal-header-bg))'),
     icon:getComputedStyle(icon).color,button:getComputedStyle(button).backgroundColor,primary:expected('color','var(--easyedu-primary)'),
     title:getComputedStyle(title).color,titleExpected:expected('color','var(--easyedu-card-identity-title-color)'),
     headerHeight:header.getBoundingClientRect().height,titleFont:getComputedStyle(title).fontSize};probe.remove();return result;
   });
   const row={width,palette:palette.name,portalled,headerMatch:paint.header===paint.expectedHeader,iconMatch:paint.icon===paint.primary,buttonMatch:paint.button===paint.primary,titleMatch:paint.title===paint.titleExpected,headerHeight:paint.headerHeight,titleFont:paint.titleFont};rows.push(row);
   if(!audit){for(const key of ['headerMatch','iconMatch','buttonMatch','titleMatch'])assert.ok(row[key],`${width}/${palette.name}/${portalled}: ${key}`);}
  }await page.close();
 }console.log(JSON.stringify({audit,cases:rows.length,rows,nativeProof:false,settingsWrites:false}));
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
