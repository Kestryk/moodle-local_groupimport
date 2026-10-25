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
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this menu-stacking scenario.');
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

test('expanded Group More-actions menu stays above revealed participant members', async({page}, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 1280, height: 900});
    const root = await login(page);

    const completeView = root.locator('[data-easystud-layout-mode="both"]');
    if ((await completeView.getAttribute('aria-pressed')) !== 'true') {
        await completeView.click();
    }
    await expect(completeView).toHaveAttribute('aria-pressed', 'true');

    const grouping = root.locator(
        '[data-easystud-tree] [data-easystud-grouping-id]:has(.local-groupimport-easystud-group):visible'
    ).first();
    await expect(grouping).toBeVisible();
    const groupingToggle = grouping.locator(
        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
    );
    if ((await groupingToggle.getAttribute('aria-expanded')) !== 'true') {
        await groupingToggle.click();
    }

    const group = grouping.locator(
        ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]:visible'
    ).first();
    const memberToggle = group.locator(':scope > [data-easystud-group-members-toggle]:visible');
    const actions = group.locator(
        ':scope > .local-groupimport-easystud-group__header > [data-easystud-group-actions-toggle]:visible'
    );
    const menu = group.locator(
        ':scope > .local-groupimport-easystud-group__header > [data-easystud-group-actions-menu]:not([hidden])'
    );

    await expect(group).toBeVisible();
    await expect(memberToggle).toBeVisible();
    await expect(actions).toBeVisible();
    if ((await memberToggle.getAttribute('aria-expanded')) !== 'true') {
        await memberToggle.click();
    }
    await expect(memberToggle).toHaveAttribute('aria-expanded', 'true');

    await actions.click();
    await expect(menu).toBeVisible();
    await expect(group).toHaveClass(/is-actions-menu-open/);
    await page.screenshot({
        path: testInfo.outputPath('expanded-group-more-actions-menu.png'),
        fullPage: false,
    });

    const stack = await Promise.all([
        group.evaluate(node => window.getComputedStyle(node).zIndex),
        menu.evaluate(node => window.getComputedStyle(node).zIndex),
    ]);
    expect(stack[0], 'expanded Group card retains the open-menu stack').toBe('35');
    expect(stack[1], 'existing More-actions menu stack').toBe('80');
    await expect(memberToggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(root.locator('[data-easystud-context-menu]:not([hidden])')).toBeHidden();
});
