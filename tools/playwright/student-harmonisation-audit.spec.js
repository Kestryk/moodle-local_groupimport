const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised, read-only product audit. Open/cancel dialogs and start/end
// decorative drags only. Never confirm, send, drop, create or mutate fixtures.
test('Student harmonisation records native controls dialogs and drag anatomy', async({page}, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({width: 1600, height: 1100});
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const records = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('harmonisation-native.json'), JSON.stringify(records, null, 2));
    const measure = async (locator, label) => {
        const data = await locator.evaluate(node => {
            const css = getComputedStyle(node), r = node.getBoundingClientRect();
            const result = {font: css.fontFamily, size: css.fontSize, weight: css.fontWeight,
                color: css.color, background: css.backgroundColor, radius: css.borderTopLeftRadius,
                width: r.width, height: r.height, lineHeight: css.lineHeight, gap: css.gap,
                padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
                border: css.borderTopColor, textAlign: css.textAlign,
                inheritedPrimary: css.getPropertyValue('--easyedu-primary').trim()};
            if (node.matches('button')) {
                result.contents = [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE)
                    .map(child => child.textContent.trim()).filter(Boolean);
                result.icons = [...node.querySelectorAll('.fa')].map(icon => {
                    const i = icon.getBoundingClientRect(), s = getComputedStyle(icon);
                    return {class: icon.className, width: i.width, height: i.height,
                        centreXDelta: i.x + i.width / 2 - r.x - r.width / 2,
                        centreYDelta: i.y + i.height / 2 - r.y - r.height / 2,
                        position: s.position, fontSize: s.fontSize};
                });
            }
            return result;
        });
        records.push({viewport: page.viewportSize().width, label, ...data});
        save();
    };
    const styleSelectors = {
        pageTitle: '.easyedu-workspace-title-control .dropdown-toggle',
        panelTitle: '.easyedu-workspace-panel-title',
        viewToggle: '[data-easystud-layout-mode]:visible',
        participantTitle: '.local-groupimport-easystud-user__name:visible',
        groupTitle: '.local-groupimport-easystud-group__name:visible',
        groupingTitle: '.local-groupimport-easystud-grouping__name:visible',
        createButton: '.local-groupimport-easystud-create .local-groupimport-easystud-icon-button:visible',
        createInput: '.local-groupimport-easystud-create input:visible',
        searchInput: '.local-groupimport-easystud__search-input:visible',
        pagination: '.local-groupimport-easystud-pagination:visible',
        ungrouped: '.local-groupimport-easystud-tree__section--ungrouped:visible'
    };
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        await page.mouse.move(0, 0);
        for (const [label, selector] of Object.entries(styleSelectors)) {
            const items = root.locator(selector);
            for (let index = 0; index < Math.min(await items.count(), 3); index++) {
                await measure(items.nth(index), label + ':' + index);
            }
        }
        await page.screenshot({path: testInfo.outputPath('workspace-' + width + '.png')});
    }
    await page.setViewportSize({width: 1600, height: 1100});
    const participant = root.locator('[data-easystud-user]:visible').first();
    const selection = participant.locator('[data-easystud-selector-input]').first();
    await selection.evaluate(input => input.click());
    try {
        const move = root.locator('[data-easystud-move-selected-participants]:visible').first();
        await expect(move).toBeEnabled();
        await move.click();
        const dialog = root.locator('[data-easystud-move-modal]');
        await expect(dialog).toBeVisible();
        await measure(dialog.locator('h3'), 'move:title');
        await measure(dialog.locator('[data-easystud-move-destination]'), 'move:destination');
        for (const attribute of ['data-easystud-confirm-move', 'data-easystud-close-move-modal']) {
            await measure(dialog.locator('button[' + attribute + ']').last(), 'move:' + attribute);
        }
        await dialog.screenshot({path: testInfo.outputPath('move-participants-desktop.png')});
        await dialog.locator('.local-groupimport-easystud-modal__footer [data-easystud-close-move-modal]').click();
        await expect(dialog).toBeHidden();
        for (const width of [1600, 390]) {
            await page.setViewportSize({width, height: 1100});
            // Reload the actual mobile workspace rather than expecting a
            // desktop selection to create a mobile action bar retroactively.
            if (width === 390) {
                await page.goto(process.env.EASYEDU_MOODLE_URL);
                await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
                await root.locator('[data-easystud-user]:visible').first()
                    .locator('[data-easystud-selector-input]').evaluate(input => input.click());
            }
            const trigger = width > 1024 ? root.locator('[data-easystud-message-selected-participants]:visible').first() :
                root.locator('[data-easystud-mobile-action-trigger="[data-easystud-message-selected-participants]"]:visible').first();
            await expect(trigger).toBeEnabled();
            await trigger.click();
            const message = page.locator('.local-groupimport-easystud-message-modal.show').last();
            await expect(message.locator('#bulk-message')).toBeVisible({timeout: 30000});
            await expect(message).not.toHaveClass(/is-loading/);
            await expect(message).toHaveClass(/easyedu-message-dialog/);
            await expect(message.locator('.modal-title')).toHaveCSS('font-size', '16px');
            await expect(message.locator('.modal-footer')).toHaveCSS('justify-content', 'center');
            const cancel = message.locator('.modal-footer .easyedu-button--secondary');
            await expect(cancel).toHaveCount(1);
            await expect(cancel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
            await expect(cancel).toHaveCSS('color', 'rgb(0, 116, 204)');
            expect(await message.evaluate(node => getComputedStyle(node)
                .getPropertyValue('--easyedu-primary').trim())).not.toBe('');
            await measure(message, 'message:portal');
            await measure(message.locator('.modal-title'), 'message:title');
            await measure(message.locator('#bulk-message'), 'message:textarea');
            const footerButtons = message.locator('.modal-footer button');
            for (let index = 0; index < await footerButtons.count(); index++) {
                await measure(footerButtons.nth(index), 'message:button:' + index);
            }
            await page.screenshot({path: testInfo.outputPath('message-' + width + '.png')});
            await message.locator('[data-action="hide"]').first().click();
            await expect(message).toBeHidden();
        }
    } finally {
        await page.setViewportSize({width: 1600, height: 1100});
        if (await selection.isChecked()) { await selection.evaluate(input => input.click()); }
    }
    for (const type of ['participant', 'group']) {
        const source = root.locator(type === 'participant' ? '[data-easystud-user]:visible' : '[data-easystud-group-id]:visible').first();
        await expect(source).toBeVisible();
        const transfer = await page.evaluateHandle(() => new DataTransfer());
        try {
            await source.dispatchEvent('dragstart', {dataTransfer: transfer, clientX: 500, clientY: 380});
            const preview = page.locator('.local-groupimport-easystud-drag-preview');
            await expect(preview).toBeVisible();
            await measure(preview, 'drag:' + type);
            await expect(preview.locator('input, button, textarea, select')).toHaveCount(0);
            await expect(preview.locator('.easyedu-drag-preview__summary')).toHaveCount(1);
            await page.screenshot({path: testInfo.outputPath('drag-' + type + '.png')});
            // The existing -1deg movement rotation expands the painted AABB.
            // Measure the CSS layout width, not that rotated bounding box.
            expect(await preview.evaluate(node => node.offsetWidth)).toBeLessThanOrEqual(288);
            records.push({label: 'drag-anatomy:' + type, ...(await preview.evaluate(node => ({
                inputs: node.querySelectorAll('input').length, buttons: node.querySelectorAll('button').length,
                detailChildren: node.querySelectorAll('.local-groupimport-easystud-user__details, [data-easystud-member-id]').length,
                hasStack: node.classList.contains('has-stack'),
                movingMask: getComputedStyle(node.querySelector('.local-groupimport-easystud-drag-preview__moving-icon')).maskImage
            })))});
            save();
        } finally {
            await source.dispatchEvent('dragend', {dataTransfer: transfer});
            await transfer.dispose();
        }
    }
});
