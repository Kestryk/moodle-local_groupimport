const {test, expect} = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const managementUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const wcagTags = [
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22a',
    'wcag22aa',
];

test.setTimeout(60000);

/**
 * Opens an authenticated plugin page and waits for its owned region.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @param {string} url Plugin URL.
 * @param {string} selector Plugin-owned region.
 * @returns {Promise<void>}
 */
const openPluginPage = async(page, url, selector) => {
    await page.goto(url);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the accessibility smoke.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
    }

    const region = page.locator(selector);
    await expect(region).toBeVisible({timeout: 60000});
    if (selector === '#local-groupimport-easystud') {
        await expect(region).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
    }
};

/**
 * Runs axe against one plugin-owned region.
 *
 * Only critical and serious findings block this first smoke. The complete
 * result remains visible in the assertion message for progressive adoption.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @param {string} selector Plugin-owned region.
 * @returns {Promise<void>}
 */
const expectNoBlockingAxeViolations = async(page, selector) => {
    const result = await new AxeBuilder({page})
        .include(selector)
        .withTags(wcagTags)
        .analyze();
    const blocking = result.violations.filter(violation =>
        violation.impact === 'critical' || violation.impact === 'serious'
    );
    const summary = blocking.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.flatMap(node => node.target),
    }));

    expect(blocking, JSON.stringify(summary, null, 2)).toEqual([]);
};

test('simplified student management has no blocking axe violations', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await openPluginPage(page, managementUrl, '#local-groupimport-easystud');
    await expectNoBlockingAxeViolations(page, '#local-groupimport-easystud');
});

test('responsive EasyStud workspace has no blocking axe violations', async({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await openPluginPage(page, managementUrl, '#local-groupimport-easystud');
    await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeVisible();
    await expectNoBlockingAxeViolations(page, '#local-groupimport-easystud');
});

test('mass import has no blocking axe violations', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await openPluginPage(page, massImportUrl, '#local-groupimport-import');
    await expectNoBlockingAxeViolations(page, '#local-groupimport-import');
});

test('non-navigation surfaces expose shared keyboard focus', async({page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await openPluginPage(page, managementUrl, '#local-groupimport-easystud');

    const renameToggle = page.locator('[data-easystud-rename-toggle]:visible').first();
    if (await renameToggle.count()) {
        await page.keyboard.press('Tab');
        await renameToggle.focus();
        await expect.poll(async() => renameToggle.evaluate(node =>
            getComputedStyle(node).borderColor
        )).toContain('138, 188, 227');
        await expect.poll(async() => renameToggle.evaluate(node => {
            const style = getComputedStyle(node);
            return style.outlineStyle !== 'none' && style.boxShadow !== 'none';
        })).toBe(true);
        await page.screenshot({
            path: testInfo.outputPath('non-navigation-focus-rename.png'),
            fullPage: false,
        });
    }

    const detailButton = page.locator('.local-groupimport-easystud-user__detail-button:visible').first();
    if (await detailButton.count()) {
        await page.keyboard.press('Tab');
        await detailButton.focus();
        await expect.poll(async() => detailButton.evaluate(node =>
            getComputedStyle(node).borderColor
        )).toContain('138, 188, 227');
        await expect.poll(async() => detailButton.evaluate(node => {
            const card = node.closest('.local-groupimport-easystud-user');
            const targetStyle = getComputedStyle(node);
            const cardStyle = card ? getComputedStyle(card) : null;
            return targetStyle.outlineStyle !== 'none' && targetStyle.boxShadow !== 'none' &&
                !!cardStyle && cardStyle.boxShadow.includes('inset') &&
                cardStyle.borderColor.includes('138, 188, 227');
        })).toBe(true);
        await page.screenshot({
            path: testInfo.outputPath('non-navigation-focus-participant.png'),
            fullPage: false,
        });

        await detailButton.click();
        const detailSummary = page.locator(
            '[data-easystud-user-modal] .local-groupimport-easystud-detail__list summary:visible'
        ).first();
        if (await detailSummary.count()) {
            await page.keyboard.press('Tab');
            await detailSummary.focus();
            await expect.poll(async() => detailSummary.evaluate(node => {
                const style = getComputedStyle(node);
                return style.outlineStyle !== 'none' && style.boxShadow !== 'none';
            })).toBe(true);
            await page.screenshot({
                path: testInfo.outputPath('non-navigation-focus-detail-summary.png'),
                fullPage: false,
            });
        }
    }

    expect(await renameToggle.count() + await detailButton.count()).toBeGreaterThan(0);
});

test('group and grouping cards expose contained keyboard focus context', async({page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await openPluginPage(page, managementUrl, '#local-groupimport-easystud');
    const root = page.locator('#local-groupimport-easystud');
    const structureMode = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
    await expect(structureMode).toBeVisible();
    await structureMode.click();

    const groupingCard = page.locator(
        '[data-easystud-tree] [data-easystud-grouping-id]:has(.local-groupimport-easystud-group):visible'
    ).first();
    await expect(groupingCard).toBeVisible();
    const groupingToggle = groupingCard.locator('[data-easystud-collapse-toggle]:visible').first();
    await expect(groupingToggle).toBeVisible();
    await page.keyboard.press('Tab');
    await groupingToggle.focus();
    await expect.poll(async() => groupingToggle.evaluate(node => {
        const card = node.closest('[data-easystud-grouping-id]');
        const targetStyle = getComputedStyle(node);
        const cardStyle = card ? getComputedStyle(card) : null;
        return targetStyle.outlineStyle !== 'none' && targetStyle.boxShadow !== 'none' &&
            !!cardStyle && cardStyle.boxShadow.includes('inset') &&
            cardStyle.borderColor.includes('138, 188, 227');
    })).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('grouping-card-focus-context.png'),
        fullPage: false,
    });

    if ((await groupingToggle.getAttribute('aria-expanded')) !== 'true') {
        await groupingToggle.click();
    }
    const nestedGroupAction = groupingCard.locator(
        '.local-groupimport-easystud-tree__children [data-easystud-group-member-search-toggle]:visible'
    ).first();
    await expect(nestedGroupAction).toBeVisible();
    await page.keyboard.press('Tab');
    await nestedGroupAction.focus();
    await expect.poll(async() => nestedGroupAction.evaluate(node => {
        const card = node.closest('.local-groupimport-easystud-group');
        const grouping = node.closest('[data-easystud-grouping-id]');
        const targetStyle = getComputedStyle(node);
        const cardStyle = card ? getComputedStyle(card) : null;
        const groupingStyle = grouping ? getComputedStyle(grouping) : null;
        return targetStyle.outlineStyle !== 'none' && targetStyle.boxShadow !== 'none' &&
            !!cardStyle && cardStyle.boxShadow.includes('inset') &&
            cardStyle.borderColor.includes('138, 188, 227') &&
            cardStyle.borderLeftColor.includes('116, 184, 146') &&
            !!groupingStyle && !groupingStyle.boxShadow.includes('inset');
    })).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('nested-group-card-focus-context.png'),
        fullPage: false,
    });
});
