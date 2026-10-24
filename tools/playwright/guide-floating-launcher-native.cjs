/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.EASYEDU_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.EASYEDU_MOODLE_BASE;
const course = process.env.EASYEDU_COURSE_ID;
const output = process.env.EASYEDU_ARTIFACTS;
if (!base || !course || !output || new URL(base).hostname !== 'localhost') {
    throw new Error('Supply an owned localhost runtime, course and external artifact directory.');
}
const media = path.join(output, 'media');
fs.mkdirSync(media, {recursive: true});
const report = {cases: [], errors: [], console: [], http: []};
const save = () => fs.writeFileSync(path.join(output, 'native.json'), JSON.stringify(report, null, 2));
const assertSlide = (index, facts) => {
    if (index === 7) {
        assert.ok(facts.start && facts.compare && facts.start.bottom <= facts.compare.y);
    } else {
        assert.ok(facts.search && facts.magnifier);
        assert.ok(facts.magnifier.x >= facts.search.x && facts.magnifier.right <= facts.search.right);
        assert.ok(facts.magnifier.y >= facts.search.y && facts.magnifier.bottom <= facts.search.bottom);
    }
};
const scroll = (page, value) => page.evaluate(y => {
    document.querySelector('#page').scrollTop = y;
    window.scrollTo(0, y);
}, value);
const box = page => page.locator('[data-easyedu-guide-floating-launcher]').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const icon = element.querySelector('.fa').getBoundingClientRect();
    const style = getComputedStyle(element);
    return {x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right,
        opacity: Number(style.opacity), visibility: style.visibility, disabled: element.disabled,
        transform: style.transform, duration: style.transitionDuration, radius: style.borderRadius,
        gradient: style.backgroundImage, icon: {width: icon.width, height: icon.height,
            dx: icon.x + icon.width / 2 - rect.x - rect.width / 2,
            dy: icon.y + icon.height / 2 - rect.y - rect.height / 2},
        aria: element.getAttribute('aria-label'), scroll: document.querySelector('#page').scrollTop,
        focused: document.activeElement === element};
});
(async() => {
    const browser = await chromium.launch({headless: true,
        ...(process.env.EASYEDU_CHROME ? {executablePath: process.env.EASYEDU_CHROME} : {})});
    try {
        for (const language of ['en', 'fr']) {
            const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
            const page = await context.newPage();
            page.setDefaultTimeout(60000);
            page.setDefaultNavigationTimeout(180000);
            page.on('pageerror', error => report.errors.push({language, message: error.message}));
            page.on('console', message => {
                if (message.type() === 'error') {
                    report.console.push({language, message: message.text()});
                }
            });
            page.on('response', response => {
                if (response.status() >= 400) {
                    report.http.push({language, status: response.status(), url: response.url()});
                }
            });
            const login = await context.request.get(base + '/login/index.php', {timeout: 180000});
            const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
            await context.request.post(base + '/login/index.php', {timeout: 180000, form: {
                username: process.env.EASYEDU_MOODLE_USERNAME,
                password: process.env.EASYEDU_MOODLE_PASSWORD, logintoken: token,
            }});
            await page.goto(base + '/local/groupimport/manage.php?id=' + course + '&lang=' + language,
                {waitUntil: 'domcontentloaded'});
            await page.locator('#local-groupimport-easystud[data-easystud-loading-state="ready"]')
                .waitFor({timeout: 180000});
            for (const end of await page.locator('[data-role="end"]:visible').all()) {
                await end.click();
            }
            for (const width of [1600, 768, 390]) {
                const row = {language, width};
                report.cases.push(row);
                await page.setViewportSize({width, height: 1000});
                await scroll(page, 0);
                await page.waitForTimeout(500);
                row.initial = await box(page);
                assert.equal(row.initial.visibility, 'hidden');
                assert.equal(row.initial.disabled, true);
                if (width < 1024) {
                    await page.locator('[data-easyedu-navigation-open]:visible').click();
                }
                const normal = page.locator('[data-easyedu-guide-open]:visible').first();
                await normal.click();
                const modal = page.locator('[data-easyedu-guide-modal]:visible');
                await modal.waitFor();
                await page.locator('[data-easyedu-guide-close]:visible').click();
                await modal.waitFor({state: 'hidden'});
                if (await page.locator('[data-easyedu-navigation-close]:visible').count()) {
                    await page.locator('[data-easyedu-navigation-close]:visible').click();
                    await page.waitForTimeout(350);
                }
                row.normalOpenClose = true;
                await page.screenshot({path: path.join(media, `top-${language}-${width}.png`)});
                await scroll(page, 850);
                row.frames = [];
                for (let i = 0; i < 8; i++) {
                    await page.waitForTimeout(40);
                    row.frames.push(await box(page));
                }
                row.floating = await box(page);
                assert.equal(row.floating.disabled, false);
                assert.equal(row.floating.width, 48);
                assert.equal(row.floating.height, 48);
                assert.equal(row.floating.opacity, 1);
                assert.equal(row.floating.icon.width, 24);
                assert.equal(row.floating.icon.height, 24);
                assert.ok(Math.abs(row.floating.icon.dx) <= 0.01 && Math.abs(row.floating.icon.dy) <= 0.01);
                assert.ok(row.floating.right <= width && row.floating.y >= 60);
                await page.screenshot({path: path.join(media, `floating-${language}-${width}.png`)});
                await page.locator('[data-easyedu-guide-floating-launcher]').click();
                await modal.waitFor();
                row.guideRegressions = [];
                for (const index of [7, 8]) {
                    const pill = page.locator(`[data-easyedu-guide-nav-item="${index}"]`);
                    await pill.evaluate(element => element.scrollIntoView({block: 'nearest', inline: 'center'}));
                    await page.waitForTimeout(300);
                    await pill.click();
                    await page.waitForTimeout(500);
                    const facts = await page.locator(`[data-easyedu-guide-slide="${index}"]`).evaluate(slide => {
                        const rect = element => {
                            const r = element?.getBoundingClientRect();
                            return r ? {x: r.x, y: r.y, width: r.width, height: r.height,
                                right: r.right, bottom: r.bottom} : null;
                        };
                        return {start: rect(slide.querySelector('[data-guide-scene-command="start"]')),
                            compare: rect(slide.querySelector('[data-guide-modes]')),
                            search: rect(slide.querySelector('.easyedu-search-field')),
                            magnifier: rect(slide.querySelector('.easyedu-search-field .fa-search'))};
                    });
                    assertSlide(index, facts);
                    row.guideRegressions.push({index, ...facts, passed: true});
                }
                await page.locator('[data-easyedu-guide-close]:visible').click();
                await modal.waitFor({state: 'hidden'});
                await page.waitForTimeout(350);
                row.returned = await box(page);
                assert.equal(row.returned.focused, true);
                assert.ok(Math.abs(row.returned.scroll - row.floating.scroll) <= 0.5);
                if (width === 390) {
                    await page.emulateMedia({reducedMotion: 'reduce'});
                    await page.waitForTimeout(250);
                    row.reduced = await box(page);
                    assert.equal(row.reduced.transform, 'none');
                    assert.ok(row.reduced.duration.split(',').every(value => parseFloat(value) <= 0.12));
                    await page.emulateMedia({reducedMotion: 'no-preference'});
                }
                await scroll(page, 0);
                await page.waitForTimeout(400);
                row.topAgain = await box(page);
                assert.equal(row.topAgain.visibility, 'hidden');
                assert.equal(row.topAgain.disabled, true);
                row.passed = true;
                save();
            }
            await context.close();
        }
        assert.deepEqual(report.errors, []);
        assert.deepEqual(report.console, []);
        assert.deepEqual(report.http, []);
        report.passed = true;
    } finally {
        save();
        await browser.close();
    }
    process.stdout.write(JSON.stringify({cases: report.cases.length, passed: report.passed}) + '\n');
})().catch(error => {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
});
