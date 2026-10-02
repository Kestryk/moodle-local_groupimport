const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Student Management Foundations workspace desktop tablet and mobile', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width: 1600, height: 1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const reports = [];
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        await page.evaluate(() => document.fonts.ready);
        await expect(root.locator('.easyedu-workspace-title-control .dropdown-toggle')).toBeVisible();
        const report = await root.evaluate(node => {
            const title = node.querySelector('.easyedu-workspace-title-control .dropdown-toggle');
            const panels = [...node.querySelectorAll('.easyedu-workspace-panel')];
            const rect = n => {const b = n.getBoundingClientRect(); return {x:b.x,y:b.y,w:b.width,h:b.height};};
            return {
                font: getComputedStyle(title).fontFamily,
                titleSize: parseFloat(getComputedStyle(title).fontSize), title:rect(title),
                root:rect(node),
                overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                panels: panels.map(n => ({...rect(n),shadow:getComputedStyle(n).boxShadow})),
                participants:node.querySelectorAll('[data-easystud-user]').length,
                groups:node.querySelectorAll('[data-easystud-group-id]').length,
                navigation:!!node.querySelector('[data-easyedu-navigation]'),
            };
        });
        reports.push({width,...report});
        fs.writeFileSync(testInfo.outputPath('workspace-geometry.json'), JSON.stringify(reports,null,2));
        expect(report.font).toContain('EasyEdu Inter');
        expect(report.titleSize).toBe(width === 390 ? 22 : 28);
        expect(report.overflow).toBeLessThanOrEqual(2);
        expect(report.title.x + report.title.w).toBeLessThanOrEqual(report.root.x + report.root.w + 2);
        expect(report.participants).toBeGreaterThan(0);
        for (const panel of report.panels) expect(panel.shadow).toBe('none');
        if (width === 1600) {
            expect(Math.abs(report.panels[0].h-report.panels[1].h)).toBeLessThan(2);
            expect(Math.abs(report.panels[0].w-report.panels[1].w)).toBeLessThan(2);
        }
        // Moodle scrolls its page wrapper, not only the document. A screenshot
        // of the oversized root can centre it and clip the header. Capture the
        // real viewport after explicitly bringing the identity into view.
        await root.locator('.local-groupimport-easystud__header').scrollIntoViewIfNeeded();
        await page.screenshot({path:testInfo.outputPath(`workspace-${width}.png`)});
    }
});
