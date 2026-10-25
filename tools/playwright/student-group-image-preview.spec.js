const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised visual audit. It selects/drops an in-memory image and
// toggles the pending delete command, but never submits the native form.
test('Group image picker preserves shared preview drop and toggle geometry', async ({page}, testInfo) => {
    test.setTimeout(240000);
    const root = page.locator('#local-groupimport-easystud');
    const records = [];
    const blocked = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('group-image-native.json'),
        JSON.stringify({records, blocked}, null, 2));

    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() === 'GET') {
            await route.continue();
        } else {
            blocked.push(route.request().method());
            save();
            await route.abort('blockedbyclient');
        }
    });

    const openGroup = async width => {
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
        await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
        const group = root.locator('[data-easystud-advanced-type="group"]:visible').first();
        await group.locator(':scope > .local-groupimport-easystud-group__header ' +
            '[data-easystud-open-advanced-settings]:visible').click();
        const modal = root.locator('[data-easystud-advanced-settings-modal]');
        await expect(modal).toBeVisible();
        await page.setViewportSize({width, height: 1100});
        await modal.evaluate(async node => {
            await document.fonts.ready;
            await Promise.all(node.getAnimations({subtree: true})
                .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations))
                .map(animation => animation.finished.catch(() => undefined)));
        });
        return modal;
    };

    for (const width of [1600, 768, 390]) {
        const modal = await openGroup(width);
        const dialog = modal.locator('.local-groupimport-easystud-settings-modal__dialog');
        const preview = modal.locator('.local-groupimport-easystud-settings-modal__image');
        const row = modal.locator('.local-groupimport-easystud-settings-modal__file-row');
        const picker = modal.locator('.local-groupimport-easystud-settings-modal__filepicker');
        const input = picker.locator('[data-easystud-advanced-file-input]');
        const trigger = picker.locator('[data-easystud-advanced-file-trigger]');
        const filename = picker.locator('[data-easystud-advanced-file-name]');
        const toggle = modal.locator('[data-easystud-delete-picture-input]');
        const toggleState = modal.locator('[data-easystud-settings-toggle-state]');

        await expect(preview).toBeVisible();
        await expect(row).toBeVisible();
        await expect(trigger).toBeVisible();
        await expect(toggle).toHaveJSProperty('checked', false);

        const chosenName = `selected-group-${width}.png`;
        await input.setInputFiles({name: chosenName, mimeType: 'image/png', buffer: Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ])});
        await expect(filename).toHaveText(chosenName);

        await picker.evaluate((node, name) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File(['group-image'], name, {type: 'image/png'}));
            node.dispatchEvent(new DragEvent('dragenter', {bubbles: true, dataTransfer: transfer}));
            node.dispatchEvent(new DragEvent('dragover', {bubbles: true, cancelable: true, dataTransfer: transfer}));
        }, `dropped-group-${width}.png`);
        await expect(picker).toHaveClass(/is-drag-over/);
        await expect(dialog).toHaveClass(/is-file-drag-over/);
        const dragPaint = await picker.evaluate(node => {
            const style = getComputedStyle(node);
            return {background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow};
        });
        expect(dragPaint.shadow).not.toBe('none');

        await picker.evaluate((node, name) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File(['group-image'], name, {type: 'image/png'}));
            node.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: transfer}));
        }, `dropped-group-${width}.png`);
        await expect(filename).toHaveText(`dropped-group-${width}.png`);
        await expect(picker).not.toHaveClass(/is-drag-over/);
        await expect(dialog).not.toHaveClass(/is-file-drag-over/);

        await toggle.check();
        await expect(toggleState).not.toHaveText('');
        const enabledLabel = (await toggleState.textContent()).trim();
        await toggle.uncheck();
        const disabledLabel = (await toggleState.textContent()).trim();
        expect(enabledLabel).not.toBe(disabledLabel);

        const geometry = await modal.evaluate(node => {
            const rect = element => {
                const value = element.getBoundingClientRect();
                return {x: value.x, y: value.y, width: value.width, height: value.height,
                    right: value.right, bottom: value.bottom};
            };
            const image = node.querySelector('.local-groupimport-easystud-settings-modal__image');
            const body = node.querySelector('.local-groupimport-easystud-modal__body');
            const fileRow = node.querySelector('.local-groupimport-easystud-settings-modal__file-row');
            const filepicker = node.querySelector('.local-groupimport-easystud-settings-modal__filepicker');
            const icon = node.querySelector('.local-groupimport-easystud-settings-modal__filepicker-icon');
            const name = node.querySelector('[data-easystud-advanced-file-name]');
            const button = node.querySelector('[data-easystud-advanced-file-trigger]');
            const iconStyle = getComputedStyle(icon, '::before');
            return {
                body: rect(body), image: rect(image), fileRow: rect(fileRow), filepicker: rect(filepicker),
                icon: rect(icon), filename: rect(name), button: rect(button),
                iconPseudo: {left: iconStyle.left, top: iconStyle.top, transform: iconStyle.transform},
                fonts: {
                    filename: getComputedStyle(name).fontSize,
                    button: getComputedStyle(button).fontSize,
                },
            };
        });
        expect(geometry.image.x).toBeGreaterThanOrEqual(geometry.body.x - .5);
        expect(geometry.image.right).toBeLessThanOrEqual(geometry.body.right + .5);
        expect(geometry.filepicker.x).toBeGreaterThanOrEqual(geometry.fileRow.x - .5);
        expect(geometry.filepicker.right).toBeLessThanOrEqual(geometry.fileRow.right + .5);
        expect(geometry.filename.right).toBeLessThanOrEqual(geometry.filepicker.right + .5);
        expect(geometry.icon.width).toBeCloseTo(32, 0);
        expect(geometry.icon.height).toBeCloseTo(32, 0);
        // The 32px outer tile has a 1px border, so 50% of its 30px content
        // box is 15px. Validate that painted centre instead of the outer half.
        expect(parseFloat(geometry.iconPseudo.left)).toBeCloseTo((geometry.icon.width - 2) / 2, 1);
        expect(parseFloat(geometry.iconPseudo.top)).toBeCloseTo((geometry.icon.height - 2) / 2, 1);

        records.push({width, chosenName, droppedName: `dropped-group-${width}.png`,
            enabledLabel, disabledLabel, dragPaint, geometry});
        save();
        await row.screenshot({path: testInfo.outputPath(`group-image-${width}.png`)});
        await modal.locator('.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]').click();
        await expect(modal).toHaveCount(0);
    }
    expect(blocked).toEqual([]);
    save();
});
