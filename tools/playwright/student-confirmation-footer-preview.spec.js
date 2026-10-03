const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised. Existing populated entities only, native open/Cancel.
// A request guard blocks accidental writes even if a conditional branch drifts.
// Desktop entry + resize proves the dialog, not a new mobile command route.
test('Student conditional confirmations retain native content and matched actions', async ({page}, testInfo) => {
    test.setTimeout(150000);
    const records = [], blockedWrites = [], errors = [];
    const root = page.locator('#local-groupimport-easystud');
    page.on('pageerror', error => errors.push(error.message));
    const save = () => fs.writeFileSync(testInfo.outputPath('confirmation-footers.json'),
        JSON.stringify({records, blockedWrites, errors}, null, 2));
    try {
        for (const kind of ['groups', 'groupings']) {
            for (const width of [1600, 768, 390]) {
                await page.setViewportSize({width: 1600, height: 1100});
                await page.emulateMedia({reducedMotion: 'no-preference'});
                await page.goto(process.env.EASYEDU_MOODLE_URL);
                if (page.url().includes('/login/')) {
                    await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                    await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                    await page.locator('#loginbtn').click();
                    await page.waitForURL(url => !url.pathname.includes('/login/'));
                    await page.goto(process.env.EASYEDU_MOODLE_URL);
                }
                await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
                const guard = async route => {
                    if (route.request().method() !== 'GET') {
                        blockedWrites.push({kind, width, method: route.request().method()});
                        save();
                        await route.abort('blockedbyclient');
                    } else {
                        await route.continue();
                    }
                };
                await page.route('**/local/groupimport/**', guard);
                try {
                    await root.locator('[data-easystud-layout-mode="both"]:visible').click();
                    const selector = kind === 'groups' ? '[data-easystud-group-id]' : '[data-easystud-grouping-id]';
                    const candidates = root.locator(selector);
                    const index = await candidates.evaluateAll((nodes, entityKind) => nodes.findIndex(node =>
                        entityKind === 'groups' ? !!node.querySelector('[data-easystud-member-id]') :
                            node.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length > 0), kind);
                    expect(index, 'Existing populated entity required; never create a fixture or click an empty Delete').toBeGreaterThanOrEqual(0);
                    const entity = candidates.nth(index);
                    if (!await entity.isVisible()) {
                        const groupingId = await entity.evaluate(node => node.closest('[data-easystud-grouping-id]')?.getAttribute('data-easystud-grouping-id'));
                        expect(groupingId).toBeTruthy();
                        const parent = root.locator('[data-easystud-grouping-id="' + groupingId + '"]').first();
                        await parent.locator('.local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]').click();
                    }
                    await expect(entity).toBeVisible();
                    // Recheck the exact predicate used by bindBulkActions before opening.
                    expect(await entity.evaluate((node, entityKind) => entityKind === 'groups' ?
                        !!node.querySelector('[data-easystud-member-id]') :
                        node.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length > 0, kind)).toBe(true);
                    await entity.locator('[data-easystud-selector-input]').first().evaluate(input => input.click());
                    const trigger = root.locator('[data-easystud-delete-selected-' + kind + ']:visible').first();
                    await expect(trigger).toBeEnabled();
                    await trigger.click();
                    const modal = root.locator('[data-easystud-confirm-modal]');
                    await expect(modal).toBeVisible();
                    await page.setViewportSize({width, height: 1100});
                    await modal.evaluate(async node => {
                        await document.fonts.ready;
                        await Promise.all(node.getAnimations({subtree: true})
                            .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations))
                            .map(animation => animation.finished.catch(() => undefined)));
                    });
                    await expect(modal).toHaveCSS('z-index', '1070');
                    const title = modal.locator('.easyedu-modal-title');
                    await expect(title).toHaveCSS('font-size', '16px');
                    await expect(title).toHaveCSS('font-weight', '700');
                    const description = modal.locator('[data-easystud-confirm-modal-message]');
                    await expect(description).toHaveCSS('font-size', '13px');
                    const labels = JSON.parse(await root.getAttribute('data-easystud-detail-labels'));
                    await expect(description).toHaveText(labels['confirmdelete' + kind]);
                    const footer = modal.locator('.easyedu-confirmation-dialog__actions');
                    const geometry = await footer.evaluate(node => {
                        const row = node.getBoundingClientRect();
                        const buttons = [...node.children].map(button => {
                            const rect = button.getBoundingClientRect(), css = getComputedStyle(button);
                            return {height: rect.height, right: rect.right, font: css.fontSize, weight: css.fontWeight,
                                radius: css.borderTopLeftRadius, background: css.backgroundColor, color: css.color,
                                padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
                                unobscured: button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))};
                        });
                        return {buttons, rightDelta: Math.abs(Math.max(...buttons.map(button => button.right)) - row.right)};
                    });
                    records.push({kind, width, entryWidth: 1600, description: await description.textContent(), geometry});
                    save();
                    expect(geometry.buttons).toHaveLength(2);
                    expect(geometry.rightDelta).toBeLessThanOrEqual(1);
                    expect(Math.abs(geometry.buttons[0].height - geometry.buttons[1].height)).toBeLessThanOrEqual(1);
                    expect(geometry.buttons[1].background).toBe('rgb(161, 43, 43)');
                    for (const button of geometry.buttons) {
                        expect(button.font).toBe('14.08px');
                        expect(button.weight).toBe('600');
                        expect(button.height).toBeGreaterThanOrEqual(37);
                        expect(button.radius).toBe(geometry.buttons[0].radius);
                        expect(button.padding).toEqual(geometry.buttons[0].padding);
                        expect(button.unobscured).toBe(true);
                    }
                    await modal.locator('.local-groupimport-easystud-modal__dialog').screenshot({
                        path: testInfo.outputPath('confirmation-' + kind + '-' + width + '.png')});
                    await footer.locator('[data-easystud-close-confirm-modal]').click();
                    await expect(modal).toBeHidden();
                    expect(blockedWrites).toEqual([]);
                } finally {
                    await page.unroute('**/local/groupimport/**', guard);
                }
            }
        }
        expect(errors).toEqual([]);
    } finally {
        save();
    }
});
