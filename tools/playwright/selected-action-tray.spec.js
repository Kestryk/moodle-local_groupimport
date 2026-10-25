const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    page.on('pageerror', error => console.log('PAGE_ERROR:', error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            console.log('CONSOLE_ERROR:', message.text());
        }
    });
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the selected-action tray audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    await expect(root).not.toHaveAttribute('data-easystud-manager-initialising', '1', {timeout: 60000});
    return root;
};

test('selected group action tray remains contained at intermediate responsive width', async({page}, testInfo) => {
    test.setTimeout(120000);
    // This is the reported intermediate responsive width: above the 768 px
    // stacking fallback, with an expanded Group card behind the tray.
    await page.setViewportSize({width: 777, height: 900});
    const root = await login(page);

    await page.locator('[data-easystud-mobile-view="groups"]').click();
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
    const group = page.locator(
        '[data-easystud-mobile-entity-region="groups"] [data-easystud-group-id]:visible'
    ).first();
    const memberToggle = group.locator('[data-easystud-group-members-toggle]:visible').first();
    await expect(memberToggle).toBeVisible();
    await memberToggle.click();
    await expect(memberToggle).toHaveAttribute('aria-expanded', 'true');
    const selector = group.locator('[data-easystud-selector-input]').first();
    await expect(selector).toBeVisible();
    await selector.evaluate(input => input.click());

    const tray = page.locator('[data-easystud-mobile-actions]:not([hidden])');
    await expect(tray).toBeVisible();
    await expect(tray).toHaveAttribute('data-easystud-mobile-actions-type', 'group');
    const geometry = await tray.evaluate(node => {
        const buttons = node.querySelector('[data-easystud-mobile-actions-buttons]');
        const rectangle = element => {
            const bounds = element.getBoundingClientRect();
            return {
                left: bounds.left,
                right: bounds.right,
                top: bounds.top,
                bottom: bounds.bottom,
                width: bounds.width,
                height: bounds.height,
            };
        };
        return {
            tray: rectangle(node),
            summary: rectangle(node.querySelector('[data-easystud-mobile-actions-summary]')),
            buttons: rectangle(buttons),
            buttonScrollWidth: buttons.scrollWidth,
            buttonClientWidth: buttons.clientWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
            actions: Array.from(buttons.querySelectorAll('[data-easystud-mobile-action-trigger]')).map(rectangle),
        };
    });
    console.log('RESPONSIVE_SELECTED_ACTION_TRAY:', JSON.stringify(geometry));
    await page.screenshot({
        path: testInfo.outputPath('selected-group-action-tray-intermediate.png'),
        fullPage: false,
    });

    expect(geometry.tray.left, 'tray left edge').toBeGreaterThanOrEqual(-1);
    expect(geometry.tray.right, 'tray right edge').toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.documentScrollWidth, 'document horizontal overflow').toBeLessThanOrEqual(geometry.viewportWidth + 2);
    expect(geometry.summary.bottom, 'summary is above the action row').toBeLessThanOrEqual(geometry.buttons.top - 4);
    expect(geometry.buttonScrollWidth, 'hidden action-row overflow').toBeLessThanOrEqual(
        geometry.buttonClientWidth + 2
    );
    expect(geometry.actions, 'group action count').toHaveLength(4);
    geometry.actions.forEach((action, index) => {
        expect(action.left, `action ${index + 1} left edge`).toBeGreaterThanOrEqual(geometry.tray.left - 1);
        expect(action.right, `action ${index + 1} right edge`).toBeLessThanOrEqual(geometry.tray.right + 1);
    });
});
