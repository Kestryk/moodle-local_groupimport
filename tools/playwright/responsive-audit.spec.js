const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

test.describe.configure({timeout: 60000});

const loadingDiagnosticsUrl = url => {
    const diagnosticUrl = new URL(url);
    diagnosticUrl.searchParams.set('easystudloadingdiagnostics', '1');
    return diagnosticUrl.toString();
};

const waitForGuideCaptureSurface = async modal => {
    await expect(modal).toBeVisible();
    await expect.poll(async() => modal.evaluate(node => {
        const dialog = node.querySelector('.easyedu-guide-modal__dialog');
        if (!dialog) {
            return false;
        }
        const dialogStyle = window.getComputedStyle(dialog);
        const hasRunningEntryMotion = [node, dialog].some(surface =>
            surface.getAnimations().some(animation => animation.playState === 'running')
        );
        return node.classList.contains('is-open') &&
            !node.classList.contains('is-closing') &&
            Number.parseFloat(dialogStyle.opacity) >= 0.99 &&
            !hasRunningEntryMotion;
    }), {
        message: 'Guide evidence must wait for the fully opaque, settled modal after normal-motion entry',
        timeout: 3000,
    }).toBe(true);
};

const assertGuidedCardContainment = async(card, label) => {
    await expect(card).toBeVisible();
    const geometry = await card.evaluate(node => {
        const cardRect = node.getBoundingClientRect();
        const body = node.querySelector('.easyedu-guide-guided-card__body');
        const action = node.querySelector('[data-easyedu-guide-start-path]');
        const bodyRect = body?.getBoundingClientRect();
        const actionRect = action?.getBoundingClientRect();
        const inside = rect => Boolean(rect &&
            rect.left >= cardRect.left - 1 && rect.right <= cardRect.right + 1 &&
            rect.top >= cardRect.top - 1 && rect.bottom <= cardRect.bottom + 1);
        return {
            cardOverflow: node.scrollWidth > node.clientWidth + 1,
            cardWidths: [node.clientWidth, node.scrollWidth],
            bodyOverflow: Boolean(body && body.scrollWidth > body.clientWidth + 1),
            bodyWidths: body ? [body.clientWidth, body.scrollWidth] : null,
            bodyInside: inside(bodyRect),
            actionInside: inside(actionRect),
            actionBelowBody: Boolean(bodyRect && actionRect && actionRect.top >= bodyRect.bottom - 1),
        };
    });
    const details = label + ': ' + JSON.stringify(geometry);
    expect(geometry.cardOverflow, details).toBe(false);
    expect(geometry.bodyOverflow, details).toBe(false);
    expect(geometry.bodyInside, details).toBe(true);
    expect(geometry.actionInside, details).toBe(true);
    expect(geometry.actionBelowBody, details).toBe(true);
};

const login = async page => {
    page.on('pageerror', error => console.log('PAGE_ERROR:', error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            console.log('CONSOLE_ERROR:', message.text());
        }
    });
    await page.goto(loadingDiagnosticsUrl(baseUrl));
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the responsive audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        // Moodle may honour the user's course landing preference after an
        // interactive login. Return explicitly to the audited EasyStud route
        // before asserting the plugin root.
        await page.waitForURL(url => !url.pathname.includes('/login/'), {
            timeout: 60000,
            waitUntil: 'domcontentloaded',
        });
        await page.goto(loadingDiagnosticsUrl(baseUrl), {waitUntil: 'domcontentloaded'});
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    try {
        await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
    } catch (error) {
        const diagnostics = await page.evaluate(() => {
            const manager = document.querySelector('#local-groupimport-easystud');
            const diagnostic = window.__easyStudLoadingDiagnostics?.['local-groupimport-easystud'];
            return {
                className: manager?.className || '',
                loadingState: manager?.getAttribute('data-easystud-loading-state') || '',
                managerInitialised: manager?.getAttribute('data-easystud-manager-initialised') || '',
                hasLoadingController: typeof manager?.easystudLoadingController?.complete === 'function',
                controllerState: manager?.easystudLoadingController?.getState?.() || '',
                events: diagnostic?.snapshot?.() || [],
            };
        });
        throw new Error('EasyStud loading gate did not settle: ' + JSON.stringify(diagnostics));
    }
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

const assertResponsiveNavigationTrigger = async page => {
    const geometry = await page.evaluate(() => {
        const trigger = document.querySelector('[data-easyedu-navigation-open]');
        const row = document.querySelector('[data-easyedu-navigation-trigger-row]');
        const participant = document.querySelector('[data-easystud-participant-navigation]');
        const drawer = document.querySelector('[data-region="drawer-toggle"]');
        const guide = document.querySelector('[data-easyedu-navigation-guide-source]');
        const rect = node => {
            if (!node) {
                return null;
            }
            const value = node.getBoundingClientRect();
            return {
                left: value.left,
                right: value.right,
                top: value.top,
                bottom: value.bottom,
                width: value.width,
                height: value.height,
            };
        };
        const overlaps = (left, right) => Boolean(left && right &&
            left.left < right.right && left.right > right.left &&
            left.top < right.bottom && left.bottom > right.top);
        const triggerRect = rect(trigger);
        return {
            text: trigger?.textContent?.trim() || '',
            label: trigger?.querySelector('.easyedu-navigation__trigger-label')?.textContent?.trim() || '',
            ariaLabel: trigger?.getAttribute('aria-label') || '',
            position: trigger ? getComputedStyle(trigger).position : '',
            left: triggerRect?.left || 0,
            top: triggerRect?.top || 0,
            height: triggerRect?.height || 0,
            viewportHeight: window.innerHeight,
            compactPhone: window.matchMedia('(max-width: 40rem)').matches,
            insetBlockStart: trigger ? getComputedStyle(trigger).insetBlockStart : '',
            transform: trigger ? getComputedStyle(trigger).transform : '',
            outerEdgeRadius: trigger ? getComputedStyle(trigger).borderTopLeftRadius : '',
            rowHeight: row?.getBoundingClientRect().height || 0,
            trigger: triggerRect,
            participant: rect(participant),
            drawer: rect(drawer),
            guide: rect(guide),
            participantOverlap: overlaps(triggerRect, rect(participant)),
            drawerOverlap: overlaps(triggerRect, rect(drawer)),
            guideOverlap: overlaps(triggerRect, rect(guide)),
            nativeTriggerEdge: Number.parseFloat(
                document.querySelector('[data-easyedu-navigation]')
                    ?.style.getPropertyValue('--easyedu-navigation-native-trigger-edge') || '0'
            ),
        };
    });
    expect(geometry.text).toBe(geometry.ariaLabel);
    expect(geometry.label).toBe(geometry.ariaLabel);
    expect(geometry.position).toBe('fixed');
    expect(geometry.left).toBeLessThanOrEqual(1);
    const triggerCentre = geometry.top + (geometry.height / 2);
    const preferredCentreOffset = Math.abs(triggerCentre - (geometry.viewportHeight / 2));
    const allowedCentreOffset = geometry.compactPhone ? 36 : 2;
    const nativeMinimumCentre = geometry.drawer ? geometry.drawer.bottom + (geometry.height / 2) : 0;
    if (nativeMinimumCentre <= geometry.viewportHeight / 2 + allowedCentreOffset) {
        expect(
            preferredCentreOffset,
            'Responsive navigation trigger geometry: ' + JSON.stringify(geometry)
        ).toBeLessThanOrEqual(allowedCentreOffset);
    } else {
        expect(triggerCentre, 'Responsive navigation trigger geometry: ' + JSON.stringify(geometry))
            .toBeGreaterThanOrEqual(nativeMinimumCentre - 1);
    }
    expect(geometry.outerEdgeRadius).toBe('0px');
    expect(geometry.rowHeight).toBe(0);
    expect(geometry.drawerOverlap, 'Responsive navigation trigger geometry: ' + JSON.stringify(geometry)).toBe(false);
    expect(geometry.guideOverlap, 'Responsive navigation trigger geometry: ' + JSON.stringify(geometry)).toBe(false);
    if (geometry.drawer) {
        expect(geometry.nativeTriggerEdge, 'Responsive navigation trigger geometry: ' + JSON.stringify(geometry))
            .toBeGreaterThanOrEqual(geometry.drawer.bottom - 1);
    }

    const trigger = page.locator('[data-easyedu-navigation-open]');
    const idleWidth = await trigger.evaluate(node => node.getBoundingClientRect().width);
    await trigger.hover();
    await expect.poll(async() => trigger.evaluate(node => node.getBoundingClientRect().width), {
        timeout: 2000,
    }).toBeGreaterThan(idleWidth + 8);
    await expect.poll(async() => trigger.evaluate(node => {
        const label = node.querySelector('.easyedu-navigation__trigger-label');
        return Number(label ? getComputedStyle(label).opacity : 0);
    }), {
        timeout: 2000,
    }).toBeGreaterThan(0.9);
    const hoverState = await trigger.evaluate(node => {
        const label = node.querySelector('.easyedu-navigation__trigger-label');
        return {
            labelOpacity: Number(getComputedStyle(label).opacity),
            transform: getComputedStyle(node).transform,
        };
    });
    expect(hoverState.labelOpacity).toBeGreaterThan(0.9);
    expect(hoverState.transform).not.toBe('none');
    await page.mouse.move(1, 1);
    await expect.poll(async() => trigger.evaluate(node => node.getBoundingClientRect().left), {
        timeout: 2000,
    }).toBeLessThanOrEqual(1);
    return geometry;
};

const assertResponsiveGuideLauncher = async(page, panel) => {
    const launcher = panel.locator('[data-easyedu-navigation-guide-slot] [data-easyedu-guide-open]');
    const label = launcher.locator('.easyedu-guide__launcher-label');
    const firstNavigationIcon = panel.locator(
        '[data-easyedu-navigation-section="easystud-tools"] .easyedu-navigation__item-icon'
    ).first();
    await expect(launcher).toBeVisible();
    await expect(label).toBeVisible();
    await expect(label).toContainText(/Open guide|Ouvrir le guide/i);
    await expect(firstNavigationIcon).toBeVisible();
    const restingAppearance = await launcher.evaluate(button => {
        const icon = button.querySelector('.easyedu-guide__launcher-icon');
        const labelElement = button.querySelector('.easyedu-guide__launcher-label');
        const panelElement = button.closest('[data-easyedu-navigation-panel]');
        const buttonStyle = getComputedStyle(button);
        return {
            buttonWidth: button.getBoundingClientRect().width,
            panelWidth: panelElement ? panelElement.getBoundingClientRect().width : 0,
            backgroundImage: buttonStyle.backgroundImage,
            iconBackground: icon ? getComputedStyle(icon).backgroundColor : '',
            labelBackground: labelElement ? getComputedStyle(labelElement).backgroundColor : '',
        };
    });
    expect(restingAppearance.buttonWidth).toBeGreaterThanOrEqual(restingAppearance.panelWidth - 28);
    expect(restingAppearance.backgroundImage).toContain('linear-gradient');
    expect(restingAppearance.iconBackground).toMatch(/^rgba\(.+,\s*0\)$/);
    expect(restingAppearance.labelBackground).toMatch(/^rgba\(.+,\s*0\)$/);
    const labelContainment = await launcher.evaluate(button => {
        const labelElement = button.querySelector('.easyedu-guide__launcher-label');
        const buttonRect = button.getBoundingClientRect();
        const labelRect = labelElement.getBoundingClientRect();
        return {
            scrollWidth: labelElement.scrollWidth,
            clientWidth: labelElement.clientWidth,
            topInside: labelRect.top >= buttonRect.top - 1,
            bottomInside: labelRect.bottom <= buttonRect.bottom + 1,
        };
    });
    expect(labelContainment.scrollWidth).toBeLessThanOrEqual(labelContainment.clientWidth + 1);
    expect(labelContainment.topInside).toBe(true);
    expect(labelContainment.bottomInside).toBe(true);
    await launcher.hover();
    await expect.poll(() => launcher.evaluate(button => {
        const elements = [
            button.querySelector('.easyedu-guide__launcher-icon'),
            button.querySelector('.easyedu-guide__launcher-label'),
        ];
        return Math.max(...elements.map(element => {
            const colour = element ? getComputedStyle(element).color : '';
            const channels = colour.match(/[\d.]+/g) || [];
            return channels.length === 4 ? Number(channels[3]) : 1;
        }));
    })).toBeLessThanOrEqual(0.01);
    const hoverAppearance = await launcher.evaluate(button => {
        const icon = button.querySelector('.easyedu-guide__launcher-icon');
        const labelElement = button.querySelector('.easyedu-guide__launcher-label');
        return {
            buttonBackground: getComputedStyle(button).backgroundImage,
            iconColor: icon ? getComputedStyle(icon).color : '',
            iconBackground: icon ? getComputedStyle(icon).backgroundImage : '',
            labelColor: labelElement ? getComputedStyle(labelElement).color : '',
            labelBackground: labelElement ? getComputedStyle(labelElement).backgroundImage : '',
        };
    });
    expect(hoverAppearance.buttonBackground).toContain('linear-gradient');
    expect(hoverAppearance.iconBackground).toContain('linear-gradient');
    expect(hoverAppearance.labelBackground).toContain('linear-gradient');
    expect(hoverAppearance.iconColor).toMatch(/^rgba\(.+,\s*0\)$/);
    expect(hoverAppearance.labelColor).toMatch(/^rgba\(.+,\s*0\)$/);
    const alignment = await page.evaluate(() => {
        const guideIcon = document.querySelector(
            '[data-easyedu-navigation-panel] [data-easyedu-navigation-guide-slot] .easyedu-guide__launcher-icon'
        );
        const navigationIcon = document.querySelector(
            '[data-easyedu-navigation-panel] [data-easyedu-navigation-section="easystud-tools"] ' +
            '.easyedu-navigation__item-icon'
        );
        return {
            guideLeft: guideIcon?.getBoundingClientRect().left || 0,
            navigationLeft: navigationIcon?.getBoundingClientRect().left || 0,
        };
    });
    const alignmentDifference = Math.abs(alignment.guideLeft - alignment.navigationLeft);
    if (alignmentDifference > 1) {
        throw new Error(
            `Compact guide icon alignment drift: guide=${alignment.guideLeft}, ` +
            `navigation=${alignment.navigationLeft}, difference=${alignmentDifference}`
        );
    }
};

const openResponsiveNavigation = async page => {
    const trigger = page.locator('[data-easyedu-navigation-open]');
    const panel = page.locator('[data-easyedu-navigation-panel]');
    // The Moodle AMD loader can resolve the manager before the navigation
    // controller callback has bound this idempotent open action. Retrying the
    // same request waits for that binding without hiding a real failure behind
    // a browser/test relaunch.
    await expect.poll(async() => {
        await trigger.click();
        return panel.getAttribute('aria-hidden');
    }, {timeout: 10000}).toBe('false');
    await expect(panel).toHaveClass(/is-open/);
    return panel;
};

const getVisibleUnion = async locator => locator.evaluateAll(nodes => {
    const rectangles = nodes
        .map(node => node.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);
    if (!rectangles.length) {
        return null;
    }
    return {
        left: Math.min(...rectangles.map(rect => rect.left)),
        right: Math.max(...rectangles.map(rect => rect.right)),
        top: Math.min(...rectangles.map(rect => rect.top)),
        bottom: Math.max(...rectangles.map(rect => rect.bottom)),
    };
});

const assertDesktopNavigationCentred = async(page, width, direction = 'ltr') => {
    await page.setViewportSize({width, height: 1000});
    await login(page);
    await page.evaluate(value => {
        document.documentElement.setAttribute('dir', value);
    }, direction);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const navigation = page.locator('[data-easyedu-navigation-desktop]');
    const destinations = navigation.locator(
        ':scope > .easyedu-navigation__sections > .easyedu-navigation__section ' +
        '> .easyedu-navigation__items > [data-easyedu-navigation-item-id]'
    );
    const guideSource = navigation.locator('[data-easyedu-navigation-guide-source]');
    const guideButton = guideSource.locator('[data-easyedu-guide-open]');
    const guideLabel = guideSource.locator('.easyedu-guide__launcher-label');
    await expect(navigation).toBeVisible();
    expect(await destinations.count()).toBeGreaterThan(0);

    const navigationGeometry = await navigation.boundingBox();
    const destinationGeometry = await getVisibleUnion(destinations);
    expect(navigationGeometry).not.toBeNull();
    expect(destinationGeometry).not.toBeNull();
    const navigationCentre = (navigationGeometry?.x || 0) + (navigationGeometry?.width || 0) / 2;
    const destinationCentre = ((destinationGeometry?.left || 0) + (destinationGeometry?.right || 0)) / 2;
    expect(Math.abs(destinationCentre - navigationCentre)).toBeLessThanOrEqual(1);

    await guideButton.hover();
    await expect(guideLabel).not.toHaveCSS('opacity', '0');
    const destinationGeometryAfterLabel = await getVisibleUnion(destinations);
    const destinationCentreAfterLabel =
        ((destinationGeometryAfterLabel?.left || 0) + (destinationGeometryAfterLabel?.right || 0)) / 2;
    expect(Math.abs(destinationCentreAfterLabel - navigationCentre)).toBeLessThanOrEqual(1);
    expect(Math.abs(destinationCentreAfterLabel - destinationCentre)).toBeLessThanOrEqual(1);
    await assertNoHorizontalOverflow(page);
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

for (const desktopCase of [
    {name: '1280', width: 1280, direction: 'ltr'},
    {name: '1440', width: 1440, direction: 'ltr'},
    {name: '1920', width: 1920, direction: 'ltr'},
    {name: 'rtl-1440', width: 1440, direction: 'rtl'},
]) {
    test(`desktop navigation remains centred at ${desktopCase.name}`, async({page}) => {
        await assertDesktopNavigationCentred(page, desktopCase.width, desktopCase.direction);
    });
}

for (const viewport of [
    {name: 'tablet-landscape', width: 1024, height: 768},
    {name: 'tablet-portrait', width: 768, height: 1024},
    {name: 'phone', width: 390, height: 844},
]) {
    test(`responsive navigation trigger remains left-centred at ${viewport.name}`, async({page}) => {
        await page.setViewportSize({width: viewport.width, height: viewport.height});
        await login(page);

        const initialGeometry = await assertResponsiveNavigationTrigger(page);
        await page.evaluate(() => {
            const scrollable = Array.from(document.querySelectorAll('*')).find(node => {
                const style = getComputedStyle(node);
                return /auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
            });
            if (scrollable) {
                scrollable.scrollTop = Math.max(1, scrollable.scrollHeight - scrollable.clientHeight);
            }
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
        });
        await page.waitForTimeout(150);
        const scrolledGeometry = await assertResponsiveNavigationTrigger(page);
        expect(Math.abs(scrolledGeometry.top - initialGeometry.top)).toBeLessThanOrEqual(1);
        await assertNoHorizontalOverflow(page);
    });

    test(`responsive entity workspaces at ${viewport.name}`, async({page}) => {
        await page.setViewportSize({width: viewport.width, height: viewport.height});
        await login(page);

        await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeVisible();
        const navTrigger = page.locator('[data-easyedu-navigation-open]');
        await expect(navTrigger).toBeVisible();
        await assertResponsiveNavigationTrigger(page);
        await navTrigger.click();
        const panel = page.locator('[data-easyedu-navigation-panel]');
        await expect(panel).toHaveClass(/is-open/);
        await assertResponsiveGuideLauncher(page, panel);
        const participantMenu = page.locator('[data-easystud-participant-navigation] .select-menu');
        await expect(participantMenu).toHaveCount(1);
        await expect(participantMenu.locator('.dropdown-toggle'))
            .toHaveAccessibleName(/Participants/i);
        expect(await participantMenu.locator('[role="option"]').count()).toBeGreaterThan(0);
        await expect(participantMenu.locator('.dropdown-toggle'))
            .toContainText(/Simplified student management/i);
        await expect(panel.locator(
            '[data-easyedu-navigation-item-id="easystud-manager"] .easyedu-navigation__item'
        )).toHaveAttribute('aria-current', 'page');
        await expect(panel.locator('[data-easyedu-navigation-section="easystud-tools"] ' +
            '[data-easyedu-navigation-item-id]')).toHaveCount(3);
        expect(await panel.locator('.easyedu-navigation__item').count()).toBeGreaterThanOrEqual(3);
        const participantCategory = panel.locator(
            '[data-easyedu-navigation-section="course-participants"]'
        );
        await expect(participantCategory).toHaveCount(1);
        const participantLinks = participantCategory.locator('[data-easyedu-navigation-participant-item]');
        const nativeParticipantItems = participantMenu.locator('.dropdown-item[data-value]');
        expect(await participantLinks.count()).toBe(await nativeParticipantItems.count());
        expect(await participantLinks.count()).toBeGreaterThan(0);
        await expect(panel.locator('[data-easyedu-navigation-participant-source]')).toHaveCount(0);
        await panel.locator('[data-easyedu-navigation-close]').click();
        await expect(panel).not.toHaveClass(/is-open/);
        await expect(navTrigger).toBeVisible();
        await assertMobileView(page, 'participants');
        await expect(page.locator('.local-groupimport-easystud__layout-mode-group')).toBeHidden();
        await expect(page.locator('[data-easystud-mobile-guide-slot] [data-easyedu-guide-open]')).toBeHidden();

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
    const menuIcon = menuButton.locator('.local-groupimport-easystud-card-menu__icon.fa-bars');
    await expect(menuIcon).toHaveCount(1);
    const triggerGeometry = await menuButton.evaluate(button => {
        const buttonRect = button.getBoundingClientRect();
        const surfaceRect = button.firstElementChild.getBoundingClientRect();
        return {
            height: buttonRect.height,
            width: buttonRect.width,
            surfaceHeight: surfaceRect.height,
            surfaceWidth: surfaceRect.width,
        };
    });
    expect(triggerGeometry.height).toBeGreaterThanOrEqual(44);
    expect(triggerGeometry.width).toBeGreaterThanOrEqual(44);
    expect(triggerGeometry.surfaceHeight).toBeLessThan(triggerGeometry.height);
    expect(triggerGeometry.surfaceWidth).toBeLessThan(triggerGeometry.width);
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

test('responsive card menu triggers align with their card row controls', async({page}, testInfo) => {
    // A cold local Moodle cache can make the login round-trip exceed the
    // suite's default minute before any geometry is measured.
    test.setTimeout(120000);
    await page.setViewportSize({width: 768, height: 900});
    await login(page);

    const readAlignment = async(menu, reference, label) => {
        await expect(menu, `${label}: menu trigger`).toBeVisible();
        await expect(reference, `${label}: reference control`).toBeVisible();
        const [menuBox, referenceBox] = await Promise.all([menu.boundingBox(), reference.boundingBox()]);
        expect(menuBox, `${label}: menu geometry`).not.toBeNull();
        expect(referenceBox, `${label}: reference geometry`).not.toBeNull();
        return {
            label,
            menuCentreY: menuBox.y + menuBox.height / 2,
            referenceCentreY: referenceBox.y + referenceBox.height / 2,
            centreOffset: (menuBox.y + menuBox.height / 2) -
                (referenceBox.y + referenceBox.height / 2),
            centreDelta: Math.abs(
                (menuBox.y + menuBox.height / 2) - (referenceBox.y + referenceBox.height / 2)
            ),
        };
    };

    await assertMobileView(page, 'participants');
    const participant = page.locator('[data-easystud-user]:visible').first();
    const participantAlignment = await readAlignment(
        participant.locator(':scope > [data-easystud-card-menu]'),
        participant.locator('.local-groupimport-easystud-user__detail-button'),
        'participant'
    );
    await page.screenshot({
        path: testInfo.outputPath('responsive-card-menu-participant.png'),
        fullPage: false,
    });

    await page.locator('[data-easystud-mobile-view="groups"]').click();
    await assertMobileView(page, 'groups');
    const group = page.locator('[data-easystud-mobile-entity-region="groups"] [data-easystud-group-id]:visible').first();
    const groupAlignment = await readAlignment(
        group.locator('[data-easystud-card-menu]:visible').first(),
        group.locator('.local-groupimport-easystud-group__name').first(),
        'group'
    );
    await page.screenshot({
        path: testInfo.outputPath('responsive-card-menu-group.png'),
        fullPage: false,
    });

    await page.locator('[data-easystud-mobile-view="groupings"]').click();
    await assertMobileView(page, 'groupings');
    const grouping = page.locator('[data-easystud-grouping-id]:visible').first();
    const groupingAlignment = await readAlignment(
        grouping.locator(':scope > [data-easystud-card-menu]'),
        grouping.locator('.local-groupimport-easystud-container-search__toggle'),
        'grouping'
    );
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
        path: testInfo.outputPath('responsive-card-menu-grouping.png'),
        fullPage: false,
    });

    console.log('RESPONSIVE_CARD_MENU_ALIGNMENT:', JSON.stringify([
        participantAlignment,
        groupAlignment,
        groupingAlignment,
    ]));
    expect(participantAlignment.centreDelta, 'participant centre delta').toBeLessThanOrEqual(2);
    expect(groupAlignment.centreDelta, 'group centre delta').toBeLessThanOrEqual(2);
    expect(groupingAlignment.centreDelta, 'grouping centre delta').toBeLessThanOrEqual(2);
});

test('desktop layouts and guide launcher remain available', async({page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);
    await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeHidden();
    await expect(page.locator('[data-easyedu-navigation-desktop]')).toBeVisible();
    await expect(page.locator('[data-easyedu-navigation-desktop] ' +
        '[data-easyedu-guide-open], [data-easystud-open-tutorial]')).toHaveCount(1);
    const navigationIcon = page.locator(
        '[data-easyedu-navigation-desktop] .easyedu-navigation__item-icon'
    ).first();
    await expect(navigationIcon).toBeVisible();
    const navigationIconGeometry = await navigationIcon.evaluate(node => {
        const icon = node.getBoundingClientRect();
        const item = node.closest('.easyedu-navigation__item').getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return {
            display: style.display,
            backgroundColor: style.backgroundColor,
            width: icon.width,
            height: icon.height,
            centreDelta: Math.abs((icon.top + icon.height / 2) - (item.top + item.height / 2)),
        };
    });
    expect(navigationIconGeometry.display).toMatch(/flex/);
    expect(navigationIconGeometry.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(navigationIconGeometry.width).toBeGreaterThanOrEqual(15);
    expect(navigationIconGeometry.width).toBeLessThanOrEqual(17);
    expect(navigationIconGeometry.centreDelta).toBeLessThanOrEqual(1);
    const guideSource = page.locator('[data-easyedu-navigation-desktop] [data-easyedu-navigation-guide-source]');
    const guideButton = guideSource.locator('[data-easyedu-guide-open]');
    const guideLabel = guideSource.locator('.easyedu-guide__launcher-label');
    await expect(guideButton).toHaveAccessibleName(/Open.*guide|Ouvrir.*guide/i);
    const desktopNavigation = page.locator('[data-easyedu-navigation-desktop]');
    const destinationSection = desktopNavigation.locator(
        '> .easyedu-navigation__sections > .easyedu-navigation__section'
    ).first();
    const desktopNavigationGeometry = await desktopNavigation.boundingBox();
    const destinationGeometry = await destinationSection.boundingBox();
    expect(desktopNavigationGeometry).not.toBeNull();
    expect(destinationGeometry).not.toBeNull();
    expect(Math.abs(
        ((destinationGeometry?.x || 0) + (destinationGeometry?.width || 0) / 2) -
        ((desktopNavigationGeometry?.x || 0) + (desktopNavigationGeometry?.width || 0) / 2)
    )).toBeLessThanOrEqual(1);
    const navigationItem = page.locator('[data-easyedu-navigation-desktop] [data-easyedu-navigation-item-id]').first();
    const beforeNavigationItem = await navigationItem.boundingBox();
    const beforeDesktopNavigation = await desktopNavigation.boundingBox();
    await guideButton.hover();
    await expect(guideLabel).toBeVisible();
    await expect(guideLabel).not.toHaveCSS('opacity', '0');
    const afterNavigationItem = await navigationItem.boundingBox();
    const afterDesktopNavigation = await desktopNavigation.boundingBox();
    // Playwright may scroll the document to bring the left-edge launcher under
    // the pointer. Compare the item to its navigation rail, not the viewport,
    // so this check detects layout reflow without mistaking page scroll for it.
    expect(Math.abs(
        ((afterNavigationItem?.x || 0) - (afterDesktopNavigation?.x || 0)) -
        ((beforeNavigationItem?.x || 0) - (beforeDesktopNavigation?.x || 0))
    )).toBeLessThanOrEqual(1);
    expect(Math.abs(
        ((afterNavigationItem?.y || 0) - (afterDesktopNavigation?.y || 0)) -
        ((beforeNavigationItem?.y || 0) - (beforeDesktopNavigation?.y || 0))
    )).toBeLessThanOrEqual(1);
    const destinationGeometryAfterLabel = await destinationSection.boundingBox();
    expect(Math.abs(
        ((destinationGeometryAfterLabel?.x || 0) + (destinationGeometryAfterLabel?.width || 0) / 2) -
        ((desktopNavigationGeometry?.x || 0) + (desktopNavigationGeometry?.width || 0) / 2)
    )).toBeLessThanOrEqual(1);
    const labelGeometry = await guideLabel.boundingBox();
    const buttonGeometry = await guideButton.boundingBox();
    expect(labelGeometry).not.toBeNull();
    expect(buttonGeometry).not.toBeNull();
    expect((labelGeometry?.x || 0)).toBeGreaterThanOrEqual((buttonGeometry?.x || 0) + (buttonGeometry?.width || 0) + 7);
    await guideButton.focus();
    await expect(guideLabel).toBeVisible();
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await expect(guideLabel).toBeHidden();
    await guideButton.click();
    const guideModal = page.locator('[data-easyedu-guide-modal]');
    await expect(guideModal).toBeVisible();
    const guideDialog = guideModal.locator('.easyedu-guide-modal__dialog');
    await expect(guideDialog).toBeVisible();
    const guideModalGeometry = await guideModal.boundingBox();
    const guideDialogGeometry = await guideDialog.boundingBox();
    expect(guideModalGeometry).not.toBeNull();
    expect(guideDialogGeometry).not.toBeNull();
    const guideModalDiagnostics = await page.evaluate(() => {
        const modal = document.querySelector('[data-easyedu-guide-modal]');
        const dialog = modal?.querySelector('.easyedu-guide-modal__dialog');
        const ancestors = [];
        let current = modal;
        while (current && ancestors.length < 8) {
            const style = window.getComputedStyle(current);
            const rect = current.getBoundingClientRect();
            ancestors.push({
                tag: current.tagName,
                className: current.className,
                position: style.position,
                display: style.display,
                width: style.width,
                inset: style.inset,
                transform: style.transform,
                filter: style.filter,
                contain: style.contain,
                willChange: style.willChange,
                rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
            });
            current = current.parentElement;
        }
        return {
            viewport: {width: window.innerWidth, height: window.innerHeight},
            modal: ancestors[0],
            dialog: dialog ? (() => {
                const style = window.getComputedStyle(dialog);
                const rect = dialog.getBoundingClientRect();
                return {
                    position: style.position,
                    display: style.display,
                    width: style.width,
                    height: style.height,
                    rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
                };
            })() : null,
            ancestors,
        };
    });
    if ((guideModalGeometry?.width || 0) < 1400 || (guideModalGeometry?.height || 0) < 980) {
        console.log('GUIDE_MODAL_DIAGNOSTICS:', JSON.stringify(guideModalDiagnostics));
    }
    expect(guideModalGeometry?.width || 0).toBeGreaterThanOrEqual(1400);
    expect(guideModalGeometry?.height || 0).toBeGreaterThanOrEqual(980);
    expect(guideDialogGeometry?.width || 0).toBeGreaterThan(640);
    expect(guideDialogGeometry?.height || 0).toBeGreaterThan(480);
    await expect(guideLabel).toBeHidden();
    await page.screenshot({
        path: testInfo.outputPath('guide-desktop.png'),
        fullPage: false,
    });
    await page.locator('[data-easyedu-guide-close]').click();
    await expect(guideModal).toBeHidden();
    await expect(guideLabel).toBeHidden();
    await expect(page.locator('[data-easyedu-navigation]')).toBeVisible();
    await expect(page.locator('[data-easyedu-navigation-panel]')).toBeHidden();
    const participantMenu = page.locator('[data-easystud-participant-navigation] .select-menu');
    await expect(participantMenu).toBeVisible();
    const participantToggle = participantMenu.locator('.dropdown-toggle');
    await participantToggle.click();
    await expect(participantToggle).toHaveAttribute('aria-expanded', 'true');
    const participantDropdown = participantMenu.locator('.dropdown-menu:visible');
    await expect(participantDropdown).toBeVisible();
    const guideDropdownPaint = await page.evaluate(() => {
        const guide = document.querySelector('[data-easyedu-navigation-desktop] [data-easyedu-guide-open]');
        const menu = document.querySelector('[data-easystud-participant-navigation] .select-menu .dropdown-menu');
        if (!guide || !menu) {
            return {overlap: false, guidePaintedAbove: false};
        }
        const guideRect = guide.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const left = Math.max(guideRect.left, menuRect.left);
        const right = Math.min(guideRect.right, menuRect.right);
        const top = Math.max(guideRect.top, menuRect.top);
        const bottom = Math.min(guideRect.bottom, menuRect.bottom);
        if (right <= left || bottom <= top) {
            return {overlap: false, guidePaintedAbove: false};
        }
        const hit = document.elementsFromPoint(left + 1, top + 1);
        return {
            overlap: true,
            guidePaintedAbove: hit.some(element => element.closest('[data-easyedu-guide-open]')),
        };
    });
    const guideSourceLayer = await guideSource.evaluate(node => window.getComputedStyle(node).zIndex);
    expect(guideSourceLayer).toBe('auto');
    if (guideDropdownPaint.overlap) {
        expect(guideDropdownPaint.guidePaintedAbove).toBe(false);
    }
    await page.keyboard.press('Escape');
    await expect(participantDropdown).toBeHidden();
    await expect(page.locator('.local-groupimport-easystud__layout-mode-group')).toBeVisible();
    await expect(page.locator('[data-easystud-participants-panel]')).toBeVisible();
    await expect(page.locator('[data-easystud-structure-panel]')).toBeVisible();
    const participant = page.locator('[data-easystud-user]:visible').first();
    const detailsButton = participant.locator('.local-groupimport-easystud-user__detail-button');
    const compactPosition = await detailsButton.evaluate(node => {
        const rect = node.getBoundingClientRect();
        const cardRect = node.closest('[data-easystud-user]').getBoundingClientRect();
        return {
            top: rect.top,
            right: rect.right,
            centreDelta: Math.abs((rect.top + rect.height / 2) - (cardRect.top + cardRect.height / 2)),
        };
    });
    await participant.locator('[data-easystud-selector-input]').evaluate(input => input.click());
    await page.waitForTimeout(650);
    const expandedPosition = await detailsButton.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return {top: rect.top, right: rect.right};
    });
    if (Math.abs(expandedPosition.top - compactPosition.top) > 1 ||
        Math.abs(expandedPosition.right - compactPosition.right) > 1) {
        console.log('SELECTION_GEOMETRY:', JSON.stringify({compactPosition, expandedPosition}));
    }
    expect(Math.abs(expandedPosition.top - compactPosition.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(expandedPosition.right - compactPosition.right)).toBeLessThanOrEqual(1);
    expect(compactPosition.centreDelta).toBeLessThanOrEqual(1);
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

    await page.setViewportSize({width: 390, height: 844});
    await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeVisible();
    const compactNavigationPanel = await openResponsiveNavigation(page);
    await expect(compactNavigationPanel).toBeVisible();
    await assertResponsiveGuideLauncher(page, compactNavigationPanel);
    await compactNavigationPanel
        .locator('[data-easyedu-navigation-guide-slot] [data-easyedu-guide-open]')
        .click();
    await expect(guideModal).toBeVisible();
    await expect(guideDialog).toBeVisible();
    await guideDialog.evaluate(node => Promise.all(node.getAnimations()
        .map(animation => animation.finished.catch(() => undefined))));
    const mobileGuideGeometry = await guideDialog.evaluate(node => {
        const rect = node.getBoundingClientRect();
        const modal = node.closest('[data-easyedu-guide-modal]');
        const modalRect = modal ? modal.getBoundingClientRect() : null;
        const modalStyle = modal ? getComputedStyle(modal) : null;
        return {
            x: rect.x,
            width: rect.width,
            height: rect.height,
            bottomGap: window.innerHeight - rect.bottom,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            modalWidth: modalRect ? modalRect.width : 0,
            modalPaddingLeft: modalStyle ? parseFloat(modalStyle.paddingLeft) : 0,
            modalPaddingRight: modalStyle ? parseFloat(modalStyle.paddingRight) : 0,
        };
    });
    console.log('MOBILE_GUIDE_GEOMETRY:', JSON.stringify(mobileGuideGeometry));
    await page.screenshot({
        path: testInfo.outputPath('guide-mobile.png'),
        fullPage: false,
    });
    expect(mobileGuideGeometry.x).toBeGreaterThanOrEqual(7);
    expect(Math.abs(mobileGuideGeometry.width - (
        mobileGuideGeometry.modalWidth - mobileGuideGeometry.modalPaddingLeft - mobileGuideGeometry.modalPaddingRight
    ))).toBeLessThanOrEqual(2);
    expect(mobileGuideGeometry.height).toBeGreaterThan(480);
    expect(mobileGuideGeometry.height).toBeLessThanOrEqual(mobileGuideGeometry.viewportHeight - 14);
    expect(mobileGuideGeometry.bottomGap).toBeGreaterThanOrEqual(7);
    expect(mobileGuideGeometry.bottomGap).toBeLessThanOrEqual(9);
    const mobileGuideAlignment = await guideDialog.evaluate(dialog => {
        const box = node => {
            const rect = node?.getBoundingClientRect();
            return rect ? {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width} : null;
        };
        const header = dialog.querySelector('.easyedu-guide-modal__header');
        const title = dialog.querySelector('.easyedu-guide-modal__title-wrap');
        const close = dialog.querySelector('[data-easyedu-guide-close]');
        const slide = dialog.querySelector('[data-easyedu-guide-slide]:not([hidden])');
        const icon = slide?.querySelector('.easyedu-guide-slide__icon');
        const content = slide?.querySelector(':scope > div');
        const heading = slide?.querySelector('.easyedu-guide-slide__header h3');
        const show = slide?.querySelector('[data-easyedu-guide-show-target]');
        const footer = dialog.querySelector('.easyedu-guide-modal__footer');
        const actions = dialog.querySelector('.easyedu-guide-modal__footer-actions');
        return {
            header: box(header),
            title: box(title),
            close: box(close),
            slide: box(slide),
            icon: box(icon),
            content: box(content),
            heading: box(heading),
            show: box(show),
            footer: box(footer),
            actions: box(actions),
        };
    });
    console.log('MOBILE_GUIDE_ALIGNMENT:', JSON.stringify(mobileGuideAlignment));
    expect(mobileGuideAlignment.header).not.toBeNull();
    expect(mobileGuideAlignment.title).not.toBeNull();
    expect(mobileGuideAlignment.close).not.toBeNull();
    expect(Math.abs(mobileGuideAlignment.title.top - mobileGuideAlignment.close.top)).toBeLessThanOrEqual(8);
    expect(mobileGuideAlignment.header.right - mobileGuideAlignment.close.right).toBeLessThanOrEqual(17);
    expect(mobileGuideAlignment.slide).not.toBeNull();
    expect(mobileGuideAlignment.icon).not.toBeNull();
    expect(mobileGuideAlignment.content).not.toBeNull();
    expect(mobileGuideAlignment.content.left - mobileGuideAlignment.slide.left).toBeLessThanOrEqual(25);
    expect(mobileGuideAlignment.content.width).toBeGreaterThanOrEqual(mobileGuideGeometry.width - 90);
    expect(mobileGuideAlignment.show).not.toBeNull();
    expect(mobileGuideAlignment.heading).not.toBeNull();
    expect(mobileGuideAlignment.show.top).toBeGreaterThan(mobileGuideAlignment.heading.bottom);
    expect(Math.abs(mobileGuideAlignment.show.width - mobileGuideAlignment.content.width)).toBeLessThanOrEqual(2);
    expect(mobileGuideAlignment.footer).not.toBeNull();
    expect(mobileGuideAlignment.actions).not.toBeNull();
    expect(mobileGuideAlignment.actions.right).toBeLessThanOrEqual(mobileGuideAlignment.footer.right + 1);
    await assertNoHorizontalOverflow(page);
    await page.locator('[data-easyedu-guide-close]').click();
    await expect(guideModal).toBeHidden();
});

test('mobile Guide modal aligns its internal content', async({page}, testInfo) => {
    await page.setViewportSize({width: 390, height: 844});
    await login(page);
    const panel = await openResponsiveNavigation(page);
    await assertResponsiveGuideLauncher(page, panel);
    await panel.locator('[data-easyedu-navigation-guide-slot] [data-easyedu-guide-open]').click();

    const modal = page.locator('[data-easyedu-guide-modal]');
    const dialog = modal.locator('.easyedu-guide-modal__dialog');
    await expect(modal).toBeVisible();
    await expect(dialog).toBeVisible();
    await dialog.evaluate(node => Promise.all(node.getAnimations()
        .map(animation => animation.finished.catch(() => undefined))));

    const alignment = await dialog.evaluate(node => {
        const box = element => {
            const rect = element?.getBoundingClientRect();
            return rect ? {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + (rect.width / 2),
                centerY: rect.top + (rect.height / 2),
            } : null;
        };
        const slide = node.querySelector('[data-easyedu-guide-slide]:not([hidden])');
        const title = node.querySelector('.easyedu-guide-modal__title-wrap');
        const content = slide?.querySelector(':scope > div');
        const footer = node.querySelector('.easyedu-guide-modal__footer');
        const actions = node.querySelector('.easyedu-guide-modal__footer-actions');
        const step = node.querySelector('.easyedu-guide-modal__step-count');
        const flowArrow = slide?.querySelector('.easyedu-guide-flow-arrow');
        return {
            dialog: box(node),
            header: box(node.querySelector('.easyedu-guide-modal__header')),
            title: box(title),
            close: box(node.querySelector('[data-easyedu-guide-close]')),
            slide: box(slide),
            icon: box(slide?.querySelector('.easyedu-guide-slide__icon')),
            content: box(content),
            heading: box(slide?.querySelector('.easyedu-guide-slide__header h3')),
            show: box(slide?.querySelector('[data-easyedu-guide-show-target]')),
            footer: box(footer),
            actions: box(actions),
            step: box(step),
            titleTextAlign: title ? getComputedStyle(title).textAlign : null,
            contentTextAlign: content ? getComputedStyle(content).textAlign : null,
            footerDirection: footer ? getComputedStyle(footer).flexDirection : null,
            actionsOrder: actions ? getComputedStyle(actions).order : null,
            stepOrder: step ? getComputedStyle(step).order : null,
            slideBorderTop: slide ? parseFloat(getComputedStyle(slide).borderTopWidth) : 0,
            slideBorderLeft: slide ? parseFloat(getComputedStyle(slide).borderLeftWidth) : 0,
            flowTransform: flowArrow ? getComputedStyle(flowArrow).transform : null,
        };
    });
    console.log('MOBILE_GUIDE_INTERNAL_ALIGNMENT:', JSON.stringify(alignment));
    await page.screenshot({
        path: testInfo.outputPath('guide-mobile-internal-alignment.png'),
        fullPage: false,
    });

    expect(alignment.dialog).not.toBeNull();
    expect(alignment.header).not.toBeNull();
    expect(alignment.title).not.toBeNull();
    expect(alignment.close).not.toBeNull();
    expect(Math.abs(alignment.title.centerX - alignment.dialog.centerX)).toBeLessThanOrEqual(8);
    expect(Math.abs(alignment.title.centerY - alignment.close.centerY)).toBeLessThanOrEqual(8);
    expect(alignment.header.right - alignment.close.right).toBeLessThanOrEqual(17);
    expect(alignment.titleTextAlign).toBe('center');
    expect(alignment.slide).not.toBeNull();
    expect(alignment.icon).not.toBeNull();
    expect(alignment.content).not.toBeNull();
    expect(alignment.content.left - alignment.slide.left).toBeLessThanOrEqual(25);
    expect(alignment.content.width).toBeGreaterThanOrEqual(alignment.dialog.width - 90);
    expect(alignment.heading).not.toBeNull();
    expect(alignment.show).not.toBeNull();
    expect(alignment.show.top).toBeGreaterThan(alignment.heading.bottom);
    expect(Math.abs(alignment.show.width - alignment.content.width)).toBeLessThanOrEqual(2);
    expect(alignment.contentTextAlign).toBe('center');
    expect(alignment.slideBorderTop).toBeGreaterThanOrEqual(6);
    expect(alignment.slideBorderLeft).toBe(0);
    expect(Math.abs(alignment.icon.centerX - alignment.slide.centerX)).toBeLessThanOrEqual(2);
    expect(alignment.footer).not.toBeNull();
    expect(alignment.actions).not.toBeNull();
    expect(alignment.step).not.toBeNull();
    expect(alignment.footerDirection).toBe('column');
    expect(Number(alignment.actionsOrder)).toBeLessThan(Number(alignment.stepOrder));
    expect(alignment.step.top).toBeGreaterThanOrEqual(alignment.actions.bottom - 1);
    expect(Math.abs(alignment.actions.centerX - alignment.footer.centerX)).toBeLessThanOrEqual(2);
    expect(alignment.flowTransform).not.toBeNull();
    expect(alignment.flowTransform).not.toBe('none');

    let guidedCardFound = false;
    for (let step = 0; step < 20; step += 1) {
        if (await dialog.locator('.easyedu-guide-guided-card:visible').count()) {
            guidedCardFound = true;
            break;
        }
        const next = dialog.locator('[data-easyedu-guide-next]:visible');
        if (await next.isDisabled()) {
            break;
        }
        await next.click();
        await page.waitForTimeout(80);
    }
    expect(guidedCardFound).toBe(true);
    const guidedPath = await dialog.locator('.easyedu-guide-guided-card:visible').evaluate(node => {
        const box = element => {
            const rect = element?.getBoundingClientRect();
            return rect ? {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                top: rect.top,
                bottom: rect.bottom,
                centerX: rect.left + (rect.width / 2),
            } : null;
        };
        const body = node.querySelector('.easyedu-guide-guided-card__body');
        const icon = node.querySelector('.easyedu-guide-guided-card__icon');
        const action = node.querySelector('.easyedu-guide-slide__start');
        return {
            card: box(node),
            body: box(body),
            icon: box(icon),
            action: box(action),
            cardTextAlign: getComputedStyle(node).textAlign,
            bodyTextAlign: body ? getComputedStyle(body).textAlign : null,
        };
    });
    console.log('MOBILE_GUIDED_PATH_COMPOSITION:', JSON.stringify(guidedPath));
    await page.screenshot({
        path: testInfo.outputPath('guide-mobile-guided-path-composition.png'),
        fullPage: false,
    });
    expect(guidedPath.card).not.toBeNull();
    expect(guidedPath.body).not.toBeNull();
    expect(guidedPath.icon).not.toBeNull();
    expect(guidedPath.action).not.toBeNull();
    expect(guidedPath.cardTextAlign).toBe('center');
    expect(guidedPath.bodyTextAlign).toBe('center');
    expect(guidedPath.action.top).toBeGreaterThanOrEqual(guidedPath.body.bottom - 1);
    expect(guidedPath.action.width).toBeGreaterThanOrEqual(guidedPath.card.width - 32);
    expect(Math.abs(guidedPath.action.centerX - guidedPath.card.centerX)).toBeLessThanOrEqual(2);
    await assertNoHorizontalOverflow(page);
    await page.locator('[data-easyedu-guide-close]').click();
    await expect(modal).toBeHidden();
});

test('compact Guide launcher portals its modal above navigation', async({page}, testInfo) => {
    await page.setViewportSize({width: 390, height: 844});
    await login(page);

    const panel = await openResponsiveNavigation(page);
    const launcher = panel.locator('[data-easyedu-navigation-guide-slot] ' +
        '[data-easyedu-responsive-guide-launcher]');
    await expect(launcher).toBeVisible();
    await expect(launcher.locator('.easyedu-guide__launcher-label')).toBeVisible();
    const launcherStyle = await launcher.evaluate(node => ({
        backgroundImage: getComputedStyle(node).backgroundImage,
        matchesCompactSelector: node.matches(
            '.local-groupimport-easystud__navigation .easyedu-navigation__panel ' +
            '.easyedu-navigation__guide-slot .easyedu-guide__launcher'
        ),
        loadedStylesheets: performance.getEntriesByType('resource')
            .map(entry => entry.name)
            .filter(name => name.includes('styles') || name.includes('groupimport')),
    }));
    console.log('COMPACT_GUIDE_LAUNCHER_STYLE:', JSON.stringify(launcherStyle));
    expect(launcherStyle.backgroundImage).not.toBe('none');

    await launcher.click();
    const guideRoot = page.locator('[data-easyedu-guide-root]');
    const modal = guideRoot.locator('[data-easyedu-guide-modal]');
    await expect(modal).toBeVisible();

    const overlayState = await page.evaluate(() => {
        const guideRoot = document.querySelector('[data-easyedu-guide-root]');
        const modal = document.querySelector('[data-easyedu-guide-modal]');
        const panel = document.querySelector('[data-easyedu-navigation-panel]');
        const dialog = modal ? modal.querySelector('.easyedu-guide-modal__dialog') : null;
        const rect = dialog ? dialog.getBoundingClientRect() : null;
        const point = rect ? document.elementFromPoint(
            rect.left + (rect.width / 2),
            rect.top + (rect.height / 2)
        ) : null;
        const activeSlide = modal ? modal.querySelector('[data-easyedu-guide-slide]:not([hidden])') : null;
        const nextAction = modal ? modal.querySelector('[data-easyedu-guide-next]') : null;
        const previousAction = modal ? modal.querySelector('[data-easyedu-guide-previous]') : null;
        return {
            guideRootIsBodyChild: !!guideRoot && guideRoot.parentElement === document.body,
            guideThemePreserved: !!guideRoot &&
                guideRoot.getAttribute('data-easyedu-guide-portal-theme') === '1' &&
                getComputedStyle(guideRoot).getPropertyValue('--easyedu-primary').trim() !== '',
            modalAbovePanel: !!modal && !!panel &&
                Number.parseInt(getComputedStyle(modal).zIndex, 10) >
                Number.parseInt(getComputedStyle(panel).zIndex, 10),
            dialogOwnsCentrePoint: !!dialog && !!point && dialog.contains(point),
            panelRemainsOpen: panel && panel.getAttribute('aria-hidden') === 'false',
            slideColor: activeSlide ? getComputedStyle(activeSlide).color : '',
            nextColor: nextAction ? getComputedStyle(nextAction).color : '',
            previousColor: previousAction ? getComputedStyle(previousAction).color : '',
            nextBackground: nextAction ? getComputedStyle(nextAction).backgroundColor : '',
        };
    });
    expect(overlayState.guideRootIsBodyChild).toBe(true);
    expect(overlayState.guideThemePreserved).toBe(true);
    expect(overlayState.modalAbovePanel).toBe(true);
    expect(overlayState.dialogOwnsCentrePoint).toBe(true);
    expect(overlayState.panelRemainsOpen).toBe(true);
    expect(overlayState.slideColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(overlayState.nextColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(overlayState.previousColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(overlayState.nextBackground).not.toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({
        path: testInfo.outputPath('guide-modal-above-navigation.png'),
        fullPage: false,
    });

    await modal.locator('[data-easyedu-guide-close]').click();
    await expect(modal).toBeHidden();
    await expect(launcher).toBeFocused();
});

test('Guide transitions close their active surface and preserve guided progress', async({page}, testInfo) => {
    await page.setViewportSize({width: 390, height: 844});
    await login(page);
    const panel = await openResponsiveNavigation(page);
    await panel.locator('[data-easyedu-navigation-guide-slot] [data-easyedu-guide-open]').click();

    const root = page.locator('[data-easyedu-guide-root]');
    const modal = page.locator('[data-easyedu-guide-modal]');
    const dialog = modal.locator('.easyedu-guide-modal__dialog');
    const interfaceReturn = root.locator('[data-easyedu-guide-interface-return]');
    const checklist = root.locator('[data-easyedu-guide-checklist]');
    await expect(modal).toBeVisible();

    const show = dialog.locator('[data-easyedu-guide-show-target]:visible').first();
    await expect(show).toBeVisible();
    await show.click();
    await expect(modal).toBeHidden();
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(interfaceReturn).toBeVisible();
    await expect(page.locator('[data-easyedu-guide-highlight]:visible')).toBeVisible();
    expect(await interfaceReturn.evaluate(node => getComputedStyle(node).color)).not.toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({
        path: testInfo.outputPath('guide-interface-return.png'),
        fullPage: false,
    });

    await interfaceReturn.locator('[data-easyedu-guide-interface-return-button]').click();
    await expect(interfaceReturn).toBeHidden();
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-easyedu-guide-highlight]:visible')).toHaveCount(0);

    for (let index = 0; index < 20; index += 1) {
        if (await dialog.locator('[data-easyedu-guide-start-path]:visible').count()) {
            break;
        }
        const next = dialog.locator('[data-easyedu-guide-next]:visible');
        if (await next.isDisabled()) {
            break;
        }
        await next.click();
    }
    const start = dialog.locator('[data-easyedu-guide-start-path]:visible').first();
    const pathName = await start.getAttribute('data-easyedu-guide-start-path');
    expect(pathName).toBeTruthy();
    await start.click();
    await expect(modal).toBeHidden();
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(checklist).toBeVisible();
    await expect(checklist).toHaveClass(/is-minimized/);
    await expect(checklist).not.toHaveAttribute('inert', '');
    await expect(checklist).toHaveAttribute('data-easyedu-guide-path', pathName);
    expect(await checklist.evaluate(node => getComputedStyle(node).color)).not.toBe('rgba(0, 0, 0, 0)');
    const checklistBorders = await checklist.evaluate(node => {
        const style = getComputedStyle(node);
        return {
            left: Number.parseFloat(style.borderLeftWidth),
            right: Number.parseFloat(style.borderRightWidth),
            top: Number.parseFloat(style.borderTopWidth),
        };
    });
    expect(checklistBorders.left).toBe(0);
    expect(checklistBorders.right).toBe(0);
    expect(checklistBorders.top).toBeGreaterThan(0);

    const selectedItemInput = page.locator(
        '[data-selectable-type]:visible [data-easystud-selector-input]:visible'
    ).first();
    await expect(selectedItemInput).toBeVisible();
    await selectedItemInput.evaluate(input => input.click());
    const mobileActions = page.locator('[data-easystud-mobile-actions]');
    await expect(mobileActions).toBeVisible();
    await expect.poll(async() => page.evaluate(() => {
        const guide = document.querySelector('[data-easyedu-guide-checklist]:not([hidden])');
        const actions = document.querySelector('[data-easystud-mobile-actions]:not([hidden])');
        if (!guide || !actions) {
            return false;
        }
        return guide.getBoundingClientRect().bottom <= actions.getBoundingClientRect().top - 6;
    })).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('guide-checklist-above-actions.png'),
        fullPage: false,
    });
    await selectedItemInput.evaluate(input => input.click());
    await expect(mobileActions).toBeHidden();

    const firstStep = checklist.locator('[data-easyedu-guide-step-index="0"]');
    await expect(firstStep).toBeVisible();
    await expect(checklist.locator('[data-easyedu-guide-step-index="1"]')).toBeHidden();
    expect(await checklist.evaluate(node => {
        const step = node.querySelector('[data-easyedu-guide-step-index].is-active');
        const control = node.querySelector('[data-easyedu-guide-checklist-minimize]');
        return control.getBoundingClientRect().left - step.getBoundingClientRect().right;
    })).toBeGreaterThanOrEqual(6);
    await firstStep.click();
    await expect(interfaceReturn).toBeHidden();
    await expect(checklist).toBeVisible();
    await expect(page.locator('[data-easyedu-guide-highlight]:visible')).toBeVisible();
    await expect.poll(async() => page.locator('[data-easyedu-guide-highlight]:visible').evaluate(node => {
        const target = node.getBoundingClientRect();
        const panel = document.querySelector('[data-easyedu-guide-checklist]')?.getBoundingClientRect();
        return !panel || target.bottom <= panel.top;
    })).toBe(true);
    await checklist.locator('[data-easyedu-guide-checklist-minimize]').click();
    await expect(checklist).not.toHaveClass(/is-minimized/);
    await expect(checklist.locator('.easyedu-guided-panel__message-compact')).toBeHidden();
    const firstStepId = await firstStep.getAttribute('data-easyedu-guide-step-id');
    expect(firstStepId).toBeTruthy();
    await root.evaluate((node, completion) => {
        node.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
            bubbles: true,
            detail: completion,
        }));
    }, {path: pathName, step: firstStepId});
    await expect(firstStep).toHaveClass(/is-complete/);
    if (pathName === 'first-structure') {
        await checklist.locator('[data-easyedu-guide-step-index="1"]').click();
        const participantActions = page.locator(
            '[data-easystud-participant-list] [data-easystud-user]:not([hidden]) > ' +
            '[data-easystud-card-menu]'
        ).first();
        await expect(participantActions).toHaveClass(/is-easyedu-guide-highlight-target/);
    }

    const stepIds = await checklist.locator('[data-easyedu-guide-step-id]').evaluateAll(nodes =>
        nodes.map(node => node.getAttribute('data-easyedu-guide-step-id')).filter(Boolean)
    );
    for (const stepId of stepIds) {
        await root.evaluate((node, completion) => {
            node.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
                bubbles: true,
                detail: completion,
            }));
        }, {path: pathName, step: stepId});
    }
    await expect(checklist).toHaveClass(/is-complete/);
    if (!await checklist.evaluate(node => node.classList.contains('is-minimized'))) {
        await checklist.locator('[data-easyedu-guide-checklist-minimize]').click();
    }
    await expect(checklist).toHaveClass(/is-minimized/);
    await expect(checklist.locator('[data-easyedu-guide-checklist-items]')).toBeHidden();
    await expect(checklist.locator('[data-easyedu-guide-checklist-message]')).toBeVisible();
    await expect(checklist.locator('[data-easyedu-guide-checklist-return]')).toBeVisible();
    const compactCompletionGeometry = await checklist.evaluate(node => {
        const close = node.querySelector('[data-easyedu-guide-checklist-close]');
        const returnButton = node.querySelector('[data-easyedu-guide-checklist-return]');
        const interfaceReturn = document.querySelector('[data-easyedu-guide-interface-return-button]');
        const interfaceClose = document.querySelector('[data-easyedu-guide-interface-return-dismiss]');
        const panelRect = node.getBoundingClientRect();
        const closeRect = close.getBoundingClientRect();
        const closeIconRect = close.querySelector('.fa').getBoundingClientRect();
        const messageRect = node.querySelector('[data-easyedu-guide-checklist-message]').getBoundingClientRect();
        const returnRect = returnButton.getBoundingClientRect();
        const styles = element => {
            const style = getComputedStyle(element);
            return {
                controlSize: element.matches(
                    '[data-easyedu-guide-checklist-close], [data-easyedu-guide-interface-return-dismiss]'
                ) ? style.width + 'x' + style.height : style.minHeight,
                radius: style.borderRadius,
                background: style.backgroundColor,
            };
        };
        return {
            closeContained: closeRect.top >= panelRect.top && closeRect.right <= panelRect.right &&
                closeRect.bottom <= panelRect.bottom,
            closeIconCentred: Math.abs(
                (closeRect.left + closeRect.width / 2) - (closeIconRect.left + closeIconRect.width / 2)
            ) <= 1 && Math.abs(
                (closeRect.top + closeRect.height / 2) - (closeIconRect.top + closeIconRect.height / 2)
            ) <= 1,
            completionHeightMatchesReturn: Math.abs(messageRect.height - returnRect.height) <= 1,
            returnButton: styles(returnButton),
            interfaceReturn: styles(interfaceReturn),
            close: styles(close),
            interfaceClose: styles(interfaceClose),
        };
    });
    expect(compactCompletionGeometry.closeContained).toBe(true);
    expect(compactCompletionGeometry.closeIconCentred).toBe(true);
    expect(compactCompletionGeometry.completionHeightMatchesReturn).toBe(true);
    expect(compactCompletionGeometry.returnButton).toEqual(compactCompletionGeometry.interfaceReturn);
    expect(compactCompletionGeometry.close).toEqual(compactCompletionGeometry.interfaceClose);
    await page.screenshot({
        path: testInfo.outputPath('guide-complete-compact.png'),
        fullPage: false,
    });

    await checklist.locator('[data-easyedu-guide-checklist-return]').click();
    await expect(checklist).toBeHidden();
    await expect(modal).toBeVisible();

    await start.click();
    await expect(modal).toBeHidden();
    await expect(checklist).toBeVisible();
    await expect(firstStep).toHaveClass(/is-complete/);
    await expect(checklist).toHaveClass(/is-minimized/);
    await checklist.locator('[data-easyedu-guide-checklist-return]').click();
    await expect(modal).toBeVisible();
    await modal.locator('[data-easyedu-guide-close]').click();
    await page.locator('[data-easyedu-navigation-open]').click();
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await page.screenshot({
        path: testInfo.outputPath('guide-guided-progress-return.png'),
        fullPage: false,
    });
});

test('desktop expanded Guide checklist keeps normal feedback and compact spacing', async({page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page);
    await page.locator(
        '[data-easyedu-navigation-desktop] [data-easyedu-navigation-guide-source] [data-easyedu-guide-open]'
    ).click();

    const modal = page.locator('[data-easyedu-guide-modal]');
    const dialog = modal.locator('.easyedu-guide-modal__dialog');
    await expect(modal).toBeVisible();
    for (let index = 0; index < 20; index += 1) {
        if (await dialog.locator('[data-easyedu-guide-start-path]:visible').count()) {
            break;
        }
        const next = dialog.locator('[data-easyedu-guide-next]:visible');
        if (await next.isDisabled()) {
            break;
        }
        await next.click();
    }

    await dialog.locator('[data-easyedu-guide-start-path]:visible').first().click();
    const checklist = page.locator('[data-easyedu-guide-checklist]');
    await expect(checklist).toBeVisible();
    await expect(checklist).not.toHaveClass(/is-minimized/);
    await checklist.locator('[data-easyedu-guide-step-index="0"]').click();
    await expect(checklist.locator('[data-easyedu-guide-checklist-message]')).toBeVisible();
    await expect(checklist.locator('.easyedu-guided-panel__message-compact')).toBeHidden();
    await expect(checklist.locator('[data-easyedu-guide-checklist-message-text]')).not.toContainText('Everything is set');
    await page.screenshot({
        path: testInfo.outputPath('guide-desktop-expanded-feedback.png'),
        fullPage: false,
    });

    await checklist.locator('[data-easyedu-guide-checklist-minimize]').click();
    await expect(checklist).toHaveClass(/is-minimized/);
    expect(await checklist.evaluate(node => {
        const step = node.querySelector('[data-easyedu-guide-step-index].is-active');
        const control = node.querySelector('[data-easyedu-guide-checklist-minimize]');
        return control.getBoundingClientRect().left - step.getBoundingClientRect().right;
    })).toBeGreaterThanOrEqual(6);
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

    const nav = await openResponsiveNavigation(page);
    await expect(nav.locator('[data-easyedu-navigation-section="easystud-tools"] ' +
        '[data-easyedu-navigation-item-id]')).toHaveCount(3);
    await page.locator('[data-easyedu-navigation-close]').click();
    await expect(page.locator('[data-easystud-mobile-guide-slot] [data-easyedu-guide-open]')).toBeHidden();

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

test('Guide target audit resolves every slide and guided step to an actionable control', async({page}, testInfo) => {
    test.setTimeout(240000);

    const showTargets = [
        {slide: 0, key: 'firstGrouping', selector: '[data-easystud-tree] [data-easystud-grouping-id]'},
        {slide: 1, key: 'groupCreateInput', selector: '.local-groupimport-easystud-create-row input[name="groupname"]'},
        {slide: 3, key: 'advancedParticipantFilters', selector: '[data-easystud-advanced-filters="participants"]'},
        {slide: 4, key: 'participantFirstCard', selector: '[data-easystud-participant-list] [data-easystud-user]'},
        {slide: 5, key: 'firstGroup', selector: '[data-easystud-structure-groups] [data-easystud-group-id]'},
        {slide: 6, key: 'firstGrouping', selector: '[data-easystud-tree] [data-easystud-grouping-id]'},
        {slide: 7, key: 'firstGrouping', selector: '[data-easystud-tree] [data-easystud-grouping-id]'},
        {slide: 8, key: 'groupingCreateInput', selector: '.local-groupimport-easystud-create-row input[name="groupingname"]'},
        {slide: 9, key: 'firstGroupEmailBox', selector: '[data-easystud-group-id] [data-easystud-group-email-box]'},
        {
            slide: 10,
            key: 'participantCardActions',
            compactKey: 'participantCardActions',
            desktopKey: 'participantFirstCard',
            compactSelector: '[data-easystud-participant-list] [data-easystud-card-menu]',
            desktopSelector: '[data-easystud-participant-list] [data-easystud-user]',
        },
        {slide: 11, key: 'participantSelectionInput', selector: '[data-easystud-participant-list] [data-easystud-user] .local-groupimport-easystud-selector'},
        {slide: 12, key: 'participantSelectionInput', selector: '[data-easystud-participant-list] [data-easystud-user] .local-groupimport-easystud-selector'},
        {slide: 13, key: 'participantFirstCard', selector: '[data-easystud-participant-list] [data-easystud-user]'},
        {slide: 16, key: 'groupCreateInput', selector: '.local-groupimport-easystud-create-row input[name="groupname"]'},
    ];
    const guidedPaths = [
        {
            slide: 2,
            path: 'first-structure',
            targets: [
                '.local-groupimport-easystud-create-row input[name="groupname"]',
                {compact: '[data-easystud-participant-list] [data-easystud-card-menu]', desktop: '[data-easystud-move-selected-participants]'},
                '[data-easystud-advanced-filters="participants"]',
            ],
        },
        {
            slide: 8,
            path: 'create-grouping',
            targets: [
                '.local-groupimport-easystud-create-row input[name="groupingname"]',
                '[data-easystud-tree] [data-easystud-grouping-groups-panel] [data-easystud-grouping-groups-box]',
                '[data-easystud-tree] [data-easystud-grouping-id]',
            ],
        },
        {
            slide: 12,
            path: 'try-actions',
            targets: [
                '[data-easystud-participant-list] [data-easystud-user]',
                '[data-easystud-participant-list] [data-easystud-user] .local-groupimport-easystud-selector',
                {
                    compact: '[data-easystud-participant-list] [data-easystud-card-menu]',
                    desktop: '[data-easystud-participant-list] [data-easystud-user]',
                },
            ],
        },
    ];
    const assertHighlightedTarget = async(selector, label = 'Guide target') => {
        const marked = page.locator('.is-easyedu-guide-highlight-target');
        await expect.poll(async() => marked.evaluateAll((nodes, expected) =>
            nodes.some(node => node.matches(expected)), selector), {
            message: label + ': the expected concrete target should replace any previous Guide highlight',
            timeout: 5000,
        }).toBe(true);
        const details = await marked.evaluateAll((nodes, expected) => {
            const node = nodes.find(candidate => candidate.matches(expected));
            if (!node) {
                return null;
            }
            return {
            expected,
            matches: node.matches(expected),
            tag: node.tagName,
            classes: node.className,
            emailTargetState: node.hasAttribute('data-easystud-group-id') ? {
                togglePresent: Boolean(node.querySelector('[data-easystud-toggle-group-email]')),
                panelPresent: Boolean(node.querySelector('[data-easystud-group-email-panel]')),
                panelHidden: node.querySelector('[data-easystud-group-email-panel]')?.hidden ?? null,
                emailFieldPresent: Boolean(node.querySelector('[data-easystud-group-email-box]')),
            } : null,
            selectionTargetState: (() => {
                const selection = document.querySelector('[data-easystud-participant-list] ' +
                    '[data-easystud-user]:not([hidden]) > .local-groupimport-easystud-selector');
                if (!selection) {
                    return null;
                }
                const style = window.getComputedStyle(selection);
                const rect = selection.getBoundingClientRect();
                return {
                    display: style.display,
                    visibility: style.visibility,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    parentHidden: selection.parentElement?.hidden ?? null,
                };
            })(),
            targetType: node.getAttribute('data-easystud-user') ? 'participant' :
                (node.getAttribute('data-easystud-group-id') ? 'group' :
                    (node.getAttribute('data-easystud-grouping-id') ? 'grouping' : 'other')),
            };
        }, selector);
        expect(details).not.toBeNull();
        expect(details.matches, 'Highlighted target mismatch: ' + JSON.stringify(details)).toBe(true);
    };

    for (const viewport of [
        {name: 'desktop', width: 1280, height: 900, compact: false},
        {name: 'compact', width: 390, height: 844, compact: true},
    ]) {
        await test.step(viewport.name, async() => {
            await page.setViewportSize({width: viewport.width, height: viewport.height});
            await login(page);
            await page.locator('[data-easyedu-guide-root]').evaluate(node => {
                const config = node.easyeduGuideConfig;
                if (config && config.storageKey) {
                    window.localStorage.removeItem(config.storageKey + '.checklist');
                }
            });

            let compactPanel = null;
            if (viewport.compact) {
                compactPanel = await openResponsiveNavigation(page);
                await compactPanel.locator('[data-easyedu-navigation-guide-slot] [data-easyedu-guide-open]').click();
            } else {
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
            }

            const root = page.locator('[data-easyedu-guide-root]');
            const modal = root.locator('[data-easyedu-guide-modal]');
            const checklist = root.locator('[data-easyedu-guide-checklist]');
            const interfaceReturn = root.locator('[data-easyedu-guide-interface-return]');
            await expect(modal).toBeVisible();

            for (const item of showTargets) {
                const slide = modal.locator('[data-easyedu-guide-slide="' + item.slide + '"]');
                await modal.locator('[data-easyedu-guide-nav-item="' + item.slide + '"]').click();
                const show = slide.locator('[data-easyedu-guide-show-target]');
                await expect(show).toBeVisible();
                const variant = viewport.compact ?
                    await show.getAttribute('data-easyedu-guide-show-target-compact') :
                    await show.getAttribute('data-easyedu-guide-show-target-desktop');
                const expectedKey = viewport.compact ? (item.compactKey || item.key) : (item.desktopKey || item.key);
                expect(variant || await show.getAttribute('data-easyedu-guide-show-target')).toBe(expectedKey);
                // The slide visual keeps moving during normal-motion mode.
                // Exercise the real handler without treating that decorative
                // motion as an unavailable interface action.
                await show.click({force: true});
                await expect(modal).toBeHidden();
                await expect(interfaceReturn, 'Slide ' + item.slide + ' should expose its return control').toBeVisible();
                await assertHighlightedTarget(viewport.compact ? (item.compactSelector || item.selector) :
                    (item.desktopSelector || item.selector), 'Slide ' + item.slide);
                await interfaceReturn.locator('[data-easyedu-guide-interface-return-button]').click();
                await expect(interfaceReturn).toBeHidden();
                await expect(modal).toBeVisible();
            }

            for (const pathAudit of guidedPaths) {
                await modal.locator('[data-easyedu-guide-nav-item="' + pathAudit.slide + '"]').click();
                const start = modal.locator('[data-easyedu-guide-slide="' + pathAudit.slide + '"] ' +
                    '[data-easyedu-guide-start-path="' + pathAudit.path + '"]');
                await expect(start).toBeVisible();
                await start.click();
                await expect(checklist).toBeVisible();

                for (let index = 0; index < pathAudit.targets.length; index += 1) {
                    if (index > 0) {
                        const previous = checklist.locator('[data-easyedu-guide-step-index="' + (index - 1) + '"]');
                        const previousId = await previous.getAttribute('data-easyedu-guide-step-id');
                        await root.evaluate((node, detail) => {
                            node.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
                                bubbles: true,
                                detail,
                            }));
                        }, {path: pathAudit.path, step: previousId});
                    }
                    const step = checklist.locator('[data-easyedu-guide-step-index="' + index + '"]');
                    const expectedSelector = typeof pathAudit.targets[index] === 'string' ?
                        pathAudit.targets[index] :
                        (viewport.compact ? pathAudit.targets[index].compact : pathAudit.targets[index].desktop);
                    if (await checklist.evaluate(node => node.classList.contains('is-complete')) &&
                            !await step.isVisible()) {
                        break;
                    }
                    await expect(step).toBeVisible();
                    await step.click();
                    await assertHighlightedTarget(expectedSelector, pathAudit.path + ' step ' + index);
                }

                const finalStep = checklist.locator('[data-easyedu-guide-step-index="' +
                    (pathAudit.targets.length - 1) + '"]');
                const finalStepId = await finalStep.getAttribute('data-easyedu-guide-step-id');
                await root.evaluate((node, detail) => {
                    node.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
                        bubbles: true,
                        detail,
                    }));
                }, {path: pathAudit.path, step: finalStepId});
                await expect(checklist).toHaveClass(/is-complete/);
                const checklistReturn = checklist.locator('[data-easyedu-guide-checklist-return]');
                await expect(checklistReturn).toBeVisible();
                await checklistReturn.click();
                await expect(checklist).toBeHidden();
                await expect(modal).toBeVisible();
            }

            if (compactPanel) {
                await expect(compactPanel).toHaveAttribute('aria-hidden', 'true');
            }
            await assertGuidedCardContainment(
                modal.locator('[data-easyedu-guide-slide="12"] .easyedu-guide-guided-card'),
                viewport.name + ' guided-path card containment'
            );
            await waitForGuideCaptureSurface(modal);
            await page.screenshot({
                path: testInfo.outputPath('guide-target-audit-' + viewport.name + '.png'),
                fullPage: false,
            });
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();
        });
    }
});
