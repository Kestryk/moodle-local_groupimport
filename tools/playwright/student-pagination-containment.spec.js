const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
// Resolve the optional fixture during --list discovery, before credentials or
// a runtime lease are acquired. A missing build must fail at preflight.
const candidatePath = process.env.EASYEDU_PAGINATION_CANDIDATE_CSS;
const candidateCss = candidatePath ? fs.readFileSync(candidatePath,'utf8') : null;

// Local-supervised geometry audit; no saved settings or membership changes.
test('Student pagination controls remain separated across responsive widths', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:1600, height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout:60000});
    const reports = [];
    // Optional compiled canonical fixture; removed in finally, never promoted
    // to the runtime or committed as a consumer-specific stylesheet.
    const style = candidateCss ? await page.addStyleTag({content:candidateCss}) : null;
    if (candidateCss) fs.writeFileSync(testInfo.outputPath('canonical-candidate.css'),candidateCss);
    try {
    for (const width of [1600,768,390,320]) {
        await page.setViewportSize({width,height:1100});
        await page.evaluate(() => document.fonts.ready);
        const bar = root.locator('[data-easystud-pagination="top"]:visible').first();
        await bar.scrollIntoViewIfNeeded();
        const report = await bar.evaluate(n => {
            const measure = e => {
                const r = e.getBoundingClientRect(), s = getComputedStyle(e);
                return {x:r.x,y:r.y,w:r.width,h:r.height,display:s.display,
                    padding:s.padding,border:s.border,font:s.fontSize,
                    text:e.textContent.trim(),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};
            };
            return {bar:measure(n),children:[...n.children].map(measure),
                sort:[...n.querySelectorAll('.local-groupimport-easystud-pagination__sort, .local-groupimport-easystud-pagination__sort > span, [data-easystud-list-sort-toggle]')].map(measure)};
        });
        reports.push({width,...report});
        fs.writeFileSync(testInfo.outputPath('pagination-geometry.json'),JSON.stringify(reports,null,2));
        await page.screenshot({path:testInfo.outputPath(`pagination-${width}.png`)});
        const visible = report.children.filter(c => c.w && c.h && c.display !== 'none');
        for (const c of visible) {
            expect.soft(c.x).toBeGreaterThanOrEqual(report.bar.x-1);
            expect.soft(c.x+c.w).toBeLessThanOrEqual(report.bar.x+report.bar.w+1);
        }
        for (let i=0;i<visible.length;i++) for (let j=i+1;j<visible.length;j++) {
            const a=visible[i],b=visible[j];
            const overlapX=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
            const overlapY=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
            expect.soft(Math.min(overlapX,overlapY),'pagination peers must not overlap').toBeLessThanOrEqual(1);
        }
        const controls=report.children[1];
        expect.soft(Math.abs(controls.x+controls.w/2-report.bar.x-report.bar.w/2),
            'page controls stay centred within the full bar').toBeLessThanOrEqual(1);
        const toggle=bar.locator('[data-easystud-list-sort-toggle]');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded','true');
        const menu=bar.locator('[data-easystud-list-sort-menu]');
        await expect(menu).toBeVisible();
        const menuBox=await menu.boundingBox();
        expect.soft(menuBox.x).toBeGreaterThanOrEqual(0);
        expect.soft(menuBox.x+menuBox.width).toBeLessThanOrEqual(width);
        await page.screenshot({path:testInfo.outputPath(`pagination-menu-${width}.png`)});
        await toggle.click();
        await expect(menu).toBeHidden();
        if (width <= 390) {
            for (const view of ['groups','groupings']) {
                await root.locator(`[data-easystud-mobile-view="${view}"]`).click();
                await expect(root).toHaveAttribute('data-easystud-mobile-view-active',view);
                const visibleBars=root.locator('[data-easystud-pagination]:visible');
                await expect(visibleBars.first()).toBeVisible();
                const geometry=await visibleBars.evaluateAll(nodes=>nodes.map(n=>{
                    const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
                    const children=[...n.children].map(box).filter(b=>b.w&&b.h);
                    const controls=n.querySelector('.local-groupimport-easystud-pagination__controls');
                    return {bar:box(n),children,controls:box(controls)};
                }));
                reports.push({width,view,bars:geometry});
                fs.writeFileSync(testInfo.outputPath('pagination-geometry.json'),JSON.stringify(reports,null,2));
                for (const r of geometry) {
                    expect.soft(Math.abs(r.controls.x+r.controls.w/2-r.bar.x-r.bar.w/2)).toBeLessThanOrEqual(1);
                    for (const c of r.children) {
                        expect.soft(c.x).toBeGreaterThanOrEqual(r.bar.x-1);
                        expect.soft(c.x+c.w).toBeLessThanOrEqual(r.bar.x+r.bar.w+1);
                    }
                    for(let i=0;i<r.children.length;i++)for(let j=i+1;j<r.children.length;j++){
                        const a=r.children[i],b=r.children[j];
                        expect.soft(Math.min(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),
                            Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y))).toBeLessThanOrEqual(1);
                    }
                }
                const viewToggle=root.locator('[data-easystud-list-sort-toggle]:visible').first();
                await viewToggle.click();
                await expect(viewToggle).toHaveAttribute('aria-expanded','true');
                const viewMenu=root.locator('[data-easystud-list-sort-menu]:visible').first();
                const viewMenuBox=await viewMenu.boundingBox();
                expect.soft(viewMenuBox.x).toBeGreaterThanOrEqual(0);
                expect.soft(viewMenuBox.x+viewMenuBox.width).toBeLessThanOrEqual(width);
                await page.screenshot({path:testInfo.outputPath(`pagination-${view}-${width}.png`)});
                await viewToggle.click();
            }
            await root.locator('[data-easystud-mobile-view="participants"]').click();
            await expect(root).toHaveAttribute('data-easystud-mobile-view-active','participants');
        }
    }
    } finally {
        if (style) await style.evaluate(node => node.remove());
    }
});
