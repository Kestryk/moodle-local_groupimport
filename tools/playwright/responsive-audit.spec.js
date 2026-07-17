const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

test.setTimeout(60000);

const login = async page => {
    page.on('pageerror', error => console.log('PAGE_ERROR:', error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            console.log('CONSOLE_ERROR:', message.text());
        }
    });
    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the responsive audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
};

const assertNoHorizontalOverflow = async page => {
    const overflow = await page.evaluate(() => {
        const root = document.querySelector('#local-groupimport-easystud');
        return {
            document: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
            root: getComputedStyle(root).overflowX === 'visible' && root.scrollWidth > root.clientWidth + 2,
        };
    });
    expect(overflow.document).toBe(false);
    expect(overflow.root).toBe(false);
};

const assertMobileView = async(page, view) => {
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', view);
    await expect(page.locator(`[data-easystud-mobile-view="${view}"]`)).toHaveAttribute('aria-pressed', 'true');
    if (view === 'participants') {
        await expect(page.locator('[data-easystud-participants-panel]')).toBeVisible();
        await expect(page.locator('[data-easystud-structure-panel]')).toBeHidden();
    } else {
        await expect(page.locator('[data-easystud-participants-panel]')).toBeHidden();
        await expect(page.locator('[data-easystud-structure-panel]')).toBeVisible();
    }
    if (view !== 'participants') {
        const activeRegion = page.locator(`[data-easystud-mobile-entity-region="${view}"]:visible`);
        await expect(activeRegion.first()).toBeVisible();
        const other = view === 'groups' ? 'groupings' : 'groups';
        await expect(page.locator(`[data-easystud-mobile-entity-region="${other}"]:visible`)).toHaveCount(0);
    }
};

for (const viewport of [
    {name: 'tablet-landscape', width: 1024, height: 768},
    {name: 'tablet-portrait', width: 768, height: 1024},
    {name: 'phone', width: 390, height: 844},
]) {
    test(`responsive entity workspaces at ${viewport.name}`, async({page}) => {
        await page.setViewportSize({width: viewport.width, height: viewport.height});
        await login(page);

        await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeVisible();
        const navTrigger = page.locator('[data-easystud-mobile-nav-open]');
        await expect(navTrigger).toBeVisible();
        await navTrigger.click();
        await expect(page.locator('[data-easystud-mobile-nav-panel]')).toHaveClass(/is-open/);
        await expect(page.locator(
            '[data-easystud-mobile-nav-panel] .easyedu-admin-primary-nav__actions ' +
            '.local-groupimport-easystud-mobile-nav-section__link'
        )).toHaveCount(4);
        expect(await page.locator('[data-easystud-mobile-moodle-nav] a').count()).toBeGreaterThan(4);
        await page.locator('[data-easystud-mobile-nav-close]').click();
        await expect(page.locator('[data-easystud-mobile-nav-panel]')).not.toHaveClass(/is-open/);
        await assertMobileView(page, 'participants');
        await expect(page.locator('.local-groupimport-easystud__layout-mode-group')).toBeHidden();
        await expect(page.locator('[data-easystud-mobile-guide-slot] [data-easyedu-guide-open]')).toBeVisible();

        await page.locator('[data-easystud-mobile-view="groups"]').click();
        await assertMobileView(page, 'groups');
        await expect(page.locator('.local-groupimport-easystud-tree__section--ungrouped:visible')).toHaveCount(0);
        await expect(page.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').first()).toBeVisible();
        await expect(page.locator('[data-easystud-advanced-filters-toggle="structure-groups"]')).toBeVisible();
        await expect(page.locator('[data-easystud-advanced-filters="structure-groups"]')).toBeHidden();
        const groupFiltersToggle = page.locator('[data-easystud-advanced-filters-toggle="structure-groups"]');
        expect(await groupFiltersToggle.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
        await groupFiltersToggle.click();
        await expect(page.locator('[data-easystud-advanced-filters="structure-groups"]')).toBeVisible();
        await page.locator('[data-easystud-mobile-view="groupings"]').click();
        await assertMobileView(page, 'groupings');
        await expect(page.locator('.local-groupimport-easystud-tree__section--ungrouped:visible')).toHaveCount(0);
        await expect(page.locator('[data-easystud-advanced-filters-toggle="structure-groupings"]')).toBeVisible();
        await expect(page.locator('[data-easystud-advanced-filters="structure-groupings"]')).toBeHidden();
        const groupingFiltersToggle = page.locator('[data-easystud-advanced-filters-toggle="structure-groupings"]');
        expect(await groupingFiltersToggle.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
        await groupingFiltersToggle.click();
        await expect(page.locator('[data-easystud-advanced-filters="structure-groupings"]')).toBeVisible();
        await page.locator('[data-easystud-mobile-view="participants"]').click();
        await assertMobileView(page, 'participants');
        await assertNoHorizontalOverflow(page);
    });
}

test('mobile card menu and selection tray use accessible touch targets', async({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await login(page);

    const participant = page.locator('[data-easystud-user]:visible').first();
    await expect(participant).toBeVisible();
    const menuButton = participant.locator(':scope > [data-easystud-card-menu]');
    await expect(menuButton).toBeVisible();
    await expect(menuButton.locator('.local-groupimport-easystud-card-menu__icon.fa-bars')).toHaveCount(1);
    await menuButton.click();

    const sheet = page.locator('[data-easystud-context-menu].is-mobile-sheet');
    await expect(sheet).toBeVisible();
    const geometry = await sheet.evaluate(node => ({
        bottom: Math.round(node.getBoundingClientRect().bottom),
        viewport: window.innerHeight,
        minActionHeight: Math.min(...Array.from(node.querySelectorAll('[role="menuitem"]:not([hidden])'))
            .map(action => action.getBoundingClientRect().height)),
    }));
    expect(Math.abs(geometry.viewport - geometry.bottom)).toBeLessThanOrEqual(2);
    expect(geometry.minActionHeight).toBeGreaterThanOrEqual(44);
    await sheet.locator('[data-easystud-context-close]').click();
    await expect(sheet).toBeHidden();
    await expect(menuButton).toBeFocused();

    await participant.dispatchEvent('pointerdown', {pointerType: 'touch', button: 0, clientX: 80, clientY: 320});
    await page.waitForTimeout(600);
    await participant.dispatchEvent('pointerup', {pointerType: 'touch', button: 0, clientX: 80, clientY: 320});
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(120);
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    const selector = participant.locator('[data-easystud-selector-input]');
    await selector.evaluate(input => input.click());
    await expect(page.locator('[data-easystud-mobile-actions]')).toBeVisible();
    await expect(participant.locator('.local-groupimport-easystud-user__details')).toBeHidden();

    const railWidth = await participant.evaluate(node => getComputedStyle(node)
        .getPropertyValue('--local-groupimport-easystud-identity-border-width').trim());
    expect(railWidth).toBe('1.28rem');
});

test('desktop layouts and guide launcher remain available', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);
    await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeHidden();
    await expect(page.locator('[data-easystud-desktop-primary-nav]')).toBeVisible();
    await expect(page.locator('[data-easystud-desktop-primary-nav] ' +
        '.easyedu-admin-primary-nav__actions > *')).toHaveCount(4);
    await expect(page.locator('[data-easystud-mobile-nav-panel]')).toBeHidden();
    await expect(page.locator('.local-groupimport-easystud__layout-mode-group')).toBeVisible();
    await expect(page.locator('[data-easystud-participants-panel]')).toBeVisible();
    await expect(page.locator('[data-easystud-structure-panel]')).toBeVisible();
    const participant = page.locator('[data-easystud-user]:visible').first();
    const detailsButton = participant.locator('.local-groupimport-easystud-user__detail-button');
    const compactPosition = await detailsButton.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return {top: rect.top, right: rect.right};
    });
    await participant.locator('[data-easystud-selector-input]').evaluate(input => input.click());
    await page.waitForTimeout(650);
    const expandedPosition = await detailsButton.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return {top: rect.top, right: rect.right};
    });
    expect(Math.abs(expandedPosition.top - compactPosition.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(expandedPosition.right - compactPosition.right)).toBeLessThanOrEqual(1);
    await participant.locator('[data-easystud-selector-input]').evaluate(input => input.click());
    await expect(page.locator('[data-easystud-advanced-filters-toggle="structure-groups"]')).toBeHidden();
    await expect(page.locator('[data-easystud-advanced-filters-toggle="structure-groupings"]')).toBeHidden();
    await page.locator('[data-easystud-layout-mode="structure"]').click();
    await expect(page.locator('[data-easystud-advanced-filters-toggle="structure-groups"]')).toBeVisible();
    // Grouping occupancy is a mobile-only filter; desktop keeps its original search-only panel.
    await expect(page.locator('[data-easystud-advanced-filters-toggle="structure-groupings"]')).toBeHidden();
    await page.locator('[data-easystud-advanced-filters-toggle="structure-groups"]').click();
    await expect(page.locator('[data-easystud-advanced-filters="structure-groups"]')).toBeVisible();
    await expect(page.locator('[data-easystud-advanced-filters="structure-groupings"]')).toBeHidden();
    await assertNoHorizontalOverflow(page);
});

test('orientation changes preserve one active mobile workspace', async({page}) => {
    await page.setViewportSize({width: 768, height: 1024});
    await login(page);
    await page.locator('[data-easystud-mobile-view="groups"]').click();
    await assertMobileView(page, 'groups');
    await page.setViewportSize({width: 1024, height: 768});
    await assertMobileView(page, 'groups');
    await assertNoHorizontalOverflow(page);
});

test('mobile navigation, group tools and grouping cards remain contained', async({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await login(page);

    await page.locator('[data-easystud-mobile-nav-open]').click();
    const nav = page.locator('[data-easystud-mobile-nav-panel]');
    await expect(nav).toHaveClass(/is-open/);
    await expect(nav.locator('.easyedu-admin-primary-nav__actions ' +
        '.local-groupimport-easystud-mobile-nav-section__link')).toHaveCount(4);
    await page.locator('[data-easystud-mobile-nav-close]').click();
    await expect(page.locator('[data-easystud-mobile-guide-slot] [data-easyedu-guide-open]')).toBeVisible();

    await page.locator('[data-easystud-mobile-view="groups"]').click();
    const topPagination = page.locator('[data-easystud-mobile-entity-region="groups"] ' +
        '[data-easystud-pagination="top"]:visible').first();
    if (await topPagination.count()) {
        const row = await topPagination.evaluate(node => {
            const selection = node.querySelector('.local-groupimport-easystud-pagination__selection');
            const controls = node.querySelector('.local-groupimport-easystud-pagination__controls');
            const tools = node.querySelector('.local-groupimport-easystud-pagination__tools');
            return [selection, controls, tools].map(item => Math.round(item.getBoundingClientRect().top));
        });
        expect(Math.max(...row) - Math.min(...row)).toBeLessThanOrEqual(4);
    }

    await page.locator('[data-easystud-mobile-view="groupings"]').click();
    const grouping = page.locator('[data-easystud-grouping-id]:visible').first();
    if (await grouping.count()) {
        const bounds = await grouping.evaluate(node => {
            const rect = node.getBoundingClientRect();
            return {left: rect.left, right: rect.right, viewport: window.innerWidth};
        });
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1);

        const groupingToggle = grouping.locator(':scope > .local-groupimport-easystud-grouping__header ' +
            '[data-easystud-collapse-toggle]');
        if (await groupingToggle.count() && await groupingToggle.getAttribute('aria-expanded') !== 'true') {
            await groupingToggle.click();
        }

        const nestedGroup = grouping.locator(':scope > .local-groupimport-easystud-tree__children ' +
            '> [data-easystud-group-id]').first();
        if (await nestedGroup.count()) {
            await expect(nestedGroup.locator('[data-easystud-card-menu]')).toHaveCount(1);
            await nestedGroup.locator('[data-easystud-card-menu]').click();
            const rename = page.locator('[data-easystud-context-action="group-focus-rename"]:visible');
            if (await rename.count()) {
                await rename.click();
                const edit = nestedGroup.locator('.local-groupimport-easystud-rename__edit');
                await expect(edit).toBeVisible();
                await edit.locator('[data-easystud-rename-cancel]').click({force: true});
                await expect(edit).toBeHidden();
            }
        }
    }
    const clearSelection = page.locator('[data-easystud-clear-all-selection]:visible').first();
    if (await clearSelection.count()) {
        await clearSelection.click();
    }
    // This view can fit entirely in the viewport with a small fixture. Give the
    // document enough height to exercise the page-level back-to-top contract.
    await page.evaluate(() => {
        document.body.style.minHeight = '1800px';
        window.scrollTo(0, 700);
    });
    const backToTop = page.locator('[data-easystud-back-to-top]');
    await expect(backToTop).toBeVisible();
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
    await assertNoHorizontalOverflow(page);
});
