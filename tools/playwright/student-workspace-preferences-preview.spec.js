const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised. The separately leased helper owns and restores both settings.
test('Configured two-view workspace opens Structure on desktop and Groups on mobile', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const url = process.env.EASYEDU_EASYSTUD_MANAGER_URL;
    expect(url, 'Only the supervised fixture may supply the manager URL').toBeTruthy();
    const root = page.locator('#local-groupimport-easystud');
    const records = [];
    const errors = [];
    const blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() !== 'GET') {
            blocked.push({method: route.request().method(), url: route.request().url()});
            await route.abort('blockedbyclient');
        } else {
            await route.continue();
        }
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});

    for (const width of [1600, 390]) {
        await page.setViewportSize({width, height: 1000});
        await page.goto(url);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(candidate => !candidate.pathname.includes('/login/'));
            await page.goto(url);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(root).toHaveAttribute('data-easystud-default-layout-mode', 'structure');
        await expect(root).toHaveAttribute('data-easystud-default-mobile-view', 'groups');
        const desktopModes = await root.locator('[data-easystud-layout-mode]').evaluateAll(nodes => nodes.map(node => ({
            mode: node.getAttribute('data-easystud-layout-mode'),
            pressed: node.getAttribute('aria-pressed'),
        })));
        expect(desktopModes).toEqual([
            {mode: 'participants', pressed: 'false'},
            {mode: 'structure', pressed: 'true'},
        ]);
        await expect(root.locator('[data-easystud-layout-mode="both"]')).toHaveCount(0);

        if (width > 1024) {
            await expect(root).toHaveClass(/local-groupimport-easystud--structure-focus/);
            await expect(root.locator('[data-easystud-structure-panel]')).toBeVisible();
            await expect(root.locator('[data-easystud-participants-panel]')).toBeHidden();
        } else {
            await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
            await expect(root.locator('[data-easystud-mobile-view="groups"]')).toHaveAttribute('aria-pressed', 'true');
            await expect(root.locator('[data-easystud-mobile-view="participants"]')).toHaveAttribute('aria-pressed', 'false');
            await expect(root.locator('[data-easystud-mobile-view="groupings"]')).toHaveAttribute('aria-pressed', 'false');
            await expect(root.locator('[data-easystud-structure-groups]')).toBeVisible();
        }
        records.push({width, desktopModes, activeMobileView: await root.getAttribute('data-easystud-mobile-view-active')});
    }

    expect(errors).toEqual([]);
    expect(blocked).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('workspace-preferences-native.json'), JSON.stringify({records, errors, blocked}, null, 2));
});
