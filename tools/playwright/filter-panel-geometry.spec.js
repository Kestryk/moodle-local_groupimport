const {test, expect} = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const rootSelector = '#local-groupimport-easystud';
const participantFiltersSelector = '.local-groupimport-easystud__filters';
const participantGroupsSelector = '.local-groupimport-easystud-participant-groups__create';
const participantListSelector = '.local-groupimport-easystud__participant-list';
const participantGroupsListSelector = '.local-groupimport-easystud-participant-groups__list';
const structureGroupsSelector = '.local-groupimport-easystud-create-card--group' +
    '[data-easystud-mobile-entity-region="groups"]';
const structureGroupingsSelector = '.local-groupimport-easystud-create-card--grouping' +
    '[data-easystud-mobile-entity-region="groupings"]';
const structureGroupsListSelector = '.local-groupimport-easystud-structure-groups__list';
const structureGroupingsListSelector = '.local-groupimport-easystud-tree__groupings';

test.describe.configure({timeout: 120000});

const login = async(page, runtimeErrors) => {
    page.on('pageerror', error => {
        const message = `PAGE_ERROR: ${error.message}`;
        runtimeErrors.push(message);
        console.log(message);
    });
    page.on('console', message => {
        if (message.type() === 'error') {
            const error = `CONSOLE_ERROR: ${message.text()}`;
            runtimeErrors.push(error);
            console.log(error);
        }
    });

    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the filter-panel geometry audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
    }

    const root = page.locator(rootSelector);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});

};

const waitForStableGeometry = async(page, selectors) => {
    let previous = null;
    let stableSamples = 0;

    await expect.poll(async() => {
        const sample = await page.locator(selectors.join(', ')).evaluateAll(nodes => nodes.map(node => {
            const rect = node.getBoundingClientRect();
            return {
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                clientHeight: node.clientHeight,
                scrollHeight: node.scrollHeight,
                hidden: node.hidden,
            };
        }));
        const valid = sample.length === selectors.length &&
            sample.every(item => !item.hidden && item.width > 0 && item.height > 0);
        const unchanged = valid && previous && sample.every((item, index) => {
            const prior = previous[index];
            return Object.keys(item).every(key => {
                if (typeof item[key] === 'boolean') {
                    return item[key] === prior[key];
                }
                return Math.abs(item[key] - prior[key]) <= 0.5;
            });
        });
        stableSamples = unchanged ? stableSamples + 1 : 0;
        previous = sample;
        return stableSamples;
    }, {
        message: `geometry did not stabilise for ${selectors.join(', ')}`,
        timeout: 5000,
        intervals: [50, 75, 100, 150, 200],
    }).toBeGreaterThanOrEqual(2);
};

const ensureParticipantMode = async page => {
    const root = page.locator(rootSelector);
    const toggle = page.locator('[data-easystud-layout-mode="participants"]');
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-pressed') !== 'true') {
        await toggle.click();
    }
    await expect(root).toHaveClass(/local-groupimport-easystud--participant-focus/);
    await expect(page.locator('[data-easystud-participant-groups-panel]')).toBeVisible();
};

const ensureStructureMode = async page => {
    const root = page.locator(rootSelector);
    const toggle = page.locator('[data-easystud-layout-mode="structure"]');
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-pressed') !== 'true') {
        await toggle.click();
    }
    await expect(root).toHaveClass(/local-groupimport-easystud--structure-focus/);
    await expect(page.locator('[data-easystud-structure-groups]')).toBeVisible();
};

const ensureOverviewMode = async page => {
    const root = page.locator(rootSelector);
    const toggle = page.locator('[data-easystud-layout-mode="both"]');
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-pressed') !== 'true') {
        await toggle.click();
    }
    await expect(root).not.toHaveClass(/local-groupimport-easystud--participant-focus/);
    await expect(root).not.toHaveClass(/local-groupimport-easystud--structure-focus/);
};

const selectResponsiveWorkspace = async(page, workspace) => {
    const root = page.locator(rootSelector);
    const toggle = page.locator(`[data-easystud-mobile-view="${workspace}"]`);
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-pressed') !== 'true') {
        await toggle.click();
    }
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', workspace);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    if (workspace === 'participants') {
        await expect(page.locator('[data-easystud-participants-panel]')).toBeVisible();
        await expect(page.locator('[data-easystud-structure-panel]')).toBeHidden();
    } else {
        await expect(page.locator('[data-easystud-participants-panel]')).toBeHidden();
        await expect(page.locator('[data-easystud-structure-panel]')).toBeVisible();
    }
};

const ensureExpanded = async(page, key, expectMotion = false) => {
    const toggle = page.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
    const panel = page.locator(`[data-easystud-advanced-filters="${key}"]`);
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-expanded') !== 'true') {
        await toggle.click();
        if (expectMotion) {
            await expect(panel).toHaveClass(/is-easyedu-disclosing/);
        }
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveClass(/is-expanded/);
    await expect(panel).toBeVisible();
};

const ensureCollapsed = async(page, key, expectMotion = false) => {
    const toggle = page.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
    const panel = page.locator(`[data-easystud-advanced-filters="${key}"]`);
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-expanded') !== 'false') {
        await toggle.click();
        if (expectMotion) {
            await expect(panel).toHaveClass(/is-easyedu-disclosing/);
        }
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
};

const expectSingleOpenGroupingRail = async(page, testInfo, viewportLabel) => {
    const grouping = page.locator(
        `${structureGroupingsListSelector} > [data-easystud-grouping-id]:visible`
    ).first();
    const toggle = grouping.locator(
        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
    );
    const children = grouping.locator(':scope > .local-groupimport-easystud-tree__children');

    await expect(grouping).toBeVisible();
    if (await toggle.getAttribute('aria-expanded') === 'true') {
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(children).toBeHidden();
    }
    const collapsed = await grouping.boundingBox();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(grouping).toHaveClass(/is-expanded/);
    await expect(children).toBeVisible();
    await expect(children).not.toHaveClass(/is-tree-animating/);
    await page.mouse.move(1, 1);

    const open = await grouping.boundingBox();
    const rail = await grouping.evaluate(node => {
        const card = getComputedStyle(node);
        const frame = getComputedStyle(node, '::after');
        const scrollHost = node.closest('[data-easystud-tree]');
        const cardRect = node.getBoundingClientRect();
        const scrollHostRect = scrollHost.getBoundingClientRect();
        const borderWidth = parseFloat(card.borderLeftWidth) || 0;
        const frameLeft = parseFloat(frame.left) || 0;
        const frameWidth = parseFloat(frame.width) || 0;
        return {
            borderColor: card.borderLeftColor,
            borderWidth,
            frameDocumentLeft: cardRect.left + frameLeft,
            frameBackground: frame.backgroundColor,
            frameDisplay: frame.display,
            frameLeft,
            frameWidth,
            scrollHostLeft: scrollHostRect.left,
        };
    });

    expect(
        Math.abs(open.width - collapsed.width),
        `${viewportLabel}: Grouping width`
    ).toBeLessThanOrEqual(1);
    expect(rail.frameDisplay, `${viewportLabel}: open frame display`).toBe('block');
    expect(
        Math.abs(rail.frameLeft + rail.borderWidth),
        `${viewportLabel}: open frame overlays the identity rail`
    ).toBeLessThanOrEqual(2);
    expect(
        Math.abs(rail.frameWidth - rail.borderWidth),
        `${viewportLabel}: one canonical rail width`
    ).toBeLessThanOrEqual(2);
    expect(
        rail.borderColor,
        `${viewportLabel}: base rail merges into open frame`
    ).toBe(rail.frameBackground);
    expect(
        rail.frameDocumentLeft - rail.scrollHostLeft,
        `${viewportLabel}: open frame has a left paint allowance`
    ).toBeGreaterThanOrEqual(1);

    await page.screenshot({
        path: testInfo.outputPath(`grouping-open-rail-${viewportLabel}.png`),
        fullPage: true,
    });

    // Restore the list state so this focused rail check cannot influence the
    // following Complete View/filter geometry assertions.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(children).toBeHidden();
};

const readWideGeometry = async page => page.evaluate((selectors) => {
    const root = document.querySelector(selectors.root);
    const participant = document.querySelector(selectors.participant);
    const groups = document.querySelector(selectors.groups);
    const participantToggle = document.querySelector(
        '[data-easystud-advanced-filters-toggle="participants"]'
    );
    const groupToggle = document.querySelector(
        '[data-easystud-advanced-filters-toggle="participant-groups"]'
    );
    const participantAdvanced = document.querySelector(
        '[data-easystud-advanced-filters="participants"]'
    );
    const groupAdvanced = document.querySelector(
        '[data-easystud-advanced-filters="participant-groups"]'
    );
    const rootRect = root.getBoundingClientRect();
    const rectangle = node => {
        const rect = node.getBoundingClientRect();
        return {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            centreY: rect.top + rect.height / 2,
            documentTop: rect.top + window.scrollY,
            localTop: rect.top - rootRect.top,
        };
    };
    const advancedState = (shell, advanced) => {
        const shellRect = shell.getBoundingClientRect();
        const advancedRect = advanced.getBoundingClientRect();
        return {
            contained: advancedRect.top >= shellRect.top - 2 &&
                advancedRect.bottom <= shellRect.bottom + 2,
            unclipped: advanced.scrollHeight <= advanced.clientHeight + 2,
        };
    };

    return {
        root: rectangle(root),
        participant: rectangle(participant),
        groups: rectangle(groups),
        participantList: rectangle(document.querySelector(selectors.participantList)),
        groupsList: rectangle(document.querySelector(selectors.groupsList)),
        participantToggle: rectangle(participantToggle),
        groupToggle: rectangle(groupToggle),
        participantAdvanced: advancedState(participant, participantAdvanced),
        groupAdvanced: advancedState(groups, groupAdvanced),
        documentOverflow: document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        rootOverflow: root.scrollWidth - root.clientWidth,
    };
}, {
    root: rootSelector,
    participant: participantFiltersSelector,
    groups: participantGroupsSelector,
    participantList: participantListSelector,
    groupsList: participantGroupsListSelector,
});

const readStructureGeometry = async page => page.evaluate((selectors) => {
    const rootRect = document.querySelector(selectors.root).getBoundingClientRect();
    const rectangle = selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return {
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            width: rect.width,
            documentTop: rect.top + window.scrollY,
            localTop: rect.top - rootRect.top,
        };
    };
    return {
        groups: rectangle(selectors.groups),
        groupings: rectangle(selectors.groupings),
        groupsList: rectangle(selectors.groupsList),
        groupingsList: rectangle(selectors.groupingsList),
    };
}, {
    root: rootSelector,
    groups: structureGroupsSelector,
    groupings: structureGroupingsSelector,
    groupsList: structureGroupsListSelector,
    groupingsList: structureGroupingsListSelector,
});

const readOverviewListGeometry = async page => page.evaluate((selectors) => {
    const participantList = document.querySelector(selectors.participantList);
    const tree = document.querySelector(selectors.tree);
    const firstVisible = (container, selector) => Array.from(
        container.querySelectorAll(selector)
    ).find(item => !item.hidden && item.offsetParent !== null);
    const participantEntry = firstVisible(
        participantList,
        '[data-easystud-user], [data-easystud-empty-state]'
    );
    const structureEntry = firstVisible(
        tree,
        '.local-groupimport-easystud-tree__section--ungrouped, ' +
            '.local-groupimport-easystud-tree__section[data-easystud-grouping-id], ' +
            '[data-easystud-empty-state]'
    );
    if (!participantEntry || !structureEntry) {
        throw new Error('Complete View requires visible participant and structure entries.');
    }
    const participantRect = participantEntry.getBoundingClientRect();
    const structureRect = structureEntry.getBoundingClientRect();
    return {
        participantTop: participantRect.top,
        structureTop: structureRect.top,
    };
}, {
    participantList: participantListSelector,
    tree: '[data-easystud-tree]',
});

const readResponsiveGeometry = async(page, shellSelector, key) => page.evaluate((selectors) => {
    const root = document.querySelector(selectors.root);
    const shell = document.querySelector(selectors.shell);
    const toggle = document.querySelector(
        `[data-easystud-advanced-filters-toggle="${selectors.key}"]`
    );
    const advanced = document.querySelector(
        `[data-easystud-advanced-filters="${selectors.key}"]`
    );
    const rootRect = root.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const advancedRect = advanced.getBoundingClientRect();
    const paddingBottom = parseFloat(getComputedStyle(shell).paddingBottom) || 0;
    const rootOverflowX = getComputedStyle(root).overflowX;

    return {
        shell: {
            top: shellRect.top,
            right: shellRect.right,
            bottom: shellRect.bottom,
            left: shellRect.left,
            width: shellRect.width,
            height: shellRect.height,
        },
        toggle: {
            top: toggleRect.top,
            right: toggleRect.right,
            bottom: toggleRect.bottom,
            left: toggleRect.left,
            width: toggleRect.width,
            height: toggleRect.height,
        },
        trailingSpace: shellRect.bottom - toggleRect.bottom - paddingBottom,
        advancedContained: advancedRect.top >= shellRect.top - 2 &&
            advancedRect.bottom <= shellRect.bottom + 2,
        advancedUnclipped: advanced.scrollHeight <= advanced.clientHeight + 2,
        withinRoot: shellRect.left >= rootRect.left - 2 &&
            shellRect.right <= rootRect.right + 2,
        withinViewport: shellRect.left >= -2 && shellRect.right <= window.innerWidth + 2,
        documentOverflow: document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        rootOverflow: root.scrollWidth - root.clientWidth,
        rootOverflowApplicable: rootOverflowX === 'visible',
    };
}, {
    root: rootSelector,
    shell: shellSelector,
    key,
});

const expectNoClippingOrOverflow = (geometry, viewportLabel) => {
    expect(geometry.participantAdvanced.contained, `${viewportLabel}: participant filters contained`).toBe(true);
    expect(geometry.participantAdvanced.unclipped, `${viewportLabel}: participant filters unclipped`).toBe(true);
    expect(geometry.groupAdvanced.contained, `${viewportLabel}: group filters contained`).toBe(true);
    expect(geometry.groupAdvanced.unclipped, `${viewportLabel}: group filters unclipped`).toBe(true);
    expect(geometry.documentOverflow, `${viewportLabel}: document overflow`).toBeLessThanOrEqual(2);
    if (geometry.rootOverflowApplicable) {
        expect(geometry.rootOverflow, `${viewportLabel}: EasyStud root overflow`).toBeLessThanOrEqual(2);
    }
};

const expectPairedGeometry = (left, right, label) => {
    expect(Math.abs(left.top - right.top), `${label}: shell top delta`).toBeLessThanOrEqual(2);
    expect(Math.abs(left.height - right.height), `${label}: shell height delta`).toBeLessThanOrEqual(2);
    expect(Math.abs(left.bottom - right.bottom), `${label}: shell bottom delta`).toBeLessThanOrEqual(2);
};

const expectStableListBaselines = (before, after, label) => {
    expect(Math.abs(before.participantList.top - before.groupsList.top), `${label}: paired list top delta`).toBeLessThanOrEqual(2);
    expect(Math.abs(after.participantList.top - after.groupsList.top), `${label}: paired list top delta`).toBeLessThanOrEqual(2);
};

const expectShellUnmoved = (before, after, label) => {
    expect(Math.abs(before.localTop - after.localTop), `${label}: shell top remains fixed`).toBeLessThanOrEqual(2);
    // Chromium may round rem-based borders to the nearest 1/64 CSS pixel.
    expect(Math.abs(before.height - after.height), `${label}: shell height remains fixed`).toBeLessThanOrEqual(2.1);
};

const expectResponsiveShell = (geometry, viewportLabel) => {
    expect(geometry.shell.width, `${viewportLabel}: visible shell width`).toBeGreaterThan(0);
    expect(geometry.shell.height, `${viewportLabel}: visible shell height`).toBeGreaterThan(0);
    // Chromium can report a 44px target a few ten-thousandths below its CSS size.
    expect(geometry.toggle.height, `${viewportLabel}: toggle height`).toBeGreaterThanOrEqual(43.99);
    expect(geometry.toggle.width, `${viewportLabel}: toggle width`).toBeGreaterThanOrEqual(43.99);
    expect(Math.abs(geometry.trailingSpace), `${viewportLabel}: natural trailing space`).toBeLessThanOrEqual(2);
    expect(geometry.advancedContained, `${viewportLabel}: advanced filters contained`).toBe(true);
    expect(geometry.advancedUnclipped, `${viewportLabel}: advanced filters unclipped`).toBe(true);
    expect(geometry.withinRoot, `${viewportLabel}: shell within EasyStud root`).toBe(true);
    expect(geometry.withinViewport, `${viewportLabel}: shell within viewport`).toBe(true);
    expect(geometry.documentOverflow, `${viewportLabel}: document overflow`).toBeLessThanOrEqual(2);
    expect(geometry.rootOverflow, `${viewportLabel}: EasyStud root overflow`).toBeLessThanOrEqual(2);
};

const focusWithKeyboard = async(page, target) => {
    await target.scrollIntoViewIfNeeded();
    await target.evaluate(node => {
        const sentinel = document.createElement('button');
        sentinel.type = 'button';
        sentinel.setAttribute('aria-hidden', 'true');
        sentinel.style.cssText = [
            'position:fixed',
            'inline-size:1px',
            'block-size:1px',
            'opacity:0',
            'pointer-events:none',
        ].join(';');
        node.before(sentinel);
        sentinel.focus();
        window.__easyeduFocusSentinel = sentinel;
    });
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
    await page.evaluate(() => {
        window.__easyeduFocusSentinel?.remove();
        delete window.__easyeduFocusSentinel;
    });
};

const readCanonicalFocus = async(target, paintOwner = target) => paintOwner.evaluate((node) => {
    const style = getComputedStyle(node);
    const root = node.closest('#local-groupimport-easystud');
    const probe = document.createElement('span');
    probe.style.cssText = [
        'position:absolute',
        'display:block',
        'visibility:hidden',
        'inline-size:var(--easyedu-focus-ring-width)',
        'block-size:1px',
    ].join(';');
    root.append(probe);
    const tokenWidth = probe.getBoundingClientRect().width;
    probe.remove();
    const shadowPixels = [...style.boxShadow.matchAll(/(-?\d*\.?\d+)px/g)]
        .map(match => Math.abs(parseFloat(match[1])));
    const hasCanonicalSpread = shadowPixels.some(value => Math.abs(value - tokenWidth) <= 0.2);
    const outlineWidth = parseFloat(style.outlineWidth);
    const transparentOutline = style.outlineStyle === 'solid' &&
        outlineWidth >= 1.5 &&
        (style.outlineColor === 'transparent' ||
            /^rgba\(.+,\s*0(?:\.0+)?\)$/.test(style.outlineColor));
    const rect = node.getBoundingClientRect();
    const clippingAncestors = [];
    let ancestor = node.parentElement;
    while (ancestor && ancestor !== root.parentElement) {
        const ancestorStyle = getComputedStyle(ancestor);
        const clipsX = ['auto', 'hidden', 'scroll', 'clip'].includes(ancestorStyle.overflowX);
        const clipsY = ['auto', 'hidden', 'scroll', 'clip'].includes(ancestorStyle.overflowY);
        if (clipsX || clipsY) {
            const ancestorRect = ancestor.getBoundingClientRect();
            const clipped = (clipsX &&
                    (rect.left - tokenWidth < ancestorRect.left - 0.5 ||
                        rect.right + tokenWidth > ancestorRect.right + 0.5)) ||
                (clipsY &&
                    (rect.top - tokenWidth < ancestorRect.top - 0.5 ||
                        rect.bottom + tokenWidth > ancestorRect.bottom + 0.5));
            if (clipped) {
                clippingAncestors.push(ancestor.className || ancestor.tagName);
            }
        }
        ancestor = ancestor.parentElement;
    }
    return {
        boxShadow: style.boxShadow,
        hasCanonicalSpread,
        outline: style.outline,
        transparentOutline,
        tokenWidth,
        clippingAncestors,
    };
});

test('filter columns preserve desktop alignment and responsive accessibility', async({page}, testInfo) => {
    const runtimeErrors = [];
    const sideBySideViewports = [
        {width: 1440, height: 900},
        {width: 1280, height: 600},
        {width: 1025, height: 768},
    ];
    const responsiveViewports = [
        {width: 1024, height: 768},
        {width: 768, height: 1024},
        {width: 390, height: 844},
    ];

    await page.setViewportSize(sideBySideViewports[0]);
    await login(page, runtimeErrors);

    for (const viewport of sideBySideViewports) {
        const viewportLabel = `${viewport.width}x${viewport.height}`;
        await page.setViewportSize(viewport);
        await ensureParticipantMode(page);

        await ensureCollapsed(page, 'participants');
        await ensureCollapsed(page, 'participant-groups');
        await waitForStableGeometry(page, [
            participantFiltersSelector,
            participantGroupsSelector,
            participantListSelector,
            participantGroupsListSelector,
        ]);
        const collapsedGeometry = await readWideGeometry(page);
        expectPairedGeometry(collapsedGeometry.participant, collapsedGeometry.groups, `${viewportLabel} collapsed`);
        if (viewport.width === 1440) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-desktop-participants-collapsed.png'),
                fullPage: true,
            });
        }

        await ensureExpanded(page, 'participants', viewport.width === 1440);
        await waitForStableGeometry(page, [
            participantFiltersSelector,
            participantGroupsSelector,
            participantListSelector,
            participantGroupsListSelector,
            '[data-easystud-advanced-filters="participants"]',
        ]);
        const participantOpenGeometry = await readWideGeometry(page);
        expectStableListBaselines(collapsedGeometry, participantOpenGeometry, `${viewportLabel} participant open`);
        expectShellUnmoved(
            collapsedGeometry.groups,
            participantOpenGeometry.groups,
            `${viewportLabel} participant open: opposite group filter`
        );
        if (viewport.width === 1440) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-desktop-participants-open.png'),
                fullPage: true,
            });
        }

        await ensureCollapsed(page, 'participants', viewport.width === 1440);
        await ensureExpanded(page, 'participant-groups');
        await waitForStableGeometry(page, [
            participantFiltersSelector,
            participantGroupsSelector,
            participantListSelector,
            participantGroupsListSelector,
            '[data-easystud-advanced-filters="participant-groups"]',
        ]);
        const groupsOpenGeometry = await readWideGeometry(page);
        expectStableListBaselines(collapsedGeometry, groupsOpenGeometry, `${viewportLabel} groups open`);
        expectShellUnmoved(
            collapsedGeometry.participant,
            groupsOpenGeometry.participant,
            `${viewportLabel} groups open: opposite participant filter`
        );
        if (viewport.width === 1440) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-desktop-groups-open.png'),
                fullPage: true,
            });
        }

        await ensureExpanded(page, 'participants');
        await waitForStableGeometry(page, [
            participantFiltersSelector,
            participantGroupsSelector,
            participantListSelector,
            participantGroupsListSelector,
            '[data-easystud-advanced-filters="participants"]',
            '[data-easystud-advanced-filters="participant-groups"]',
        ]);

        const geometry = await readWideGeometry(page);
        expectNoClippingOrOverflow(geometry, viewportLabel);
        expect(geometry.participant.width, `${viewportLabel}: participant shell width`).toBeGreaterThan(0);
        expect(geometry.groups.width, `${viewportLabel}: group shell width`).toBeGreaterThan(0);
        expectPairedGeometry(geometry.participant, geometry.groups, `${viewportLabel} both open`);
        expectStableListBaselines(collapsedGeometry, geometry, `${viewportLabel} both open`);
        expect(
            Math.abs(geometry.participantToggle.bottom - geometry.groupToggle.bottom),
            `${viewportLabel}: action bottom delta`
        ).toBeLessThanOrEqual(2);
        expect(
            Math.abs(geometry.participantToggle.centreY - geometry.groupToggle.centreY),
            `${viewportLabel}: action centre delta`
        ).toBeLessThanOrEqual(2);
        expect(
            geometry.participant.right,
            `${viewportLabel}: participant shell precedes group shell`
        ).toBeLessThanOrEqual(geometry.groups.left + 2);

        await ensureStructureMode(page);
        await ensureCollapsed(page, 'structure-groups');
        await waitForStableGeometry(page, [
            structureGroupsSelector,
            structureGroupingsSelector,
            structureGroupsListSelector,
            structureGroupingsListSelector,
        ]);
        const structureCollapsed = await readStructureGeometry(page);
        expectPairedGeometry(structureCollapsed.groups, structureCollapsed.groupings, `${viewportLabel} structure collapsed`);
        expect(Math.abs(structureCollapsed.groupsList.top - structureCollapsed.groupingsList.top),
            `${viewportLabel} structure collapsed: list top delta`).toBeLessThanOrEqual(2);

        await ensureExpanded(page, 'structure-groups');
        await waitForStableGeometry(page, [
            structureGroupsSelector,
            structureGroupingsSelector,
            structureGroupsListSelector,
            structureGroupingsListSelector,
            '[data-easystud-advanced-filters="structure-groups"]',
        ]);
        const structureOpen = await readStructureGeometry(page);
        expect(Math.abs(structureOpen.groupsList.top - structureOpen.groupingsList.top),
            `${viewportLabel} structure open: list top delta`).toBeLessThanOrEqual(2);
        expectShellUnmoved(
            structureCollapsed.groupings,
            structureOpen.groupings,
            `${viewportLabel} structure open: opposite grouping filter`
        );
        if (viewport.width === 1440) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-desktop-structure-open.png'),
                fullPage: true,
            });

            await ensureOverviewMode(page);
            await expectSingleOpenGroupingRail(page, testInfo, 'desktop-1440');
            await ensureCollapsed(page, 'participants');
            await waitForStableGeometry(page, [
                participantListSelector,
                structureGroupingsListSelector,
            ]);
            const overviewCollapsed = await readOverviewListGeometry(page);
            await ensureExpanded(page, 'participants', true);
            await waitForStableGeometry(page, [
                participantListSelector,
                structureGroupingsListSelector,
                '[data-easystud-advanced-filters="participants"]',
            ]);
            const overviewOpen = await readOverviewListGeometry(page);
            expect(
                Math.abs(overviewOpen.participantTop - overviewOpen.structureTop),
                `${viewportLabel} Complete View: aligned list tops`
            ).toBeLessThanOrEqual(2);
            expect(
                Math.abs(overviewOpen.structureTop - overviewCollapsed.structureTop),
                `${viewportLabel} Complete View: right list follows opening filter`
            ).toBeGreaterThan(8);
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-complete-view-participants-open.png'),
                fullPage: true,
            });
        }
    }

    for (const viewport of responsiveViewports) {
        const viewportLabel = `${viewport.width}x${viewport.height}`;
        await page.setViewportSize(viewport);

        await selectResponsiveWorkspace(page, 'participants');
        await ensureExpanded(page, 'participants');
        await waitForStableGeometry(page, [
            participantFiltersSelector,
            '[data-easystud-advanced-filters="participants"]',
        ]);
        expectResponsiveShell(
            await readResponsiveGeometry(page, participantFiltersSelector, 'participants'),
            `${viewportLabel} participants`
        );
        if (viewport.width === 390) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-responsive-participants.png'),
                fullPage: true,
            });
        }

        await selectResponsiveWorkspace(page, 'groups');
        await ensureExpanded(page, 'structure-groups');
        await waitForStableGeometry(page, [
            structureGroupsSelector,
            '[data-easystud-advanced-filters="structure-groups"]',
        ]);
        expectResponsiveShell(
            await readResponsiveGeometry(page, structureGroupsSelector, 'structure-groups'),
            `${viewportLabel} groups`
        );
        if (viewport.width === 390) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-responsive-groups.png'),
                fullPage: true,
            });
        }

        await selectResponsiveWorkspace(page, 'groupings');
        await ensureExpanded(page, 'structure-groupings');
        await waitForStableGeometry(page, [
            structureGroupingsSelector,
            '[data-easystud-advanced-filters="structure-groupings"]',
        ]);
        expectResponsiveShell(
            await readResponsiveGeometry(page, structureGroupingsSelector, 'structure-groupings'),
            `${viewportLabel} groupings`
        );
        if (viewport.width === 390) {
            await page.screenshot({
                path: testInfo.outputPath('filter-alignment-responsive-groupings.png'),
                fullPage: true,
            });
            await expectSingleOpenGroupingRail(page, testInfo, 'responsive-390');
        }
    }

    await selectResponsiveWorkspace(page, 'participants');
    await ensureExpanded(page, 'participants');
    const participantToggle = page.locator(
        '[data-easystud-advanced-filters-toggle="participants"]'
    );
    // Reach the disclosure through real Tab navigation so Chromium applies
    // :focus-visible; a programmatic focus alone is not keyboard modality
    // after the preceding pointer interactions.
    const participantSearch = page.locator('[data-easystud-search]:visible').first();
    await participantSearch.focus();
    for (let step = 0; step < 12; step++) {
        if (await participantToggle.evaluate(node => node === document.activeElement)) {
            break;
        }
        await page.keyboard.press('Tab');
    }
    await expect(participantToggle).toBeFocused();
    const focusGeometry = await participantToggle.evaluate(node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const shell = node.closest('.local-groupimport-easystud__filters');
        const shellStyle = getComputedStyle(shell);
        const outlineVisible = parseFloat(style.outlineWidth) > 0 &&
            style.outlineStyle !== 'none' &&
            style.outlineColor !== 'transparent' &&
            style.outlineColor !== 'rgba(0, 0, 0, 0)';
        const shadowVisible = style.boxShadow !== 'none' &&
            style.boxShadow.indexOf('rgba(0, 0, 0, 0)') === -1;
        const outlineExtent = outlineVisible ?
            parseFloat(style.outlineWidth) + Math.abs(parseFloat(style.outlineOffset) || 0) :
            0;
        const focusExtent = Math.max(outlineExtent, shadowVisible ? 4 : 0);
        return {
            visible: outlineVisible || shadowVisible,
            shellAllowsFocusPaint: shellStyle.overflowX === 'visible' &&
                shellStyle.overflowY === 'visible',
            paintedWithinViewport: rect.top - focusExtent >= -2 &&
                rect.right + focusExtent <= window.innerWidth + 2 &&
                rect.bottom + focusExtent <= window.innerHeight + 2 &&
                rect.left - focusExtent >= -2,
            viewportEvidence: {
                rect: {
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    left: rect.left,
                },
                focusExtent,
                width: window.innerWidth,
                height: window.innerHeight,
            },
        };
    });
    console.log('MOBILE_FOCUS_VIEWPORT:', JSON.stringify(focusGeometry.viewportEvidence));
    expect(focusGeometry.visible, '390x844: visible keyboard focus').toBe(true);
    expect(focusGeometry.shellAllowsFocusPaint, '390x844: filter shell does not clip focus paint').toBe(true);
    expect(focusGeometry.paintedWithinViewport, '390x844: focus paint remains in viewport').toBe(true);

    const participantAdvanced = page.locator(
        '[data-easystud-advanced-filters="participants"]'
    );
    await page.keyboard.press('Space');
    await expect(participantToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(participantAdvanced).not.toHaveClass(/is-expanded/);
    await page.keyboard.press('Enter');
    await expect(participantToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(participantAdvanced).toHaveClass(/is-expanded/);
    await expect(participantAdvanced).toBeVisible();
    await waitForStableGeometry(page, [participantFiltersSelector, '[data-easystud-advanced-filters="participants"]']);

    await page.setViewportSize(sideBySideViewports[0]);
    await ensureParticipantMode(page);
    await ensureExpanded(page, 'participants');
    await ensureExpanded(page, 'participant-groups');
    await waitForStableGeometry(page, [
        participantFiltersSelector,
        participantGroupsSelector,
        '[data-easystud-advanced-filters="participants"]',
        '[data-easystud-advanced-filters="participant-groups"]',
    ]);
    await expect(page.locator(`${participantFiltersSelector}:visible`)).toHaveCount(1);
    await expect(page.locator(`${participantGroupsSelector}:visible`)).toHaveCount(1);

    const focusMatrix = [
        {
            label: 'desktop navigation action',
            target: page.locator('[data-easyedu-navigation-desktop] .easyedu-navigation__item:visible').first(),
        },
        {
            label: 'guide launcher',
            target: page.locator('[data-easyedu-navigation-desktop] [data-easyedu-guide-open]:visible').first(),
        },
        {
            label: 'participant search field',
            target: participantSearch,
            paintOwner: page.locator('.local-groupimport-easystud__search-field:visible').first(),
        },
        {
            label: 'advanced filter select',
            target: page.locator(
                `${participantFiltersSelector} .form-select:visible, ` +
                `${participantFiltersSelector} select:visible`
            ).first(),
        },
        {
            label: 'filter disclosure',
            target: participantToggle,
        },
    ];
    const focusEvidence = [];
    for (const entry of focusMatrix) {
        await expect(entry.target, `${entry.label}: representative control exists`).toHaveCount(1);
        await focusWithKeyboard(page, entry.target);
        // Sample the stable focus state after the longest 180ms component transition.
        await page.waitForTimeout(220);
        const evidence = await readCanonicalFocus(entry.target, entry.paintOwner || entry.target);
        console.log('FOCUS_SAMPLE:', JSON.stringify({label: entry.label, ...evidence}));
        expect(evidence.hasCanonicalSpread, `${entry.label}: canonical ring width`).toBe(true);
        expect(evidence.transparentOutline, `${entry.label}: forced-colors outline fallback`).toBe(true);
        expect(evidence.clippingAncestors, `${entry.label}: focus paint is not clipped`).toEqual([]);
        focusEvidence.push({label: entry.label, ...evidence});
    }
    console.log('FOCUS_MATRIX:', JSON.stringify(focusEvidence));

    await focusWithKeyboard(page, focusMatrix[0].target);
    await page.locator('[data-easyedu-navigation-desktop]').screenshot({
        path: testInfo.outputPath('focus-navigation.png'),
    });
    await focusWithKeyboard(page, participantToggle);
    await page.locator(participantFiltersSelector).screenshot({
        path: testInfo.outputPath('focus-filter-panel.png'),
    });

    const axeResults = await new AxeBuilder({page})
        .include(participantFiltersSelector)
        .include(participantGroupsSelector)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
        .analyze();
    const seriousOrCritical = axeResults.violations.filter(
        violation => violation.impact === 'serious' || violation.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
    expect(runtimeErrors, 'browser console and page errors').toEqual([]);
});
