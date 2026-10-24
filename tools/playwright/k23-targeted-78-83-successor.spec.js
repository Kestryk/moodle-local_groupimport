const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const acorn = require(process.env.EASYEDU_ACORN_MODULE || 'acorn');
test.use({launchOptions: {executablePath: process.env.EASYSTUD_CHROME_PATH}, ignoreHTTPSErrors: true});
test('K23 targeted aggregate AMD successor', async({page, context}) => {
    test.setTimeout(600000); page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(120000);
    const dir = process.env.K2378_DIR, root = process.env.K2378_ROOT, url = new URL(process.env.EASYEDU_MOODLE_URL);
    const result = {cases: [], errors: [], requests: []}; let mode = 'before';
    const save = () => fs.writeFileSync(dir + '/native.json', JSON.stringify(result, null, 2));
    const settle = async() => { await page.waitForTimeout(350); await page.evaluate(() => Promise.all(document.getAnimations()
        .filter(a => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})))); };
    page.on('pageerror', e => { result.errors.push({mode, message: e.message, stack: e.stack}); save(); });
    await context.route('**/*', async r => {
        const u = new URL(r.request().url());
        if (u.pathname.includes('/lib/requirejs.php/')) {
            const response = await r.fetch(); let body = await response.text();
            const names = ['workspace', 'group_card_controls'];
            if (names.some(name => body.includes('define("local_groupimport/local/cm/' + name + '",'))) {
                const ast = acorn.parse(body, {ecmaVersion: 'latest'});
                const replacements = ast.body.filter(n => n.expression?.callee?.name === 'define' &&
                    names.some(name => n.expression.arguments[0]?.value === 'local_groupimport/local/cm/' + name));
                for (const node of replacements.sort((a,b) => b.start-a.start)) {
                    const name = node.expression.arguments[0].value.split('/').pop();
                    const candidate = fs.readFileSync(mode === 'before' ? dir + '/before-' + name + '.min.js' :
                        root + '/amd/build/local/cm/' + name + '.min.js', 'utf8').split('//# sourceMappingURL=')[0];
                    body = body.slice(0,node.start) + candidate + '\n' + body.slice(node.end);
                    result.requests.push({mode,module:name}); save();
                }
            }
            return r.fulfill({response,body});
        }
        for (const name of ['student-management.css', 'guide.css']) if (u.pathname.endsWith('/styles/' + name)) {
            return r.fulfill({contentType: 'text/css', body: fs.readFileSync(mode === 'before' ? dir + '/before-' + name : root + '/styles/' + name)});
        }
        for (const name of ['workspace', 'group_card_controls']) if (u.pathname.includes('/local_groupimport/local/cm/' + name + '.js')) {
            result.requests.push({mode, module: name}); save();
            return r.fulfill({contentType: 'application/javascript', body: fs.readFileSync(mode === 'before' ?
                dir + '/before-' + name + '.min.js' : root + '/amd/build/local/cm/' + name + '.min.js')});
        }
        if (u.pathname.includes('/api/rest/v2/user/current/preferences/') && r.request().method() === 'POST') {
            return r.fulfill({contentType: 'application/json', body: '{}'});
        }
        if (u.pathname.includes('/lib/ajax/service.php')) {
            let calls; try { calls = r.request().postDataJSON(); } catch { /* GET reads. */ }
            if (Array.isArray(calls) && calls.every(c => /^core_user_(set|update)_user_preferences?$/.test(c.methodname))) {
                return r.fulfill({contentType: 'application/json', body: JSON.stringify(calls.map(() => ({error: false, data: {}})))});
            }
        }
        return r.continue();
    });
    const login = await context.request.get(url.origin + '/login/index.php');
    const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
    await context.request.post(url.origin + '/login/index.php', {maxRedirects: 0, form: {
        username: process.env.EASYEDU_MOODLE_USERNAME, password: process.env.EASYEDU_MOODLE_PASSWORD, logintoken: token
    }});
    try {
        for (const lang of ['fr', 'en']) for (mode of ['before', 'after']) {
            url.searchParams.set('lang', lang); await page.setViewportSize({width: 1600, height: 1100});
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('#local-groupimport-easystud[data-easystud-loading-state="ready"]', {timeout: 120000});
            await page.evaluate(() => document.fonts.ready);
            for (let i = 0; i < 2; i++) { const c = page.locator('.drawer.show [data-action="closedrawer"]:visible').first();
                if (await c.count()) await c.click(); }
            for (const width of [1600, 768, 390]) {
                await page.setViewportSize({width, height: 1100});
                await page.evaluate(() => { document.querySelector('#page').scrollTop = 0; window.scrollTo(0, 0); }); await settle();
                const toast = await page.evaluate(() => new Promise((resolve, reject) => {
                    require(['local_groupimport/easyedu_notification'], n => {
                        n.show({text: 'K23 test notification', title: 'EasyStud', closeLabel: 'Close', delay: 60000}); resolve(true);
                    }, reject);
                }));
                await settle();
                const notification = await page.locator('.easyedu-v3-banner-stack').evaluate(e => {
                    const b = e.getBoundingClientRect(); const nav = document.querySelector('.navbar.fixed-top')?.getBoundingClientRect();
                    return {x: b.x, y: b.y, width: b.width, navBottom: nav?.bottom || 0};
                });
                await page.locator('.easyedu-v3-banner__close:visible').last().click(); await settle();
                await page.evaluate(() => { document.querySelector('#page').scrollTop = 900; window.scrollTo(0, 900); }); await settle();
                const floating = page.locator('[data-easyedu-guide-floating-launcher].is-visible');
                await floating.waitFor(); await page.mouse.move(0, 0); await settle();
                const box = async() => floating.evaluate(e => { const b = e.getBoundingClientRect(), i = e.querySelector('.fa').getBoundingClientRect();
                    const label = e.querySelector('.easyedu-guide__launcher-label'); return {width: b.width, height: b.height,
                        dx: i.x + i.width / 2 - b.x - b.width / 2, dy: i.y + i.height / 2 - b.y - b.height / 2,
                        labelOpacity: getComputedStyle(label).opacity}; });
                const rest = await box(); await floating.hover(); await settle(); const hover = await box();
                await page.screenshot({path: dir + '/' + mode + '/floating-' + lang + '-' + width + '.png'});
                await page.mouse.move(0, 0); await page.evaluate(() => { document.querySelector('#page').scrollTop = 0; window.scrollTo(0, 0); }); await settle();
                const view = width > 1024 ? '[data-easystud-layout-mode="structure"]:visible' : '[data-easystud-mobile-view="groupings"]:visible';
                await page.locator(view).first().click(); await settle();
                const disclosure = await page.evaluate(() => new Promise((resolve, reject) => require([
                    'local_groupimport/local/cm/state', 'local_groupimport/local/cm/workspace'
                ], (s, w) => {
                    try {
                        const root = document.querySelector('#local-groupimport-easystud'), model = s.getOnDemandModel(root);
                        const groupings = model.raw.groupings.slice().sort((a, b) => (b.groupids || []).length - (a.groupids || []).length);
                        const target = groupings.find(g => root.querySelector('[data-easystud-grouping-id="' + g.id + '"]'));
                        const section = root.querySelector('[data-easystud-grouping-id="' + target.id + '"]');
                        const panel = section.querySelector('[data-easystud-container-search-panel]');
                        const fixture = (target.groupids || []).length < 7, saved = target.groupids;
                        // Browser-only stress fixture when the native grouping is below the long-list threshold.
                        if (fixture) target.groupids = model.raw.groups.slice(0, 7).map(g => g.id);
                        panel.hidden = true; panel.classList.remove('is-open'); section.easystudLongSearchReady = false;
                        w.ensureTreeSection(root, section);
                        const row = {grouping: target.id, groups: target.groupids.length, browserFixture: fixture,
                            hidden: panel.hidden, open: panel.classList.contains('is-open')};
                        if (fixture) target.groupids = saved;
                        resolve(row);
                    } catch (e) { reject(e); }
                }, reject)));
                result.cases.push({lang, mode, width, notification, rest, hover, disclosure}); save();
                if (width <= 1024) {
                    await page.locator('[data-easystud-mobile-view="groups"]:visible').first().click(); await settle();
                }
                const ungrouped = page.locator('.local-groupimport-easystud-tree__section--ungrouped:visible');
                if (await ungrouped.count()) {
                    const toggle = ungrouped.locator('[data-easystud-collapse-toggle]').first();
                    if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
                    await settle();
                    const search = await ungrouped.evaluate(section => {
                        const input = section.querySelector('input[type="search"]'), field = input.closest('label');
                        const panel = input.closest('[data-easystud-container-search-panel]');
                        // A sparse fixture keeps its search hidden; expose only the native disclosure for geometry.
                        panel.hidden = false; panel.classList.add('is-open');
                        const button = panel.querySelector('.easyedu-inline-search-cancel');
                        const r=field.getBoundingClientRect(),i=input.getBoundingClientRect(),b=button.getBoundingClientRect();
                        return {placeholder:input.placeholder,captioned:field.classList.contains('easyedu-search-field--captioned'),
                            fieldHeight:r.height,inputHeight:i.height,buttonHeight:b.height,visible:input.checkVisibility(),
                            iconMode:getComputedStyle(button.querySelector('.easyedu-inline-search-cancel__label')).display==='none',
                            yDelta:r.bottom-b.bottom};
                    });
                    result.searches ||= []; result.searches.push({mode,lang,width,...search}); save();
                }
                if (mode === 'after') {
                    expect(Math.abs(rest.dx)).toBeLessThanOrEqual(.5); expect(Math.abs(rest.dy)).toBeLessThanOrEqual(.5);
                    expect(notification.x).toBeCloseTo(16, 1); expect(notification.y).toBeGreaterThanOrEqual(notification.navBottom);
                    expect(hover.labelOpacity).toBe('1'); expect(disclosure.hidden).toBeTruthy(); expect(disclosure.open).toBeFalsy();
                }
            }
        }
        expect(result.errors).toEqual([]);
    } catch (e) { result.failure = {message: e.message, stack: e.stack}; save(); throw e; }
});
