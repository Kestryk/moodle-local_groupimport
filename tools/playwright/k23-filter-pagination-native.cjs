'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.EASYSTUD_ARTIFACTS;
const label = process.argv[2] || 'native';
if (!out || !path.isAbsolute(out) || !process.env.EASYSTUD_BASE_URL || !process.env.EASYSTUD_COURSE_ID ||
    !process.env.MOODLE_TEST_USER || !process.env.MOODLE_TEST_PASSWORD) throw Error('Set native course, credentials and absolute artifacts');
fs.mkdirSync(out, {recursive: true});
const report = {label, cases: [], errors: [], console: []};
const save = () => fs.writeFileSync(path.join(out, label + '.json'), JSON.stringify(report, null, 2));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async() => {
    const browser = await chromium.launch({headless: true,
        ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {})});
    try {
        const page = await browser.newPage({viewport: {width: 1600, height: 1000}});
        page.setDefaultTimeout(15000);
        page.setDefaultNavigationTimeout(180000);
        page.on('pageerror', e => { report.errors.push({message: e.message, stack: e.stack}); save(); });
        page.on('console', m => { if (m.type() === 'error') report.console.push(m.text()); });
        for (const lang of ['fr', 'en']) {
            await page.goto(process.env.EASYSTUD_BASE_URL + '/local/groupimport/manage.php?id=' +
                process.env.EASYSTUD_COURSE_ID + '&lang=' + lang, {waitUntil: 'domcontentloaded'});
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
            const widths = process.env.EASYSTUD_WIDTHS ? process.env.EASYSTUD_WIDTHS.split(',').map(Number) :
                [1600, 1400, 1350, 1300, 1250, 1200, 1150, 1100, 1050, 1000, 950, 900, 850, 800, 768, 750, 700, 650, 600, 390];
            for (const width of widths) {
                await page.setViewportSize({width, height: 1000});
                await wait(350);
                for (const close of await page.locator('.drawer.show [data-action="closedrawer"]:visible').all()) {
                    await close.click();
                    await wait(350);
                }
                if (process.env.EASYSTUD_DRAWERS && width > 1024) {
                    for (const side of ['left', 'right']) {
                        const open = page.locator('.drawer-' + side + '-toggle button:visible').first();
                        if (await open.count()) { await open.click(); await wait(350); }
                    }
                }
                for (const view of ['participants', 'groups', 'groupings']) {
                    const mode = {participants: 'both', groups: 'participants', groupings: 'structure'}[view];
                    const toggle = page.locator('[data-easystud-layout-mode="' + mode + '"]:visible');
                    if (await toggle.count()) await toggle.first().click();
                    const tab = page.locator('[data-easystud-mobile-view="' + view + '"]:visible');
                    if (await tab.count()) await tab.click();
                    await wait(350);
                    if (process.env.EASYSTUD_SELECT_ALL) {
                        const clear = page.locator('[data-easystud-clear-all-selection]:visible').first();
                        if (await clear.count()) { await clear.click(); await wait(300); }
                        const lists = {participants: '[data-easystud-participant-list]',
                            groups: width <= 1024 ? '.local-groupimport-easystud-structure-groups__list' :
                                '.local-groupimport-easystud-participant-groups__list',
                            groupings: '.local-groupimport-easystud-tree__groupings'};
                        await page.locator(lists[view] + ' [data-easystud-select-results]:visible').first().click();
                        await wait(400);
                    }
                    const openers = page.locator('[data-easystud-advanced-filters-toggle][aria-expanded="false"]:visible');
                    for (const opener of await openers.all()) {
                        if (await opener.evaluate(e => e.checkVisibility({opacityProperty: true, visibilityProperty: true}))) {
                            await opener.click();
                        }
                    }
                    await page.waitForFunction(() => !document.querySelector('#local-groupimport-easystud .is-easyedu-disclosing'));
                    await wait(200);
                    const measured = await page.evaluate(() => {
                        const root = document.querySelector('#local-groupimport-easystud');
                        const visible = e => e && e.checkVisibility({opacityProperty: true, visibilityProperty: true}) &&
                            e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
                        const rect = e => {const r = e.getBoundingClientRect(); return {x: r.x, y: r.y,
                            width: r.width, height: r.height, right: r.right, bottom: r.bottom};};
                        const overlaps = (a, b) => ({x: Math.min(a.right, b.right) - Math.max(a.x, b.x),
                            y: Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y)});
                        const filters = [...root.querySelectorAll('[data-easystud-advanced-filters]')].filter(visible).map(e => ({
                            kind: e.dataset.easystudAdvancedFilters, gap: rect(e).y - rect(e.previousElementSibling).bottom,
                            expectedGap: parseFloat(getComputedStyle(root).getPropertyValue('--easyedu-gap')) *
                                parseFloat(getComputedStyle(document.documentElement).fontSize),
                            cssMargin: getComputedStyle(e).marginBlockStart,
                        }));
                        const bars = [...root.querySelectorAll('.local-groupimport-easystud-pagination')].filter(visible).map(e => {
                            const groups = [...e.children].filter(g => visible(g) && !g.className.includes('__spacer'));
                            const conflicts = [];
                            for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
                                const o = overlaps(rect(groups[i]), rect(groups[j]));
                                if (o.x > 0.5 && o.y > 0.5) conflicts.push({a: groups[i].className, b: groups[j].className, ...o});
                            }
                            const controls = [...e.querySelectorAll('button,[data-easystud-page-label],[data-easystud-list-count]')]
                                .filter(visible).map(c => ({name: c.textContent.trim() || c.getAttribute('aria-label'),
                                    deselect: c.getAttribute('data-easystud-deselect-results') === '1',
                                    box: rect(c), outside: rect(c).x < rect(e).x - 0.5 || rect(c).right > rect(e).right + 0.5}));
                            for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
                                const o = overlaps(controls[i].box, controls[j].box);
                                if (o.x > 0.5 && o.y > 0.5) conflicts.push({a: controls[i].name, b: controls[j].name, ...o});
                            }
                            const pager = groups.find(g => g.className.includes('__controls'));
                            return {parent: e.parentElement.className, box: rect(e), display: getComputedStyle(e).display,
                                pagerCentre: pager ? rect(pager).x + rect(pager).width / 2 - rect(e).x - rect(e).width / 2 : null,
                                groups: groups.map(g => ({name: g.className, box: rect(g)})), conflicts, controls};
                        });
                        return {filters, bars};
                    });
                    report.cases.push({lang, width, view, ...measured});
                    save();
                    if (lang === 'en' && width === 1100 && view === 'groupings') {
                        await page.screenshot({path: path.join(out, label + '-1100.png')});
                    }
                }
            }
        }
        assert.equal(report.errors.length, 0, 'No JS exception');
        assert.ok(report.cases.every(c => c.bars.length), 'Every view exposes native pagination');
        for (const c of report.cases) {
            if (process.env.EASYSTUD_SELECT_ALL) assert.ok(c.bars.some(b => b.controls.some(k => k.deselect)),
                'Selected matrix must expose the actual Deselect command');
            for (const f of c.filters) assert.ok(f.gap >= f.expectedGap - 0.5,
                JSON.stringify({lang: c.lang, width: c.width, view: c.view, filter: f}));
            for (const b of c.bars) {
                assert.ok(!b.conflicts.length && b.controls.every(k => !k.outside),
                    JSON.stringify({lang: c.lang, width: c.width, view: c.view, bar: b}));
                if (b.pagerCentre !== null && ((c.width === 1600 && !process.env.EASYSTUD_DRAWERS) || c.width === 390)) {
                    assert.ok(Math.abs(b.pagerCentre) <= 0.5, 'Wide/narrow pager retains its centre');
                }
            }
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
