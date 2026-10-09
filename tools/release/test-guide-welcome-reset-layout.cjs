const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
assert.equal(process.argv.length,9,'Usage: node test-guide-welcome-reset-layout.cjs <playwright> <mustache> <php> <fixture> <css> <template> <built-confirmation>');
const {chromium}=require(process.argv[2]);
const renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8').replace('export default mustache;','module.exports=mustache;'),renderer);
(async()=>{
    const browser=await chromium.launch({headless:true,channel:'chrome'});
    const rows=[];
    try{
        for(const language of ['en','fr']){
            const data=JSON.parse(execFileSync(process.argv[4],[process.argv[5],language],{encoding:'utf8'})).welcomeReset;
            Object.assign(data,{cancelurl:'/cancel',action:'/confirm',sesskey:'isolated-placeholder'});
            for(const width of [1280,768,390]){
                const page=await browser.newPage({viewport:{width,height:900}});
                await page.route('**/*',route=>route.fulfill({body:'<html></html>'}));
                await page.goto('http://confirmation.test');
                await page.setContent('<button id="outside">Outside</button><style>*{box-sizing:border-box}'+fs.readFileSync(process.argv[6],'utf8')+'</style>'+renderer.module.exports.render(fs.readFileSync(process.argv[7],'utf8'),data));
                await page.addScriptTag({content:'window.define=(...args)=>{window.Confirmation=args.at(-1)();};'+fs.readFileSync(process.argv[8],'utf8')});
                await page.evaluate(()=>{
                    window.cancelCount=0;window.submitCount=0;
                    const dialog=document.querySelector('dialog');
                    dialog.querySelector('[data-easyedu-dialog-cancel]').addEventListener('click',e=>{e.preventDefault();window.cancelCount++;});
                    dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();window.submitCount++;});
                    Confirmation.init('#easyedu-welcome-reset');
                });
                const measured=await page.locator('.easyedu-confirmation-dialog').evaluate(n=>{
                    const a=n.querySelector('.easyedu-button--secondary'),b=n.querySelector('button'),p=n.querySelector('p'),r=n.getBoundingClientRect();
                    const range=document.createRange();range.selectNodeContents(p);
                    return {width:r.width,overflow:n.scrollWidth>n.clientWidth,padding:getComputedStyle(n.querySelector('form')).padding,
                        nativeModal:n.matches(':modal'),cancelFocused:document.activeElement===a,
                        centreX:Math.abs(r.x+r.width/2-innerWidth/2),centreY:Math.abs(r.y+r.height/2-innerHeight/2),
                        colour:getComputedStyle(b).backgroundColor,paired:Math.abs(a.getBoundingClientRect().height-b.getBoundingClientRect().height),
                        descriptionFits:[...range.getClientRects()].every(t=>t.left>=r.left && t.right<=r.right)};
                });
                assert.equal(measured.padding,'20px');
                assert.equal(measured.colour,'rgb(15, 108, 191)','Canonical defaults supplied without workspace');
                assert.ok(measured.paired<0.05 && !measured.overflow && measured.descriptionFits);
                assert.ok(measured.nativeModal && measured.cancelFocused && measured.centreX<1 && measured.centreY<1);
                await page.locator('#outside').evaluate(n=>n.focus());
                assert.equal(await page.locator('dialog').evaluate(n=>n.contains(document.activeElement)),true,'Background cannot take focus');
                await page.locator('[data-easyedu-dialog-cancel]').hover();
                assert.equal(await page.locator('[data-easyedu-dialog-cancel]').evaluate(n=>getComputedStyle(n).textDecorationLine),'none');
                await page.keyboard.press('Escape');
                assert.equal(await page.evaluate(()=>window.cancelCount),1);
                assert.equal(await page.evaluate(()=>window.submitCount),0);
                await page.evaluate(()=>{Confirmation.destroy('#easyedu-welcome-reset');Confirmation.init('#easyedu-welcome-reset');});
                assert.equal(await page.locator('dialog').evaluate(n=>n.matches(':modal')),true);
                rows.push({language,viewportWidth:width,...measured});
                await page.close();
            }
        }
        console.log(JSON.stringify({rows,authentication:false,businessWrites:0}));
    }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
