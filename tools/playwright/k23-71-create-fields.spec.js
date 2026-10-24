const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test.use({launchOptions: {executablePath: process.env.EASYSTUD_CHROME_PATH}, ignoreHTTPSErrors: true});
test('K23-71 quick-create occurrences match their Small buttons', async({page, context}) => {
    test.setTimeout(300000); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(120000);
    const dir = process.env.K2371_CREATE_DIR, url = new URL(process.env.EASYEDU_MOODLE_URL);
    const result = {rows: [], errors: [], css: {before: 0, after: 0}};
    let mode = 'before';
    const save = () => fs.writeFileSync(dir + '/native.json', JSON.stringify(result, null, 2));
    page.on('pageerror', e => { result.errors.push({message: e.message, stack: e.stack}); save(); });
    await context.route('**/local/groupimport/styles/student-management.css*', r => {
        result.css[mode]++;
        return r.fulfill({contentType: 'text/css', body: fs.readFileSync(process.env[mode === 'before' ?
            'K2371_BASELINE_CSS' : 'K2371_CANDIDATE_CSS'])});
    });
    await context.route('**/api/rest/v2/user/current/preferences/**', r => r.request().method() === 'POST' ?
        r.fulfill({contentType: 'application/json', body: '{}'}) : r.continue());
    await context.route('**/lib/ajax/service.php?*', r => {
        let calls; try { calls = r.request().postDataJSON(); } catch { /* Native GET reads. */ }
        if (Array.isArray(calls) && calls.every(c => /^core_user_(set|update)_user_preferences?$/.test(c.methodname))) {
            return r.fulfill({contentType: 'application/json', body: JSON.stringify(calls.map(() => ({error: false, data: {}})))});
        }
        return r.continue();
    });
    const login = await context.request.get(url.origin + '/login/index.php');
    const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
    const auth = await context.request.post(url.origin + '/login/index.php', {maxRedirects: 0, form: {
        username: process.env.EASYEDU_MOODLE_USERNAME, password: process.env.EASYEDU_MOODLE_PASSWORD, logintoken: token
    }});
    expect([302, 303]).toContain(auth.status());
    try {
        for (const lang of ['fr', 'en']) for (mode of ['before', 'after']) {
            await page.setViewportSize({width: 1600, height: 1100}); url.searchParams.set('lang', lang);
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('#local-groupimport-easystud[data-easystud-loading-state="ready"]', {timeout: 120000});
            await page.evaluate(() => document.fonts.ready);
            for (let i = 0; i < 2; i++) {
                const close = page.locator('.drawer.show [data-action="closedrawer"]:visible').first();
                if (await close.count()) { await close.click(); await page.waitForTimeout(300); }
            }
            for (const width of [1600, 1024, 768, 390]) {
                await page.setViewportSize({width, height: 1100}); await page.waitForTimeout(300);
                const views = width > 1024 ? ['participants', 'structure'] : ['participants', 'groups', 'groupings'];
                for (const view of views) {
                    const selector = width > 1024 ? '[data-easystud-layout-mode="' + view + '"]:visible' :
                        '[data-easystud-mobile-view="' + view + '"]:visible';
                    await page.locator(selector).first().click(); await page.waitForTimeout(300);
                    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.playState === 'running' &&
                        Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a => a.finished.catch(() => {}))));
                    const expectedVisible = width > 1024 ? (view === 'participants' ? [0] : [1, 2]) :
                        (view === 'participants' ? [] : view === 'groups' ? [1] : [2]);
                    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(
                        '#local-groupimport-easystud .local-groupimport-easystud-create input.form-control')].flatMap((e, i) =>
                        e.checkVisibility({visibilityProperty: true, opacityProperty: true}) && !e.closest('[hidden]') ? [i] : [])))
                        .toEqual(expectedVisible);
                    const row = await page.evaluate(() => {
                        const root = document.querySelector('#local-groupimport-easystud');
                        const inputs = [...root.querySelectorAll('.local-groupimport-easystud-create input.form-control')];
                        return {language: document.documentElement.lang, total: inputs.length, fields: inputs.map((input, occurrence) => {
                            const form = input.closest('form'), button = form.querySelector('.easyedu-create-icon-button');
                            const visible = input.checkVisibility({visibilityProperty: true, opacityProperty: true}) && !input.closest('[hidden]');
                            const f = input.getBoundingClientRect(), b = button.getBoundingClientRect();
                            return {occurrence, name: input.name, placeholder: input.placeholder, accessibleName: input.getAttribute('aria-label'),
                                caption: !!form.querySelector('.easyedu-field-caption'), visible, field: f.height, button: b.height,
                                delta: f.height - b.height, fieldFont: getComputedStyle(input).fontSize};
                        })};
                    });
                    result.rows.push({mode, lang, width, view, ...row}); save();
                    expect(row.total).toBe(3); expect(row.language.startsWith(lang)).toBeTruthy();
                    for (const p of row.fields) { expect(p.caption).toBeFalsy(); expect(p.placeholder).toBeTruthy();
                        expect(p.accessibleName).toBe(p.placeholder); }
                    if (mode === 'after') for (const p of row.fields.filter(f => f.visible)) {
                        expect(Math.abs(p.delta)).toBeLessThan(.02); expect(p.field).toBeCloseTo(width <= 1024 ? 44 : 30.4, 1);
                    }
                    if ([1600, 768, 390].includes(width) && row.fields.some(f => f.visible)) {
                        await page.locator('.local-groupimport-easystud-create:visible').first().scrollIntoViewIfNeeded();
                        await page.screenshot({path: dir + '/' + mode + '-' + lang + '-' + width + '-' + view + '.png'});
                    }
                }
            }
        }
        expect(result.errors).toEqual([]);
        const observed = new Set(result.rows.filter(r => r.mode === 'after').flatMap(r => r.fields.filter(f => f.visible).map(f => f.occurrence)));
        expect([...observed].sort()).toEqual([0, 1, 2]); save();
    } catch (e) { result.failure = {message: e.message, stack: e.stack}; save(); throw e; }
});
