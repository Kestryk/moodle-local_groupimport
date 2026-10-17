'use strict';
// Dedicated leased pool. Never submit import confirmation from this UI recipe.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(process.argv[2]);
const fixture = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const out = process.argv[4];
assert(path.isAbsolute(out)); fs.mkdirSync(out, {recursive: true});
const base = 'http://localhost:8052';
const report = {cases: [], errors: [], passed: false};
(async() => {
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        page.setDefaultTimeout(45000);
        page.on('pageerror', error => report.errors.push(error.message));
        page.on('console', message => {if (message.type() === 'error') report.errors.push(message.text());});
        await page.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
        await page.locator('#username').fill(fixture.ownerUsername);
        await page.locator('#password').fill(fs.readFileSync(fixture.ownerSecretFile, 'utf8').trim());
        await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded', timeout: 180000}),
            page.locator('#loginbtn').click({noWaitAfter: true})]);
        for (const language of ['fr', 'en']) for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const course = fixture.cases['10000'];
            await page.goto(`${base}/local/groupimport/index.php?id=${course.courseid}&lang=${language}`,
                {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.locator('#local-groupimport-import[data-easystud-loading-state="ready"]').waitFor({state: 'visible', timeout: 180000});
            await page.locator('[id^="filepicker-button-"]').click();
            const tab = page.getByRole('tab', {name: language === 'fr' ? 'Déposer un fichier' : 'Upload a file', exact: true});
            if (await tab.isVisible()) await tab.click();
            await page.locator('.fp-upload-form input[type="file"]').setInputFiles(course.csv);
            await page.locator('.fp-upload-btn').click();
            await page.locator('.filepicker-filename a').waitFor({state: 'visible', timeout: 120000});
            await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                page.locator('#id_submitbutton').click({noWaitAfter: true})]);
            const rows = page.locator('[data-local-groupimport-preview-row]');
            assert.equal(await rows.count(), 100);
            const form = page.locator('form[data-preview-total]');
            assert.equal(await form.getAttribute('data-preview-total'), '10000');
            await rows.nth(99).locator('input[name^="groupname["]').fill('QA edited page boundary');
            await rows.first().locator('input[type="checkbox"]').uncheck();
            await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                page.locator('button[name="previewpage"][value="1"]').click({noWaitAfter: true})]);
            assert.equal(await rows.count(), 100);
            assert.equal(await rows.first().getAttribute('data-preview-index'), '100');
            await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                page.locator('button[name="previewpage"][value="0"]').click({noWaitAfter: true})]);
            assert.equal(await rows.nth(99).locator('input[name^="groupname["]').inputValue(), 'QA edited page boundary');
            assert.equal(await rows.first().locator('input[type="checkbox"]').isChecked(), false);
            await page.locator('#local-groupimport-import[data-easystud-loading-state="ready"]').waitFor({state: 'visible', timeout: 180000});
            await page.locator('button[name="previewpage"][value="1"]').waitFor({state: 'visible'});
            const geometry = await page.locator('button[name="previewpage"]').evaluateAll(buttons => buttons.filter(b => !b.disabled).map(b => {
                const r = b.getBoundingClientRect(); const t = b.querySelector('.fa').getBoundingClientRect(); return {height: r.height, dx: (r.left+r.right-t.left-t.right)/2,
                    dy: (r.top+r.bottom-t.top-t.bottom)/2};
            }));
            assert(geometry.every(g => g.height > 20 && Math.abs(g.dx) <= .5 && Math.abs(g.dy) <= .5), JSON.stringify(geometry));
            const phpWarnings = await page.locator('[data-rel=debugging],.debuggingmessage').allTextContents();
            assert.deepEqual(phpWarnings, []);
            report.cases.push({language, width, domRows: 100, totalRows: 10000, editsPersisted: true, geometry});
            await page.screenshot({path: path.join(out, `${language}-${width}.png`)});
        }
        assert.deepEqual(report.errors, []); report.passed = true;
    } catch (error) {report.failure = error.stack; process.exitCode = 1;}
    finally {fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2)); await browser.close();}
    console.log(JSON.stringify({passed: report.passed, cases: report.cases.length, errors: report.errors.length, failure: report.failure?.split('\n')[0]}));
})();
