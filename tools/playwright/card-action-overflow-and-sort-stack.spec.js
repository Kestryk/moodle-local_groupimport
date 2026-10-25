const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this scenario.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    return root;
};

test('Sort and responsive card actions keep one visible menu owner', async({page}, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({width: 768, height: 900});
    const root = await login(page);

    const groupsView = root.locator('[data-easystud-mobile-view="groups"]');
    if (await groupsView.isVisible()) {
        await groupsView.click();
    }

    const group = root.locator(
        '[data-easystud-group-id]:visible:has([data-easystud-list-sort-dropdown])'
    ).first();
    await expect(group).toBeVisible();

    const memberToggle = group.locator(':scope > [data-easystud-group-members-toggle]:visible');
    if (await memberToggle.count() && (await memberToggle.getAttribute('aria-expanded')) !== 'true') {
        await memberToggle.click();
    }
    const sortToggle = group.locator('[data-easystud-list-sort-toggle]:visible').first();
    const sortMenu = group.locator('[data-easystud-list-sort-menu]').first();
    await expect(sortToggle).toBeVisible();
    await sortToggle.click();
    await expect(sortMenu).toBeVisible();
    await expect(group).toHaveClass(/is-sort-menu-open/);

    const sortBounds = await Promise.all([
        group.evaluate(node => node.getBoundingClientRect().toJSON()),
        sortMenu.evaluate(node => node.getBoundingClientRect().toJSON()),
    ]);
    expect(sortBounds[1].left).toBeGreaterThanOrEqual(sortBounds[0].left - 1);
    expect(sortBounds[1].right).toBeLessThanOrEqual(sortBounds[0].right + 1);
    await page.screenshot({path: testInfo.outputPath('group-sort-menu-above-members.png')});
    await sortToggle.click();

    const actionGroup = root.locator(
        '[data-easystud-group-id]:visible:has([data-easystud-group-actions-toggle]:visible)'
    ).first();
    const actionToggle = actionGroup.locator('[data-easystud-group-actions-toggle]:visible').first();
    const localMenu = actionGroup.locator('[data-easystud-group-actions-menu]').first();
    await actionToggle.click();
    await expect(localMenu).toBeVisible();
    await expect(root.locator('[data-easystud-context-menu]:not([hidden])')).toHaveCount(0);

    const overflowState = await actionGroup.evaluate(node => ({
        sources: node.querySelectorAll('.is-easystud-card-action-overflow').length,
        menuItems: node.querySelectorAll('[data-easystud-group-actions-menu] ' +
            '.local-groupimport-easystud-group__actions-menu-item').length,
    }));
    expect(overflowState.sources).toBeGreaterThan(0);
    expect(overflowState.menuItems).toBe(overflowState.sources);
    await page.screenshot({path: testInfo.outputPath('single-card-action-overflow-menu.png')});
});
