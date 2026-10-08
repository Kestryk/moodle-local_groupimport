const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
assert.equal(process.argv.length,8,'Usage: node test-guide-welcome-reset-layout.cjs <playwright> <mustache> <php> <fixture> <css> <template>');
const {chromium}=require(process.argv[2]);
const renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8').replace('export default mustache;','module.exports=mustache;'),renderer);
(async()=>{
    const browser=await chromium.launch({headless:true,channel:'chrome'});
    const rows=[];
    try{
        for(const language of ['en','fr']){
            const data=JSON.parse(execFileSync(process.argv[4],[process.argv[5],language],{encoding:'utf8'})).welcomeReset;
            for(const width of [1280,768,390]){
                const page=await browser.newPage({viewport:{width,height:900}});
                await page.setContent('<style>*{box-sizing:border-box}'+fs.readFileSync(process.argv[6],'utf8')+'</style>'+renderer.module.exports.render(fs.readFileSync(process.argv[7],'utf8'),data));
                const measured=await page.locator('.easyedu-confirmation-dialog').evaluate(n=>{
                    const a=n.querySelector('.easyedu-button--secondary'),b=n.querySelector('button'),p=n.querySelector('p'),r=n.getBoundingClientRect();
                    const range=document.createRange();range.selectNodeContents(p);
                    return {width:r.width,overflow:n.scrollWidth>n.clientWidth,padding:getComputedStyle(n.querySelector('form')).padding,
                        colour:getComputedStyle(b).backgroundColor,paired:Math.abs(a.getBoundingClientRect().height-b.getBoundingClientRect().height),
                        descriptionFits:[...range.getClientRects()].every(t=>t.left>=r.left && t.right<=r.right)};
                });
                assert.equal(measured.padding,'20px');
                assert.equal(measured.colour,'rgb(15, 108, 191)','Canonical defaults supplied without workspace');
                assert.ok(measured.paired<0.05 && !measured.overflow && measured.descriptionFits);
                rows.push({language,viewportWidth:width,...measured});
                await page.close();
            }
        }
        console.log(JSON.stringify({rows,authentication:false,businessWrites:0}));
    }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
