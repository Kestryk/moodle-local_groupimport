const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised, read-only: no membership, import, message or settings action
// is activated. Run through the saved-credentials wrapper after preview apply.
test('Student card direct actions match Foundations across responsive widths', async({page}, testInfo) => {
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
    const families = ['user__detail-button', 'group__mail-button', 'group__duplicate-button',
        'group__member-search-button', 'group__settings-button'];
    const reports = [];
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        await page.evaluate(() => document.fonts.ready);
        const eye = root.locator('.local-groupimport-easystud-user__detail-button:visible').first();
        await expect(eye).toBeVisible();
        await eye.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        await page.evaluate(() => document.activeElement?.blur());
        const report = await root.evaluate((node, names) => {
            const bounds = element => {
                const r = element.getBoundingClientRect();
                return {x:r.x, y:r.y, w:r.width, h:r.height};
            };
            return {
                rem:parseFloat(getComputedStyle(document.documentElement).fontSize),
                overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
                responsive:node.classList.contains('local-groupimport-easystud--responsive-workspace'),
                actions:names.map(name => ({name, items:[...node.querySelectorAll(
                    '.local-groupimport-easystud-' + name)].map(button => {
                    const css = getComputedStyle(button);
                    const icon = button.querySelector('.fa, .icon');
                    return {box:bounds(button), visible:!!button.getClientRects().length,
                        background:css.backgroundColor, border:css.borderTopColor,
                        icon:icon ? bounds(icon) : null};
                })})),
                menus:[...node.querySelectorAll('[data-easystud-card-menu]')]
                    .filter(button => button.getClientRects().length).length,
            };
        }, families);
        reports.push({width, ...report});
        fs.writeFileSync(testInfo.outputPath('card-actions-geometry.json'), JSON.stringify(reports, null, 2));
        expect(report.overflow).toBeLessThanOrEqual(2);
        for (const family of report.actions) {
            if (width === 1600) expect(family.items.length, family.name).toBeGreaterThan(0);
            for (const item of family.items.filter(item => item.visible)) {
                expect(Math.abs(item.box.w - 1.85 * report.rem), family.name).toBeLessThan(1);
                expect(Math.abs(item.box.h - 1.85 * report.rem), family.name).toBeLessThan(1);
                // Moodle's CSS optimizer may serialize transparent as white
                // with zero alpha. RGB channels are irrelevant at zero alpha.
                expect(item.background, family.name).toMatch(/^rgba\(\d+, \d+, \d+, 0\)$/);
                expect(item.border, family.name).toMatch(/^rgba\(\d+, \d+, \d+, 0\)$/);
                expect(item.icon, family.name).not.toBeNull();
                expect(Math.abs(item.icon.x + item.icon.w / 2 - item.box.x - item.box.w / 2)).toBeLessThan(1);
                expect(Math.abs(item.icon.y + item.icon.h / 2 - item.box.y - item.box.h / 2)).toBeLessThan(1);
            }
            if (report.responsive && family.name !== 'user__detail-button') {
                expect(family.items.filter(item => item.visible), family.name).toHaveLength(0);
            }
        }
        if (report.responsive) expect(report.menus).toBeGreaterThan(0);
        await page.screenshot({path:testInfo.outputPath(`card-actions-${width}.png`)});
        if (width === 1600) {
            await eye.hover();
            const hoverEvidence = await eye.evaluate(button => {
                const matched = [];
                const visit = rules => {
                    for (const rule of rules) {
                        if (rule.selectorText && button.matches(rule.selectorText)) {
                            const background = rule.style.getPropertyValue('background');
                            const backgroundColor = rule.style.getPropertyValue('background-color');
                            if (background || backgroundColor) matched.push({selector:rule.selectorText,
                                background, backgroundColor,
                                priority:rule.style.getPropertyPriority('background') ||
                                    rule.style.getPropertyPriority('background-color')});
                        }
                        if (rule.cssRules) visit(rule.cssRules);
                    }
                };
                for (const sheet of document.styleSheets) {
                    try { visit(sheet.cssRules); } catch (error) {
                        matched.push({inaccessibleStylesheet:sheet.href, error:error.name});
                    }
                }
                const box = button.getBoundingClientRect();
                const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
                return {hover:button.matches(':hover'), background:getComputedStyle(button).backgroundColor,
                    inlineStyle:button.getAttribute('style'), centreHit:button.contains(target), matched};
            });
            fs.writeFileSync(testInfo.outputPath('card-action-hover-cascade.json'), JSON.stringify(hoverEvidence, null, 2));
            // Keep the requirement strict, but collect the remaining independent
            // viewport checks even when this already-known hover check fails.
            await expect.soft(eye).toHaveCSS('background-color', 'rgb(247, 251, 255)');
            await page.mouse.move(0, 0);
            // Establish keyboard modality without activating a business action.
            await page.keyboard.press('Tab');
            await eye.focus();
            await expect.soft(eye).toHaveCSS('border-top-color', 'rgb(138, 188, 227)');
            expect.soft(await eye.evaluate(button => getComputedStyle(button).boxShadow)).not.toBe('none');
            await page.screenshot({path:testInfo.outputPath('card-actions-keyboard-focus.png')});
        }
    }
});
