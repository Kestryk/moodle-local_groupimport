/* eslint-env node */
// Real translated Mustache, current curriculum, Guide/Motion AMD and full page CSS.
// Isolated HTTP route only: no Moodle DB, login, service or runtime mutation.
// Args: Playwright module, Moodle mustache.js, PHP CLI, new output directory,
// optional baseline directory containing baseline.css/baseline.mustache/baseline-guide.js.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const [pw, mustacheFile, php, output, baseline] = process.argv.slice(2);
assert(!fs.existsSync(output),'Keep evidence immutable');
fs.mkdirSync(output,{recursive:true});
const {chromium} = require(pw);
const render = {module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(mustacheFile,'utf8').replace('export default mustache;','module.exports = mustache;'),render);
const css=fs.readFileSync(baseline?path.join(baseline,'baseline.css'):path.join(root,'styles/student-management.css'),'utf8');
const template=fs.readFileSync(baseline?path.join(baseline,'baseline.mustache'):path.join(root,'templates/easyedu_guide.mustache'),'utf8');
const guide=fs.readFileSync(baseline?path.join(baseline,'baseline-guide.js'):path.join(root,'amd/src/easyedu_guide.js'),'utf8');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const partial=name=>{
    const file=path.join(root,'templates',name.replace(/^local_groupimport\//,'')+'.mustache');
    return fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
};
const font=fs.readFileSync(path.join(root,'fonts/InterVariable.woff2')).toString('base64');
const faFile=path.resolve(path.dirname(mustacheFile),'../../fonts/fa-solid-900.woff2');
const fa=fs.readFileSync(faFile).toString('base64');
const rows=[];
(async()=>{
    const browser=await chromium.launch({channel:'chrome',headless:true});
    try{
        for(const lang of ['fr','en'])for(const width of [768,390]){
            const fixture=JSON.parse(cp.execFileSync(php,[path.join(root,'tools/release/guide-current-curriculum-fixture.php'),lang],{encoding:'utf8'}));
            const payload=fixture.templateData;
            payload.str=()=>()=>lang==='fr'?'Affichage et animations':'Display and animations';
            const html=render.module.exports.render(template,payload,partial);
            const context=await browser.newContext({viewport:{width,height:width===390?844:1024},hasTouch:true,reducedMotion:'no-preference'});
            const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];
            page.on('pageerror',e=>errors.push(e.message));
            page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
            await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
            await page.goto('http://k20-guide.test/');
            await page.setContent(`<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}
              @font-face{font-family:FA;src:url(data:font/woff2;base64,${fa})}*{box-sizing:border-box}body{margin:0;font-family:Inter}
              .fa{font:900 14px/1 FA;display:inline-block}.fa-expand:before{content:'\\f065'}.fa-minus:before{content:'\\f068'}
              .fa-sliders:before{content:'\\f1de'}.fa-compass:before{content:'\\f14e'}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
              ${css}</style><main class="easyedu-ui local-groupimport-easystud path-local-groupimport">${html}</main>`);
            await page.addScriptTag({content:`window.amd={};window.define=(...a)=>{const name=typeof a[0]==='string'?a.shift():'local_groupimport/easyedu_guide',deps=Array.isArray(a[0])?a.shift():[],factory=a[0],exports={};const value=factory(...deps.map(d=>d==='exports'?exports:amd[d]));amd[name]=value||exports;};`});
            for(const name of ['motion','easyedu_bubble'])await page.addScriptTag({content:read('amd/build/'+name+'.min.js')});
            await page.addScriptTag({content:guide});
            const firstPath=Object.keys(fixture.paths)[0];assert(firstPath,'Actual curriculum has paths');
            await page.evaluate(({paths,firstPath})=>{
                localStorage.setItem('k20.qa.checklist',JSON.stringify({path:firstPath,activeIndex:0,completed:{}}));
                window.Guide=amd['local_groupimport/easyedu_guide'];
                Guide.init('[data-easyedu-guide-root]',{storageKey:'k20.qa',firstVisit:false,welcomeOffer:false,paths});
            },{paths:fixture.paths,firstPath});
            await page.evaluate(()=>document.fonts.ready);
            const notice=page.locator('[data-easyedu-guide-resume]');
            fs.writeFileSync(path.join(output,'stage.json'),JSON.stringify({stage:'initialized',lang,width,errors,
                state:await page.evaluate(()=>({storage:localStorage.getItem('k20.qa.checklist'),
                    roots:[...document.querySelectorAll('[data-easyedu-guide-root]')].map(n=>n.className),
                    notices:document.querySelectorAll('[data-easyedu-guide-resume]').length}))},null,2));
            await notice.waitFor({state:'visible'});
            await page.locator('[data-easyedu-guide-open]').first().click();
            const modal=page.locator('[data-easyedu-guide-modal]');
            await modal.waitFor({state:'visible'});
            await modal.evaluate(async n=>Promise.all(n.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
            const stack=await page.evaluate(()=>{
                const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
                const notice=document.querySelector('[data-easyedu-guide-resume]'),footer=document.querySelector('.easyedu-guide-modal__footer');
                const n=box(notice),f=box(footer);
                return {notice:n,footer:f,insideDialog:!!notice.closest('.easyedu-guide-modal__dialog'),
                    overlap:Math.max(0,Math.min(n.bottom,f.bottom)-Math.max(n.y,f.y)),
                    buttons:[...footer.querySelectorAll('button')].map(b=>{const r=box(b);return {box:r,
                        hit:b.contains(document.elementFromPoint(r.x+r.w/2,r.y+r.h/2)),name:b.getAttribute('aria-label')||b.textContent.trim()};})};
            });
            const k2002=stack.insideDialog&&stack.overlap===0&&stack.notice.bottom<=stack.footer.y&&
                stack.buttons.every(b=>b.hit&&b.box.bottom<=stack.footer.bottom&&b.box.right<=width);
            await notice.locator('[data-easyedu-guide-resume-path]').click();
            const checklist=page.locator('[data-easyedu-guide-checklist]');await checklist.waitFor({state:'visible'});
            await modal.locator('[data-easyedu-guide-close]').click();
            await modal.waitFor({state:'hidden'});
            const earlyRestore=page.locator('[data-easyedu-guide-checklist-restore]');
            if(await earlyRestore.isVisible())await earlyRestore.click();
            await checklist.evaluate(async n=>Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
            const measure=async selector=>page.locator(selector).evaluate(b=>{
                const r=b.getBoundingClientRect(),s=getComputedStyle(b),i=b.querySelector('.fa'),ir=i?.getBoundingClientRect();
                const cross=getComputedStyle(b,'::before');
                return {width:r.width,height:r.height,radius:s.borderRadius,background:s.backgroundColor,color:s.color,
                    border:s.border,hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),
                    glyphCentre:ir?[Math.abs(r.x+r.width/2-ir.x-ir.width/2),Math.abs(r.y+r.height/2-ir.y-ir.height/2)]:
                        [Math.abs(parseFloat(cross.left)-r.width/2+parseFloat(s.borderLeftWidth)),Math.abs(parseFloat(cross.top)-r.height/2+parseFloat(s.borderTopWidth))]};
            });
            const close=await measure('[data-easyedu-guide-checklist-close]');
            // Click the real minimize action; no injected class or synthetic keyboard input.
            const minimize=page.locator('[data-easyedu-guide-checklist-minimize]');
            if(await minimize.isVisible())await minimize.click();
            else await checklist.evaluate(n=>n.querySelector('[data-easyedu-guide-checklist-minimize]').click());
            const restoreButton=page.locator('[data-easyedu-guide-checklist-restore]');await restoreButton.waitFor({state:'visible'});
            const restore=await measure('[data-easyedu-guide-checklist-restore]');
            const k2001=['width','height','radius','background','color','border'].every(k=>close[k]===restore[k])&&
                close.height===44&&restore.height===44&&close.glyphCentre.every(n=>n<=0.5)&&restore.glyphCentre.every(n=>n<=0.5)&&close.hit&&restore.hit;
            await restoreButton.click();
            // The standalone page has no course targets; docking may immediately
            // reduce it again. Persistence, not that target-dependent decision,
            // is the invariant of this presentation-only fixture.
            assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('k20.qa.checklist')).path),firstPath);
            assert.deepEqual(errors,[]);
            rows.push({lang,width,stack,close,restore,k2001,k2002,errors});
            fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(rows,null,2));
            if(!baseline){assert(k2001,'K20-01 '+JSON.stringify({lang,width,close,restore}));
                if(process.env.K20_ONLY!=='01')assert(k2002,'K20-02 '+JSON.stringify({lang,width,stack}));}
            await context.close();
        }
        console.log(JSON.stringify({cases:rows.length,k2001:rows.filter(r=>r.k2001).length,k2002:rows.filter(r=>r.k2002).length,consoleErrors:0}));
    }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(output,'failure.txt'),e.stack);console.error(e.message);process.exitCode=1;});
