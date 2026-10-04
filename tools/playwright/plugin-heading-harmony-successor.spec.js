const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised passive three-route readback, no Save/import/upload or fixtures.
test('Plugin heading roles match Mass Import across all three routes', async ({page}, testInfo) => {
    test.setTimeout(240000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    const routes = [
        {name: 'mass', path: '/local/groupimport/index.php?id=5', root: '#local-groupimport-import',
            eyebrow: '.local-groupimport-import__eyebrow', title: '.easyedu-page-title', description: '.local-groupimport-import__intro'},
        {name: 'student', path: '/local/groupimport/manage.php?id=5', root: '#local-groupimport-easystud',
            eyebrow: '.easyedu-workspace-eyebrow', title: '.easyedu-workspace-title-control .dropdown-toggle',
            description: '.easyedu-workspace-description'},
        {name: 'admin', path: '/admin/settings.php?section=local_groupimport', root: '#page-admin-setting-local_groupimport',
            eyebrow: '.local-groupimport-admin-settings__page-eyebrow',
            title: '.local-groupimport-admin-settings__page-title', description: '.local-groupimport-admin-settings__page-description'},
    ];
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            for (const route of routes) {
                const target = new URL(route.path, base).toString();
                await page.goto(target);
                if (page.url().includes('/login/')) {
                    await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                    await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                    await page.locator('#loginbtn').click();
                    await page.waitForURL(url => !url.pathname.includes('/login/'));
                    await page.goto(target);
                }
                await page.route('**/local/groupimport/**', async request => {
                    if (request.request().method() === 'GET') await request.continue();
                    else {blocked.push('plugin non-GET'); await request.abort('blockedbyclient');}
                });
                await page.route('**/admin/settings.php*', async request => {
                    if (request.request().method() === 'GET') await request.continue();
                    else {blocked.push('settings non-GET'); await request.abort('blockedbyclient');}
                });
                const root = page.locator(route.root);
                if (route.name !== 'admin') {
                    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
                }
                await expect(root.locator(route.title)).toBeVisible();
                await page.evaluate(() => document.fonts.ready);
                const roles = {};
                for (const role of ['eyebrow', 'title', 'description']) {
                    const element = root.locator(route[role]);
                    await expect(element).toHaveCount(1);
                    roles[role] = await element.evaluate(n => {
                        const s = getComputedStyle(n), r = n.getBoundingClientRect();
                        return {text: n.textContent.trim(), font: s.fontFamily, size: s.fontSize,
                            weight: s.fontWeight, line: s.lineHeight, color: s.color,
                            x: r.x, y: r.y, width: r.width, height: r.height};
                    });
                }
                const icons = await root.locator('.easyedu-icon-tile:visible, .easyedu-file-deposit__icon:visible').evaluateAll(nodes =>
                    nodes.map(n => {const r = n.getBoundingClientRect(); return {classes: n.className, width: r.width, height: r.height};}));
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
                expect(roles.eyebrow.size).toBe('10.88px');
                expect(roles.title.size).toBe('20px');
                expect(roles.description.size).toBe('14.4px');
                expect(roles.eyebrow.weight).toBe('700');
                expect(roles.title.weight).toBe('700');
                expect(roles.description.weight).toBe('400');
                expect(overflow).toBeLessThanOrEqual(2);
                const reference = records.find(record => record.width === width && record.route === 'mass');
                if (reference) {
                    for (const role of ['eyebrow', 'title', 'description']) {
                        expect(roles[role].font).toBe(reference.roles[role].font);
                        expect(roles[role].line).toBe(reference.roles[role].line);
                    }
                }
                records.push({width, route: route.name, roles, icons, overflow});
            }
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('plugin-heading-hierarchy.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
