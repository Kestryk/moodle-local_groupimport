const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the motion audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible();
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
};

const waitForMotion = async page => {
    await page.evaluate(async() => {
        const root = document.querySelector('#local-groupimport-easystud');
        if (!root || !root.getAnimations) {
            return;
        }
        const animations = root.getAnimations({subtree: true}).filter(animation => {
            const timing = animation.effect && animation.effect.getComputedTiming ?
                animation.effect.getComputedTiming() : null;
            return !timing || Number.isFinite(timing.iterations);
        });
        await Promise.race([
            Promise.all(animations.map(animation => animation.finished.catch(() => undefined))),
            new Promise(resolve => window.setTimeout(resolve, 1200)),
        ]);
    });
};

const clickWhenAvailable = async(page, selector) => {
    const control = page.locator(selector).first();
    if (!await control.count() || !await control.isVisible() || await control.isDisabled()) {
        return false;
    }
    await control.click();
    await waitForMotion(page);
    return true;
};

const assertStableLayout = async page => {
    const state = await page.evaluate(() => {
        const root = document.querySelector('#local-groupimport-easystud');
        const scrollRegions = Array.from(root.querySelectorAll(
            '.local-groupimport-easystud__panel-body, [data-easystud-participant-list], ' +
            '[data-easystud-structure-groups], [data-easystud-participant-groups-panel]'
        )).filter(region => region.offsetParent !== null && region.clientWidth > 20);
        return {
            disclosing: root.querySelectorAll('.is-easyedu-disclosing').length,
            pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
            horizontalScrollRegions: scrollRegions.filter(region => {
                const overflow = getComputedStyle(region).overflowX;
                return ['auto', 'scroll'].includes(overflow) && region.scrollWidth > region.clientWidth + 2;
            }).length,
        };
    });
    expect(state.disclosing).toBe(0);
    expect(state.pageOverflow).toBe(false);
    expect(state.horizontalScrollRegions).toBe(0);
};

test('asks whether to copy or move a group between groupings in the structure view', async({page}) => {
    await login(page);
    await clickWhenAvailable(page, '[data-easystud-layout-mode="structure"]');

    const groupings = page.locator(
        '[data-easystud-tree] [data-easystud-grouping-id]:visible'
    );
    const groupingCount = await groupings.count();
    if (groupingCount < 2) {
        test.skip();
        return;
    }

    let sourceIndex = -1;
    for (let index = 0; index < groupingCount; index++) {
        const groupCount = await groupings.nth(index).locator(
            ':scope > [data-easystud-container-group-list] > [data-easystud-group-id]'
        ).count();
        if (groupCount > 0) {
            sourceIndex = index;
            break;
        }
    }
    if (sourceIndex === -1) {
        test.skip();
        return;
    }

    const sourceGrouping = groupings.nth(sourceIndex);
    const targetGrouping = groupings.nth(sourceIndex === 0 ? 1 : 0);
    await sourceGrouping.locator(':scope > .local-groupimport-easystud-grouping__header ' +
        '[data-easystud-collapse-toggle]').click();
    await waitForMotion(page);

    const sourceGroup = sourceGrouping.locator(
        ':scope > [data-easystud-container-group-list] > [data-easystud-group-id]:visible'
    ).first();
    await expect(sourceGroup).toBeVisible();
    await page.evaluate(([source, target]) => {
        const transfer = new DataTransfer();
        source.dispatchEvent(new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
        }));
        target.dispatchEvent(new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
        }));
        target.dispatchEvent(new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
        }));
        source.dispatchEvent(new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
        }));
    }, [await sourceGroup.elementHandle(), await targetGrouping.elementHandle()]);

    const choiceModal = page.locator(
        '.local-groupimport-easystud-modal:has([data-easystud-choice-copy])'
    );
    await expect(choiceModal).toBeVisible();
    await expect(choiceModal.locator('[data-easystud-choice-copy]')).toBeVisible();
    await expect(choiceModal.locator('[data-easystud-choice-move]')).toBeVisible();
    await choiceModal.locator('[data-easystud-choice-close]').click();
    await expect(choiceModal).toBeHidden();
});

for (const mode of [
    {name: 'standard motion', reducedMotion: 'no-preference'},
    {name: 'reduced motion', reducedMotion: 'reduce'},
]) {
    test.describe(mode.name, () => {
        test.use({reducedMotion: mode.reducedMotion});

        if (mode.reducedMotion === 'no-preference') {
            test('renders a visible intermediate participant-card height', async({page}) => {
                await login(page);
                const participant = page.locator('[data-easystud-user]:visible').first();
                const trajectory = await participant.evaluate(async card => {
                    const selector = card.querySelector('[data-easystud-selector-input]');
                    const initial = card.getBoundingClientRect().height;
                    const samples = [];
                    const start = performance.now();
                    selector.click();
                    await new Promise(resolve => {
                        const sample = () => {
                            const elapsed = performance.now() - start;
                            samples.push(card.getBoundingClientRect().height);
                            if (elapsed < 320) {
                                requestAnimationFrame(sample);
                            } else {
                                resolve();
                            }
                        };
                        requestAnimationFrame(sample);
                    });
                    return {initial, final: card.getBoundingClientRect().height, samples};
                });

                expect(trajectory.final).toBeGreaterThan(trajectory.initial + 1);
                expect(trajectory.samples.some(height =>
                    height > trajectory.initial + 1 && height < trajectory.final - 1)).toBe(true);
            });

            test('reopens a collapsed group member list without stale height effects', async({page}) => {
                await login(page);
                await clickWhenAvailable(page, '[data-easystud-layout-mode="participants"]');
                const toggle = page.locator(
                    '[data-easystud-group-id]:visible [data-easystud-group-members-toggle]:visible'
                ).first();
                if (!await toggle.count()) {
                    test.skip();
                    return;
                }
                const group = toggle.locator('xpath=ancestor::*[@data-easystud-group-id][1]');
                const list = group.locator('[data-easystud-group-members]').first();
                const collapsedHeight = (await list.boundingBox()).height;

                await toggle.evaluate(control => control.click());
                await waitForMotion(page);
                const firstExpandedHeight = (await list.boundingBox()).height;
                await toggle.evaluate(control => control.click());
                expect(await list.evaluate(node => node.getAnimations({subtree: false}).length)).toBeGreaterThan(0);
                await waitForMotion(page);
                const secondCollapsedHeight = (await list.boundingBox()).height;
                await toggle.evaluate(control => control.click());
                expect(await list.evaluate(node => node.getAnimations({subtree: false}).length)).toBeGreaterThan(0);
                await waitForMotion(page);
                const secondExpandedHeight = (await list.boundingBox()).height;

                expect(firstExpandedHeight).toBeGreaterThan(collapsedHeight + 1);
                expect(secondCollapsedHeight).toBeLessThan(firstExpandedHeight - 1);
                expect(secondExpandedHeight).toBeGreaterThan(secondCollapsedHeight + 1);
                expect(await list.evaluate(node => node.getAnimations().length)).toBe(0);
            });

            test('uses compact motion for inline search and atomic view changes', async({page}) => {
                await login(page);
                const layout = page.locator('.local-groupimport-easystud__layout');
                await page.locator('[data-easystud-layout-mode="structure"]').evaluate(control => control.click());
                const viewDuration = await layout.evaluate(node => {
                    const animation = node.getAnimations({subtree: false})[0];
                    return animation ? animation.effect.getComputedTiming().duration : 0;
                });
                expect(viewDuration).toBeGreaterThan(0);
                expect(viewDuration).toBeLessThanOrEqual(160);
                await waitForMotion(page);

                const toggle = page.locator('[data-easystud-container-search-toggle]:visible').first();
                if (!await toggle.count()) {
                    test.skip();
                    return;
                }
                const section = toggle.locator('xpath=ancestor::*[contains(@class, "local-groupimport-easystud-tree__section")][1]');
                const panel = section.locator('[data-easystud-container-search-panel]').first();
                await toggle.evaluate(control => control.click());
                const searchDuration = await panel.evaluate(node => {
                    const animation = node.getAnimations({subtree: false})[0];
                    return animation ? animation.effect.getComputedTiming().duration : 0;
                });
                expect(searchDuration).toBeGreaterThan(0);
                expect(searchDuration).toBeLessThanOrEqual(150);
                await waitForMotion(page);
                expect(await panel.boundingBox()).not.toBeNull();
                expect(await panel.evaluate(node => node.getAnimations({subtree: false}).length)).toBe(0);
            });

            test('keeps grouping column width stable during pagination', async({page}) => {
                await login(page);
                await page.locator('[data-easystud-layout-mode="structure"]').evaluate(control => control.click());
                await waitForMotion(page);
                const list = page.locator('.local-groupimport-easystud-tree__groupings:visible').first();
                const next = list.locator(
                    ':scope > [data-easystud-pagination="top"] [data-easystud-page-next]:not([disabled])'
                );
                if (!await next.count()) {
                    test.skip();
                    return;
                }
                const result = await list.evaluate(async node => {
                    const button = node.querySelector(
                        ':scope > [data-easystud-pagination="top"] [data-easystud-page-next]:not([disabled])'
                    );
                    const initialWidth = node.clientWidth;
                    const widths = [];
                    const transforms = [];
                    const start = performance.now();
                    button.click();
                    await new Promise(resolve => {
                        const sample = () => {
                            widths.push(node.clientWidth);
                            transforms.push(getComputedStyle(node).transform);
                            if (performance.now() - start < 380) {
                                requestAnimationFrame(sample);
                            } else {
                                resolve();
                            }
                        };
                        requestAnimationFrame(sample);
                    });
                    return {initialWidth, finalWidth: node.clientWidth, widths, transforms};
                });

                const expectedMinimum = Math.min(result.initialWidth, result.finalWidth) - 1;
                expect(Math.min(...result.widths)).toBeGreaterThanOrEqual(expectedMinimum);
                expect(result.transforms.every(transform =>
                    transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
            });
        }

        test('keeps EasyStud motion stable across views and disclosures', async({page}) => {
            const consoleErrors = [];
            page.on('pageerror', error => consoleErrors.push(error.message));
            page.on('console', message => {
                if (message.type() === 'error') {
                    consoleErrors.push(message.text());
                }
            });

            await login(page);

            for (const view of ['participants', 'both', 'structure']) {
                await clickWhenAvailable(page, `[data-easystud-layout-mode="${view}"]`);
                await assertStableLayout(page);
            }

            await clickWhenAvailable(page, '[data-easystud-layout-mode="both"]');
            await clickWhenAvailable(page, '[data-easystud-advanced-filters-toggle]:visible');
            await clickWhenAvailable(page, '[data-easystud-advanced-filters-toggle][aria-expanded="true"]:visible');

            const participantSelector = page.locator(
                '[data-easystud-user]:visible [data-easystud-selector-input]'
            ).first();
            if (await participantSelector.count()) {
                await participantSelector.click();
                await waitForMotion(page);
                await clickWhenAvailable(page, '[data-easystud-clear-all-selection]:visible');
            }

            await clickWhenAvailable(page, '[data-easystud-group-members-toggle]:visible');
            await clickWhenAvailable(page, '[data-easystud-group-members-toggle][aria-expanded="true"]:visible');
            await clickWhenAvailable(page, '[data-easystud-collapse-toggle]:visible');
            await clickWhenAvailable(page, '[data-easystud-collapse-toggle][aria-expanded="false"]:visible');

            for (const position of ['top', 'bottom']) {
                await clickWhenAvailable(page,
                    `[data-easystud-pagination="${position}"] [data-easystud-page-next]:visible`);
            }

            await assertStableLayout(page);
            expect(consoleErrors).toEqual([]);
        });

        test('settles rapid repeated disclosure clicks in the final ARIA state', async({page}) => {
            await login(page);
            await clickWhenAvailable(page, '[data-easystud-layout-mode="both"]');
            let toggle = page.locator('[data-easystud-group-members-toggle]:visible').first();
            if (!await toggle.count()) {
                toggle = page.locator('[data-easystud-advanced-filters-toggle]:visible').first();
            }
            if (!await toggle.count()) {
                test.skip();
                return;
            }
            await toggle.click();
            await toggle.click();
            await toggle.click();
            await waitForMotion(page);
            await assertStableLayout(page);
            expect(['true', 'false']).toContain(await toggle.getAttribute('aria-expanded'));
        });
    });
}
