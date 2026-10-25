const {test, expect} = require('@playwright/test');

const manageUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const adminUrl = new URL('/admin/settings.php?section=local_groupimport', manageUrl).toString();
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

test.describe.configure({timeout: 180000});

const login = async(page, url) => {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Saved credentials are required for the Platform wave validation bundle.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(urlValue => !urlValue.pathname.includes('/login/'), {
            timeout: 60000,
            waitUntil: 'domcontentloaded',
        });
        await page.goto(url, {waitUntil: 'domcontentloaded'});
    }
};

const paginationOwners = [
    ['Participants', '[data-easystud-participant-list]', '[data-easystud-user]', 15],
    ['Groups Complete', '.local-groupimport-easystud-participant-groups__list', '[data-easystud-group-id]', 10],
    ['Groups Structure', '.local-groupimport-easystud-structure-groups__list', '[data-easystud-group-id]', 10],
    ['Groupings Structure', '.local-groupimport-easystud-tree__groupings', '[data-easystud-grouping-id]', 10],
];

const assertPanelDisabledActions = async manageRoot => {
    const panelOwners = [
        ['Participants', '[data-easystud-participants-panel="1"]',
            '[data-easystud-move-selected-participants="1"]'],
        ['Structure', '[data-easystud-structure-panel="1"]',
            '[data-easystud-delete-selected-groups="1"]'],
    ];

    for (const [label, panelSelector, actionSelector] of panelOwners) {
        const panel = manageRoot.locator(panelSelector);
        await expect(panel, label + ' panel owner').toHaveCount(1);
        const actions = panel.locator(':scope > .card-body > .local-groupimport-easystud__panel-heading > ' +
            '.local-groupimport-easystud__panel-actions');
        await expect(actions, label + ' panel actions owner').toHaveCount(1);
        const action = actions.locator(':scope > button' + actionSelector);
        await expect(action, label + ' known disabled action').toHaveCount(1);
        await expect(action).toBeDisabled();
    }
};

const activateDesktopLayout = async (root, mode) => {
    const toggle = root.locator(`[data-easystud-layout-mode="${mode}"]`);
    await expect(toggle, mode + ' desktop layout toggle').toHaveCount(1);
    await expect(toggle, mode + ' desktop layout toggle').toBeVisible();
    if (await toggle.getAttribute('aria-pressed') !== 'true') {
        await toggle.click();
    }
    await expect(toggle, mode + ' desktop layout active').toHaveAttribute('aria-pressed', 'true');
};

const assertVisibleOwners = async (root, owners) => {
    for (const [label, listSelector] of owners) {
        const list = root.locator(listSelector);
        await expect(list, label + ' list owner').toHaveCount(1);
        await expect(list, label + ' list').toBeVisible();
    }
};

const assertNonPaginatedOwners = async (root, owners) => {
    await assertVisibleOwners(root, owners);
    for (const [label, listSelector] of owners) {
        const list = root.locator(listSelector);
        await expect(list.locator(':scope > [data-easystud-pagination]'),
            label + ' must not own pagination in this layout').toHaveCount(0);
    }
};

const assertPaginationGeometry = async (pagination, label, requireBottom) => {
    const geometry = await pagination.evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node);
        const owner = node.parentElement;
        const rect = node.getBoundingClientRect();
        const ownerRect = owner.getBoundingClientRect();
        return {
            position: style.position,
            bottom: node.getAttribute('data-easystud-pagination') === 'bottom',
            last: node === owner.lastElementChild,
            belowListContent: node.getAttribute('data-easystud-pagination') !== 'bottom' ||
                rect.top >= ownerRect.top,
        };
    }));
    expect(geometry.every(item => item.position !== 'fixed' && item.position !== 'sticky'),
        label + ' pagination must not be viewport-fixed').toBe(true);
    if (!requireBottom) {
        return;
    }
    const bottom = geometry.find(item => item.bottom);
    expect(bottom && bottom.last, label + ' bottom pagination must end its content block').toBe(true);
    expect(bottom && bottom.belowListContent, label + ' bottom pagination placement').toBe(true);
};

const assertPaginationOwners = async (root, owners) => {
    for (const [label, listSelector, itemSelector, pageSize] of owners) {
        const list = root.locator(listSelector);
        await expect(list, label + ' list owner').toHaveCount(1);
        await expect(list, label + ' list').toBeVisible();
        const itemCount = await list.locator(':scope > ' + itemSelector).count();
        const pagination = list.locator(':scope > [data-easystud-pagination]');
        if (itemCount <= pageSize) {
            const paginationCount = await pagination.count();
            expect(paginationCount, label + ' single-page pagination count').toBeLessThanOrEqual(1);
            if (paginationCount === 1) {
                await expect(pagination).toHaveAttribute('data-easystud-pagination', 'top');
                await expect(pagination).toHaveClass(/is-placeholder/);
                await assertPaginationGeometry(pagination, label, false);
            }
            continue;
        }

        await expect(pagination, label + ' pagination owner').toHaveCount(2);
        await assertPaginationGeometry(pagination, label, true);
    }
};

const assertNoScriptFallback = async(page, url, rootSelector, contentSelector, capturePath) => {
    await login(page, url);
    const root = page.locator(rootSelector);
    await expect(root).toHaveCount(1);
    await expect(root).toBeVisible({timeout: 60000});
    await page.screenshot({path: capturePath, fullPage: true});
    await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
    await expect(root.locator(contentSelector)).toHaveCount(1);
    await expect(root.locator(contentSelector)).toBeVisible();
    await expect(root).not.toHaveAttribute('aria-busy', 'true');
};

test('EED-UI-2026-0030-0033 Platform wave: global controls plus Mass Import and Administration no-script lifecycle', async({browser, page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page, manageUrl);
    const manageRoot = page.locator('#local-groupimport-easystud');
    await expect(manageRoot).toBeVisible({timeout: 60000});
    await expect(manageRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await assertPanelDisabledActions(manageRoot);
    const ungrouped = manageRoot.locator('.local-groupimport-easystud-tree__section--ungrouped');
    await expect(ungrouped).toHaveCount(1);
    await expect(ungrouped).toBeVisible();
    const ungroupedDisclosure = ungrouped.locator(':scope > [data-easystud-collapse-toggle]');
    await expect(ungroupedDisclosure).toHaveCount(1);
    await expect(ungroupedDisclosure).toBeVisible();
    await expect(ungroupedDisclosure).toHaveAttribute('aria-expanded', 'false');
    await expect(ungroupedDisclosure).toHaveAttribute('aria-controls', 'easystud-group-list-ungrouped');
    await ungroupedDisclosure.click();
    await expect(ungroupedDisclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(ungrouped.locator(':scope > .local-groupimport-easystud-tree__children')).toBeVisible();

    // The desktop layout intentionally hides one panel at a time. Complete
    // shows Participants and the Groupings tree, Participants shows Groups
    // Complete, and Structure shows Groups Structure plus the Groupings tree.
    // Activate each owning view before asserting its visible pagination.
    await activateDesktopLayout(manageRoot, 'both');
    await assertPaginationOwners(manageRoot, [paginationOwners[0]]);
    await assertNonPaginatedOwners(manageRoot, [paginationOwners[3]]);
    await page.screenshot({path: testInfo.outputPath('0030-global-controls-desktop.png'), fullPage: true});
    await activateDesktopLayout(manageRoot, 'participants');
    await assertPaginationOwners(manageRoot, [paginationOwners[1]]);
    await activateDesktopLayout(manageRoot, 'structure');
    await assertPaginationOwners(manageRoot, [paginationOwners[2], paginationOwners[3]]);

    await page.setViewportSize({width: 390, height: 844});
    const mobileViewSwitcher = manageRoot.locator('[data-easystud-mobile-view-switcher="1"]');
    await expect(mobileViewSwitcher).toHaveCount(1);
    const groupsViewTrigger = mobileViewSwitcher.locator(':scope > [data-easystud-mobile-view="groups"]');
    await expect(groupsViewTrigger).toHaveCount(1);
    await expect(groupsViewTrigger).toBeVisible();
    await groupsViewTrigger.click();
    await expect(manageRoot).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
    const groupsStructureList = manageRoot.locator(paginationOwners[2][1]);
    await expect(groupsStructureList).toHaveCount(1);
    const groupsBottomPagination = groupsStructureList.locator(':scope > [data-easystud-pagination="bottom"]');
    await expect(groupsBottomPagination).toHaveCount(1);
    const next = groupsBottomPagination.locator(':scope > .local-groupimport-easystud-pagination__controls ' +
        '> [data-easystud-page-next="1"]');
    await expect(next).toHaveCount(1);
    await expect(next).toBeVisible();
    await next.focus();
    await expect(next).toBeFocused();
    await page.screenshot({path: testInfo.outputPath('0030-global-controls-mobile.png'), fullPage: true});

    await page.goto(massImportUrl, {waitUntil: 'domcontentloaded'});
    const massRoot = page.locator('#local-groupimport-import');
    await expect(massRoot).toHaveCount(1);
    await expect(massRoot).toBeVisible({timeout: 60000});
    await expect(massRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(massRoot.locator('[data-easystud-real-content]')).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('0032-mass-import-normal-lifecycle.png'), fullPage: true});

    await page.goto(adminUrl, {waitUntil: 'domcontentloaded'});
    const adminRoot = page.locator('#page-admin-setting-local_groupimport');
    await expect(adminRoot).toHaveCount(1);
    await expect(adminRoot).toBeVisible({timeout: 60000});
    await expect(adminRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(adminRoot.locator('[data-local-groupimport-admin-features]')).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('0033-admin-normal-lifecycle.png'), fullPage: true});

    const noScriptContext = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
    try {
        const noScriptPage = await noScriptContext.newPage();
        await assertNoScriptFallback(noScriptPage, massImportUrl, '#local-groupimport-import',
            '[data-easystud-real-content]', testInfo.outputPath('0032-mass-import-no-script.png'));
        await assertNoScriptFallback(noScriptPage, adminUrl, '#page-admin-setting-local_groupimport',
            '[data-local-groupimport-admin-features]', testInfo.outputPath('0033-admin-no-script.png'));
    } finally {
        await noScriptContext.close();
    }
});
