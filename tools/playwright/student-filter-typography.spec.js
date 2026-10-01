const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Supervised read-only audit: view/disclosure state only, no saved filters.
test('Student filter typography and normal disclosure motion remain shared', async({page}, testInfo) => {
    test.setTimeout(180000);
    await page.emulateMedia({reducedMotion:'no-preference'});
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:1600,height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u => !u.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    const reports = [];
    for (const width of [1600,768,390,320]) {
        await page.setViewportSize({width,height:1100});
        await page.evaluate(() => document.fonts.ready);
        const views = width <= 390 ? ['participants','groups','groupings'] : [null];
        for (const view of views) {
            if (view) {
                await root.locator(`[data-easystud-mobile-view="${view}"]`).click();
                await expect(root).toHaveAttribute('data-easystud-mobile-view-active',view);
            }
            const toggles = root.locator('[data-easystud-advanced-filters-toggle]:visible');
            expect(await toggles.count()).toBeGreaterThan(0);
            for (let i=0;i<await toggles.count();i++) {
                const toggle = toggles.nth(i);
                await toggle.scrollIntoViewIfNeeded();
                const key = await toggle.getAttribute('data-easystud-advanced-filters-toggle');
                const panel = root.locator(`[data-easystud-advanced-filters="${key}"]`);
                const metrics = await toggle.evaluate(n => {
                    const s=getComputedStyle(n),r=n.getBoundingClientRect();
                    return {font:s.fontFamily,size:parseFloat(s.fontSize),weight:s.fontWeight,
                        lineHeight:parseFloat(s.lineHeight),width:r.width,height:r.height,
                        overflow:n.scrollWidth-n.clientWidth};
                });
                expect(metrics.font).toContain('EasyEdu Inter');
                expect(metrics.size).toBeCloseTo(12.16,1);
                expect(metrics.weight).toBe('400');
                expect(metrics.lineHeight).toBeCloseTo(13.376,1);
                expect(metrics.overflow).toBeLessThanOrEqual(1);
                await expect(toggle).toHaveAttribute('aria-expanded','false');
                // Observe the actual transient state before settling, not only
                // the final expanded geometry. Existing Motion stays untouched.
                await toggle.click();
                await expect(panel).toHaveClass(/is-easyedu-disclosing/);
                await expect(toggle).toHaveAttribute('aria-expanded','true');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                await expect(panel).toHaveAttribute('aria-hidden','false');
                await toggle.locator('..').screenshot({path:testInfo.outputPath(`filter-${width}-${view||'desktop'}-${key}.png`)});
                await toggle.click();
                await expect(panel).toHaveClass(/is-easyedu-disclosing/);
                await expect(toggle).toHaveAttribute('aria-expanded','false');
                await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                await expect(panel).toHaveAttribute('aria-hidden','true');
                expect(await panel.evaluate(n=>n.inert)).toBe(true);
                reports.push({viewportWidth:width,view,key,...metrics,openMotion:true,closeMotion:true});
                fs.writeFileSync(testInfo.outputPath('filter-typography.json'),JSON.stringify(reports,null,2));
            }
        }
    }
});
