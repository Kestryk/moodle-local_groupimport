/* eslint-env node */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.EASYEDU_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.EASYEDU_MOODLE_BASE;
const output = process.env.EASYEDU_ARTIFACTS;
const phase = process.env.EASYEDU_PHASE || 'after';
const course = process.env.EASYEDU_COURSE_ID;
if (!base || new URL(base).hostname !== 'localhost' || !output || !course) {
    throw new Error('Supply an owned localhost runtime, existing course and external artifacts.');
}
const out = {phase, cases: [], errors: [], http: []};
const save = () => fs.writeFileSync(path.join(output, phase + '.json'), JSON.stringify(out, null, 2));
const media = path.join(output, 'media');
fs.mkdirSync(media, {recursive: true});
const measure = page => page.evaluate(() => {
    const rect = element => {
        const r = element.getBoundingClientRect();
        return {x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom};
    };
    const selector = '#local-groupimport-easystud .easyedu-search-field--captioned' +
        ':not(.local-groupimport-easystud-container-search__field)';
    return [...document.querySelectorAll(selector)].map(e => {
        const input = e.querySelector('input');
        const caption = e.querySelector('.easyedu-field-caption');
        const icon = e.querySelector('.fa-search');
        const style = getComputedStyle(e);
        return {visible: e.checkVisibility({opacityProperty: true, visibilityProperty: true}) &&
                e.getBoundingClientRect().width > 0,
            key: input && [...input.attributes].filter(a => a.name.startsWith('data-easystud')).map(a => a.name).join('|'),
            cls: e.className, text: caption?.textContent.trim(), placeholder: input?.placeholder,
            display: style.display, field: rect(e), parent: rect(e.parentElement), input: input && rect(input),
            icon: icon && rect(icon), caption: caption && rect(caption),
            font: getComputedStyle(input).font, padding: style.padding, border: style.borderRadius};
    });
});
const assertFields = fields => {
    const visible = fields.filter(f => f.visible && f.caption);
    assert.ok(visible.length, 'Active workspace exposes its captioned search');
    for (const f of visible) {
        assert.ok(f.field.w <= f.parent.w + 0.5, 'Field contained');
        assert.ok(f.caption.bottom <= f.input.y + 0.5, 'Caption above input');
        assert.ok(Math.abs(f.icon.y + f.icon.h / 2 - f.input.y - f.input.h / 2) <= 1, 'Icon and input one row');
        assert.ok(f.icon.right <= f.input.x + 0.5, 'Icon precedes input');
        assert.ok(f.input.right <= f.field.right + 0.5, 'Input contained');
    }
};
const assertCandidate = fields => {
    if (phase === 'after') {
        assertFields(fields);
    }
};
const testFullDetails = async(page, row) => {
    if (row.view !== 'participants' || row.width !== 1600) {
        return;
    }
    const density = page.locator('[data-easystud-density-toggle]:visible').first();
    await density.click();
    await page.waitForTimeout(1000);
    row.fullDetails = await measure(page);
    assertCandidate(row.fullDetails);
    await density.click();
    await page.waitForTimeout(600);
};
(async() => {
    const browser = await chromium.launch({headless: true,
        ...(process.env.EASYEDU_CHROME ? {executablePath: process.env.EASYEDU_CHROME} : {})});
    try {
        for (const language of ['en', 'fr']) {
            const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
            if (phase === 'before') {
                assert.ok(process.env.EASYEDU_BASELINE_CSS);
                await context.route('**/styles/student-management.css*', route => route.fulfill({
                    contentType: 'text/css', body: fs.readFileSync(process.env.EASYEDU_BASELINE_CSS, 'utf8'),
                }));
            }
            const page = await context.newPage();
            page.setDefaultTimeout(60000);
            page.setDefaultNavigationTimeout(180000);
            page.on('pageerror', e => out.errors.push({language, message: e.message}));
            page.on('response', r => {
                if (r.status() >= 400) {
                    out.http.push({language, url: r.url(), status: r.status()});
                }
            });
            const response = await context.request.get(base + '/login/index.php', {timeout: 180000});
            const token = (await response.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
            await context.request.post(base + '/login/index.php', {timeout: 180000, form: {
                username: process.env.EASYEDU_MOODLE_USERNAME, password: process.env.EASYEDU_MOODLE_PASSWORD,
                logintoken: token,
            }});
            await page.goto(base + '/local/groupimport/manage.php?id=' + course + '&lang=' + language,
                {waitUntil: 'domcontentloaded'});
            out.stage = language + ': document';
            save();
            await page.locator('#local-groupimport-easystud[data-easystud-loading-state="ready"]')
                .waitFor({timeout: 180000});
            for (const width of [1600, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                await page.waitForTimeout(600);
                const views = width > 1024 ? ['participants', 'structure'] : ['participants', 'groups', 'groupings'];
                for (const view of views) {
                    const selector = width > 1024 ? `[data-easystud-layout-mode="${view}"]:visible` :
                        `[data-easystud-mobile-view="${view}"]:visible`;
                    await page.locator(selector).first().click();
                    await page.waitForTimeout(1000);
                    const row = {language, width, view, fields: await measure(page)};
                    out.cases.push(row);
                    save();
                    assertCandidate(row.fields);
                    await testFullDetails(page, row);
                    await page.locator('#local-groupimport-easystud').scrollIntoViewIfNeeded();
                    await page.screenshot({path: path.join(media, `${phase}-${language}-${width}-${view}.png`)});
                    save();
                }
            }
            await context.close();
        }
        assert.deepEqual(out.errors, []);
        assert.deepEqual(out.http, []);
        out.passed = true;
    } finally {
        save();
        await browser.close();
    }
    process.stdout.write(JSON.stringify({phase, cases: out.cases.length, passed: out.passed}) + '\n');
})().catch(error => {
    out.failure = error.message;
    save();
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
});
