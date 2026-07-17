const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the Mass Import audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
    }
    await expect(page.locator('#local-groupimport-import')).toBeVisible({timeout: 30000});
};

const expectNoPageOverflow = async page => {
    const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(overflow).toBe(false);
};

const expectAccentRailsContained = async root => {
    const rails = await root.locator('.local-groupimport-import-card').evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node);
        const pseudo = getComputedStyle(node, '::before');
        return {
            backgroundImage: style.backgroundImage,
            borderTopLeftRadius: parseFloat(style.borderTopLeftRadius),
            borderTopRightRadius: parseFloat(style.borderTopRightRadius),
            pseudoContent: pseudo.content,
        };
    }));

    expect(rails).toHaveLength(2);
    rails.forEach(rail => {
        expect(rail.backgroundImage).toContain('linear-gradient');
        expect(rail.borderTopLeftRadius).toBeGreaterThan(0);
        expect(rail.borderTopRightRadius).toBeGreaterThan(0);
        expect(rail.pseudoContent).toBe('none');
    });
};

test('renders the EasyEdu Mass Import navigation and history modal', async({page}) => {
    await login(page);

    const root = page.locator('#local-groupimport-import');
    await expect(root.locator('.local-groupimport-import__header-actions [aria-current="page"]')).toBeVisible();
    await expect(root.locator('.local-groupimport-import-card--upload')).toBeVisible();
    await expect(root.locator('.local-groupimport-import-card--results')).toBeVisible();
    await expectNoPageOverflow(page);
    await expectAccentRailsContained(root);

    const alignment = await root.evaluate(node => {
        const parent = node.parentElement.getBoundingClientRect();
        const box = node.getBoundingClientRect();
        return {
            left: box.left - parent.left,
            right: parent.right - box.right,
            ratio: box.width / parent.width,
        };
    });
    expect(Math.abs(alignment.left - alignment.right)).toBeLessThanOrEqual(3);
    expect(alignment.ratio).toBeGreaterThanOrEqual(0.96);

    await root.locator('[data-local-groupimport-history-open]').click();
    await expect(root.locator('[data-local-groupimport-history-modal]')).toBeVisible();
    await expect(root.locator(
        '[data-local-groupimport-history-modal] .local-groupimport-import-modal__dialog'
    )).toBeVisible();
    await root.locator('[data-local-groupimport-history-close]').first().click();
    await expect(root.locator('[data-local-groupimport-history-modal]')).toBeHidden();
});

test('anchors the EasyStud guide at the start of the primary navigation', async({page}) => {
    await login(page);
    await page.goto(new URL('/local/groupimport/manage.php?id=5', baseUrl).toString());
    const managementRoot = page.locator('.local-groupimport-easystud');
    const managementRails = await managementRoot.locator(
        '.local-groupimport-easystud__panel--participants, .local-groupimport-easystud__panel--structure'
    ).evaluateAll(nodes => nodes.map(node => ({
        backgroundImage: getComputedStyle(node).backgroundImage,
        pseudoContent: getComputedStyle(node, '::before').content,
    })));
    expect(managementRails).toHaveLength(2);
    managementRails.forEach(rail => {
        expect(rail.backgroundImage.match(/linear-gradient/g)).toHaveLength(2);
        expect(rail.pseudoContent).toBe('none');
    });

    const navigation = page.locator('.local-groupimport-easystud__header-actions');
    const guide = navigation.locator(':scope > .easyedu-guide, :scope > [class*="easyedu-guide"]').first();
    const actions = navigation.locator(':scope > .easyedu-admin-primary-nav__actions');
    await expect(navigation).toBeVisible({timeout: 30000});
    await expect(guide).toBeVisible();
    await expect(actions).toBeVisible();
    const [navigationBox, guideBox] = await Promise.all([navigation.boundingBox(), guide.boundingBox()]);
    expect(guideBox.x - navigationBox.x).toBeLessThanOrEqual(8);
    const centres = await navigation.evaluate(node => {
        const navigationBox = node.getBoundingClientRect();
        const actionNodes = Array.from(node.querySelectorAll(':scope > .easyedu-admin-primary-nav__actions > *'))
            .filter(action => !action.hidden && getComputedStyle(action).display !== 'none');
        const boxes = actionNodes.map(action => action.getBoundingClientRect());
        return {
            navigation: navigationBox.left + navigationBox.width / 2,
            actions: (Math.min(...boxes.map(box => box.left)) + Math.max(...boxes.map(box => box.right))) / 2,
        };
    });
    expect(Math.abs(centres.navigation - centres.actions)).toBeLessThanOrEqual(4);
});

test('downloads the styled Excel example', async({page}) => {
    await login(page);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.local-groupimport-import__template-link').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.xlsx$/);
});

test('previews a dropped file and keeps replacement controls usable', async({page}) => {
    await login(page);
    await page.waitForFunction(() => window.M && M.form_filepicker && M.core_filepicker &&
        Object.keys(M.core_filepicker.instances || {}).length > 0, null, {timeout: 15000});

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await dataTransfer.evaluate((transfer, content) => {
        transfer.items.add(new File([content], 'easyedu-audit.csv', {type: 'text/csv'}));
    }, [
        'student;group;grouping',
        'test.etudiant.01@example.com;Audit preview group;Audit preview grouping',
    ].join('\n'));

    await page.dispatchEvent('body', 'drop', {dataTransfer});
    await expect(page.locator('.filepicker-filename, [id^="file_info_"]')
        .filter({hasText: 'easyedu-audit.csv'}).first())
        .toBeVisible({timeout: 30000});

    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.locator('.local-groupimport-import-card--upload [type="submit"]').click(),
    ]);

    const root = page.locator('#local-groupimport-import');
    await expect(root).toHaveClass(/has-preview/);
    await expect(root).toHaveClass(/is-upload-collapsed/);
    await expect(root.locator('.local-groupimport-import-preview__table')).toBeVisible();
    await expectAccentRailsContained(root);

    const strategy = root.locator('.local-groupimport-import-preview__strategy');
    const strategyBody = strategy.locator('.easyedu-segmented-choice__body');
    const strategyLabel = strategy.locator('.easyedu-segmented-choice__label');
    const strategyBounds = await Promise.all([strategyBody.boundingBox(), strategyLabel.boundingBox()]);
    expect(strategyBounds[0]).not.toBeNull();
    expect(strategyBounds[1]).not.toBeNull();
    expect(strategyBounds[1].x).toBeGreaterThan(strategyBounds[0].x);
    expect(strategyBounds[1].x + strategyBounds[1].width)
        .toBeLessThan(strategyBounds[0].x + strategyBounds[0].width);
    expect(strategyBounds[1].y).toBeGreaterThan(strategyBounds[0].y);

    const selectionToggle = root.locator('[data-local-groupimport-preview-toggle-all]');
    await expect(root.locator('[data-local-groupimport-preview-toggle-results]')).toHaveCount(0);
    await root.locator('[data-local-groupimport-preview-search]').fill('Audit preview group');
    await expect(selectionToggle).toContainText(/results/i);
    await selectionToggle.click();
    await expect(selectionToggle).toContainText(/select results/i);
    await root.locator('[data-local-groupimport-preview-search]').fill('');
    await expect(selectionToggle).toContainText(/select all/i);

    const exportAction = root.locator('.local-groupimport-import__export-results');
    if (await exportAction.count()) {
        await expect(exportAction).toHaveCSS('display', 'inline-flex');
        const exportGap = await exportAction.evaluate(node => parseFloat(getComputedStyle(node).columnGap));
        expect(exportGap).toBeGreaterThanOrEqual(9);
    }

    const toggle = root.locator('[data-local-groupimport-upload-toggle]');
    await expect(toggle).toHaveCSS('position', 'sticky');
    await expect(toggle).toHaveAttribute('data-local-groupimport-upload-toggle-bound', '1', {timeout: 15000});
    await toggle.click();
    await expect(root).not.toHaveClass(/is-upload-collapsed/);
    await expect(root.locator('.local-groupimport-import-card--upload [type="submit"]')).toContainText(/replace file/i);
    await expectAccentRailsContained(root);

    const replacementTransfer = await page.evaluateHandle(() => new DataTransfer());
    await replacementTransfer.evaluate((transfer, content) => {
        transfer.items.add(new File([content], 'easyedu-replacement-audit.csv', {type: 'text/csv'}));
    }, [
        'student;group;grouping',
        'test.etudiant.01;Audit replacement group;Audit replacement grouping',
        'test.etudiant.02@example.com;Audit replacement group;Audit replacement grouping',
    ].join('\n'));
    await page.dispatchEvent('body', 'drop', {dataTransfer: replacementTransfer});
    await expect(page.locator('.filepicker-filename, [id^="file_info_"]')
        .filter({hasText: 'easyedu-replacement-audit.csv'}).first())
        .toBeVisible({timeout: 30000});

    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        root.locator('.local-groupimport-import-card--upload [type="submit"]').click(),
    ]);
    await expect(page.locator('.local-groupimport-import-preview__table tbody tr')).toHaveCount(2);
    const replacementGroups = page.locator('.local-groupimport-import-preview__table input[name^="groupname["]');
    const replacementIdentifiers = page.locator(
        '.local-groupimport-import-preview__table input[name^="identifier["]'
    );
    await expect(replacementGroups).toHaveCount(2);
    await expect(replacementGroups.nth(0)).toHaveValue('Audit replacement group');
    await expect(replacementGroups.nth(1)).toHaveValue('Audit replacement group');
    await expect(replacementIdentifiers.nth(0)).toHaveValue('test.etudiant.01');
    await expect(replacementIdentifiers.nth(1)).toHaveValue('test.etudiant.02@example.com');
    await expectNoPageOverflow(page);
});

test('keeps the Mass Import page contained on a narrow viewport', async({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await login(page);
    await expectNoPageOverflow(page);

    const cards = page.locator('.local-groupimport-import-card:visible');
    await expect(cards).toHaveCount(2);
    const boxes = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect()));
    expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom - 2);
});

test('shows the legacy-safe EasyStud feature setting', async({page}) => {
    await login(page);
    await page.goto(new URL('/admin/settings.php?section=local_groupimport', baseUrl).toString());
    await expect(page.locator('[data-local-groupimport-admin-features]')).toBeVisible({timeout: 30000});
    await expect(page.locator('#id_s_local_groupimport_enablesimplifiedview')).toBeVisible();
    const saveLayout = await page.locator('#adminsettings > .settingsform > .row:last-child button').evaluate(button => {
        const row = button.closest('.row');
        const previous = row ? row.previousElementSibling : null;
        const rowBox = row ? row.getBoundingClientRect() : null;
        const previousBox = previous ? previous.getBoundingClientRect() : null;
        return {
            justifyContent: row ? getComputedStyle(row).justifyContent : '',
            gapAbove: rowBox && previousBox ? rowBox.top - previousBox.bottom : 0,
        };
    });
    expect(saveLayout.justifyContent).toBe('flex-end');
    expect(saveLayout.gapAbove).toBeGreaterThanOrEqual(12);
    await expectNoPageOverflow(page);
});
