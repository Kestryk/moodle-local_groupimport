/* eslint-env node */
// Native K21-01: actual Moodle Guide, Range paint bounds, no injected CSS/HTML.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [pw, base, secretFile, output, phase = 'candidate'] = process.argv.slice(2);
assert([pw, output].every(value => value && path.isAbsolute(value)));
const credentials = require('./lib/process-credentials.cjs')(secretFile);
const url = new URL(base);
assert(['localhost', '127.0.0.1'].includes(url.hostname));
assert(['8052', '8054', '8055'].includes(url.port), 'Use the allocated test pool only');
assert(!fs.existsSync(output), 'Keep predecessor evidence immutable');
fs.mkdirSync(output, {recursive: true});
const {chromium} = require(pw);
const report = {phase, rows: [], errors: []};
const save = () => fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(report, null, 2));
(async () => {
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
    const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('pageerror', error => report.errors.push(error.message));
    try {
        const login = await context.request.get(base + '/login/index.php', {timeout: 120000});
        const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)[1];
        const response = await context.request.post(base + '/login/index.php', {form: {
            username: credentials.username, password: credentials.password, logintoken: token,
        }, maxRedirects: 0, timeout: 120000});
        assert([302, 303].includes(response.status()));
        for (const lang of ['en', 'fr']) {
            await page.setViewportSize({width: 1600, height: 1000});
            await page.goto(base + '/local/groupimport/manage.php?id=71&lang=' + lang,
                {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.waitForFunction(() =>
                document.querySelector('#local-groupimport-easystud')?.dataset.easystudSmReady === '1',
            null, {timeout: 180000});
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            await page.waitForFunction(() => document.querySelector('[data-easyedu-guide-root]')?.easyeduGuideConfig,
                null, {timeout: 180000});
            const specimen = page.locator('[data-easyedu-guide-specimen="assignment"]');
            const index = await specimen.evaluate(node => node.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
            assert.equal(Number(index), 11, 'The current Assignment specimen is slide12');
            await page.locator('[data-easyedu-guide-nav-item="' + index + '"]').first().click();
            await specimen.waitFor({state: 'visible'});
            for (const width of [1600, 1280, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                await page.evaluate(async () => {
                    await document.fonts.ready;
                    await Promise.allSettled(document.getAnimations().filter(animation =>
                        animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished));
                });
                const row = await specimen.evaluate(root => {
                    const activity = root.querySelector('.easyedu-guide-spec__activity');
                    const box = node => {
                        const r = node.getBoundingClientRect();
                        return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height};
                    };
                    const frame = box(activity), cs = getComputedStyle(activity);
                    const texts = [...activity.querySelectorAll('.easyedu-information__description')].map(node => {
                        const range = document.createRange(); range.selectNodeContents(node);
                        const paint = box(range), style = getComputedStyle(node);
                        return {text: node.textContent.trim(), paint, paragraph: box(node), whiteSpace: style.whiteSpace,
                            overflowWrap: style.overflowWrap, fontSize: style.fontSize, lineHeight: style.lineHeight,
                            overflowLeft: Math.max(0, frame.left - paint.left),
                            overflowRight: Math.max(0, paint.right - frame.right),
                            paddingEncroachment: Math.max(0, paint.right - (frame.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth))),
                            verticalOverflow: Math.max(0, paint.bottom - frame.bottom)};
                    });
                    const ancestry = []; let current = activity;
                    while (current && ancestry.length < 8) {
                        const s = getComputedStyle(current);
                        ancestry.push({tag: current.tagName, classes: current.className, whiteSpace: s.whiteSpace,
                            display: s.display, minWidth: s.minWidth, width: s.width}); current = current.parentElement;
                    }
                    return {frame, texts, ancestry};
                });
                row.lang = lang; row.width = width;
                const note = row.texts.at(-1);
                if (lang === 'en') assert.equal(note.text,
                    'Only members of the groups in this grouping can see and submit the assignment, if access is restricted to this grouping.');
                assert.equal(row.texts.length, 3);
                report.rows.push(row); save();
                if (lang === 'en' && [1600, 390].includes(width)) {
                    await page.screenshot({path: path.join(output, phase + '-en-' + width + '.png')});
                }
            }
        }
        assert.equal(report.rows.length, 8); assert.deepEqual(report.errors, []);
        if (phase !== 'before') {
            for (const row of report.rows) for (const text of row.texts) {
                assert.equal(text.overflowLeft, 0); assert.equal(text.overflowRight, 0);
                assert.equal(text.paddingEncroachment, 0); assert.equal(text.verticalOverflow, 0);
                assert.equal(text.whiteSpace, 'normal');
            }
        }
        report.status = 'PASS'; save();
    } catch (error) { report.status = 'FAIL'; report.failure = error.stack; save(); throw error; }
    finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
