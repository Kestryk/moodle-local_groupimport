'use strict';

// Prepared native course only; opens menus but never invokes a business action.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.EASYSTUD_ARTIFACTS;
const base = process.env.EASYSTUD_BASE_URL;
const course = process.env.EASYSTUD_COURSE_ID;
const label = process.argv[2] || 'native';
if (!out || !path.isAbsolute(out) || !base || !course || !process.env.MOODLE_TEST_USER ||
    !process.env.MOODLE_TEST_PASSWORD) throw Error('Set absolute EASYSTUD_ARTIFACTS, BASE_URL, COURSE_ID and MOODLE_TEST_USER/PASSWORD');
fs.mkdirSync(out, {recursive: true});
const report = {label, cases: [], errors: [], console: []};
const save = () => fs.writeFileSync(path.join(out, label + '.json'), JSON.stringify(report, null, 2));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async() => {
    const browser = await chromium.launch({headless: true,
        ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {})});
    try {
        const page = await browser.newPage({viewport: {width: 1300, height: 1000}});
        page.setDefaultNavigationTimeout(180000);
        page.on('pageerror', e => { report.errors.push({message: e.message, stack: e.stack}); save(); });
        page.on('console', m => { if (m.type() === 'error') report.console.push(m.text()); });
        for (const lang of ['fr', 'en']) {
            await page.goto(base + '/local/groupimport/manage.php?id=' + course + '&lang=' + lang,
                {waitUntil: 'domcontentloaded'});
            if (await page.locator('#username').count()) {
                await page.locator('#username').fill(process.env.MOODLE_TEST_USER);
                await page.locator('#login input[type=password]').fill(process.env.MOODLE_TEST_PASSWORD);
                await Promise.all([page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'commit'}),
                    page.locator('#loginbtn').click({noWaitAfter: true})]);
            }
            await page.waitForFunction(() => document.querySelector('#local-groupimport-easystud')?.dataset
                .easystudLoadingState === 'ready', null, {timeout: 240000});
            const later = page.locator('[data-easyedu-guide-welcome-dismiss]:visible');
            if (await later.count()) await later.click();
            for (const width of [1600, 1300, 1100, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                await wait(600);
                for (const close of await page.locator('.drawer.show [data-action="closedrawer"]:visible').all()) {
                    await close.click();
                    await wait(400);
                }
                const both = page.locator('[data-easystud-layout-mode="both"]:visible');
                if (await both.count()) await both.first().click();
                const tab = page.locator('[data-easystud-mobile-view="participants"]:visible');
                if (await tab.count()) await tab.click();
                if (width > 1024) {
                    const openCourseIndex = page.locator('.drawer-left-toggle button:visible').first();
                    if (await openCourseIndex.count()) await openCourseIndex.click();
                }
                await wait(500);
                const card = page.locator('[data-easystud-user]:visible').first();
                const checked = await card.locator('[data-easystud-selector-input]').isChecked();
                if (!checked) await card.locator('.local-groupimport-easystud-selector').first().click();
                await wait(500);
                const toggle = page.locator('[data-easystud-participants-panel] [data-easystud-panel-actions-toggle]:visible').first();
                const row = {lang, width, items: []};
                report.cases.push(row);
                if (!(await toggle.count())) { row.result = 'No overflow trigger rendered'; save(); continue; }
                await toggle.click();
                await wait(450);
                const menu = page.locator('[data-easystud-participants-panel] [data-easystud-panel-actions-menu]:visible').first();
                row.items = await menu.locator('.btn').evaluateAll(buttons => buttons.map(b => {
                    const icon = b.querySelector('.fa');
                    const text = [...b.children].find(e => e !== icon && e.textContent.trim());
                    const s = getComputedStyle(b);
                    if (!icon || !text) return {text: b.textContent.trim(), missingAnatomy: true};
                    const r = document.createRange();
                    r.selectNodeContents(text);
                    const ink = r.getBoundingClientRect();
                    return {text: b.textContent.trim(), addToGroup: b.hasAttribute('data-easystud-move-selected-participants'),
                        display: s.display, gap: s.columnGap, token: s.getPropertyValue('--easyedu-action-icon-gap').trim(),
                        inkGap: ink.left - icon.getBoundingClientRect().right, font: s.fontSize,
                        overflow: b.scrollWidth - b.clientWidth, html: b.outerHTML};
                }));
                if (lang === 'en' && width === 1300) await menu.screenshot({path: path.join(out, label + '.png')});
                save();
                await toggle.click();
                await wait(300);
            }
        }
        assert.equal(report.errors.length, 0, 'No JS exception');
        for (const lang of ['fr', 'en']) assert.ok(report.cases.some(c => c.lang === lang && c.items.some(i => i.addToGroup)),
            'Actual Add to group entry must be rendered in each locale');
        for (const row of report.cases) for (const item of row.items) {
            assert.ok(!item.missingAnatomy && parseFloat(item.gap) > 0 && item.inkGap >= parseFloat(item.gap) - 0.5 &&
                item.overflow <= 0.5, JSON.stringify({lang: row.lang, width: row.width, item}));
        }
    } catch (e) {
        report.failure = {message: e.message, stack: e.stack};
        process.exitCode = 1;
    } finally {
        save();
        await browser.close();
        console.log(JSON.stringify({cases: report.cases.length, errors: report.errors.length, failure: report.failure}));
    }
})();
