/* eslint-env node */
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('developer debug pages use guarded URLs and JSON bootstrap on 8051', async({page}, info) => {
    test.setTimeout(300000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    if (base.origin !== 'http://localhost:8051') {
        throw Error('Only the isolated 8051 copy is authorised');
    }
    const result = {origin: base.origin, debugDeveloper: true, pages: [], consoleErrors: [], pageErrors: []};
    const save = () => fs.writeFileSync(info.outputPath('debug-notices-results.json'), JSON.stringify(result, null, 2));
    page.on('console', message => {
        if (message.type() === 'error') {
            result.consoleErrors.push(message.text()); save();
        }
    });
    page.on('pageerror', error => { result.pageErrors.push(error.message); save(); });
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(90000);
    await page.goto(base.href, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await Promise.all([
            page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit'}),
            page.locator('#loginbtn').click({noWaitAfter: true}),
        ]);
    }
    for (const lang of ['fr', 'en']) {
        for (const [kind, path] of [
            ['manager', '/local/groupimport/manage.php?id=5'],
            ['import', '/local/groupimport/index.php?id=5'],
            ['settings', '/admin/settings.php?section=local_groupimport'],
            ['otherSettings', '/admin/settings.php?section=manageauths'],
        ]) {
            const url = new URL(path, base.origin);
            url.searchParams.set('lang', lang);
            const response = await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            const row = {kind, lang, status: response.status()};
            row.debugDeveloper = await page.evaluate(() => window.M?.cfg?.developerdebug);
            expect(row.debugDeveloper).toBe(true);
            result.pages.push(row); save();
            expect(row.status).toBe(200);
            if (kind === 'manager') {
                const root = page.locator('#local-groupimport-easystud');
                await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 90000});
                await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1');
                row.bootstrap = await page.locator('#easystud-page-config').evaluate(node => {
                    const config = JSON.parse(node.textContent);
                    const guide = document.querySelector('[data-easyedu-guide-root]');
                    return {
                        initialized: node.dataset.initialized,
                        guideArgumentBytes: JSON.stringify(config.guide).length,
                        managerArgumentBytes: JSON.stringify(config.manager).length,
                        guideLoaded: !!guide?.easyeduGuideConfig,
                        participantCards: document.querySelectorAll('[data-easystud-user]').length,
                    };
                });
                expect(row.bootstrap.initialized).toBe('1');
                expect(row.bootstrap.guideArgumentBytes).toBeGreaterThan(1024);
                expect(row.bootstrap.guideLoaded).toBe(true);
                expect(row.bootstrap.participantCards).toBeGreaterThan(0);
            } else if (kind === 'import') {
                await expect(page.locator('#local-groupimport-import')).toHaveAttribute(
                    'data-easystud-loading-state', 'ready', {timeout: 90000});
            } else if (kind === 'settings') {
                await expect(page.locator('body')).not.toHaveClass(/local-groupimport-admin-settings-page--loading/,
                    {timeout: 90000});
                await expect(page.locator('link[href*="/styles/administration.css"]')).toHaveCount(1);
            } else {
                await expect(page.locator('link[href*="/styles/administration.css"]')).toHaveCount(0);
            }
            row.debugNotices = await page.locator('[data-rel="debugging"], .debuggingmessage, .phpdebugmessage').count();
            row.bodyHasDebugMessage = /Too much data passed as arguments|This page did not call|Notice:|Warning:/.test(
                await page.locator('body').innerText());
            save();
            expect(row.debugNotices).toBe(0);
            expect(row.bodyHasDebugMessage).toBe(false);
            expect(result.consoleErrors).toEqual([]);
            expect(result.pageErrors).toEqual([]);
        }
    }
    result.pass = true; save();
});
