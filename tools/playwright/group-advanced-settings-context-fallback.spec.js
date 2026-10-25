const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const rootSelector = '#local-groupimport-easystud';

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this responsive scenario.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }

    const root = page.locator(rootSelector);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    return root;
};

test('responsive Group menu falls back to Group details without duplicating a direct cog', async({page}) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 390, height: 900});
    const root = await login(page);
    const contextMenu = root.locator('[data-easystud-context-menu]');
    const advancedAction = contextMenu.locator(
        '[data-easystud-context-action="group-open-advanced-settings"]'
    );

    await page.locator('[data-easystud-mobile-view="groupings"]').click();
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groupings');
    const grouping = root.locator(
        '[data-easystud-tree] [data-easystud-grouping-id]:has(.local-groupimport-easystud-group):visible'
    ).first();
    const groupingToggle = grouping.locator(
        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
    );
    if ((await groupingToggle.getAttribute('aria-expanded')) !== 'true') {
        await groupingToggle.click();
    }

    const nestedGroup = grouping.locator(
        ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]:visible'
    ).first();
    const nestedHeader = nestedGroup.locator(':scope > .local-groupimport-easystud-group__header');
    const nestedActions = nestedHeader.locator(':scope > [data-easystud-group-actions-toggle]');
    await expect(nestedGroup).toHaveAttribute('data-easystud-advanced-type', 'group');
    await expect(nestedGroup).toHaveAttribute('data-easystud-advanced-native-url', /\S+/);
    await expect(nestedHeader.locator(':scope > [data-easystud-open-advanced-settings]')).toHaveCount(0);

    await nestedActions.click();
    await expect(contextMenu).toBeVisible();
    await expect(advancedAction).toHaveCount(1);
    await expect(advancedAction).toBeVisible();
    await advancedAction.click();

    const modal = root.locator('[data-easystud-advanced-settings-modal]');
    await expect(modal).toBeVisible();
    await expect(nestedActions).toBeFocused();
    await modal.locator('[data-easystud-close-advanced-settings]').first().click();
    await expect(modal).toHaveCount(0);
    await expect(nestedActions).toBeFocused();

    await page.locator('[data-easystud-mobile-view="groups"]').click();
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
    const catalogGroup = root.locator(
        '[data-easystud-structure-groups] [data-easystud-group-id]:visible'
    ).first();
    const catalogHeader = catalogGroup.locator(':scope > .local-groupimport-easystud-group__header');
    await expect(catalogHeader.locator(':scope > [data-easystud-open-advanced-settings]')).toHaveCount(1);
    await catalogGroup.locator(':scope > [data-easystud-card-menu]').click();
    await expect(contextMenu).toBeVisible();
    await expect(advancedAction).toBeHidden();
});
