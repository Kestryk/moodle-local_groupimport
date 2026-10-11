// Scoped successor: actual localized template/AMD, not Moodle or human acceptance.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 6, 'Usage: <playwright> <mustache> <php> <external-output>');
const {chromium} = require(process.argv[2]), renderer = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(process.argv[3], 'utf8').replace('export default mustache;', 'module.exports = mustache;'), renderer);
const root = path.resolve(__dirname, '../..'), output = path.resolve(process.argv[5]);
fs.mkdirSync(output, {recursive: true});
(async () => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'}), records = [], errors = [];
    try {
        for (const language of ['en', 'fr']) for (const width of [1600, 1280, 390]) {
            const data = JSON.parse(execFileSync(process.argv[4], [path.join(__dirname, 'guide-demonstration-entry-fixture.php'), language], {encoding: 'utf8'}));
            const height = width === 1600 ? 900 : width === 1280 ? 800 : 844;
            const page = await browser.newPage({viewport: {width, height}});
            page.on('pageerror', e => errors.push(e.message));
            await page.route('**/*', route => route.fulfill({body: '<html></html>'}));
            await page.goto('http://guide-review1.test');
            await page.setContent('<style>*{box-sizing:border-box}[hidden]{display:none!important}' + fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '</style><div class="local-groupimport-easystud easyedu-ui">' + renderer.module.exports.render(fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8'), data.templateData) + '</div>');
            await page.addScriptTag({content: 'window.define=(deps,factory)=>{window.Guide=factory();};\n' + fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8')});
            await page.evaluate(() => Guide.init('[data-easyedu-guide-root]', {storageKey: 'review1-qa', firstVisit: false}));
            await page.locator('[data-easyedu-guide-open]').first().click();
            const modal = page.locator('[data-easyedu-guide-modal]');
            const slide = data.templateData.slides.find(s => s.discoveryscene?.kind === 'membership');
            await modal.locator(`[data-easyedu-guide-nav-item="${slide.index}"]`).click();
            const scene = modal.locator('[data-easyedu-guide-scene="membership"]'), header = scene.locator('[data-guide-scene-header]');
            await header.waitFor({state: 'visible'});
            await header.locator('[data-guide-scene-command="move"]').click();
            await page.waitForFunction(()=>{
                const h=document.querySelector('[data-easyedu-guide-scene="membership"] [data-guide-scene-header]');
                return h.getBoundingClientRect().bottom<=h.closest('.easyedu-guide-modal__body').getBoundingClientRect().bottom+1;
            });
            await scene.evaluate(n => { n.originalMembershipNode = n.querySelector('[data-guide-memberships]'); });
            const ready = await header.evaluate(n => {
                const rect = e => { const r = e.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}; };
                const body = n.closest('.easyedu-guide-modal__body'), modes = n.querySelector('.easyedu-guide-scene__modes');
                const memberships = n.querySelector('[data-guide-memberships]');
                return {position:getComputedStyle(n).position,header:rect(n),body:rect(body),memberships:memberships&&rect(memberships),
                    modeLabels:[...modes.querySelectorAll('button')].map(b=>b.textContent.trim()),
                    modes:[...modes.querySelectorAll('button')].map(rect),start:rect(n.querySelector('[data-guide-scene-command="start"]')),
                    selectedBackground:getComputedStyle(modes.querySelector('[aria-pressed="true"]')).backgroundColor,
                    startBackground:getComputedStyle(n.querySelector('[data-guide-scene-command="start"]')).backgroundColor,
                    accessibleName:modes.getAttribute('aria-label')};
            });
            records.push({language,width,state:'ready',...ready});
            assert.equal(ready.position, 'relative'); assert.ok(ready.accessibleName); assert.equal(ready.modeLabels.length,2);
            assert.notEqual(ready.selectedBackground,ready.startBackground);
            assert.ok(ready.memberships,'Same memberships component lives in ready header');
            assert.ok(ready.memberships.bottom<=ready.body.bottom+1,'Expected memberships visible before Start');
            if(width===390){assert.ok(Math.abs(ready.modes[0].top-ready.modes[1].top)<1);assert.ok(Math.abs(ready.modes[0].width-ready.modes[1].width)<1);assert.ok(ready.start.top>=ready.modes[0].bottom);}
            await scene.screenshot({path:path.join(output,`${language}-${width}-ready.png`)});
            await header.locator('[data-guide-scene-command="start"]').click();
            for(const phase of ['select','menu','confirm','validate']){
                await page.waitForFunction(({phase})=>document.querySelector('[data-easyedu-guide-scene="membership"]').dataset.guidePhase===phase,{phase});
                await page.waitForFunction(()=>{
                    const h=document.querySelector('[data-easyedu-guide-scene="membership"] [data-guide-scene-header]');
                    return h.querySelector('.easyedu-guide-scene__header-controls').getBoundingClientRect().height<1;
                });
                await page.waitForTimeout(550);
                const reading = await scene.evaluate(n=>{
                    const h=n.querySelector('[data-guide-scene-header]'),r=h.getBoundingClientRect(),body=n.closest('.easyedu-guide-modal__body');
                    const phase=n.dataset.guidePhase,selectors={select:'[data-guide-person]',menu:'[data-guide-menu]',confirm:'[data-guide-confirm]',validate:'[data-guide-simulated-submit]'};
                    const t=n.querySelector(selectors[phase]),tr=t.getBoundingClientRect(),copy=h.querySelector('[data-guide-live-copy]'),css=getComputedStyle(copy);
                    return {phase,height:r.height,headerBottom:r.bottom,targetTop:tr.top,targetBottom:tr.bottom,bodyBottom:body.getBoundingClientRect().bottom,
                        position:getComputedStyle(h).position,scrollPadding:parseFloat(getComputedStyle(body).scrollPaddingTop),
                        controlHeight:h.querySelector('.easyedu-guide-scene__header-controls').getBoundingClientRect().height,
                        sameMembership:n.originalMembershipNode===n.querySelector('[data-guide-memberships]'),membershipOutsideHeader:!h.contains(n.querySelector('[data-guide-memberships]')),
                        fullCopy:copy.textContent,title:copy.title,ariaLive:copy.getAttribute('aria-live'),lineClamp:css.webkitLineClamp};
                });
                records.push({language,width,state:'playing',...reading});
                assert.ok(reading.height<=(width===390?96:84)+1,'Compact reading header');assert.equal(reading.position,'sticky');
                assert.ok(reading.controlHeight<1);assert.equal(reading.sameMembership,true);assert.equal(reading.membershipOutsideHeader,true);
                assert.ok(reading.targetTop>=reading.headerBottom-1,'Phase target not underneath sticky header');
                assert.ok(Math.abs(reading.scrollPadding-reading.height-8)<1);assert.equal(reading.lineClamp,'2');
                assert.equal(reading.title,reading.fullCopy);assert.equal(reading.ariaLive,'polite');
                await header.locator('[data-guide-playback="pause"]').click();
                assert.equal(await header.getAttribute('data-guide-playback-state'),'paused');
                await header.screenshot({path:path.join(output,`${language}-${width}-${phase}.png`)});
                await header.locator('[data-guide-playback="pause"]').click();
                await header.locator('[data-guide-playback="next-phase"]').click();
            }
            await page.waitForFunction(()=>document.querySelector('[data-easyedu-guide-scene="membership"]').dataset.guideSceneFinished==='true');
            await page.waitForTimeout(400);
            const finished=await scene.evaluate(n=>{
                const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
                const body=n.closest('.easyedu-guide-modal__body');return {body:rect(body),memberships:rect(n.querySelector('[data-guide-memberships]')),recap:rect(n.querySelector('[data-guide-recap]')),
                    headerPosition:getComputedStyle(n.querySelector('[data-guide-scene-header]')).position,scrollPaddingInline:body.style.getPropertyValue('scroll-padding-top'),sameMembership:n.originalMembershipNode===n.querySelector('[data-guide-memberships]')};
            });
            records.push({language,width,state:'finished-C5-measurement',...finished});
            assert.equal(finished.headerPosition,'relative');assert.equal(finished.scrollPaddingInline,'');assert.equal(finished.sameMembership,true);
            await page.screenshot({path:path.join(output,`${language}-${width}-finished.png`)});
            await scene.locator('[data-guide-scene-command="reset"]').click();
            assert.equal(await header.locator('[data-guide-memberships]').count(),1);
            await page.evaluate(()=>Guide.destroy('[data-easyedu-guide-root]'));await page.close();
        }
        assert.deepEqual(errors,[]);
        console.log('PASS six localized three-width ready/read/pause/phase-target/finish/reset cases; C5 measurements recorded.');
    } finally {
        fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({records,errors,nativeVerified:false,humanAccepted:false},null,2),{flag:'wx'});
        await browser.close();
    }
})().catch(e=>{console.error(e);process.exitCode=1;});
