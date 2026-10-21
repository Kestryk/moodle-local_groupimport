'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict');
const path = require('node:path');
// Candidate: native read-only visual gates; use only a leased pool copy.
// Args: before|after fr|en width more|steps|mi-steps|specimen playwright secret output baseURL
const [phase, lang, size, subject, pwModule, secretFile, out, base] = process.argv.slice(2);
assert(['before', 'after'].includes(phase)); assert(['fr', 'en'].includes(lang));
assert(['more', 'steps', 'mi-steps', 'specimen'].includes(subject));
assert(pwModule && secretFile && out && base, 'All candidate arguments are required');
for (const file of [pwModule, secretFile, out]) assert(path.isAbsolute(file), 'Absolute paths required');
const target = new URL(base);
assert(['localhost', '127.0.0.1'].includes(target.hostname) && ['8052', '8054', '8055'].includes(target.port),
    'Use a leased test-pool copy; never the main runtime');
const width = Number(size); assert(width >= 320);
const {chromium} = require(pwModule); fs.mkdirSync(out, {recursive: true});
const measure = e => {
    const s = getComputedStyle(e), r = e.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(e); const text = range.getBoundingClientRect();
    return {text: e.textContent.trim(), rect: r.toJSON(), color: s.color, background: s.backgroundColor,
        border: s.border, radius: s.borderRadius, padding: s.padding, font: s.font,
        marginBlockStart: s.marginBlockStart, marginBlockEnd: s.marginBlockEnd,
        centreX: (text.left + text.right - r.left - r.right) / 2,
        centreY: (text.top + text.bottom - r.top - r.bottom) / 2};
};
(async () => {
    const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const ctx = await browser.newContext({viewport: {width, height: 1100}, locale: lang === 'fr' ? 'fr-FR' : 'en-GB', hasTouch: width < 800});
    try {
        const password = fs.readFileSync(secretFile, 'utf8').trim();
        const loginPage = await ctx.request.get(base + '/login/index.php');
        const token = /name="logintoken" value="([^"]+)"/.exec(await loginPage.text())[1];
        const login = await ctx.request.post(base + '/login/index.php', {form: {username: 'admin', password, logintoken: token}, maxRedirects: 0});
        assert([302, 303].includes(login.status()));
        const page = await ctx.newPage(), errors = [];
        page.setDefaultTimeout(60000);
        page.on('pageerror', e => errors.push(e.message)); page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
        const massImport = subject === 'mi-steps';
        await page.goto(base + '/local/groupimport/' + (massImport ? 'index.php' : 'manage.php') + '?id=71&lang=' + lang,
            {waitUntil: 'domcontentloaded'});
        if (!massImport) await page.waitForFunction(() => document.querySelector('#local-groupimport-easystud')?.dataset.easystudSmReady === '1');
        const result = {phase, lang, width, subject};
        if (subject === 'more') {
            if (width < 1024) await page.locator('[data-easystud-mobile-view="groups"]:visible').click();
            const owner = page.locator('[data-easystud-group-id]:visible')
                .filter({has: page.locator('[data-easystud-long-list-action="more"]:not([hidden])')}).first();
            const more = owner.locator('[data-easystud-long-list-action="more"]').first();
            const toggle = owner.locator('[data-easystud-group-members-toggle]').first();
            const ownerElement = await owner.elementHandle();
            if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
            await more.waitFor({state: 'visible'}); await more.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
            result.more = await more.evaluate(measure);
            if (phase !== 'before') {
                const before = JSON.parse(fs.readFileSync(`${out}/before-more-${lang}-${width}.json`, 'utf8'));
                assert.equal(result.more.color, 'rgb(11, 94, 168)', 'Historical secondary blue');
                for (const key of ['font', 'padding', 'border', 'radius', 'background']) {
                    assert.equal(result.more[key], before.more[key], 'More unchanged ' + key);
                }
                for (const key of ['width', 'height']) assert.equal(result.more.rect[key], before.more.rect[key]);
                assert(Math.abs(result.more.centreX) <= 0.5 && Math.abs(result.more.centreY) <= 0.5);
            }
            result.owner = await owner.getAttribute('data-easystud-group-id');
            result.countBefore = await ownerElement.evaluate(e => [...e.querySelectorAll('[data-easystud-member-id]')]
                .filter(row => row.getClientRects().length && !row.hidden).length);
            await page.screenshot({path: `${out}/${phase}-${subject}-${lang}-${width}.png`});
            await more.click(); await page.waitForTimeout(700);
            result.countAfter = await ownerElement.evaluate(e => [...e.querySelectorAll('[data-easystud-member-id]')]
                .filter(row => row.getClientRects().length && !row.hidden).length);
            result.footerAfter = await ownerElement.evaluate(e => e.querySelector('[data-easystud-long-list-footer]').innerText);
            fs.writeFileSync(`${out}/${phase}-${subject}-${lang}-${width}.json`, JSON.stringify(result, null, 2));
            assert(result.countAfter > result.countBefore, 'More reveals real member rows');
        } else {
            if (await page.locator('[data-easyedu-guide-open]:visible').count() === 0) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const index = subject === 'steps' ? 2 : 4;
            await page.locator('[data-easyedu-guide-nav-item="' + index + '"]').first().click();
            await page.waitForTimeout(1200); await page.evaluate(() => document.fonts.ready);
            if (subject.endsWith('steps')) {
                const steps = page.locator('.easyedu-guide-slide:visible .easyedu-guide-guided-card__steps li');
                await steps.first().scrollIntoViewIfNeeded();
                result.steps = [];
                for (let i = 0; i < await steps.count(); i++) result.steps.push(await steps.nth(i).evaluate(measure));
                assert(result.steps.length > 0, 'Native invitation steps exist');
                if (phase !== 'before') {
                    if (massImport) assert(result.steps.every(s => s.background === 'rgba(0, 0, 0, 0)'), 'Mass Import remains text only');
                    else assert(result.steps.every(s => s.background !== 'rgba(0, 0, 0, 0)'), 'Step pills have a surface');
                }
            } else {
                const panel = page.locator('.easyedu-guide-slide:visible .easyedu-guide-spec--participant');
                result.panel = await panel.evaluate(measure);
                result.gaps = await panel.evaluate(e => {
                    const r = e.getBoundingClientRect(), prev = e.previousElementSibling?.getBoundingClientRect(), next = e.nextElementSibling?.getBoundingClientRect();
                    return {before: prev ? r.top - prev.bottom : null, after: next ? next.top - r.bottom : null,
                        overflowX: Math.max(0, e.scrollWidth - e.clientWidth), innerPadding: getComputedStyle(e).padding};
                });
                assert.equal(result.gaps.overflowX, 0, 'Participant specimen does not overflow');
                if (phase !== 'before') assert.equal(result.panel.marginBlockStart, '32px');
            }
            await page.screenshot({path: `${out}/${phase}-${subject}-${lang}-${width}.png`});
        }
        result.consoleErrors = errors;
        fs.writeFileSync(`${out}/${phase}-${subject}-${lang}-${width}.json`, JSON.stringify(result, null, 2));
        assert.deepEqual(errors, []); console.log(JSON.stringify(result));
    } finally {await ctx.close(); await browser.close();}
})().catch(e => {console.error(e.stack); process.exitCode = 1;});
