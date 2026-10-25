const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

test.setTimeout(60000);

const login = async page => {
    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the card audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
};

test('card title hierarchy and grouping disclosure remain stable', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);

    const participantTitle = page.locator('.local-groupimport-easystud-user__name:visible').first();
    await expect(participantTitle).toBeVisible();
    const participantMetrics = await participantTitle.evaluate(node => {
        const style = getComputedStyle(node);
        const bounds = node.getBoundingClientRect();
        return {
            fontSize: parseFloat(style.fontSize),
            fontWeight: parseInt(style.fontWeight, 10),
            width: bounds.width,
            parentWidth: node.parentElement.getBoundingClientRect().width,
        };
    });

    await page.locator('[data-easystud-layout-mode="structure"]').click();

    const groupTitle = page.locator('.local-groupimport-easystud-group__name:visible').first();
    const groupingTitle = page.locator('.local-groupimport-easystud-grouping__name:visible').first();

    await expect(groupTitle).toBeVisible();
    await expect(groupingTitle).toBeVisible();

    const titleMetrics = [participantMetrics, ...await Promise.all([groupTitle, groupingTitle].map(locator =>
        locator.evaluate(node => {
            const style = getComputedStyle(node);
            const bounds = node.getBoundingClientRect();
            return {
                fontSize: parseFloat(style.fontSize),
                fontWeight: parseInt(style.fontWeight, 10),
                width: bounds.width,
                parentWidth: node.parentElement.getBoundingClientRect().width,
            };
        })
    ))];

    expect(titleMetrics[0].fontSize).toBeLessThan(titleMetrics[1].fontSize);
    expect(titleMetrics[1].fontSize).toBeLessThanOrEqual(titleMetrics[2].fontSize);
    expect(titleMetrics[0].fontWeight).toBeGreaterThanOrEqual(600);
    expect(titleMetrics[1].fontWeight).toBeGreaterThanOrEqual(600);
    expect(titleMetrics[2].fontWeight).toBeGreaterThanOrEqual(700);
    titleMetrics.forEach(metric => expect(metric.width).toBeLessThanOrEqual(metric.parentWidth + 1));

    const disclosure = groupingTitle.locator('xpath=parent::button');
    const disclosureIcon = disclosure.locator(':scope > .fa');
    const controlledId = await disclosure.getAttribute('aria-controls');
    expect(controlledId).toBeTruthy();
    await expect(disclosureIcon).not.toHaveCSS('color', 'rgb(0, 0, 0)');
    const controlled = page.locator(`#${controlledId}`);

    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(disclosureIcon).not.toHaveCSS('transform', 'none');
    await expect(controlled).toBeVisible();
});

test('card selectors align with titles without consuming the title gap', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);

    const measure = async(card, titleSelector) => card.evaluate((node, selector) => {
        const target = node.querySelector(':scope > .local-groupimport-easystud-selector').getBoundingClientRect();
        const square = node.querySelector(
            ':scope > .local-groupimport-easystud-selector .local-groupimport-easystud-selector__ui'
        ).getBoundingClientRect();
        const title = node.querySelector(selector).getBoundingClientRect();
        return {
            centreDelta: Math.abs((square.top + square.height / 2) - (title.top + title.height / 2)),
            targetGap: title.left - target.right,
        };
    }, titleSelector);

    const participant = page.locator('[data-easystud-user]:visible').first();
    const compactParticipantGeometry = await measure(participant, '.local-groupimport-easystud-user__name');

    await page.locator('[data-easystud-density-toggle]').click();
    await expect(page.locator('#local-groupimport-easystud')).not.toHaveClass(
        /local-groupimport-easystud--compact-users/
    );
    const detailedParticipantGeometry = await measure(participant, '.local-groupimport-easystud-user__name');
    const detailedParticipantLine = await participant.evaluate(node => {
        const centre = selector => {
            const bounds = node.querySelector(selector).getBoundingClientRect();
            return bounds.top + bounds.height / 2;
        };
        return [
            centre(':scope > .local-groupimport-easystud-selector .local-groupimport-easystud-selector__ui'),
            centre('.local-groupimport-easystud-user__name'),
            centre('.local-groupimport-easystud-user__detail-button'),
        ];
    });

    await page.locator('[data-easystud-layout-mode="structure"]').click();

    const group = page.locator(
        '.local-groupimport-easystud-structure-groups__list > [data-easystud-group-id]:visible'
    ).first();
    const grouping = page.locator(
        '.local-groupimport-easystud-tree__groupings > [data-easystud-grouping-id]:visible'
    ).first();
    const groupGeometry = await measure(group, '.local-groupimport-easystud-group__name');
    const groupingGeometry = await measure(grouping, '.local-groupimport-easystud-grouping__name');
    const cardHeaderLines = await Promise.all([
        group.evaluate(node => {
            const centre = selector => {
                const bounds = node.querySelector(selector).getBoundingClientRect();
                return bounds.top + bounds.height / 2;
            };
            return [
                centre(':scope > .local-groupimport-easystud-selector .local-groupimport-easystud-selector__ui'),
                centre('.local-groupimport-easystud-group__name'),
                centre('.badge'),
                centre('.local-groupimport-easystud-group__mail-button'),
            ];
        }),
        grouping.evaluate(node => {
            const centre = selector => {
                const bounds = node.querySelector(selector).getBoundingClientRect();
                return bounds.top + bounds.height / 2;
            };
            return [
                centre(':scope > .local-groupimport-easystud-selector .local-groupimport-easystud-selector__ui'),
                centre('.local-groupimport-easystud-tree__toggle > .fa'),
                centre('.local-groupimport-easystud-grouping__name'),
                centre('.badge'),
                centre('.local-groupimport-easystud-container-search__toggle'),
            ];
        }),
    ]);

    [compactParticipantGeometry, detailedParticipantGeometry, groupGeometry, groupingGeometry].forEach(geometry => {
        expect(geometry.centreDelta).toBeLessThanOrEqual(4);
        expect(geometry.targetGap).toBeGreaterThanOrEqual(4);
    });
    [detailedParticipantLine, ...cardHeaderLines].forEach(centres => {
        expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(1);
    });

    const selectAll = page.locator(
        '.local-groupimport-easystud-tree ' +
        '.local-groupimport-easystud-pagination--top [data-easystud-select-results]:visible'
    ).first();
    await expect(selectAll).toHaveCSS('align-items', 'center');
    await expect(selectAll).toHaveCSS('justify-content', 'center');
    const selectAllLabel = selectAll.locator('[data-easystud-select-results-label]');
    await expect(selectAllLabel).toBeVisible();
    const selectGeometry = await selectAll.evaluate(select => {
        const label = select.querySelector('[data-easystud-select-results-label]');
        const range = document.createRange();
        const textNode = label.firstChild;
        range.selectNodeContents(textNode);
        const button = select.getBoundingClientRect();
        const text = range.getBoundingClientRect();
        return {
            horizontalDelta: Math.abs(
                (button.left + button.width / 2) - (text.left + text.width / 2)
            ),
            verticalDelta: Math.abs(
                (button.top + button.height / 2) - (text.top + text.height / 2)
            ),
        };
    });
    const navigationGap = await page.evaluate(() => {
        const navigation = document.querySelector(
            '.local-groupimport-easystud__header-actions--desktop'
        ).getBoundingClientRect();
        const toggles = document.querySelector(
            '.local-groupimport-easystud__layout-toggles'
        ).getBoundingClientRect();
        return toggles.top - navigation.bottom;
    });
    const paginationGeometry = await selectAll.evaluate(select => {
        const pagination = select.closest('[data-easystud-pagination]');
        const centre = selector => {
            const bounds = pagination.querySelector(selector).getBoundingClientRect();
            return bounds.top + bounds.height / 2;
        };
        return {
            centres: [
                centre('[data-easystud-select-results]'),
                centre('.local-groupimport-easystud-pagination__controls'),
                centre('.local-groupimport-easystud-pagination__sort'),
            ],
            selectColour: getComputedStyle(select).color,
            selectLabelColour: getComputedStyle(
                select.querySelector('[data-easystud-select-results-label]')
            ).color,
            sortLabelColour: getComputedStyle(
                pagination.querySelector('.local-groupimport-easystud-pagination__sort > span')
            ).color,
        };
    });
    expect(navigationGap).toBeGreaterThanOrEqual(38);
    expect(selectGeometry.horizontalDelta).toBeLessThanOrEqual(1);
    expect(selectGeometry.verticalDelta).toBeLessThanOrEqual(2);
    expect(Math.max(...paginationGeometry.centres) - Math.min(...paginationGeometry.centres))
        .toBeLessThanOrEqual(1);
    expect(paginationGeometry.selectLabelColour).toBe(paginationGeometry.selectColour);
    expect(paginationGeometry.selectColour).not.toBe('rgb(106, 115, 123)');
    expect(paginationGeometry.sortLabelColour).not.toBe('rgb(97, 116, 135)');
});

test('card selectors keep semantic colour and touch target', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);

    const participant = page.locator('[data-easystud-user]:visible').first();
    const selector = participant.locator(':scope > .local-groupimport-easystud-selector');
    const input = selector.locator('input[type="checkbox"]');
    const visual = selector.locator('.local-groupimport-easystud-selector__ui');

    await selector.click();
    await expect(input).toBeChecked();
    await expect(participant).toHaveClass(/is-selected/);

    const desktopGeometry = await selector.evaluate(node => {
        const target = node.getBoundingClientRect();
        const square = node.querySelector('.local-groupimport-easystud-selector__ui').getBoundingClientRect();
        return {
            targetHeight: target.height,
            targetWidth: target.width,
            squareHeight: square.height,
            squareWidth: square.width,
        };
    });
    expect(desktopGeometry.targetHeight).toBeGreaterThanOrEqual(32);
    expect(desktopGeometry.targetWidth).toBeGreaterThanOrEqual(32);
    expect(desktopGeometry.squareHeight).toBeLessThan(desktopGeometry.targetHeight);
    expect(desktopGeometry.squareWidth).toBeLessThan(desktopGeometry.targetWidth);

    const colours = await Promise.all([
        visual.evaluate(node => getComputedStyle(node).backgroundColor),
        participant.evaluate(node => getComputedStyle(node).getPropertyValue(
            '--local-groupimport-easystud-participant'
        ).trim()),
    ]);
    expect(colours[0]).not.toBe('rgba(0, 0, 0, 0)');
    expect(colours[1]).not.toBe('');

    await page.setViewportSize({width: 390, height: 844});
    const mobileSelector = page.locator(
        '[data-easystud-user]:visible > .local-groupimport-easystud-selector'
    ).first();
    const mobileGeometry = await mobileSelector.evaluate(node => {
        const target = node.getBoundingClientRect();
        const square = node.querySelector('.local-groupimport-easystud-selector__ui').getBoundingClientRect();
        return {
            targetHeight: target.height,
            targetWidth: target.width,
            squareHeight: square.height,
            squareWidth: square.width,
        };
    });
    expect(mobileGeometry.targetHeight).toBeGreaterThanOrEqual(44);
    expect(mobileGeometry.targetWidth).toBeGreaterThanOrEqual(44);
    expect(mobileGeometry.squareHeight).toBeLessThan(mobileGeometry.targetHeight);
    expect(mobileGeometry.squareWidth).toBeLessThan(mobileGeometry.targetWidth);
});
