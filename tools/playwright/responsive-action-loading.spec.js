const {test, expect, chromium} = require('@playwright/test');
const fs = require('fs');
const out = 'C:/dev/artifacts/responsive-action-loading-20261025';
const repo = 'C:/dev/worktrees/easystud-codex2-responsive-action-loading-20261025';

test('responsive action loading has one presentation', async () => {
    test.setTimeout(360000);
    expect(fs.readFileSync('C:/dev/tools/pool-locks/8054.lock/owner.txt', 'utf8'))
        .toContain('responsive-action-loading-25oct');
    const result = {samples: [], errors: [], http: [], intercepted: [], css: []};
    const save = () => fs.writeFileSync(out + '/native.json', JSON.stringify(result, null, 2));
    const browser = await chromium.launch({headless: true,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    try {
        for (const phase of ['before', 'after']) {
            const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
            const page = await context.newPage();
            page.setDefaultTimeout(90000);
            page.on('pageerror', e => result.errors.push(e.message));
            page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()); });
            page.on('response', r => { if (r.status() >= 400) result.http.push({status: r.status(), url: r.url().split('?')[0]}); });
            await page.route('**/local/groupimport/styles/*.css*', async route => {
                const name = new URL(route.request().url()).pathname.split('/').pop();
                const file = phase === 'before' && name === 'student-management.css'
                    ? out + '/before-student-management.css' : repo + '/styles/' + name;
                result.css.push({phase, name});
                await route.fulfill({status: 200, contentType: 'text/css', body: fs.readFileSync(file, 'utf8')});
            });
            await page.goto('http://localhost:8054/login/index.php', {waitUntil: 'domcontentloaded'});
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await Promise.all([page.waitForURL(u => !u.pathname.includes('/login/')), page.locator('#loginbtn').click()]);
            for (const lang of ['en', 'fr']) {
                await page.setViewportSize({width: 1600, height: 1000});
                await page.goto('http://localhost:8054/local/groupimport/manage.php?id=71&lang=' + lang,
                    {waitUntil: 'domcontentloaded', timeout: 120000});
                const root = page.locator('#local-groupimport-easystud[data-easystud-loading-state="ready"]');
                await root.waitFor();
                const welcome = page.locator('[data-easyedu-guide-welcome-dismiss]:visible');
                if (await welcome.count()) await welcome.first().click();
                let release;
                const hold = new Promise(resolve => { release = resolve; });
                let received;
                const pending = new Promise(resolve => { received = resolve; });
                const handler = async route => {
                    const data = new URLSearchParams(route.request().postData());
                    result.intercepted.push({phase, lang, action: data.get('action'), forwarded: false});
                    received();
                    await hold;
                    await route.fulfill({status: 200, contentType: 'application/json',
                        body: JSON.stringify({success: false, error: 'QA: request intercepted; no course changes.'})});
                };
                await page.route('**/local/groupimport/ajax.php', handler);
                try {
                    const input = page.locator('input[name="groupname"]:visible').first();
                    await input.fill('QA loading presentation probe');
                    await input.locator('..').locator('button[type="submit"]').click();
                    await pending;
                    await expect(root).toHaveClass(/is-action-busy/);
                    for (const width of [1600, 1025, 1024, 768, 390, 1600]) {
                        await page.setViewportSize({width, height: 1000});
                        await page.waitForTimeout(350);
                        const sample = await root.evaluate(e => {
                            const pseudo = p => {
                                const s = getComputedStyle(e, p);
                                return {content: s.content, display: s.display, width: s.width, animation: s.animationName,
                                    painted: s.content !== 'none' && s.content !== 'normal' && s.display !== 'none'};
                            };
                            const mobile = e.querySelector('[data-easystud-action-busy-status]');
                            return {desktopSpinner: pseudo('::after'), desktopLabel: pseudo('::before'),
                                mobile: {hidden: mobile.hidden, display: getComputedStyle(mobile).display,
                                    painted: mobile.getClientRects().length > 0 && getComputedStyle(mobile).visibility !== 'hidden'},
                                busy: e.classList.contains('is-action-busy')};
                        });
                        Object.assign(sample, {phase, lang, width});
                        result.samples.push(sample); save();
                        expect(sample.mobile.painted).toBe(width <= 1024);
                        expect(sample.desktopSpinner.painted).toBe(phase === 'before' || width > 1024);
                        expect(sample.desktopLabel.painted).toBe(sample.desktopSpinner.painted);
                    }
                } finally { release(); }
                await expect(root).not.toHaveClass(/is-action-busy/);
                await page.unroute('**/local/groupimport/ajax.php', handler);
                expect(await page.locator('[data-easystud-action-busy-status]:visible').count()).toBe(0);
            }
            await context.close();
        }
        expect(result.css.some(x => x.phase === 'before' && x.name === 'student-management.css')).toBe(true);
        expect(result.css.some(x => x.phase === 'after' && x.name === 'student-management.css')).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.http).toEqual([]);
        result.verdict = 'PASS';
    } catch (e) { result.failure = e.message; throw e; }
    finally { save(); await browser.close(); }
});
