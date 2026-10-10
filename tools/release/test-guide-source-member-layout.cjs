/* eslint-env node */
// Actual translated invitation only; no Moodle session or native exercise.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
assert.equal(process.argv.length,5,'Usage: <playwright-module> <moodle-mustache-source> <php>');
const {chromium}=require(process.argv[2]);
const renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8').replace('export default mustache;','module.exports = mustache;'),renderer);
const root=path.resolve(__dirname,'../..');
const template=fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const engine='window.define=(...args)=>{window.Guide=args.at(-1)();};\n'+
    fs.readFileSync(path.join(root,'amd/build/easyedu_guide.min.js'),'utf8');
(async()=>{
    const browser=await chromium.launch({headless:true,channel:'chrome'});
    let cases=0;
    try{
        for(const language of ['en','fr']) for(const width of [1280,768,390]) for(const motion of ['no-preference','reduce']){
            const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion});
            await page.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<html></html>'}));
            await page.goto('http://guide.test');
            const raw=JSON.parse(execFileSync(process.argv[4],[path.join(__dirname,'guide-current-curriculum-fixture.php'),language],
                {encoding:'utf8'}));
            const index=raw.readingContract.slideIds.indexOf('add-or-move-members');
            assert.ok(index>=0);
            await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}'+css+'</style>'+
                renderer.module.exports.render(template,raw.templateData));
            await page.addScriptTag({content:engine});
            await page.evaluate(()=>Guide.init('[data-easyedu-guide-root]',{firstVisit:false,storageKey:'member-layout-qa'}));
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
            const invitation=page.locator('[data-easyedu-guide-slide="'+index+'"] .easyedu-guide-guided-card');
            await invitation.waitFor({state:'visible'});
            await invitation.scrollIntoViewIfNeeded();
            await page.waitForFunction(()=>{
                const dialog=document.querySelector('.easyedu-guide-modal__dialog');
                return dialog && !dialog.getAnimations().some(animation=>animation.playState==='running');
            });
            const result=await invitation.evaluate(node=>{
                const host=node.getBoundingClientRect();
                const text=[...node.querySelectorAll('.easyedu-guide-guided-card__body > small,'+
                    '.easyedu-guide-guided-card__body > strong,.easyedu-guide-guided-card__body > span,'+
                    '.easyedu-guide-guided-card__steps li,[data-easyedu-guide-start-path] > span')]
                    .filter(item=>item.getClientRects().length);
                return {count:text.length,overflow:node.scrollWidth>node.clientWidth+1,
                    escaped:text.filter(item=>{
                        const box=item.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(item);
                        return [...range.getClientRects()].some(rect=>rect.left<box.left-1 || rect.right>box.right+1 ||
                            rect.bottom>box.bottom+1 || rect.left<host.left-1 || rect.right>host.right+1);
                    }).map(item=>item.textContent)};
            });
            assert.ok(result.count>=8,'All actual title, copy, four labels and action counted');
            assert.equal(result.overflow,false);assert.deepEqual(result.escaped,[],`${language}/${width}/${motion}`);
            await page.close();cases++;
        }
        console.log(`PASS ${cases} actual EN/FR member invitations: three widths, normal/reduced, full painted copy containment.`);
    }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
