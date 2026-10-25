const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the native drawer clearance scenario.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'), {
            timeout: 60000,
            waitUntil: 'domcontentloaded',
        });
        await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    }

    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 60000});
};

test('easystud-navigation-native-drawer-clearance', async({page}) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 390, height: 844});
    await login(page);

    const geometry = await page.evaluate(() => {
        const rectangle = node => {
            const bounds = node.getBoundingClientRect();
            return {
                left: bounds.left,
                right: bounds.right,
                top: bounds.top,
                bottom: bounds.bottom,
            };
        };
        const overlaps = (left, right) => left.left < right.right && left.right > right.left &&
            left.top < right.bottom && left.bottom > right.top;
        const navigation = document.querySelector('[data-easyedu-navigation]');
        const trigger = document.querySelector('[data-easyedu-navigation-open]');
        const drawer = document.querySelector('[data-region="drawer-toggle"]');

        if (!navigation || !trigger || !drawer || !drawer.getClientRects().length) {
            return null;
        }
        const triggerRect = rectangle(trigger);
        const drawerRect = rectangle(drawer);
        return {
            trigger: triggerRect,
            drawer: drawerRect,
            overlaps: overlaps(triggerRect, drawerRect),
            nativeTriggerEdge: Number.parseFloat(
                navigation.style.getPropertyValue('--easyedu-navigation-native-trigger-edge') || '0'
            ),
        };
    });

    expect(geometry, 'Expected the visible Moodle drawer opener and EasyEdu trigger at 390 px.').not.toBeNull();
    expect(geometry.overlaps, 'Native drawer clearance: ' + JSON.stringify(geometry)).toBe(false);
    expect(geometry.trigger.top, 'Native drawer clearance: ' + JSON.stringify(geometry))
        .toBeGreaterThanOrEqual(geometry.drawer.bottom - 1);
    expect(geometry.nativeTriggerEdge, 'Native drawer clearance: ' + JSON.stringify(geometry))
        .toBeGreaterThanOrEqual(geometry.drawer.bottom - 1);
});
