// K17-75 measurement: click to visible display-preferences dialog on a fresh browser context.
// Args: playwrightPath baseUrl secretPath chromePath outJson [trials] [delayMs]
const fs = require('node:fs');
const [playwrightPath, baseUrl, secretPath, chromePath, outJson, trials = '5', delay = '8000'] = process.argv.slice(2);
if (!/^http:\/\/localhost:(8052|8054|8055)$/.test(baseUrl)) { throw Error('Claude pool runtime only.'); }
const {chromium} = require(playwrightPath);
const password = fs.readFileSync(secretPath, 'utf8').trim();
const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
(async() => {
    const browser = await chromium.launch({executablePath: chromePath, headless: true});
    const seed = await browser.newContext();
    const sp = await seed.newPage();
    await sp.goto(baseUrl + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
    await sp.locator('#username').fill('claude-sm-test');
    await sp.locator('#password').fill(password);
    await Promise.all([sp.waitForURL(u => !u.pathname.endsWith('/login/index.php'), {waitUntil: 'commit', timeout: 180000}),
        sp.locator('#loginbtn').click({noWaitAfter: true})]);
    const state = await seed.storageState();
    await seed.close();
    const out = {};
    for (const width of [1600, 390]) {
        const rows = [];
        for (let i = 0; i < Number(trials) + 1; i++) { // first trial warms server caches, discarded
            const ctx = await browser.newContext({storageState: state, viewport: {width, height: width === 390 ? 844 : 1000}});
            const page = await ctx.newPage();
            const errors = [];
            page.on('pageerror', e => errors.push(e.message));
            page.on('console', m => { if (m.type() === 'error') { errors.push(m.text()); } });
            const start = Date.now();
            await page.goto(baseUrl + '/local/groupimport/manage.php?id=71&lang=fr', {waitUntil: 'load', timeout: 180000});
            const loadMs = Date.now() - start;
            await page.locator('.local-groupimport-easystud:not(.local-groupimport-easystud--booting)').waitFor({timeout: 180000});
            const readyMs = Date.now() - start;
            await page.waitForTimeout(Number(delay));
            let opener;
            if (width === 1600) {
                opener = page.locator('[data-easyedu-navigation] .easyedu-navigation__preferences-source [data-easyedu-display-open]').first();
            } else {
                await page.locator('[data-easyedu-navigation] [data-easyedu-navigation-open]').first().click();
                await page.waitForTimeout(600);
                opener = page.locator('[data-easyedu-navigation] [data-easyedu-navigation-panel] [data-easyedu-display-open]').first();
            }
            await opener.waitFor({state: 'visible'});
            await page.evaluate(() => {
                window.__t = {};
                document.addEventListener('click', e => {
                    if (e.target.closest('[data-easyedu-display-open]')) {
                        window.__t.t0 = performance.now();
                        const tick = () => {
                            const d = document.querySelector('[data-easyedu-display-dialog][open]');
                            if (d) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__t.t1 = performance.now(); })); } else { requestAnimationFrame(tick); }
                        };
                        tick();
                    }
                }, true);
            });
            await opener.click();
            await page.waitForFunction(() => window.__t.t1, null, {timeout: 60000});
            const t = await page.evaluate(() => window.__t);
            rows.push({openMs: Math.round(t.t1 - t.t0), loadMs, readyMs, dialogs: await page.locator('[data-easyedu-display-dialog]').count(), errors: errors.length});
            await ctx.close();
        }
        const kept = rows.slice(1);
        out[width] = {rows: kept, openMedian: median(kept.map(r => r.openMs)), loadMedian: median(kept.map(r => r.loadMs)), readyMedian: median(kept.map(r => r.readyMs))};
    }
    fs.writeFileSync(outJson, JSON.stringify(out, null, 1));
    console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, {open: v.openMedian, load: v.loadMedian, ready: v.readyMedian, errs: v.rows.reduce((a, r) => a + r.errors, 0)}]))));
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
