/* eslint-env node */
// Isolated OLD-C contract: real native select, Kit CSS, source and canonical controller.
// node this-file <Kit-root> <Playwright-module> <Sass-module> <new-output-directory> [FA-font]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const kit = path.resolve(process.argv[2]);
const {chromium} = require(process.argv[3]);
const sass = require(process.argv[4]);
const output = path.resolve(process.argv[5]);
assert(!fs.existsSync(output), 'Keep previous evidence immutable');
fs.mkdirSync(output, {recursive: true});
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const pluginStyle = read(path.join(root, 'scss/easyedu/components/_searchable-choices.scss'));
assert.equal(pluginStyle, read(path.join(kit, 'scss/easyedu/components/_searchable-choices.scss')));
const css = sass.compile(path.join(kit, 'examples/searchable-choices.scss')).css;
const font = fs.readFileSync(path.join(root, 'fonts/InterVariable.woff2')).toString('base64');
const fa = process.argv[6] ? fs.readFileSync(process.argv[6]).toString('base64') : '';
const labels = {
    fr: {label: 'Identifiants autorisés', search: 'Rechercher', empty: 'Aucun résultat', none: 'Aucune sélection',
        count: '__count__ sélectionnés', clear: 'Tout retirer', remove: 'Retirer « __label__ » de la sélection'},
    en: {label: 'Allowed identifiers', search: 'Search', empty: 'No results', none: 'No selection',
        count: '__count__ selected', clear: 'Clear all', remove: 'Remove “__label__” from the selection'},
};
const records = [];
const sources = {plugin: read(path.join(root, 'amd/src/searchable_choices.js')),
    kit: read(path.join(kit, 'choices/searchable_choices.js'))};
const helper = s => s.slice(s.indexOf('    // Buttons are siblings'), s.indexOf('    const syncValue ='));
assert.equal(helper(sources.plugin), helper(sources.kit), 'One tagged rendering contract');
const near = (a, b, what) => assert(Math.abs(a - b) <= 0.5, `${what}: ${a} vs ${b}`);
(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    try {
        for (const [consumer, source] of Object.entries(sources)) {
            for (const lang of ['fr', 'en']) {
                for (const width of [1600, 390]) {
                    const context = await browser.newContext({viewport: {width, height: 1000}, hasTouch: width === 390,
                        reducedMotion: 'no-preference'});
                    const page = await context.newPage();
                    const errors = [];
                    page.on('pageerror', error => errors.push(error.message));
                    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
                    await page.setContent(`<body id="page-admin-setting-local_groupimport"><main class="easyedu-ui"><form id="adminsettings">
                      <div class="form-item"><div class="form-setting"><div class="defaultsnext easyedu-ui">
                      <label for="tagged">${labels[lang].label}</label>
                      <select id="tagged" name="fields[]" multiple><option value="username" selected>Username</option>
                      <option value="email" selected>Email</option><option value="locked">Locked</option>
                      <option value="safe">&lt;img src=x onerror=alert(1)&gt; $&amp;</option>
                      <optgroup label="Managed" disabled><option value="managed">Managed</option></optgroup></select></div></div></div>
                      <label for="legacy">Legacy</label><select id="legacy" multiple><option selected>A</option><option selected>B</option></select>
                      <label for="single">Single</label><select id="single"><option selected>A</option></select>
                      <button type="reset">Reset</button></form></main>`);
                    const pageCss = process.argv[7] === '--page-css' && consumer === 'plugin' ?
                        read(path.join(root,'styles/administration.css')) : css;
                    await page.addStyleTag({content: pageCss + `
                      @font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}
                      @font-face{font-family:FA;src:url(data:font/woff2;base64,${fa});font-weight:900}
                      .fa{display:inline-block;font:900 14px/1 FA}.fa-chevron-down:before{content:'\\f078'}
                      main{max-width:448px;margin:auto;padding:16px;box-sizing:border-box}body{margin:0;font-family:Inter}
                    `});
                    await page.addScriptTag({content: source.replace(/export const /g, 'const ') + `
                      window.tagged=enhanceMultipleSelect(document.querySelector('#tagged'),${JSON.stringify(labels[lang])},{taggedValues:true});
                      window.legacy=enhanceMultipleSelect(document.querySelector('#legacy'),${JSON.stringify(labels[lang])});
                      window.single=enhanceSelect(document.querySelector('#single'),${JSON.stringify(labels[lang])},{taggedValues:true});
                      window.changes=0;document.querySelector('#tagged').addEventListener('change',()=>window.changes++);
                    `});
                    await page.evaluate(() => document.fonts.ready);
                    const host = page.locator('.easyedu-searchable-choice--tagged');
                    const trigger = host.locator('.easyedu-searchable-choice__trigger');
                    assert.equal(await host.count(), 1, 'Only opted-in multiple gets chips');
                    assert.equal(await page.locator('#legacy + div .easyedu-searchable-choice__summary').textContent(),
                        labels[lang].count.replace('__count__', '2'), 'Legacy count unchanged');
                    assert.equal(await page.locator('button button').count(), 0, 'No nested controls');
                    const geometry = await host.evaluate(h => {
                        const rect = n => {const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,
                            right:r.right,bottom:r.bottom,cx:r.x+r.width/2,cy:r.y+r.height/2};};
                        const f=h.querySelector('.easyedu-searchable-choice__field'),t=h.querySelector('.easyedu-searchable-choice__trigger');
                        const s=getComputedStyle(f), cs=getComputedStyle(h.querySelector('.easyedu-searchable-choice__clear'));
                        return {debug:{font:s.fontFamily,block:s.paddingBlock,position:s.position,
                            frame:s.getPropertyValue('--easyedu-choice-frame-height'),caret:s.getPropertyValue('--easyedu-choice-trigger-size'),
                            clearRight:cs.right,clearLeft:cs.left,clearMargin:cs.margin,clearTransform:cs.transform},
                            field:rect(f),padding:s.paddingLeft,summaryGap:getComputedStyle(f.firstChild).gap,
                            trigger:rect(t),chevron:rect(t.lastChild),clear:rect(h.querySelector('.easyedu-searchable-choice__clear')),
                            chips:[...h.querySelectorAll('.easyedu-selection-chip')].map(c=>{
                                const l=c.firstChild,r=document.createRange();r.selectNodeContents(l);const s=getComputedStyle(c);
                                const b=c.lastChild,p=getComputedStyle(b,'::before');
                                return {box:rect(c),label:rect(l),text:rect(r),font:s.fontSize,radius:s.borderRadius,
                                    background:s.backgroundColor,ink:s.color,remove:rect(b),
                                    cross:[p.left,p.top,p.width,p.height,p.transform]};})};
                    });
                    fs.writeFileSync(path.join(output,`geometry-${consumer}-${lang}-${width}.json`),JSON.stringify(geometry,null,2));
                    near(geometry.field.h, width === 390 ? 44 : 38, 'Frame');
                    assert.equal(geometry.padding, '8px');assert.equal(geometry.summaryGap, '8px');
                    near(geometry.trigger.h, width === 390 ? 44 : 32, 'Caret target');
                    near(geometry.clear.h, width === 390 ? 44 : 28, 'Clear target');
                    for (const n of [geometry.trigger, geometry.clear, geometry.chevron]) near(n.cy, geometry.field.cy, 'Frame centre');
                    near(geometry.chevron.cx, geometry.trigger.cx, 'Caret centre X');
                    for (const chip of geometry.chips) {
                        near(chip.box.h,24,'Chip height');near(chip.remove.h,24,'Chip remove target');
                        near(chip.box.cy,chip.text.cy,'Text centre');near(chip.box.cy,chip.remove.cy,'Remove centre');
                        assert.equal(chip.font,'11px');assert.equal(chip.background,'rgb(244, 248, 252)');
                        assert.equal(chip.cross[0],'12px');assert.equal(chip.cross[1],'12px');
                        assert(chip.box.bottom<=geometry.field.bottom && chip.box.right<=geometry.field.right,'Chip containment');
                    }
                    assert(geometry.field.right<=width && geometry.field.x>=0,'Viewport containment');
                    assert(geometry.trigger.bottom<=geometry.field.bottom && geometry.clear.bottom<=geometry.field.bottom,'Vertical targets');
                    await host.evaluate(h=>h.classList.add('easyedu-searchable-choice--compact'));
                    near(await host.locator('.easyedu-searchable-choice__field').evaluate(n=>n.getBoundingClientRect().height),
                        width === 390 ? 44 : 32, 'Compact frame keeps Touch44');
                    await host.evaluate(h=>h.classList.remove('easyedu-searchable-choice--compact'));
                    await page.screenshot({path:path.join(output,`${consumer}-${lang}-${width}.png`)});
                    await host.locator('[data-easyedu-selection-value="username"]').click();
                    assert.deepEqual(await page.locator('#tagged').evaluate(n=>[...new FormData(n.form).getAll('fields[]')]),['email']);
                    assert.equal(await page.evaluate(()=>window.changes),1);
                    assert.equal(await trigger.evaluate(n=>n===document.activeElement),true,'Removal focus');
                    await trigger.click();
                    await host.getByRole('searchbox').fill('absent');
                    assert.equal(await host.getByRole('status').isVisible(),true);
                    assert.equal(await host.locator('.easyedu-selection-chip').count(),1,'Search preserves hidden selection');
                    await host.getByRole('searchbox').fill('');
                    await host.getByRole('button',{name:'Username',exact:true}).click();
                    assert.equal(await page.evaluate(()=>window.changes),2);
                    await host.getByRole('button',{name:'<img src=x onerror=alert(1)> $&',exact:true}).click();
                    assert.equal(await host.locator('img').count(),0,'Safe option text');
                    assert((await host.locator('[data-easyedu-selection-value="safe"]').getAttribute('aria-label')).includes('$&'));
                    await page.locator('#tagged').evaluate(n=>{
                        n.querySelector('[value="locked"]').selected=true;n.querySelector('[value="locked"]').disabled=true;
                        n.dispatchEvent(new Event('change',{bubbles:true}));
                    });
                    await host.getByRole('button',{name:labels[lang].clear,exact:true}).click();
                    assert.deepEqual(await page.locator('#tagged').evaluate(n=>[...n.selectedOptions].map(o=>o.value)),['locked']);
                    assert.equal(await host.locator('[data-easyedu-selection-value="locked"]').isDisabled(),true);
                    assert.equal(await host.getByRole('button',{name:labels[lang].clear,exact:true}).isDisabled(),true);
                    await page.locator('#tagged').evaluate(n=>{n.disabled=true;window.tagged.refresh();});
                    assert.equal(await trigger.isDisabled(),true,'Native disabled propagates');
                    await page.locator('#tagged').evaluate(n=>{
                        n.disabled=false;n.form.reset();window.tagged.refresh();
                    });
                    assert.deepEqual(await host.locator('.easyedu-selection-chip__label').allTextContents(),['Username','Email'],'Native reset');
                    if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click();
                    await host.locator('.easyedu-searchable-choice__panel').evaluate(async n => {
                        await Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{})));
                    });
                    const closingFocus = await page.evaluate(() => {
                        window.tagged.close(true);
                        const closing=window.tagged.host.querySelector('.easyedu-searchable-choice__panel').inert;
                        window.tagged.host.querySelector('.easyedu-selection-chip__remove').click();
                        return {closing,focused:document.activeElement===window.tagged.trigger};
                    });
                    assert.equal(closingFocus.closing,true,'Exercise removal during actual closing');
                    assert.equal(closingFocus.focused,true,'Closing removal avoids inert search and restores trigger focus');
                    await page.evaluate(()=>window.tagged.close(true));
                    await host.locator('.easyedu-searchable-choice__panel').waitFor({state:'hidden'});
                    await page.locator('#tagged').evaluate(n=>{
                        n.querySelector('[value="locked"]').disabled=false;window.tagged.refresh();
                    });
                    await host.getByRole('button',{name:labels[lang].clear,exact:true}).click();
                    assert.equal(await host.locator('.easyedu-selection-chip').count(),0,'Clearing removes all chips');
                    assert.equal(await host.locator('.easyedu-searchable-choice__clear').isHidden(),true,'Empty clear obeys hidden');
                    assert.equal(await host.locator('.easyedu-searchable-choice__summary').textContent(),labels[lang].none);
                    await page.evaluate(()=>window.tagged.destroy());
                    assert.equal(await page.locator('#tagged').isVisible(),true,'Destroy restores native fallback');
                    assert.equal(await page.locator('label[for="tagged"]').count(),1);
                    assert.deepEqual(errors,[]);
                    records.push({consumer,lang,width,geometry,closingFocus,errors,status:'PASS'});
                    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(records,null,2));
                    await context.close();
                }
            }
        }
        console.log(`PASS ${records.length} source/Kit FR/EN 1600/390 cases, geometry, form values, lifecycle and safe text.`);
    } finally { await browser.close(); }
})().catch(error=>{fs.writeFileSync(path.join(output,'failure.txt'),error.stack);console.error(error.message);process.exitCode=1;});
