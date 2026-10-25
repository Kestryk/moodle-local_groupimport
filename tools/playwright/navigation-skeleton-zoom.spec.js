const {test, expect, chromium} = require('@playwright/test');
const fs = require('fs/promises');
const path = require('path');

const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const chromiumExecutable = process.env.EASYEDU_CHROMIUM_EXECUTABLE || undefined;

const surfaces = [
    {
        id: 'student-management',
        url: new URL('/local/groupimport/manage.php?id=5', massImportUrl).toString(),
        rootSelector: '#local-groupimport-easystud',
        cueSelector: '.local-groupimport-easystud__loading-surface',
        realNavigationSelector: '.local-groupimport-easystud__navigation',
        navigationFrameSelector: '.local-groupimport-easystud__loading-navigation-frame',
        navigationCuesSelector: '.local-groupimport-easystud__loading-navigation-cues',
        structuralSelector: '.local-groupimport-easystud__loading-panel',
        cardSelector: [
            '.local-groupimport-easystud__loading-search-filter-region',
            '.local-groupimport-easystud__loading-participant-card',
            '.local-groupimport-easystud__loading-structure-card',
        ].join(', '),
        toggleSelector: '.local-groupimport-easystud__loading-view-toggle',
        frameSelector: [
            '.local-groupimport-easystud__loading-panel',
            '.local-groupimport-easystud__loading-search-filter-region',
            '.local-groupimport-easystud__loading-participant-card',
            '.local-groupimport-easystud__loading-structure-card',
        ].join(', '),
        expectedCues: 50,
        animatedPseudo: '::after',
    },
    {
        id: 'mass-import',
        url: massImportUrl,
        rootSelector: '#local-groupimport-import',
        cueSelector: '.local-groupimport-import__loading-surface',
        realNavigationSelector: '.local-groupimport-import-navigation',
        navigationFrameSelector: '.local-groupimport-import__loading-navigation-frame',
        navigationCuesSelector: '.local-groupimport-import__loading-navigation-cues',
        structuralSelector: '.local-groupimport-import__loading-card',
        cardSelector: '',
        toggleSelector: '',
        frameSelector: '.local-groupimport-import__loading-card',
        expectedCues: 21,
        animatedPseudo: '',
    },
];

const cells = [
    {viewport: {width: 320, height: 844}, direction: 'ltr'},
    {viewport: {width: 320, height: 844}, direction: 'rtl'},
    {viewport: {width: 390, height: 844}, direction: 'ltr'},
    {viewport: {width: 390, height: 844}, direction: 'rtl'},
];

const nativeZoomLevel = percentage => Math.log(percentage / 100) / Math.log(1.2);

const prepareIsolatedZoomProfile = async(profileRoot, baseUrl, zoom) => {
    const endpoint = new URL(baseUrl);
    const defaultProfile = path.join(profileRoot, 'Default');
    const preferences = {
        partition: {
            per_host_zoom_levels: {
                x: {
                    [endpoint.host]: {
                        last_modified: String((Date.now() + 11644473600000) * 1000),
                        zoom_level: nativeZoomLevel(zoom),
                    },
                },
            },
        },
    };

    await fs.mkdir(defaultProfile, {recursive: true});
    await fs.writeFile(
        path.join(defaultProfile, 'Preferences'),
        JSON.stringify(preferences, null, 2),
        'utf8'
    );
};

const login = async page => {
    await page.goto(massImportUrl, {waitUntil: 'domcontentloaded'});
    if (!page.url().includes('/login/')) {
        return;
    }
    if (!password) {
        throw new Error('The supervised runner did not supply a Moodle password.');
    }
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.locator('#loginbtn').click();
    await page.waitForURL(url => !url.pathname.includes('/login/'), {
        waitUntil: 'domcontentloaded',
    });
};

const revealSkeleton = async(page, surface, direction, showBusyIndicator = false) => {
    await page.goto(surface.url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await login(page);
        await page.goto(surface.url, {waitUntil: 'domcontentloaded'});
    }
    await expect(page.locator(surface.rootSelector)).toBeVisible({timeout: 30000});
    const realNavigation = page.locator(surface.realNavigationSelector).first();
    await expect(realNavigation).toBeVisible({timeout: 30000});
    const realNavigationHeight = await realNavigation.evaluate(node => node.getBoundingClientRect().height);

    await page.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'none'});
    await page.evaluate(({rootSelector, direction, showBusyIndicator}) => {
        const root = document.querySelector(rootSelector);
        const skeleton = root?.querySelector('[data-easystud-loading-skeleton]');
        if (!root || !skeleton) {
            throw new Error('Expected EasyStud loading skeleton is absent.');
        }
        document.documentElement.dir = direction;
        root.classList.remove('is-easystud-loading-skeleton-exiting');
        root.classList.toggle('is-action-busy', showBusyIndicator);
        root.dataset.easystudLoadingState = 'loading';
        root.setAttribute('aria-busy', 'true');
        skeleton.hidden = false;
    }, {rootSelector: surface.rootSelector, direction, showBusyIndicator});

    const skeleton = page.locator(
        `${surface.rootSelector} [data-easystud-loading-skeleton]`
    );
    await expect(skeleton).toBeVisible();
    return {skeleton, realNavigationHeight};
};

const inspectSkeleton = async(page, surface) => page.evaluate(({surface}) => {
    const root = document.querySelector(surface.rootSelector);
    const skeleton = root?.querySelector('[data-easystud-loading-skeleton]');
    const cueNodes = Array.from(skeleton?.querySelectorAll(surface.cueSelector) || []);
    const frameNodes = Array.from(skeleton?.querySelectorAll(surface.frameSelector) || []);
    const navigationFrame = skeleton?.querySelector(surface.navigationFrameSelector);
    const navigationCues = skeleton?.querySelector(surface.navigationCuesSelector);
    const structuralNodes = Array.from(skeleton?.querySelectorAll(surface.structuralSelector) || []);
    const cardNodes = surface.cardSelector ?
        Array.from(skeleton?.querySelectorAll(surface.cardSelector) || []) : [];
    const toggle = surface.toggleSelector ? skeleton?.querySelector(surface.toggleSelector) : null;
    const animatedName = node => getComputedStyle(node, surface.animatedPseudo).animationName;
    const animatedDirection = node => getComputedStyle(node, surface.animatedPseudo).animationDirection;
    const readPixels = value => Number.parseFloat(value) || 0;
    const busySpinner = root ? getComputedStyle(root, '::after') : null;
    const busyLabel = root ? getComputedStyle(root, '::before') : null;
    const bounds = skeleton?.getBoundingClientRect();
    const visibleNodes = nodes => nodes.filter(node => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
    });
    const borderWidths = node => {
        const style = getComputedStyle(node);
        return {
            blockStart: readPixels(style.borderBlockStartWidth),
            inlineStart: readPixels(style.borderInlineStartWidth),
        };
    };
    const focusableCount = skeleton?.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).length || 0;
    const escapingNodes = Array.from(skeleton?.querySelectorAll(`${surface.cueSelector}, ${surface.frameSelector}`) || [])
        .filter(node => {
            const box = node.getBoundingClientRect();
            // Compact Student Management intentionally hides the Structure
            // panel. Its display:none descendants have a 0 x 0 rectangle and
            // cannot overflow, so only rendered frames participate here.
            if (box.width === 0 && box.height === 0) {
                return false;
            }
            return box.left < bounds.left - 1 || box.right > bounds.right + 1;
        })
        .map(node => {
            const box = node.getBoundingClientRect();
            return {
                className: node.className,
                left: box.left,
                right: box.right,
            };
        });

    return {
        cueCount: cueNodes.length,
        navigationCueCount: navigationCues?.children.length || 0,
        navigationFrameHeight: navigationFrame?.getBoundingClientRect().height || 0,
        structuralBorders: visibleNodes(structuralNodes).map(borderWidths),
        cardBorders: visibleNodes(cardNodes).map(borderWidths),
        toggleBorder: toggle ? borderWidths(toggle) : null,
        focusableCount,
        frameCount: frameNodes.length,
        animatedCues: cueNodes.filter(node => animatedName(node) !== 'none').length,
        animatedFrames: frameNodes.filter(node => getComputedStyle(node).animationName !== 'none').length,
        cueDirections: [...new Set(cueNodes.map(animatedDirection))],
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        skeletonClientWidth: skeleton?.clientWidth || 0,
        skeletonScrollWidth: skeleton?.scrollWidth || 0,
        skeletonOverflow: Boolean(skeleton && skeleton.scrollWidth > skeleton.clientWidth + 1),
        skeletonBounds: bounds ? {left: bounds.left, right: bounds.right} : null,
        escapingNodes,
        innerWidth: window.innerWidth,
        rootFontSize: readPixels(getComputedStyle(document.documentElement).fontSize),
        visualViewportScale: window.visualViewport?.scale || 1,
        busyIndicator: busySpinner && busyLabel ? {
            enabled: root.classList.contains('is-action-busy'),
            spinnerBottom: readPixels(busySpinner.bottom),
            spinnerHeight: readPixels(busySpinner.height),
            spinnerRight: readPixels(busySpinner.right),
            spinnerWidth: readPixels(busySpinner.width),
            labelBottom: readPixels(busyLabel.bottom),
            labelRight: readPixels(busyLabel.right),
        } : null,
    };
}, {surface});

test('Navigation Skeleton stays contained at 320/390 with isolated native 100/200 zoom', async({}, testInfo) => {
    test.setTimeout(900000);
    const profileRoot = process.env.PLAYWRIGHT_PROFILE_DIR;
    if (!profileRoot) {
        throw new Error('The supervised runner must provide an external browser profile directory.');
    }

    const evidence = [];
    for (const zoom of [200, 100]) {
        const zoomProfile = path.join(profileRoot, `native-zoom-${zoom}`);
        await prepareIsolatedZoomProfile(zoomProfile, massImportUrl, zoom);
        const context = await chromium.launchPersistentContext(zoomProfile, {
            // The profile is created inside this run's external artifact directory.
            // No keypress or desktop-window automation is used, so an existing browser
            // profile and its zoom level cannot be changed by this scenario.
            headless: zoom === 100,
            viewport: {width: 390, height: 844},
            deviceScaleFactor: 1,
            executablePath: chromiumExecutable,
            args: zoom === 200 ? [
                '--force-device-scale-factor=1',
                '--window-position=-32000,-32000',
                '--window-size=390,844',
            ] : ['--force-device-scale-factor=1'],
        });

        try {
            const authenticationPage = await context.newPage();
            await login(authenticationPage);
            await authenticationPage.close();

            for (const cell of cells) {
                for (const surface of surfaces) {
                    const page = await context.newPage();
                    await page.setViewportSize(cell.viewport);
                    const showBusyIndicator = surface.id === 'mass-import';
                    const {skeleton, realNavigationHeight} = await revealSkeleton(
                        page, surface, cell.direction, showBusyIndicator
                    );
                    const inspection = await inspectSkeleton(page, surface);
                    const cellId = `${surface.id}-${cell.viewport.width}-${cell.direction}-${zoom}`;

                    // Preserve the exact native-zoom visual evidence even if a
                    // subsequent containment assertion diagnoses a regression.
                    await skeleton.screenshot({
                        path: testInfo.outputPath(`navigation-skeleton-${cellId}.png`),
                    });
                    if (showBusyIndicator && cell.viewport.width === 320 &&
                        cell.direction === 'ltr' && zoom === 200) {
                        await page.screenshot({
                            path: testInfo.outputPath(`navigation-skeleton-${cellId}-window.png`),
                        });
                    }
                    evidence.push({cellId, ...inspection});

                    expect(inspection.cueCount, `${cellId}: internal cue count`).toBe(surface.expectedCues);
                    expect(inspection.navigationCueCount, `${cellId}: one Navigation Skeleton cue`).toBe(1);
                    expect(inspection.navigationFrameHeight, `${cellId}: compact navigation height`).toBeGreaterThan(0);
                    expect(
                        Math.abs(inspection.navigationFrameHeight - realNavigationHeight),
                        `${cellId}: compact navigation stays close to the real navigation height`
                    ).toBeLessThanOrEqual(inspection.rootFontSize * 2);
                    expect(inspection.structuralBorders.length, `${cellId}: structural containers`).toBeGreaterThan(0);
                    expect(
                        inspection.structuralBorders.every(border => border.blockStart > border.inlineStart),
                        `${cellId}: structural containers expose only the K3.1 block-start accent`
                    ).toBe(true);
                    if (inspection.cardBorders.length > 0) {
                        expect(
                            inspection.cardBorders.every(border => border.inlineStart > border.blockStart),
                            `${cellId}: internal cards expose only the K3.1 inline-start accent`
                        ).toBe(true);
                    }
                    if (inspection.toggleBorder) {
                        expect(inspection.toggleBorder.blockStart, `${cellId}: view toggle block border`).toBe(0);
                        expect(inspection.toggleBorder.inlineStart, `${cellId}: view toggle inline border`).toBe(0);
                    }
                    expect(inspection.focusableCount, `${cellId}: decorative skeleton focusables`).toBe(0);
                    expect(inspection.frameCount, `${cellId}: static frame count`).toBeGreaterThan(0);
                    expect(inspection.animatedCues, `${cellId}: animated internal cues`).toBe(surface.expectedCues);
                    expect(inspection.animatedFrames, `${cellId}: animated outer frames`).toBe(0);
                    expect(inspection.documentOverflow, `${cellId}: document horizontal overflow`).toBe(false);
                    expect(inspection.documentScrollWidth, `${cellId}: document width`).toBeLessThanOrEqual(
                        inspection.documentClientWidth + 1
                    );
                    expect(inspection.skeletonScrollWidth, `${cellId}: skeleton width`).toBeLessThanOrEqual(
                        inspection.skeletonClientWidth + 1
                    );
                    expect(inspection.skeletonOverflow, `${cellId}: skeleton horizontal overflow`).toBe(false);
                    if (showBusyIndicator && cell.viewport.width === 320 && zoom === 200) {
                        const busy = inspection.busyIndicator;
                        expect(busy.enabled, `${cellId}: busy indicator enabled`).toBe(true);
                        expect(busy.spinnerWidth, `${cellId}: compact busy spinner width`).toBeLessThanOrEqual(
                            inspection.rootFontSize * 1.61
                        );
                        expect(busy.spinnerHeight, `${cellId}: compact busy spinner height`).toBeLessThanOrEqual(
                            inspection.rootFontSize * 1.61
                        );
                        expect(busy.spinnerBottom - busy.labelBottom,
                            `${cellId}: busy spinner lower-edge clearance`).toBeCloseTo(
                            inspection.rootFontSize * 0.5, 1
                        );
                        expect(busy.spinnerRight - busy.labelRight,
                            `${cellId}: busy spinner end-edge clearance`).toBeCloseTo(
                            inspection.rootFontSize * 0.65, 1
                        );
                    }
                    expect(
                        inspection.escapingNodes,
                        `${cellId}: skeleton nodes escaping its root ${JSON.stringify(inspection.skeletonBounds)}`
                    ).toEqual([]);
                    if (cell.direction === 'rtl') {
                        expect(inspection.cueDirections, `${cellId}: RTL shimmer direction`).toEqual(['reverse']);
                    }
                    if (zoom === 200) {
                        const nativeZoomProven =
                            cell.viewport.width / Math.max(inspection.innerWidth, 1) >= 1.8 ||
                            inspection.visualViewportScale >= 1.8;
                        expect(nativeZoomProven, `${cellId}: genuine native 200% zoom`).toBe(true);
                    }

                    await page.close();
                }
            }
        } finally {
            await context.close();
        }
    }

    await fs.writeFile(
        testInfo.outputPath('navigation-skeleton-native-zoom-summary.json'),
        JSON.stringify(evidence, null, 2),
        'utf8'
    );
});
