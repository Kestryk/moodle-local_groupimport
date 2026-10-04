const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised baseline; read-only bootstrap, client disclosures only.
test('More Filters feedback baseline reads native spacing and all routes', async ({page}, testInfo) => {
    test.setTimeout(240000);
    const records = [], errors = [], blocked = [], root = page.locator('#local-groupimport-easystud');
    page.on('pageerror', e => errors.push(e.message));
    const guard = async route => {
        if (route.request().method() === 'GET') await route.continue();
        else {blocked.push(route.request().method()); await route.abort('blockedbyclient');}
    };
    await page.emulateMedia({reducedMotion:'no-preference'});
    try {
        for (const width of [1600,768,390]) {
            await page.unroute('**/local/groupimport/**',guard).catch(() => undefined);
            await page.setViewportSize({width,height:1100});
            await page.goto(process.env.EASYEDU_MOODLE_URL);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(u => !u.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL);
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await page.route('**/local/groupimport/**',guard);
            const cases = width > 1024 ? [
                ['participants','participants'],['participants','participant-groups'],
                ['structure','structure-groups'],['structure','structure-groupings'],
            ] : [['participants','participants'],['groups','structure-groups'],['groupings','structure-groupings']];
            for (const [mode,key] of cases) {
                await root.locator(width > 1024 ? `[data-easystud-layout-mode="${mode}"]:visible` :
                    `[data-easystud-mobile-view="${mode}"]:visible`).click();
                const more = root.locator(`[data-easystud-advanced-filters-toggle="${key}"]:visible`).first();
                const panel = root.locator(`[data-easystud-advanced-filters="${key}"]`);
                await expect(more).toBeVisible();
                await more.hover();
                await page.waitForTimeout(180);
                const before = await more.evaluate(n => {
                    const r=n.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect(),s=getComputedStyle(n);
                    return {width:r.width,parentWidth:p.width,height:r.height,background:s.backgroundColor,
                        border:s.borderTopColor,font:s.fontSize,gap:s.gap};
                });
                if (await more.getAttribute('aria-expanded') !== 'true') await more.click();
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                expect(await panel.evaluate(n=>n.inert)).toBe(false);
                const geometry = await panel.evaluate((n,key) => {
                    const button=document.querySelector(`[data-easystud-advanced-filters-toggle="${key}"]`),
                        b=button.getBoundingClientRect(),r=n.getBoundingClientRect();
                    const controls=Array.from(n.querySelectorAll('.easyedu-searchable-choice__trigger,.easyedu-filter-toggle,.easyedu-filter-reset'))
                        .filter(c=>c.checkVisibility()).map(c=>c.getBoundingClientRect().bottom);
                    return {edgeGap:b.top-r.bottom,lastControlGap:controls.length?b.top-Math.max(...controls):null};
                },key);
                await more.click();
                await expect(more).toHaveAttribute('aria-expanded','false');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                expect(await panel.evaluate(n=>n.inert)).toBe(true);
                records.push({width,mode,key,before,geometry});
            }
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('filter-feedback-baseline.json'),JSON.stringify({records,errors,blocked},null,2));
    }
});
