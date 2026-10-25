const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME;
const password = process.env.EASYEDU_MOODLE_PASSWORD;

const openMassImport = async(page, diagnostics) => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!username || !password) {
            throw new Error('The supervised runner did not provide process-local Moodle credentials.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'), {
            waitUntil: 'domcontentloaded',
        });
    }

    const importRoot = page.locator('#local-groupimport-import');
    try {
        await expect(importRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    } catch (error) {
        const runtimeDiagnostics = await page.evaluate(() => window.__easyStudLoadingDiagnostics || []);
        throw new Error(`${error.message}\nRuntime loading diagnostics: ${JSON.stringify(runtimeDiagnostics)}\n` +
            `Page errors: ${JSON.stringify(diagnostics.pageErrors)}\n` +
            `Console errors: ${JSON.stringify(diagnostics.consoleErrors)}`);
    }
    await expect(importRoot.locator('[data-easystud-real-content]')).toBeVisible({timeout: 60000});
    return importRoot;
};

test('Mass Import replaces its legacy action rail with the shared navigation', async({page}, testInfo) => {
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });

    await page.setViewportSize({width: 1280, height: 900});
    const importRoot = await openMassImport(page, {pageErrors, consoleErrors});
    const navigation = page.locator('#local-groupimport-import-navigation');
    const navigationRegion = page.locator('[data-region="local-groupimport-import-navigation"]');
    const desktopNavigation = navigation.locator('[data-easyedu-navigation-desktop]');
    const header = importRoot.locator('.local-groupimport-import__header');

    await expect(navigationRegion).toBeVisible();
    await expect(navigation).toBeVisible();
    await expect(desktopNavigation).toBeVisible();
    await expect(importRoot.locator('.local-groupimport-import__header-actions')).toHaveCount(0);
    await expect(desktopNavigation.locator('[data-easyedu-navigation-item-id="easystud-import"] a'))
        .toHaveAttribute('aria-current', 'page');
    await expect(desktopNavigation.locator('[data-easyedu-navigation-item-id="easystud-manager"] a')).toBeVisible();
    await expect(desktopNavigation.locator('[data-easyedu-navigation-item-id="mass-import-download-template"] a'))
        .toHaveAttribute('href', /template\.php/);
    await expect(desktopNavigation.locator('[data-easyedu-navigation-item-id="mass-import-history"] button'))
        .toBeVisible();
    await expect(navigation.locator('[data-easyedu-navigation-guide-source]')).toHaveCount(0);
    await expect(navigation.locator('[data-easyedu-navigation-section="course-participants"]')).toHaveCount(0);

    const headerContract = await navigationRegion.evaluate(node =>
        node.parentElement === node.closest('.local-groupimport-import__header')
    );
    expect(headerContract).toBeTruthy();
    await expect(header).toContainText('Import history');
    await page.screenshot({
        path: testInfo.outputPath('mass-import-navigation-desktop.png'),
        fullPage: false,
    });

    await page.setViewportSize({width: 390, height: 844});
    const trigger = navigation.locator('[data-easyedu-navigation-open]');
    await expect(trigger).toBeVisible();
    const triggerGeometry = await trigger.evaluate(node => {
        const box = node.getBoundingClientRect();
        return {
            position: getComputedStyle(node).position,
            centre: box.top + box.height / 2,
            viewportCentre: window.innerHeight / 2,
        };
    });
    expect(triggerGeometry.position).toBe('fixed');
    expect(Math.abs(triggerGeometry.centre - triggerGeometry.viewportCentre)).toBeLessThanOrEqual(4);

    await trigger.click();
    const panel = navigation.locator('[data-easyedu-navigation-panel]');
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect(panel).toBeVisible();
    await expect(trigger).toBeHidden();
    await expect(panel.locator('[data-easyedu-navigation-item-id="easystud-import"] a'))
        .toHaveAttribute('aria-current', 'page');
    await expect(panel.locator('[data-easyedu-navigation-item-id="easystud-manager"] a')).toBeVisible();
    await expect(panel.locator('[data-easyedu-navigation-item-id="mass-import-download-template"] a'))
        .toHaveAttribute('href', /template\.php/);
    const compactHistory = panel.locator('[data-easyedu-navigation-item-id="mass-import-history"] button');
    await expect(compactHistory).toBeVisible();
    await page.screenshot({
        path: testInfo.outputPath('mass-import-navigation-phone.png'),
        fullPage: false,
    });

    await compactHistory.click();
    const historyModal = importRoot.locator('[data-local-groupimport-history-modal]');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(historyModal).toBeVisible();
    await historyModal.locator('[data-local-groupimport-history-close]').click();
    await expect(historyModal).toBeHidden();
    await expect(trigger).toBeFocused();

    const hasHorizontalOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(hasHorizontalOverflow).toBe(false);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
});
