/* eslint-env node */
// Authorized pool only; no settings save. Use supervised process-local credentials or a secret-file path; never a password argument.
// node this-file <Playwright-module> <pool.json> <admin-name> <password-file> <new-output-dir>
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.argv[2]);
const lease = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').replace(/^\uFEFF/, ''));
assert([8052, 8054, 8055].includes(lease.port), 'Only a leased pool copy');
assert.equal(fs.readFileSync(path.join(lease.lock, 'owner.txt'), 'utf8').replace(/^\uFEFF/, '').trim(), lease.run);
const password = process.env.EASYEDU_MOODLE_PASSWORD ||
    fs.readFileSync(process.argv[5], 'utf8').replace(/^\uFEFF/, '').trim();
const output = path.resolve(process.argv[6]);
assert(!fs.existsSync(output), 'Keep earlier evidence');
fs.mkdirSync(output, {recursive: true});
const base = `http://localhost:${lease.port}`;
const rows = [];
(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    try {
        const context = await browser.newContext();
        const login = await context.newPage();
        await login.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
        await login.locator('#username').fill(process.argv[4]);
        await login.locator('#password').fill(password);
        await Promise.all([login.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 90000, waitUntil: 'domcontentloaded'}),
            login.locator('#loginbtn').click({noWaitAfter: true})]);
        for (const lang of ['fr', 'en']) {
            for (const width of [1600, 390]) {
                const testContext = await browser.newContext({storageState: await context.storageState(),
                    viewport: {width, height: 1000}, hasTouch: width === 390});
                const page = await testContext.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
                await page.goto(base + '/admin/settings.php?section=local_groupimport&lang=' + lang,
                    {waitUntil: 'domcontentloaded', timeout: 180000});
                await page.waitForFunction(() => document.querySelector('#adminsettings')?.dataset.easyeduAdminChoices === 'ready',
                    null, {timeout: 120000});
                await page.waitForFunction(() => !window.M?.util?.pending_js?.length, null, {timeout: 120000});
                await page.evaluate(() => document.fonts.ready);
                const select = page.locator('select[name="s_local_groupimport_alloweduserfields[]"]');
                const saved = await select.evaluate(n => [...n.selectedOptions].map(o => o.value));
                await select.evaluate(n => {
                    [...n.options].forEach(option=>{option.selected=['username','email'].includes(option.value);});
                    n.dispatchEvent(new Event('change',{bubbles:true}));
                });
                const initial = await select.evaluate(n => [...n.selectedOptions].map(o => o.value));
                assert.equal(initial.length,2,'Two native identifiers in the DOM-only fixture');
                const host = select.locator('xpath=following-sibling::*[contains(@class,"easyedu-searchable-choice")]');
                assert.equal(await host.getAttribute('class').then(s => s.includes('--tagged')), true);
                const geometry = await host.evaluate(h => {
                    const box = n => {const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,
                        right:r.right,bottom:r.bottom,cx:r.x+r.width/2,cy:r.y+r.height/2};};
                    const field=h.querySelector('.easyedu-searchable-choice__field');
                    return {field:box(field),trigger:box(h.querySelector('.easyedu-searchable-choice__trigger')),
                        clear:box(h.querySelector('.easyedu-searchable-choice__clear')),
                        chips:[...h.querySelectorAll('.easyedu-selection-chip')].map(c=>{
                            const range=document.createRange();range.selectNodeContents(c.firstChild);
                            return {box:box(c),text:box(range),remove:box(c.lastChild),name:c.lastChild.getAttribute('aria-label')};})};
                });
                assert(geometry.field.h >= (width===390?44:38));
                assert(geometry.field.right <= width && geometry.field.x >= 0);
                for (const target of [geometry.trigger, geometry.clear]) {
                    assert(Math.abs(target.cy-geometry.field.cy)<=0.5);
                    assert(target.bottom<=geometry.field.bottom && target.right<=geometry.field.right);
                }
                assert.equal(geometry.chips.length,initial.length);
                for (const chip of geometry.chips) {
                    assert.equal(chip.box.h,24);assert.equal(chip.remove.h,24);
                    assert(Math.abs(chip.box.cy-chip.text.cy)<=0.5);
                    assert(Math.abs(chip.box.cy-chip.remove.cy)<=0.5);
                    assert(chip.name && chip.name.trim());
                    assert(chip.box.bottom<=geometry.field.bottom && chip.box.right<=geometry.field.right);
                }
                if (initial.length) {
                    await host.locator('.easyedu-selection-chip__remove').first().click();
                    const posted = await select.evaluate(n => new FormData(n.form).getAll(n.name));
                    assert.deepEqual(posted,initial.slice(1),'Native submitted data follows chip removal');
                    assert.equal(await host.locator('.easyedu-searchable-choice__trigger').evaluate(n=>n===document.activeElement),true);
                }
                await select.evaluate((n, values) => {
                    [...n.options].forEach(option=>{option.selected=values.includes(option.value);});
                    n.dispatchEvent(new Event('change',{bubbles:true}));
                }, saved);
                assert.deepEqual(await select.evaluate(n=>[...n.selectedOptions].map(o=>o.value)),saved);
                assert.deepEqual(errors,[]);
                rows.push({lang,width,geometry,initial,saved,errors,status:'PASS',serverWrites:0});
                fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(rows,null,2));
                await testContext.close();
            }
        }
        console.log(`PASS ${rows.length} native admin cases, no settings saved.`);
        await context.close();
    } finally { await browser.close(); }
})().catch(error => {fs.writeFileSync(path.join(output,'failure.txt'),error.stack);console.error(error.message);process.exitCode=1;});
