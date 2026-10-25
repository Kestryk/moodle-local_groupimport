const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('K16 strict matrix selector column and right filter footer', async ({page}, info) => {
    test.setTimeout(600000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    if (base.hostname !== 'localhost' || base.port || base.searchParams.get('id') !== '5') throw Error('Main course5 only');
    const rows = [], errors = [], writes = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/local/groupimport/ajax.php*', r => { writes.push(r.request().url()); return r.abort(); });
    await page.goto(new URL('/login/index.php', base).href, {waitUntil:'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil:'domcontentloaded'});
    }
    const root = page.locator('#local-groupimport-easystud');
    const settle = async () => {
        await root.evaluate(async n => {
            await document.fonts.ready;
            await Promise.all(n.getAnimations({subtree:true}).filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));
        });
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    const save = () => fs.writeFileSync(info.outputPath('k16-overlap.json'), JSON.stringify({rows,errors,writes,humanAccepted:false}, null, 2));
    try {
        for (const lang of ['fr','en']) for (const width of [1600,768,390]) {
            await page.setViewportSize({width,height:1000});
            const url = new URL(base); url.searchParams.set('lang',lang);
            await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
            await expect(root.locator('[data-easystud-user]').first()).toBeAttached({timeout:60000});
            await root.locator(width <= 1024 ? '[data-easystud-mobile-view="participants"]' : '[data-easystud-layout-mode="participants"]:visible').click();
            for (const density of ['initial','toggled']) {
                if (density === 'toggled') await root.locator('[data-easystud-density-toggle]').evaluate(n => n.click());
                await settle();
                const cards = await root.locator('[data-easystud-user]').evaluateAll(ns => ns.slice(0,4).map(n => {
                    const r = e => e.getBoundingClientRect(), name = r(n.querySelector('.local-groupimport-easystud-user__name'));
                    const selector = r(n.querySelector('.local-groupimport-easystud-selector')), square = r(n.querySelector('.local-groupimport-easystud-selector__ui'));
                    const eye = r(n.querySelector('.local-groupimport-easystud-user__detail-button')), menu = r(n.querySelector('.local-groupimport-easystud-card-menu'));
                    const accent = r(n.querySelector('.easyedu-card-title-accent'));
                    return {nameX:name.x, targetGap:name.x-selector.right, squareGap:name.x-square.right, accentGap:accent.x-selector.right,
                        caseDelta:square.y+square.height/2-name.y-name.height/2,
                        eyeDelta:eye.height ? eye.y+eye.height/2-name.y-name.height/2 : null,
                        menuDelta:menu.height ? menu.y+menu.height/2-name.y-name.height/2 : null,
                        textEdges:[n.querySelector('.local-groupimport-easystud-user__email'), ...n.querySelectorAll('.local-groupimport-easystud-user__meta-tags')].filter(e => e.getClientRects().length).map(e => r(e).x)};
                }));
                rows.push({lang,width,density,cards}); save();
                for (const c of cards) {
                    expect.soft(c.targetGap).toBeGreaterThanOrEqual(8); expect.soft(c.squareGap).toBeGreaterThanOrEqual(8);
                    expect.soft(c.accentGap).toBeGreaterThanOrEqual(0);
                    expect.soft(Math.abs(c.caseDelta)).toBeLessThanOrEqual(.5);
                    if(c.eyeDelta !== null) expect.soft(Math.abs(c.eyeDelta)).toBeLessThanOrEqual(.5);
                    if(c.menuDelta !== null) expect.soft(Math.abs(c.menuDelta)).toBeLessThanOrEqual(.5);
                    for(const x of c.textEdges) expect.soft(Math.abs(x-c.nameX)).toBeLessThanOrEqual(.5);
                }
            }
            for (const view of (width <= 1024 ? ['participants','groups','groupings'] : ['participants','structure'])) {
                await root.locator(width <= 1024 ? `[data-easystud-mobile-view="${view}"]` : `[data-easystud-layout-mode="${view}"]:visible`).click();
                await settle();
                for(const toggle of await root.locator('[data-easystud-advanced-filters-toggle]:visible').all()) {
                    if(await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
                }
                await settle();
                const footers = await root.locator('.local-groupimport-easystud__filters-reset:visible').evaluateAll(ns => ns.map(n => {
                    const b=n.getBoundingClientRect(), p=n.parentElement.getBoundingClientRect(), s=getComputedStyle(n.parentElement);
                    return {rightDelta:p.right-parseFloat(s.paddingRight)-b.right, width:b.width, parentWidth:p.width};
                }));
                rows.push({lang,width,view,footers}); save();
                expect.soft(footers.length).toBeGreaterThan(0);
                for(const f of footers) expect.soft(Math.abs(f.rightDelta)).toBeLessThanOrEqual(.5);
            }
        }
        expect(errors).toEqual([]); expect(writes).toEqual([]);
    } finally { save(); }
});
