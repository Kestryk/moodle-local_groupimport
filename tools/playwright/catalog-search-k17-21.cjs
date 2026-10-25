'use strict';
// Dedicated leased-copy audit. Reads test credentials without logging them.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle/local/groupimport/tools/playwright/node_modules/playwright');
const scratch = 'C:/Users/kj220291/AppData/Local/Temp/claude/c--dev-Moodle-51-MoodleWindowsInstaller-latest-501-server-moodle/d3800829-cb31-425f-be66-3a9181257570/scratchpad';
const baseline = process.argv.includes('--baseline');
const output = path.join(__dirname, '../../docs/testing', baseline ? 'catalog-search-k17-21-baseline.json' : 'catalog-search-k17-21-results.json');
const result = {runtime: 'http://localhost:8052', baseline, cases: [], errors: []};
(async () => {
    assert(fs.readFileSync(path.join(scratch, '8052.lock/owner.txt'), 'utf8').includes('catalog-search'));
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
    try {
        const context = await browser.newContext({viewport: {width: 768, height: 1024}});
        let page = await context.newPage();
        page.setDefaultTimeout(180000);
        page.on('pageerror', error => result.errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
        await page.goto(result.runtime + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
        await page.locator('#username').fill('claude-sm-test');
        await page.locator('#password').fill(fs.readFileSync(path.join(scratch, 'claude-sm-test.secret'), 'utf8').trim());
        await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 180000, waitUntil:'domcontentloaded'}), page.locator('#loginbtn').click({noWaitAfter:true})]);
        console.log('Login committed');
        for (const lang of baseline ? ['fr'] : ['fr', 'en']) {
            for (const width of baseline ? [768] : [1600, 768, 390]) {
                await page.close();
                page = await context.newPage();
                page.setDefaultTimeout(30000);
                page.on('pageerror', error => result.errors.push(error.message));
                page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
                await page.setViewportSize({width, height: width === 390 ? 844 : 1024});
                await page.goto(result.runtime + '/local/groupimport/manage.php?id=71&lang=' + lang,
                    {waitUntil: 'domcontentloaded', timeout: 180000});
                console.log('Manager committed ' + lang + '/' + width);
                const root = page.locator('#local-groupimport-easystud');
                await page.locator('#local-groupimport-easystud[data-easystud-manager-initialised="1"]').waitFor({state: 'attached', timeout: 180000});
                console.log('Ready ' + lang + '/' + width);
                if (width < 1025) {
                    await root.locator('[data-easystud-mobile-view="groups"]').click({noWaitAfter:true});
                } else {
                    await root.locator('[data-easystud-layout-mode="structure"]').click({noWaitAfter:true});
                }
                await page.waitForTimeout(1200);
                const search = root.locator('[data-easystud-structure-group-search]');
                const record = await search.evaluate(input => {
                    const rect = node => {const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height};};
                    const host = input.closest('label');
                    const h = rect(host), i = rect(host.querySelector('.fa')), field = rect(input);
                    return {lang: document.documentElement.lang, visible: !!host.getClientRects().length && h.h > 0,
                        host:h, icon:i, field, iconCenterDelta: i.y+i.h/2-h.y-h.h/2,
                        inputCenterDelta: field.y+field.h/2-h.y-h.h/2,
                        className:host.className, display:getComputedStyle(host).display,
                        rootClass:input.closest('#local-groupimport-easystud').className};
                });
                record.width = width;
                result.cases.push(record);
                fs.writeFileSync(output, JSON.stringify(result));
                if (baseline) continue;
                assert(record.lang.startsWith(lang));
                assert(record.visible, 'Search must be visible');
                assert(Math.abs(record.iconCenterDelta) <= .5, 'Search icon centre');
                assert(Math.abs(record.inputCenterDelta) <= .5, 'Search input centre');
                assert(record.host.x >= 0 && record.host.x + record.host.w <= width, 'Search containment');
                const cards = root.locator('.local-groupimport-easystud-structure-groups__list > [data-easystud-group-id]');
                await cards.first().waitFor({state:'attached'});
                const original = await cards.count();
                assert(original > 0, 'Original catalogue has groups');
                const firstName = await cards.first().getAttribute('data-easystud-advanced-name');
                await search.fill(firstName);
                await page.waitForTimeout(700);
                record.matchVisible = await cards.evaluateAll(nodes => nodes.filter(node => node.checkVisibility()).length);
                assert(record.matchVisible > 0 && record.matchVisible <= original);
                assert((await cards.allTextContents()).length > 0);
                await search.fill('K17-21-no-match-921873');
                await page.waitForTimeout(700);
                record.noMatchVisible = await cards.evaluateAll(nodes => nodes.filter(node => node.checkVisibility()).length);
                assert.equal(record.noMatchVisible, 0);
                await search.fill('');
                await page.waitForTimeout(700);
                record.restored = await cards.count();
                assert.equal(record.restored, original);
                record.original = original;
                fs.writeFileSync(output, JSON.stringify(result));
                console.log('PASS ' + lang + '/' + width);
            }
        }
        assert.equal(result.errors.length, 0, 'Console/page errors');
        result.passed = true;
    } finally {
        fs.writeFileSync(output, JSON.stringify(result));
        await browser.close();
    }
    console.log(JSON.stringify({passed: result.passed, cases: result.cases.length, errors: result.errors.length, output}));
})().catch(error => {console.error(error.message);process.exitCode = 1;});
