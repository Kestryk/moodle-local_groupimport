const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: selection only; no membership or saved setting changes.
test('Participant metadata retains contents and responsive containment', async({page}, testInfo) => {
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
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height:1100});
        await page.evaluate(() => document.fonts.ready);
        const card = root.locator('[data-easystud-user="1"]:visible').first();
        await expect(card).toBeVisible();
        const selector = card.locator(':scope > .local-groupimport-easystud-selector');
        for (const selected of [false, true]) {
            if (await card.evaluate(n => n.classList.contains('is-selected')) !== selected) {
                await selector.click();
            }
            await expect.poll(() => card.evaluate(n => n.classList.contains('is-selected'))).toBe(selected);
            // Await native motion settling without altering its duration or classes.
            await expect.poll(() => card.evaluate(n => n.getAnimations({subtree:true})
                .filter(a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity).length)).toBe(0);
            await card.scrollIntoViewIfNeeded();
            const report = await card.evaluate(n => {
                const box = e => { const r = e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; };
                const measure = e => ({box:box(e),visible:!!e.getClientRects().length,
                    font:getComputedStyle(e).fontSize, scrollWidth:e.scrollWidth,clientWidth:e.clientWidth});
                return {card:box(n),name:measure(n.querySelector('.local-groupimport-easystud-user__name')),
                    email:measure(n.querySelector('.local-groupimport-easystud-user__email')),
                    eye:measure(n.querySelector('.local-groupimport-easystud-user__detail-button')),
                    metadata:[...n.querySelectorAll('.local-groupimport-easystud-user__meta-group')].map(row => ({
                        label:measure(row.querySelector('.local-groupimport-easystud-user__meta-label')),
                        values:measure(row.querySelector('.local-groupimport-easystud-user__meta-tags')),
                        tokens:row.querySelectorAll('.local-groupimport-easystud-user__meta-tags > *').length
                    }))};
            });
            reports.push({width,selected,...report});
            fs.writeFileSync(testInfo.outputPath('participant-metadata.json'), JSON.stringify(reports,null,2));
            await page.screenshot({path:testInfo.outputPath(`participant-${width}-${selected ? 'selected' : 'compact'}.png`)});
            expect.soft(report.metadata.length).toBeGreaterThan(0);
            for (const element of [report.name,report.email,report.eye,
                ...report.metadata.flatMap(row => [row.label,row.values])].filter(e => e.visible)) {
                expect.soft(element.box.x).toBeGreaterThanOrEqual(report.card.x - 1);
                expect.soft(element.box.x + element.box.w).toBeLessThanOrEqual(report.card.x + report.card.w + 1);
            }
        }
        await selector.click();
        await expect(card).not.toHaveClass(/is-selected/);
    }
});
