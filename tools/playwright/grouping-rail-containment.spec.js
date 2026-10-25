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
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the Grouping rail audit.');
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

test('responsive expanded Grouping rail stays inside its card', async({page}, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 390, height: 844});
    const root = await login(page);

    await page.locator('[data-easystud-mobile-view="groupings"]').click();
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groupings');
    const grouping = page.locator(
        '[data-easystud-mobile-entity-region="groupings"] [data-easystud-grouping-id]:visible'
    ).first();
    await expect(grouping).toBeVisible();
    const closedGeometry = await grouping.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return {left: rect.left, right: rect.right, width: rect.width};
    });

    const toggle = grouping.locator(
        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
    );
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-expanded') !== 'true') {
        await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(grouping).toHaveClass(/is-expanded/);
    await grouping.evaluate(node => node.scrollIntoView({block: 'center', inline: 'nearest'}));

    const geometry = await grouping.evaluate(node => {
        const rect = node.getBoundingClientRect();
        const after = getComputedStyle(node, '::after');
        const before = getComputedStyle(node, '::before');
        const pixels = value => Number.parseFloat(value);
        const railLeft = rect.left + pixels(after.left);
        const railWidth = pixels(after.width);
        const iconTransform = new DOMMatrixReadOnly(before.transform);
        const iconLeft = rect.left + pixels(before.left) + iconTransform.m41;
        return {
            card: {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width},
            rail: {left: railLeft, right: railLeft + railWidth, width: railWidth},
            iconLeft,
            railHitTargets: [0.02, 0.2, 0.4, 0.6, 0.8, 0.98].map(ratio => {
                const y = rect.top + ((rect.bottom - rect.top) * ratio);
                const target = document.elementFromPoint(railLeft + railWidth / 2, y);
                return {
                    y,
                    id: target?.id || '',
                    className: typeof target?.className === 'string' ? target.className : '',
                    region: target?.getAttribute('data-region') || '',
                };
            }),
            documentScrollWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
        };
    });
    console.log('RESPONSIVE_EXPANDED_GROUPING_RAIL:', JSON.stringify({closedGeometry, geometry}));
    await page.screenshot({
        path: testInfo.outputPath('responsive-expanded-grouping-rail.png'),
        fullPage: false,
    });

    expect(Math.abs(geometry.card.left - closedGeometry.left), 'card left edge').toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.card.right - closedGeometry.right), 'card right edge').toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.card.width - closedGeometry.width), 'card width').toBeLessThanOrEqual(1);
    expect(geometry.rail.left, 'rail left edge stays in the card').toBeGreaterThanOrEqual(geometry.card.left - 1);
    expect(geometry.rail.right, 'rail right edge stays in the card').toBeLessThanOrEqual(geometry.card.right + 1);
    expect(geometry.iconLeft, 'rail icon stays in the card').toBeGreaterThanOrEqual(geometry.card.left - 1);
    expect(geometry.iconLeft, 'rail icon stays before card content').toBeLessThanOrEqual(geometry.card.left + geometry.rail.width + 1);
    geometry.railHitTargets.forEach((target, index) => {
        expect(target.className, `rail paint target ${index + 1}`).toContain('local-groupimport-easystud-tree__section');
    });
    expect(geometry.documentScrollWidth, 'document horizontal overflow').toBeLessThanOrEqual(geometry.viewportWidth + 2);
});
