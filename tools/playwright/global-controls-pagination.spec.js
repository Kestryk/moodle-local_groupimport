const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const rootSelector = '#local-groupimport-easystud';

test.describe.configure({timeout: 120000});

const login = async page => {
    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the EED-UI-2026-0030 audit.');
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
    const root = page.locator(rootSelector);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
};

const assertTopActionCentres = async page => {
    const records = await page.locator('.local-groupimport-easystud__panel:visible ' +
        '.local-groupimport-easystud__panel-actions:visible').evaluateAll(actions => actions.flatMap(container =>
        Array.from(container.querySelectorAll(':scope > button:not([hidden])')).map(button => {
            const buttonRect = button.getBoundingClientRect();
            const content = Array.from(button.children).filter(node => !node.matches('[aria-hidden="true"]'));
            const contentRect = content.reduce((acc, node) => {
                const rect = node.getBoundingClientRect();
                return {
                    left: Math.min(acc.left, rect.left),
                    right: Math.max(acc.right, rect.right),
                };
            }, {left: Infinity, right: -Infinity});
            return {
                disabled: button.disabled,
                delta: Math.abs((contentRect.left + contentRect.right) / 2 -
                    (buttonRect.left + buttonRect.right) / 2),
            };
        })));
    expect(records.length, 'at least one visible top-panel action').toBeGreaterThan(0);
    expect(records.every(record => record.delta <= 3), JSON.stringify(records)).toBe(true);
    expect(records.some(record => record.disabled), 'fixture must expose a disabled top action').toBe(true);
};

const paginationOwners = [
    ['Participants', '[data-easystud-participant-list]'],
    ['Groups Complete', '.local-groupimport-easystud-participant-groups__list'],
    ['Groups Structure', '.local-groupimport-easystud-structure-groups__list'],
    ['Groupings Structure', '.local-groupimport-easystud-tree__groupings'],
];

const assertPagination = async (page, owners = paginationOwners) => {
    for (const [label, listSelector] of owners) {
        const list = page.locator(listSelector).first();
        await expect(list, label + ' list').toHaveCount(1);
        const pagination = list.locator(':scope > [data-easystud-pagination]');
        await expect(pagination, label + ' pagination owner').toHaveCount(2);
        const geometry = await pagination.evaluateAll(nodes => nodes.map(node => {
            const style = getComputedStyle(node);
            const list = node.parentElement;
            const rect = node.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
            return {
                position: style.position,
                bottom: node.getAttribute('data-easystud-pagination') === 'bottom',
                last: node === list.lastElementChild,
                belowListContent: node.getAttribute('data-easystud-pagination') !== 'bottom' ||
                    rect.top >= listRect.top,
            };
        }));
        expect(geometry.every(item => item.position !== 'fixed' && item.position !== 'sticky'),
            label + ' pagination must not be viewport-fixed').toBe(true);
        const bottom = geometry.find(item => item.bottom);
        expect(bottom && bottom.last, label + ' bottom pagination must end its content block').toBe(true);
        expect(bottom && bottom.belowListContent, label + ' bottom pagination placement').toBe(true);
    }
};

test('EED-UI-2026-0030 global controls, ungrouped disclosure and pagination parity', async({page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);
    await assertTopActionCentres(page);

    const ungrouped = page.locator('.local-groupimport-easystud-tree__section--ungrouped');
    await expect(ungrouped).toHaveCount(1);
    const disclosure = ungrouped.locator(':scope > [data-easystud-collapse-toggle]');
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await expect(disclosure).toContainText('Groups without grouping');
    const surface = await ungrouped.evaluate(node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {width: rect.width, radius: style.borderRadius, shadow: style.boxShadow, border: style.border};
    });
    expect(surface.width).toBeGreaterThan(0);
    expect(surface.radius).not.toBe('0px');
    expect(surface.shadow).not.toBe('none');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(ungrouped.locator(':scope > .local-groupimport-easystud-tree__children')).toBeVisible();
    await assertPagination(page, paginationOwners.slice(0, 3));
    await page.locator('[data-easystud-layout-mode="structure"]').click();
    await expect(page.locator(rootSelector)).toHaveClass(/local-groupimport-easystud--structure-focus/);
    await assertPagination(page, [paginationOwners[3]]);
    await page.screenshot({path: testInfo.outputPath('global-controls-pagination-desktop.png'), fullPage: true});

    await page.setViewportSize({width: 390, height: 844});
    await page.locator('[data-easystud-mobile-view="groups"]').click();
    await expect(page.locator(rootSelector)).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
    await assertTopActionCentres(page);
    await assertPagination(page, [paginationOwners[2]]);
    for (const arrow of ['first', 'prev', 'next', 'last']) {
        const button = page.locator(`[data-easystud-page-${arrow}]:visible`).first();
        await expect(button).toBeVisible();
        await button.focus();
        await expect(button).toBeFocused();
        await expect(button).toHaveCSS('position', 'static');
    }
    await page.screenshot({path: testInfo.outputPath('global-controls-pagination-mobile.png'), fullPage: true});
});
