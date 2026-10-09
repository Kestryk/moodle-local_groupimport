// Actual translated PHP data, Moodle Mustache, consumer CSS and built AMD.
// Isolated explanation containment only; no Moodle session or course actions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 5, 'Usage: <playwright-module> <moodle-mustache-source> <php>');
const {chromium} = require(process.argv[2]);
const renderer = {module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[3], 'utf8').replace('export default mustache;', 'module.exports = mustache;'), renderer);
const root = path.resolve(__dirname, '../..');
const template = fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const engine = 'window.define=(...args)=>{window.Guide=args.at(-1)();};\n' +
    fs.readFileSync(path.join(root, 'amd/build/easyedu_guide.min.js'), 'utf8');
(async () => {
    const browser = await chromium.launch({headless:true, channel:'chrome'});
    let cases = 0;
    try {
        for (const language of ['en', 'fr']) for (const width of [1280, 768, 390]) for (const motion of ['no-preference', 'reduce']) {
            const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:motion});
            await page.route('**/*', route => route.fulfill({status:200,contentType:'text/html',body:'<html></html>'}));
            await page.goto('http://guide.test');
            const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-discovery-fixture.php'), language], {encoding:'utf8'}));
            data.slides = data.actionLessons.map((lesson,index)=>({...lesson,index,content:'',title:lesson.type}));
            Object.assign(data, {discoverypresentation:true, rootclass:'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
                guideopenlabel:'Open', guidecloselabel:'Close', guidetitle:'EasyStud guide', guidesubtitle:'Student Management',
                guidepreviouslabel:'Previous', guidenextlabel:'Next', guideshowinterfacelabel:'Show', slidecount:2});
            await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}'+css+'</style>'+renderer.module.exports.render(template,data));
            await page.addScriptTag({content:engine});
            await page.evaluate(() => Guide.init('[data-easyedu-guide-root]', {firstVisit:false,storageKey:'copy-fixture'}));
            await page.locator('[data-easyedu-guide-open]').click();
            for (const index of [0,1]) {
                await page.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const copy = page.locator(`[data-easyedu-guide-slide="${index}"] .easyedu-guide-introduction`).first();
                await copy.waitFor({state:'visible'});
                const bounds = await copy.evaluate(node => {
                    const a=node.getBoundingClientRect(),b=node.parentElement.getBoundingClientRect();
                    return {left:a.left,right:a.right,parentLeft:b.left,parentRight:b.right,overflow:node.scrollWidth>node.clientWidth+1};
                });
                assert.equal(bounds.overflow,false,`${language}/${width}/${motion}/${index}: copy wraps`);
                assert.ok(bounds.left>=bounds.parentLeft-1 && bounds.right<=bounds.parentRight+1,'Painted copy stays in its container');
                const textOverflow = await copy.locator('p,dd,dt > span:last-child').evaluateAll(nodes=>nodes.filter(node=>{
                    const range=document.createRange();range.selectNodeContents(node);
                    const ink=range.getBoundingClientRect(),box=node.getBoundingClientRect();
                    return ink.left<box.left-1 || ink.right>box.right+1 || ink.bottom>box.bottom+1;
                }).map(node=>node.textContent));
                assert.deepEqual(textOverflow,[],`${language}/${width}/${motion}: painted text containment`);
                cases++;
            }
            await page.close();
        }
        console.log(`PASS ${cases} translated action explanation cases: actual renderer/built AMD, canonical layout, contained EN/FR copy, normal/reduced motion.`);
    } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});

