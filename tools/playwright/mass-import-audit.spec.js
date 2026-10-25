const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async(page, {expectMassImport = true} = {}) => {
    // Moodle may keep unrelated theme or analytics resources pending after the
    // document and the plugin bootstrap are available. The assertions below
    // still wait for the real plugin root, so this avoids treating that global
    // page-load tail as a Mass Import loading-state failure.
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the Mass Import audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'), {
            waitUntil: 'domcontentloaded',
        });
    }
    if (expectMassImport) {
        await expect(page.locator('#local-groupimport-import')).toBeVisible({timeout: 30000});
    }
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

test('Mass Import real-content surfaces expose shared keyboard focus', async({page}, testInfo) => {
    await login(page);

    const root = page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(root.locator('[data-easystud-real-content]')).toBeVisible({timeout: 60000});
    const historyOpen = root.locator('[data-local-groupimport-history-open]:visible').first();
    await expect(historyOpen).toBeVisible();
    await page.keyboard.press('Tab');
    await historyOpen.focus();
    await expect.poll(async() => historyOpen.evaluate(node => {
        const style = getComputedStyle(node);
        return style.outlineStyle !== 'none' && style.boxShadow !== 'none' &&
            style.borderColor.includes('138, 188, 227');
    })).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('mass-import-focus-history-open.png'),
        fullPage: false,
    });

    await root.locator('[data-local-groupimport-history-open]').click();
    const modal = root.locator('[data-local-groupimport-history-modal]');
    await expect(modal).toBeVisible();
    const close = modal.locator('[data-local-groupimport-history-close]:visible').first();
    await expect(close).toBeVisible();
    await page.keyboard.press('Tab');
    await close.focus();
    await expect.poll(async() => close.evaluate(node => {
        const style = getComputedStyle(node);
        return style.outlineStyle !== 'none' && style.boxShadow !== 'none' &&
            style.borderColor.includes('138, 188, 227');
    })).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('mass-import-focus-history-close.png'),
        fullPage: false,
    });
    await close.click();
    await expect(modal).toBeHidden();
});

test('keeps the Mass Import skeleton and shared bottom-end busy indicator contract', async({page}) => {
    await login(page);

    const root = page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready');
    const skeleton = root.locator('[data-easystud-loading-skeleton]');
    await expect(skeleton).toHaveCount(1);
    await expect(skeleton).toHaveAttribute('data-easyedu-navigation-skeleton', '1');
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    await expect(skeleton).toBeHidden();
    await expect(skeleton.locator('.local-groupimport-import__loading-card')).toHaveCount(2);
    await expect(skeleton.locator('.local-groupimport-import__loading-surface')).toHaveCount(19);
    await expect(root.locator('[data-easystud-real-content]')).toBeVisible();

    const animationName = await root.locator(
        '[data-easystud-loading-skeleton] .local-groupimport-import__loading-surface'
    ).first().evaluate(node => getComputedStyle(node).animationName);
    const frameAnimationName = await root.locator(
        '[data-easystud-loading-skeleton] .local-groupimport-import__loading-card'
    ).first().evaluate(node => getComputedStyle(node).animationName);
    await root.evaluate(node => node.classList.add('is-action-busy'));
    await page.waitForTimeout(40);
    const contract = await page.evaluate(animationName => {
        const node = document.querySelector('#local-groupimport-import');
        const spinner = getComputedStyle(node, '::after');
        const label = getComputedStyle(node, '::before');
        return {
            animationName,
            spinnerPosition: spinner.position,
            spinnerBottom: spinner.bottom,
            spinnerRight: spinner.right,
            labelContent: label.content,
        };
    }, animationName);
    await root.evaluate(node => node.classList.remove('is-action-busy'));

    if (contract.spinnerPosition !== 'fixed') {
        const cssDiagnostics = await page.evaluate(() => {
            const root = document.querySelector('#local-groupimport-import');
            root?.classList.add('is-action-busy');
            const matchedRules = [];
            const stylesheetPaths = Array.from(document.styleSheets).map(sheet => {
                try {
                    const path = sheet.href ? new URL(sheet.href, window.location.href).pathname : 'inline';
                    Array.from(sheet.cssRules || []).forEach(rule => {
                        if (root && rule.selectorText && rule.selectorText.includes('.local-groupimport-import.is-action-busy') &&
                                root.matches(rule.selectorText.replace(/::after$/, ''))) {
                            matchedRules.push({
                                path,
                                selector: rule.selectorText,
                                position: rule.style.position,
                                bottom: rule.style.bottom,
                                right: rule.style.right,
                            });
                        }
                    });
                    return {
                        path,
                        hasMassImportSpinner: Array.from(sheet.cssRules || []).some(rule =>
                            rule.selectorText && rule.selectorText.includes('.local-groupimport-import.is-action-busy')
                        ),
                    };
                } catch (error) {
                    return {path: 'unreadable', hasMassImportSpinner: false};
                }
            });
            return {
                rootClass: root?.className || '',
                computedPosition: root ? getComputedStyle(root, '::after').position : '',
                matchedRules,
                stylesheetPaths,
            };
        });
        console.log(`MASS_IMPORT_LOADING_DIAGNOSTIC ${JSON.stringify(cssDiagnostics)}`);
    }

    expect(contract.animationName).toContain('easyedu-skeleton-shimmer');
    expect(frameAnimationName).toBe('none');
    expect(contract.spinnerPosition).toBe('fixed');
    expect(contract.spinnerBottom).not.toBe('auto');
    expect(contract.spinnerRight).not.toBe('auto');
    expect(contract.labelContent).toContain('Loading in progress');
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

    const navigation = page.locator(
        '.local-groupimport-easystud__header-actions--desktop'
    );
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

test('shows the selected file type and removes the native Moodle draft', async({page}) => {
    await login(page);
    await page.waitForFunction(() => window.M && M.form_filepicker && M.core_filepicker &&
        Object.keys(M.core_filepicker.instances || {}).length > 0, null, {timeout: 15000});

    const transfer = await page.evaluateHandle(() => {
        const value = new DataTransfer();
        value.items.add(new File([
            'student;group;grouping\ntest.etudiant.01@example.com;Removal audit;Removal audit'
        ], 'easyedu-removal-audit.csv', {type: 'text/csv'}));
        return value;
    });
    await page.dispatchEvent('body', 'drop', {dataTransfer: transfer});

    const deposit = page.locator('.easyedu-file-deposit--moodle');
    const selected = deposit.locator('.easyedu-file-deposit__selected-file');
    await expect(selected).toContainText('easyedu-removal-audit.csv', {timeout: 30000});
    await expect(selected.locator('.easyedu-file-deposit__file-type')).toHaveClass(/fa-file-csv/);
    await expect(selected.locator('.easyedu-file-deposit__remove')).toBeVisible();

    await selected.locator('.easyedu-file-deposit__remove').click();
    await expect(deposit.locator('.easyedu-file-deposit__selected-file')).toHaveCount(0, {timeout: 15000});
    await expect(deposit.locator('.fp-btn-choose')).toBeVisible();
    await expect(page.locator('.local-groupimport-import-card--upload [type="submit"]')).toBeDisabled();
    await transfer.dispose();
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
    await expect(page.locator('.easyedu-file-deposit__file-type')).toHaveClass(/fa-file-csv/);
    await expect(page.locator('.easyedu-file-deposit__remove')).toBeVisible();

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
        await expect(exportAction).toHaveClass(/easyedu-action-with-icon/);
        await expect(exportAction).toHaveCSS('display', 'inline-flex');
        const exportGap = await exportAction.evaluate(node => parseFloat(getComputedStyle(node).columnGap));
        expect(exportGap).toBeGreaterThanOrEqual(9);
        const paintedGap = await exportAction.evaluate(node => {
            const icon = node.querySelector('.fa');
            const label = icon ? icon.nextElementSibling : null;
            if (!icon || !label) {
                return -1;
            }
            const iconBounds = icon.getBoundingClientRect();
            const labelBounds = label.getBoundingClientRect();
            return labelBounds.left - iconBounds.right;
        });
        expect(paintedGap).toBeGreaterThanOrEqual(9);
    }

    const toggle = root.locator('[data-local-groupimport-upload-toggle]');
    const previewGrid = root.locator('.local-groupimport-import__grid');
    await expect(previewGrid).toHaveCSS('transition-duration', '0.32s');
    await expect(previewGrid).toHaveCSS('transition-timing-function', 'cubic-bezier(0.4, 0, 0.2, 1)');
    await expect(toggle).toHaveCSS('position', 'sticky');
    await expect(toggle).toHaveAttribute('data-local-groupimport-upload-toggle-bound', '1', {timeout: 15000});
    const uploadCopy = root.locator('.local-groupimport-import-card--upload .easyedu-panel__copy');
    const openingStart = await toggle.evaluate(button => {
        button.click();
        const container = button.closest('#local-groupimport-import');
        const copy = container.querySelector('.local-groupimport-import-card--upload .easyedu-panel__copy');
        const style = getComputedStyle(copy);
        return {
            expanding: container.classList.contains('is-upload-expanding'),
            collapsed: container.classList.contains('is-upload-collapsed'),
            opacity: parseFloat(style.opacity),
            position: style.position,
        };
    });
    expect(openingStart).toEqual({expanding: true, collapsed: false, opacity: 0, position: 'absolute'});
    await expect(root).not.toHaveClass(/is-upload-expanding/, {timeout: 1500});
    await expect(root).not.toHaveClass(/is-upload-collapsed/);
    await expect(uploadCopy).toHaveCSS('opacity', '1');
    await expect(root.locator('.local-groupimport-import-card--upload [type="submit"]')).toContainText(/replace file/i);
    await expectAccentRailsContained(root);

    const closingStart = await toggle.evaluate(button => {
        button.click();
        const container = button.closest('#local-groupimport-import');
        const copy = container.querySelector('.local-groupimport-import-card--upload .easyedu-panel__copy');
        return {
            collapsing: container.classList.contains('is-upload-collapsing'),
            collapsed: container.classList.contains('is-upload-collapsed'),
            position: getComputedStyle(copy).position,
        };
    });
    expect(closingStart).toEqual({collapsing: true, collapsed: false, position: 'static'});
    await page.waitForTimeout(80);
    const closingOpacity = await uploadCopy.evaluate(node => parseFloat(getComputedStyle(node).opacity));
    expect(closingOpacity).toBeGreaterThan(0);
    expect(closingOpacity).toBeLessThan(1);
    await expect(root).toHaveClass(/is-upload-collapsed/, {timeout: 1500});
    await expect(root).not.toHaveClass(/is-upload-collapsing/, {timeout: 1500});
    await expect(uploadCopy).toHaveCSS('position', 'absolute');
    await expect(uploadCopy).toHaveCSS('visibility', 'hidden');
    const compactRailAlignment = await root.locator('.local-groupimport-import-card--upload').evaluate(card => {
        const icon = card.querySelector('.easyedu-icon-tile');
        const toggleButton = card.querySelector('[data-local-groupimport-upload-toggle]');
        const cardBounds = card.getBoundingClientRect();
        const iconBounds = icon.getBoundingClientRect();
        const toggleBounds = toggleButton.getBoundingClientRect();
        const cardCenter = cardBounds.left + cardBounds.width / 2;
        return {
            iconDelta: Math.abs(iconBounds.left + iconBounds.width / 2 - cardCenter),
            toggleDelta: Math.abs(toggleBounds.left + toggleBounds.width / 2 - cardCenter),
            ordered: toggleBounds.top >= iconBounds.bottom,
        };
    });
    expect(compactRailAlignment.iconDelta).toBeLessThanOrEqual(2);
    expect(compactRailAlignment.toggleDelta).toBeLessThanOrEqual(2);
    expect(compactRailAlignment.ordered).toBe(true);

    await toggle.click();
    await expect(root).not.toHaveClass(/is-upload-expanding/, {timeout: 1500});
    await expect(root).not.toHaveClass(/is-upload-collapsed/);
    await expect(uploadCopy).toHaveCSS('opacity', '1');

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

test('Administration real-content controls expose shared keyboard focus', async({page}, testInfo) => {
    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => consoleErrors.push(error.message));
    await login(page, {expectMassImport: false});
    await page.goto(new URL('/admin/settings.php?section=local_groupimport', baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
    });

    const root = page.locator('#page-admin-setting-local_groupimport');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(root.locator('[data-local-groupimport-admin-features]')).toBeVisible({timeout: 60000});

    const focusContract = async(control, painted, requireBorder = true) => {
        await page.keyboard.press('Tab');
        await control.focus();
        await expect.poll(async() => painted.evaluate((node, borderRequired) => {
            const style = getComputedStyle(node);
            return style.outlineStyle !== 'none' && style.boxShadow !== 'none' &&
                (!borderRequired || style.borderColor.includes('138, 188, 227'));
        }, requireBorder)).toBe(true);
    };

    const checkbox = root.locator('#id_s_local_groupimport_enablesimplifiedview');
    await expect(checkbox).toBeVisible();
    await focusContract(checkbox, checkbox, false);
    await page.screenshot({path: testInfo.outputPath('admin-focus-checkbox.png'), fullPage: false});

    const select = root.locator('select[name="s_local_groupimport_participantprimarybadgefield"]');
    await expect(select).toBeVisible();
    await focusContract(select, select);
    await page.screenshot({path: testInfo.outputPath('admin-focus-select.png'), fullPage: false});

    const color = root.locator('input[name="s_local_groupimport_participantprimarybadgebgcolor"]');
    const colorShell = color.locator('xpath=ancestor::*[contains(@class, "local-groupimport-admin-settings__color-control")][1]');
    await expect(color).toBeVisible();
    await focusContract(color, colorShell);
    await page.screenshot({path: testInfo.outputPath('admin-focus-color.png'), fullPage: false});

    const save = root.locator('#adminsettings > .settingsform > .row:last-child button, #adminsettings > .settingsform > .row:last-child input[type="submit"]').first();
    await expect(save).toBeVisible();
    await focusContract(save, save);
    await page.screenshot({path: testInfo.outputPath('admin-focus-save.png'), fullPage: false});

    expect(consoleErrors).toEqual([]);
    await expectNoPageOverflow(page);
});

test('Inline and advanced-filter controls expose shared keyboard focus', async({page}, testInfo) => {
    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => consoleErrors.push(error.message));
    await login(page);
    await page.goto(new URL('/local/groupimport/manage.php?id=5', baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
    });

    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    const focusContract = async(control) => {
        await page.keyboard.press('Tab');
        await control.focus();
        await expect.poll(async() => control.evaluate(node => {
            const style = getComputedStyle(node);
            return style.outlineStyle !== 'none' && style.boxShadow !== 'none' &&
                style.borderColor.includes('138, 188, 227');
        })).toBe(true);
    };

    const createInput = root.locator(
        '[data-easystud-mobile-entity-region="groups"] .local-groupimport-easystud-create input[name="groupname"]:visible'
    ).first();
    await expect(createInput).toBeVisible();
    await focusContract(createInput);
    await page.screenshot({path: testInfo.outputPath('inline-focus-create.png'), fullPage: false});

    const renameToggle = root.locator('[data-easystud-rename-toggle]:visible').first();
    await expect(renameToggle).toBeVisible();
    await renameToggle.click();
    const renameInput = root.locator('.local-groupimport-easystud-rename__edit input[name="name"]:visible').first();
    await expect(renameInput).toBeVisible();
    await focusContract(renameInput);
    await page.screenshot({path: testInfo.outputPath('inline-focus-rename.png'), fullPage: false});

    const structureMode = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
    await expect(structureMode).toBeVisible();
    await structureMode.click();
    const filterToggle = root.locator('[data-easystud-advanced-filters-toggle="structure-groups"]:visible').first();
    await expect(filterToggle).toBeVisible();
    await filterToggle.click();
    const filterSelect = root.locator('#local-groupimport-structure-catalog-grouping-filter:visible');
    await expect(filterSelect).toBeVisible();
    await focusContract(filterSelect);
    await page.screenshot({path: testInfo.outputPath('advanced-filter-focus-select.png'), fullPage: false});

    expect(consoleErrors).toEqual([]);
    await expectNoPageOverflow(page);
});

test('Structure card actions expose shared keyboard focus', async({page}, testInfo) => {
    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => consoleErrors.push(error.message));
    await login(page);
    await page.goto(new URL('/local/groupimport/manage.php?id=5', baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
    });

    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    const structureMode = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
    await expect(structureMode).toBeVisible();
    await structureMode.click();

    const focusContract = async(control) => {
        await page.keyboard.press('Tab');
        await control.focus();
        await expect.poll(async() => control.evaluate(node => {
            const style = getComputedStyle(node);
            return style.outlineStyle !== 'none' && style.boxShadow !== 'none' &&
                style.borderColor.includes('138, 188, 227');
        })).toBe(true);
    };

    for (const [name, selector] of [
        ['duplicate', '.local-groupimport-easystud-group__duplicate-button:visible'],
        ['member-search', '.local-groupimport-easystud-group__member-search-button:visible'],
        ['settings', '.local-groupimport-easystud-group__settings-button:visible'],
    ]) {
        const control = root.locator(selector).first();
        await expect(control, `${name} action is present`).toBeVisible();
        await focusContract(control);
        await page.screenshot({path: testInfo.outputPath(`structure-focus-${name}.png`), fullPage: false});
    }

    expect(consoleErrors).toEqual([]);
    await expectNoPageOverflow(page);
});

test('keeps the EasyStud administration skeleton and shared bottom-end indicator contract', async({page}) => {
    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => consoleErrors.push(error.message));
    await login(page, {expectMassImport: false});
    await page.goto(new URL('/admin/settings.php?section=local_groupimport', baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
    });
    const initialObservedAt = await page.evaluate(() => performance.now());

    const root = page.locator('#page-admin-setting-local_groupimport');
    const skeleton = root.locator('[data-easystud-loading-skeleton]');
    const initialLoading = await page.evaluate(() => {
        const pageRoot = document.querySelector('#page-admin-setting-local_groupimport');
        const loadingSkeleton = pageRoot && pageRoot.querySelector('[data-easystud-loading-skeleton]');
        const skeletonHeading = loadingSkeleton && loadingSkeleton.closest('.formsettingheading');
        const skeletonFieldset = skeletonHeading && skeletonHeading.parentElement;
        return {
            state: pageRoot ? pageRoot.getAttribute('data-easystud-loading-state') : null,
            hidden: loadingSkeleton ? loadingSkeleton.hidden : null,
            display: loadingSkeleton ? getComputedStyle(loadingSkeleton).display : null,
            visibleNativeChildren: skeletonFieldset ? Array.from(skeletonFieldset.children).filter(node =>
                node !== skeletonHeading && !node.hidden && getComputedStyle(node).display !== 'none'
            ).length : null,
            fieldsetMatchesFirst: skeletonFieldset ? skeletonFieldset.matches(
                '#adminsettings > .settingsform > fieldset:first-of-type'
            ) : false,
            fieldsetIndex: skeletonFieldset && skeletonFieldset.parentElement ?
                Array.from(skeletonFieldset.parentElement.children).indexOf(skeletonFieldset) : -1,
            fieldsetParent: skeletonFieldset && skeletonFieldset.parentElement ? {
                tag: skeletonFieldset.parentElement.tagName,
                id: skeletonFieldset.parentElement.id,
                className: skeletonFieldset.parentElement.className,
            } : null,
            visibleNativeClasses: skeletonFieldset ? Array.from(skeletonFieldset.children).filter(node =>
                node !== skeletonHeading && !node.hidden && getComputedStyle(node).display !== 'none'
            ).map(node => node.className) : [],
        };
    });
    expect(initialLoading.state).toBe('loading');
    expect(initialLoading.hidden).toBe(false);
    expect(initialLoading.display).toBe('grid');
    expect(initialLoading.visibleNativeChildren, JSON.stringify(initialLoading)).toBe(0);
    await expect(skeleton.locator('.local-groupimport-admin-settings__loading-section')).toHaveCount(3);
    await expect(skeleton.locator('.local-groupimport-admin-settings__loading-form-row')).toHaveCount(10);
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 30000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    await expect(skeleton).toBeHidden();
    const revealElapsed = await page.evaluate(startedAt => performance.now() - startedAt, initialObservedAt);
    expect(revealElapsed).toBeGreaterThanOrEqual(1100);
    await expect(root.locator('[data-local-groupimport-admin-features]')).toBeVisible();

    await skeleton.evaluate(node => {
        node.hidden = false;
        node.style.display = 'grid';
    });
    const skeletonAnimation = await skeleton.locator(
        '.local-groupimport-admin-settings__loading-surface'
    ).first().evaluate(node => getComputedStyle(node).animationName);
    await root.evaluate(node => node.classList.add('is-action-busy'));
    await page.waitForTimeout(40);
    try {
        const contract = await page.evaluate(() => {
            const root = document.querySelector('#page-admin-setting-local_groupimport');
            const spinner = getComputedStyle(root, '::after');
            const label = getComputedStyle(root, '::before');
            return {
                spinnerAnimation: spinner.animationName,
                spinnerPosition: spinner.position,
                spinnerBottom: spinner.bottom,
                spinnerRight: spinner.right,
                labelContent: label.content,
            };
        });

        expect(skeletonAnimation).toContain('local-groupimport-easystud-loading-shimmer-v4');
        expect(contract.spinnerAnimation).toContain('easyedu-busy-spin');
        expect(contract.spinnerPosition).toBe('fixed');
        expect(contract.spinnerBottom).not.toBe('auto');
        expect(contract.spinnerRight).not.toBe('auto');
        expect(contract.labelContent).toContain('Loading in progress');
    } finally {
        await root.evaluate(node => node.classList.remove('is-action-busy'));
        await skeleton.evaluate(node => {
            node.hidden = true;
            node.style.removeProperty('display');
        });
    }
    await expectNoPageOverflow(page);
    expect(consoleErrors).toEqual([]);
});
