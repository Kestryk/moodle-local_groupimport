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
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this geometry scenario.');
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

const rectangle = node => {
    const bounds = node.getBoundingClientRect();
    return {
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
    };
};

const centreY = bounds => (bounds.top + bounds.bottom) / 2;

test('nested Group member count and compact actions remain separate at responsive widths', async({page}, testInfo) => {
    test.setTimeout(180000);
    const root = await login(page);

    for (const width of [320, 390, 400, 768, 1280]) {
        await page.setViewportSize({width, height: 900});
        if (width <= 1024) {
            await page.locator('[data-easystud-mobile-view="groupings"]').click();
            await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groupings');
        } else {
            const completeView = root.locator('[data-easystud-layout-mode="both"]');
            if ((await completeView.getAttribute('aria-pressed')) !== 'true') {
                await completeView.click();
            }
            await expect(completeView).toHaveAttribute('aria-pressed', 'true');
        }

        const grouping = root.locator(
            '[data-easystud-tree] [data-easystud-grouping-id]:has(.local-groupimport-easystud-group):visible'
        ).first();
        await expect(grouping).toBeVisible();
        const groupingHeader = grouping.locator(':scope > .local-groupimport-easystud-grouping__header');
        const groupingToggle = grouping.locator(
            ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
        );
        if ((await groupingToggle.getAttribute('aria-expanded')) !== 'true') {
            await groupingToggle.click();
        }
        const groupingSelector = grouping.locator(':scope > .local-groupimport-easystud-selector');
        const groupingSelectionUi = groupingSelector.locator(':scope > .local-groupimport-easystud-selector__ui');
        const groupingGeometry = await Promise.all([
            groupingSelector.evaluate(rectangle),
            groupingSelectionUi.evaluate(rectangle),
            groupingHeader.evaluate(rectangle),
            groupingToggle.evaluate(rectangle),
        ]);
        const [groupingSelection, groupingSelectionUiBounds, groupingHeaderBounds, groupingToggleBounds] = groupingGeometry;
        expect(
            Math.abs(centreY(groupingSelectionUiBounds) - centreY(groupingToggleBounds)),
            `${width}px: Grouping checkbox square aligns with its title line`
        ).toBeLessThanOrEqual(2);

        const group = grouping.locator(
            ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]:visible'
        ).first();
        const header = group.locator(':scope > .local-groupimport-easystud-group__header');
        const groupSelector = group.locator(':scope > .local-groupimport-easystud-selector');
        const groupSelectionUi = groupSelector.locator(':scope > .local-groupimport-easystud-selector__ui');
        const groupName = header.locator(':scope > .local-groupimport-easystud-group__name');
        const badge = header.locator(':scope > .badge');
        const actions = header.locator(':scope > [data-easystud-group-actions-toggle]:visible');
        await expect(group).toBeVisible();
        await expect(actions).toBeVisible();

        const compactPhone = width <= 400;
        if (compactPhone) {
            await expect(grouping.locator(':scope > .local-groupimport-easystud-grouping__header .badge')).toBeHidden();
            await expect(badge).toBeHidden();
            await expect(grouping.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-container-search-toggle]')).toBeHidden();
            await expect(grouping.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-toggle-grouping-groups]')).toBeHidden();
        } else {
            await expect(badge).toBeVisible();
        }

        const memberRows = group.locator(
            ':scope > .local-groupimport-easystud-group__members > .local-groupimport-easystud-member:visible'
        );
        await expect(memberRows.first()).toBeVisible();

        const geometry = await Promise.all([
            group.evaluate(rectangle),
            groupSelector.evaluate(rectangle),
            groupSelectionUi.evaluate(rectangle),
            header.evaluate(rectangle),
            groupName.evaluate(rectangle),
            actions.evaluate(rectangle),
            page.evaluate(() => ({
                documentWidth: document.documentElement.scrollWidth,
                viewportWidth: window.innerWidth,
            })),
            memberRows.evaluateAll(nodes => nodes.map(node => {
                const bounds = node.getBoundingClientRect();
                return {
                    bottom: bounds.bottom,
                    height: bounds.height,
                    left: bounds.left,
                    right: bounds.right,
                    top: bounds.top,
                    width: bounds.width,
                };
            })),
        ]);
        const [card, groupSelection, groupSelectionUiBounds, headerBounds, groupNameBounds, action, pageGeometry, memberRowBounds] = geometry;
        const count = compactPhone ? null : await badge.evaluate(rectangle);
        const groupNameMetrics = await groupName.evaluate(node => ({
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            text: node.textContent.trim(),
        }));
        console.log(`NESTED_GROUP_CARD_ALIGNMENT_${width}:`, JSON.stringify({
            grouping: {selector: groupingSelection, ui: groupingSelectionUiBounds, header: groupingHeaderBounds, toggle: groupingToggleBounds},
            group: {card, selector: groupSelection, ui: groupSelectionUiBounds, header: headerBounds, name: groupNameBounds, nameMetrics: groupNameMetrics, count, action, memberRows: memberRowBounds},
            pageGeometry,
        }));

        await page.screenshot({
            path: testInfo.outputPath(`nested-group-card-action-count-${width}.png`),
            fullPage: false,
        });

        if (!compactPhone) {
            const controlsDoNotOverlap = count.right <= action.left - 4 ||
                action.right <= count.left - 4 ||
                count.bottom <= action.top - 4 ||
                action.bottom <= count.top - 4;
            expect(controlsDoNotOverlap, `${width}px: member count and compact actions do not overlap`).toBe(true);
            expect(count.right, `${width}px: member count stays before compact actions`).toBeLessThanOrEqual(action.left - 4);
        }
        expect(
            Math.abs(centreY(groupSelectionUiBounds) - centreY(groupNameBounds)),
            `${width}px: Group checkbox square aligns with its title line`
        ).toBeLessThanOrEqual(2);
        expect(
            Math.abs(centreY(action) - centreY(groupNameBounds)),
            `${width}px: Group actions trigger aligns with its title line`
        ).toBeLessThanOrEqual(2);
        if (compactPhone) {
            const groupNameFits = await groupName.evaluate(node => node.scrollWidth <= node.clientWidth);
            expect(groupNameFits, `${width}px: nested Group name remains fully visible`).toBe(true);
        }
        expect(action.left, `${width}px: compact actions stay inside the Group card`).toBeGreaterThanOrEqual(card.left - 1);
        expect(action.right, `${width}px: compact actions stay inside the Group card`).toBeLessThanOrEqual(card.right + 1);
        for (const [index, member] of memberRowBounds.entries()) {
            expect(member.left, `${width}px: member row ${index + 1} stays inside the Group card`).toBeGreaterThanOrEqual(card.left - 1);
            expect(member.right, `${width}px: member row ${index + 1} stays inside the Group card`).toBeLessThanOrEqual(card.right + 1);
        }
        expect(pageGeometry.documentWidth, `${width}px: no horizontal document overflow`).toBeLessThanOrEqual(
            pageGeometry.viewportWidth + 2
        );

        await actions.click();
        await expect(actions).toHaveAttribute('aria-expanded', 'true');
        await expect(root.locator('[data-easystud-context-menu]:not([hidden])')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(actions).toHaveAttribute('aria-expanded', 'false');
    }
});
