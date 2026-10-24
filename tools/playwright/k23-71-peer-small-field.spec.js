const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test.use({launchOptions: {executablePath: process.env.EASYSTUD_CHROME_PATH}, ignoreHTTPSErrors: true});
test('K23-71 Small field peers keep exact native height', async({page, context}) => {
    test.setTimeout(600000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(120000);
    const dir = process.env.K2371_DIR, url = new URL(process.env.EASYEDU_MOODLE_URL);
    const result = {rows: [], errors: [], requests: [], css: {before: 0, after: 0}};
    let mode = 'before';
    const save = () => fs.writeFileSync(dir + '/native.json', JSON.stringify(result, null, 2));
    page.on('pageerror', e => { result.errors.push({message: e.message, stack: e.stack}); save(); });
    await context.route('**/local/groupimport/styles/student-management.css*', r => {
        result.css[mode]++;
        return r.fulfill({contentType: 'text/css', body: fs.readFileSync(process.env[mode === 'before' ?
            'K2371_BASELINE_CSS' : 'K2371_CANDIDATE_CSS'])});
    });
    await context.route('**/api/rest/v2/user/current/preferences/**', r =>
        r.request().method() === 'POST' ? r.fulfill({contentType: 'application/json', body: '{}'}) : r.continue());
    await context.route('**/lib/ajax/service.php?*', r => {
        let calls; try { calls = r.request().postDataJSON(); } catch { /* GET reads remain native. */ }
        if (Array.isArray(calls) && calls.every(c => /^core_user_(set|update)_user_preferences?$/.test(c.methodname))) {
            return r.fulfill({contentType: 'application/json', body: JSON.stringify(calls.map(() => ({error: false, data: {}})))});
        }
        if (Array.isArray(calls) && calls.some(c => /create|delete|rename|update|set_|assign|remove/.test(c.methodname))) {
            result.requests.push({blocked: calls.map(c => c.methodname)}); save(); return r.abort();
        }
        return r.continue();
    });
    const login = await context.request.get(url.origin + '/login/index.php');
    const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
    const auth = await context.request.post(url.origin + '/login/index.php', {maxRedirects: 0, form: {
        username: process.env.EASYEDU_MOODLE_USERNAME, password: process.env.EASYEDU_MOODLE_PASSWORD, logintoken: token
    }});
    expect([302, 303]).toContain(auth.status());
    const settle = async() => {
        await page.waitForTimeout(400);
        await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.playState === 'running' &&
            Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a => a.finished.catch(() => {}))));
    };
    for (const lang of ['fr', 'en']) for (mode of ['before', 'after']) {
        url.searchParams.set('lang', lang);
        await page.setViewportSize({width: 1600, height: 1100});
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        await page.waitForSelector('#local-groupimport-easystud[data-easystud-loading-state="ready"]', {timeout: 120000});
        await page.evaluate(() => document.fonts.ready);
        for (let i = 0; i < 2; i++) {
            const close = page.locator('.drawer.show [data-action="closedrawer"]:visible').first();
            if (await close.count()) await close.click();
        }
        const welcome = page.locator('[data-easyedu-guide-welcome-dismiss]:visible').first();
        if (await welcome.count()) await welcome.click();
        for (const width of [1600, 1025, 1024, 768, 390]) {
            await page.setViewportSize({width, height: 1100}); await settle();
            const view = width > 1024 ? '[data-easystud-layout-mode="structure"]:visible' :
                '[data-easystud-mobile-view="groups"]:visible';
            await page.locator(view).first().click(); await settle();
            const measure = async(kind) => {
                const rows = await page.evaluate(kind => {
                    const root = document.querySelector('#local-groupimport-easystud');
                    const hosts = [...root.querySelectorAll(kind === 'create' ?
                        '.local-groupimport-easystud-create' : '.local-groupimport-easystud-rename__edit')];
                    return hosts.filter(h => h.checkVisibility() && !h.closest('[hidden]')).flatMap(h => {
                        const input = h.querySelector('input.form-control'), buttons = [...h.querySelectorAll('.easyedu-create-icon-button')];
                        if (!input || !input.checkVisibility()) return [];
                        const box = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return {
                            height: r.height, width: r.width, font: s.fontSize, lineHeight: s.lineHeight,
                            top: r.y, border: s.borderTopColor, background: s.backgroundColor
                        }; };
                        return buttons.filter(b => b.checkVisibility()).map(b => ({kind, input: box(input), button: box(b),
                            delta: input.getBoundingClientRect().height - b.getBoundingClientRect().height}));
                    });
                }, kind);
                result.rows.push({mode, lang, width, kind, rows}); save();
                if (mode === 'after') for (const row of rows) {
                    expect(Math.abs(row.delta)).toBeLessThan(0.02);
                    expect(row.input.height).toBeCloseTo(width <= 1024 ? 44 : 30.4, 1);
                }
            };
            await measure('create');
            for (const entity of ['group', 'grouping']) {
                if (width <= 1024 && entity === 'grouping') {
                    await page.locator('[data-easystud-mobile-view="groupings"]:visible').first().click(); await settle();
                    await measure('create');
                }
                const header = page.locator('.local-groupimport-easystud-' + entity + '__header:visible').first();
                const rename = header.locator('.local-groupimport-easystud-rename__toggle:visible').first();
                if (await rename.count()) await rename.click();
                else {
                    await header.locator('[data-easystud-card-menu]:visible').first().click(); await settle();
                    await rename.or(page.locator('[data-easystud-context-action="' + entity + '-focus-rename"]:visible')).first().click();
                }
                await settle(); await measure('rename');
                expect(await page.locator('.local-groupimport-easystud-rename__edit:visible input.form-control').count()).toBeGreaterThan(0);
                if ([1600, 768, 390].includes(width)) await page.screenshot({path: dir + '/' + mode + '-' + lang + '-' + width + '-' + entity + '.png'});
                await page.locator('.local-groupimport-easystud-rename__cancel:visible').first().click(); await settle();
                const searchSelector = entity === 'group' ? '[data-easystud-group-member-search-toggle]' : '[data-easystud-container-search-toggle]';
                const search = header.locator(searchSelector + ':visible').first();
                if (await search.count()) await search.click();
                else {
                    await header.locator('[data-easystud-card-menu]:visible').first().click(); await settle();
                    await search.or(page.locator('[data-easystud-context-action="' + (entity === 'group' ? 'group-search-members' :
                        'grouping-search-groups') + '"]:visible')).first().click();
                }
                await settle();
                const searchRows = await page.evaluate(() => [...document.querySelectorAll(
                    '#local-groupimport-easystud .local-groupimport-easystud-container-search__row')].filter(h =>
                    h.checkVisibility() && !h.closest('[hidden]')).map(h => {
                    const input = h.querySelector('input'), field = h.querySelector('.easyedu-search-field');
                    const button = h.querySelector('.easyedu-inline-search-cancel'), icon = field?.querySelector('.fa');
                    if (!input || !button) return null;
                    const r = input.getBoundingClientRect(), b = button.getBoundingClientRect(), i = icon?.getBoundingClientRect();
                    return {field: r.height, button: b.height, bottomDelta: r.bottom - b.bottom,
                        iconMode: getComputedStyle(button.querySelector('.easyedu-inline-search-cancel__label')).display === 'none',
                        iconContained: !i || i.left >= r.left && i.right <= r.right && i.top >= r.top && i.bottom <= r.bottom};
                }).filter(Boolean));
                result.rows.push({mode, lang, width, entity, kind: 'search', rows: searchRows}); save();
                if (mode === 'after') for (const row of searchRows.filter(r => r.iconMode)) {
                    expect(Math.abs(row.field - row.button)).toBeLessThan(0.02);
                    expect(Math.abs(row.bottomDelta)).toBeLessThan(0.02);
                    expect(row.iconContained).toBeTruthy();
                }
                await page.locator('.easyedu-inline-search-cancel:visible').first().click(); await settle();
            }
        }
    }
    save(); expect(result.errors).toEqual([]);
    expect(result.rows.filter(r => r.mode === 'after' && r.kind === 'create').every(r => r.rows.length > 0)).toBeTruthy();
});
