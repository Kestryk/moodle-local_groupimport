// Actual current curriculum + shared renderer/engine; no Moodle session/data.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 5, 'Usage: <playwright> <mustache> <php>');
const {chromium} = require(process.argv[2]);
const renderer = {module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8').replace('export default mustache;', 'module.exports = mustache;'),renderer);
const root = path.resolve(__dirname,'../..');
const template = fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8');
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const engine = 'window.define=(...args)=>{window.Guide=args.at(-1)();};\n' + fs.readFileSync(path.join(root,'amd/build/easyedu_guide.min.js'),'utf8');
(async()=>{
    const browser = await chromium.launch({headless:true,channel:'chrome'});
    let cases=0;
    try {
        for(const language of ['en','fr']) {
            const data=JSON.parse(execFileSync(process.argv[4],[path.join(__dirname,'guide-current-curriculum-fixture.php'),language],{encoding:'utf8'}));
            assert.equal(data.templateData.slides.length,12,'Every current slide');
            for(const width of [1280,768,390]) for(const motion of ['no-preference','reduce']) {
                const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion});
                const errors=[];page.on('pageerror',e=>errors.push(e.message));
                await page.route('**/*',route=>route.fulfill({body:'<html></html>'}));
                await page.goto('http://guide-slide-title.test');
                await page.setContent('<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif}[hidden]{display:none!important}'+css+'</style>'+
                    '<div class="local-groupimport-easystud path-local-groupimport easyedu-ui">'+renderer.module.exports.render(template,data.templateData)+'</div>');
                await page.addScriptTag({content:engine});
                await page.evaluate(()=>Guide.init('[data-easyedu-guide-root]',{firstVisit:false,fullscreen:true,storageKey:'slide-title-isolated'}));
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
                for(const slide of data.templateData.slides) {
                    await page.locator('[data-easyedu-guide-nav-item="'+slide.index+'"]').click();
                    await page.waitForFunction(index=>document.querySelector('[data-easyedu-guide-root]').dataset.easyeduGuideCurrentSlide===String(index),slide.index);
                    const title=page.locator('[data-easyedu-guide-slide="'+slide.index+'"] .easyedu-guide-slide__header > h3');
                    await title.waitFor({state:'visible'});
                    const result=await title.evaluate(node=>{
                        const style=getComputedStyle(node),rect=node.getBoundingClientRect(),header=node.parentElement.getBoundingClientRect();
                        const range=document.createRange();range.selectNodeContents(node);
                        const failures=[...range.getClientRects()].filter(r=>r.left<rect.left-1||r.right>rect.right+1||r.bottom>rect.bottom+1);
                        return {text:node.textContent,size:style.fontSize,weight:style.fontWeight,line:style.lineHeight,color:style.color,
                            family:style.fontFamily,wrapped:rect.height>21,failures:failures.length,
                            contained:rect.left>=header.left-1&&rect.right<=header.right+1,
                            secondary:getComputedStyle(node.closest('[data-easyedu-guide-root]')).getPropertyValue('--easyedu-secondary-text').trim()};
                    });
                    const context=[slide.id,language,width,motion].join('/');
                    assert.equal(result.text,slide.title,context);assert.equal(result.size,'16px',context);
                    assert.equal(result.weight,'600',context);assert.equal(result.line,'19.2px',context);
                    assert.equal(result.color,'rgb(11, 94, 168)',context);
                    assert.ok(result.contained,context+' header bounds');assert.equal(result.failures,0,context+' painted copy');
                    cases++;
                }
                assert.deepEqual(errors,[]);await page.evaluate(()=>Guide.destroy('[data-easyedu-guide-root]'));await page.close();
            }
        }
        console.log('PASS '+cases+' actual slide titles: EN/FR, three widths, normal/reduced, shared typography and painted containment.');
    } finally {await browser.close();}
})().catch(e=>{console.error(JSON.stringify({message:e.message,actual:e.actual,expected:e.expected,where:e.stack?.split('\n')[1]}));process.exitCode=1;});
