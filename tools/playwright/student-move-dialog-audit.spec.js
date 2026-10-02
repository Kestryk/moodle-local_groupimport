const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing course data only; selection, open and cancel.
// Never confirm a move, change memberships, manufacture empty data or submit.
test('Student move dialogs preserve native participant and group branches', async ({page}, testInfo) => {
    test.setTimeout(150000);
    const records = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('move-native.json'), JSON.stringify(records, null, 2));
    const root = page.locator('#local-groupimport-easystud');
    const ready = async () => {
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    };
    const measure = async (locator, role) => {
        records.push({viewport: page.viewportSize().width, role, ...await locator.evaluate(node => {
            const s = getComputedStyle(node), r = node.getBoundingClientRect();
            return {x: r.x, y: r.y, width: r.width, height: r.height, fontSize: s.fontSize,
                fontWeight: s.fontWeight, color: s.color, background: s.backgroundColor,
                radius: s.borderTopLeftRadius, border: s.borderTopColor, lineHeight: s.lineHeight,
                padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft],
                gap: s.gap, text: node.matches('select') ? null : node.textContent.trim()};
        })});
        save();
    };
    for (const width of [1600, 390]) {
        for (const branch of ['participants', 'groups', 'groups-in-grouping']) {
            const kind = branch === 'participants' ? branch : 'groups';
            await page.setViewportSize({width, height: 1100});
            await ready(); // Each context starts with native selection cleared.
            if (kind === 'groups') {
                const toggle = width === 390 ? '[data-easystud-mobile-view="groups"]:visible' :
                    '[data-easystud-layout-mode="structure"]:visible';
                await root.locator(toggle).first().click();
                if (!await root.locator('[data-easystud-group-id]:visible').count()) {
                    const parent = root.locator('[data-easystud-grouping-id]:visible').filter({
                        has: page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]')
                    }).first();
                    await parent.locator('.local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]').click();
                }
            }
            const candidates = root.locator('[data-easystud-group-id]:visible');
            const groupedIndex = branch === 'groups-in-grouping' ? await candidates.evaluateAll(nodes => nodes.findIndex(node => {
                const id = node.getAttribute('data-easystud-group-id');
                return [...document.querySelectorAll('[data-easystud-grouping-id]')].some(parent =>
                    parent.querySelector(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id="' + id + '"]'));
            })) : -1;
            if (branch === 'groups-in-grouping') { expect(groupedIndex, 'Existing grouped course group is required; do not create fixtures').toBeGreaterThanOrEqual(0); }
            const item = kind === 'participants' ? root.locator('[data-easystud-user]:visible').first() :
                candidates.nth(groupedIndex >= 0 ? groupedIndex : 0);
            await expect(item).toBeVisible();
            await item.locator('[data-easystud-selector-input]').first().evaluate(input => input.click());
            const action = '[data-easystud-move-selected-' + kind + ']';
            const trigger = width === 390 ? root.locator('[data-easystud-mobile-action-trigger="' + action + '"]:visible').first() :
                root.locator(action + ':visible').first();
            await expect(trigger).toBeEnabled();
            await trigger.click();
            const dialog = root.locator('[data-easystud-move-modal]');
            await expect(dialog).toBeVisible();
            // Measure the completed normal-motion shell, not an opening scale.
            await dialog.locator('.local-groupimport-easystud-modal__dialog').evaluate(node =>
                Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {}))));
            const select = dialog.locator('[data-easystud-move-destination]');
            await expect(select).toBeFocused();
            await expect(select).toHaveClass(/easyedu-select/);
            await expect(dialog.locator('h3')).toHaveCSS('font-size', '16px');
            await expect(dialog.locator('.easyedu-dialog-actions')).toHaveCSS('justify-content', 'center');
            const options = await select.locator('option').evaluateAll(nodes => nodes.map(n => ({value: n.value, label: n.textContent})));
            const origin = dialog.locator('[data-easystud-move-origin-wrap]');
            records.push({viewport: width, kind, branch, options, originVisible: await origin.isVisible(),
                originChecked: await dialog.locator('[data-easystud-move-remove-origin]').isChecked(),
                confirmLabel: await dialog.locator('[data-easystud-confirm-move]').textContent()});
            expect(options.length).toBeGreaterThan(0);
            if (kind === 'groups') { expect(options[0].value).toBe('0'); }
            else { await expect(origin).toBeHidden(); }
            if (branch === 'groups-in-grouping') { await expect(origin).toBeVisible(); }
            for (const [role, selector] of Object.entries({shell: '.local-groupimport-easystud-modal__dialog',
                header: '.local-groupimport-easystud-modal__header', title: 'h3',
                body: '.local-groupimport-easystud-modal__body', help: '[data-easystud-move-modal-help]',
                label: '[data-easystud-move-modal-label]', select: '[data-easystud-move-destination]',
                footer: '.easyedu-dialog-actions', cancel: '.easyedu-button--secondary', confirm: '[data-easystud-confirm-move]'})) {
                await measure(dialog.locator(selector), branch + ':' + role);
            }
            if (await origin.isVisible()) { await measure(origin, branch + ':origin'); }
            await page.evaluate(() => document.fonts.ready);
            await dialog.locator('.local-groupimport-easystud-modal__dialog').screenshot({path: testInfo.outputPath('move-' + branch + '-' + width + '.png')});
            await dialog.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
            await expect(dialog).toBeHidden();
        }
    }
    save();
});
