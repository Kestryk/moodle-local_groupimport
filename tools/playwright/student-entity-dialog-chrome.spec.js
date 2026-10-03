const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised candidate. Existing course data, native open/cancel and
// disclosure only. Never Save, upload, export, navigate a native link or mutate.
test('Student entity dialogs preserve conditional content and Foundation chrome', async({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], root = page.locator('#local-groupimport-easystud');
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const settle = async node => node.evaluate(async element => {
        await document.fonts.ready;
        await Promise.all(element.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
    });
    const ready = async width => {
        await page.setViewportSize({width, height: 1100});
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
    };
    const inspect = async (modal, kind, width) => {
        await expect(modal).toBeVisible();
        await settle(modal);
        const title = modal.locator('.easyedu-modal-title');
        await expect(title).toHaveCSS('font-size', '16px');
        await expect(title).toHaveCSS('color', 'rgb(38, 72, 97)');
        const close = modal.locator('.local-groupimport-easystud-modal__close:visible');
        await expect(close).toHaveCount(1);
        const closeBox = await close.boundingBox();
        expect(Math.abs(closeBox.width - 36.8)).toBeLessThanOrEqual(0.02);
        expect(Math.abs(closeBox.height - 36.8)).toBeLessThanOrEqual(0.02);
        await expect(close).toHaveCSS('align-items', 'center');
        await expect(close).toHaveCSS('justify-content', 'center');
        const closeBaseline = await close.evaluate(element => {
            const css = getComputedStyle(element), rect = element.getBoundingClientRect();
            const glyph = element.querySelector('.fa, [aria-hidden="true"]')?.getBoundingClientRect();
            return {
                background: css.backgroundColor,
                color: css.color,
                glyphCenterDeltaX: glyph ? Math.abs(glyph.x + glyph.width / 2 - rect.x - rect.width / 2) : null,
                glyphCenterDeltaY: glyph ? Math.abs(glyph.y + glyph.height / 2 - rect.y - rect.height / 2) : null,
            };
        });
        if (closeBaseline.glyphCenterDeltaX !== null) {
            expect(closeBaseline.glyphCenterDeltaX).toBeLessThanOrEqual(1);
            expect(closeBaseline.glyphCenterDeltaY).toBeLessThanOrEqual(1);
        }
        await close.hover();
        const closeHover = await close.evaluate(element => {
            const css = getComputedStyle(element);
            const probe = document.createElement('span');
            probe.style.color = 'var(--easyedu-danger)';
            probe.style.backgroundColor = 'var(--easyedu-danger-soft)';
            element.append(probe);
            const probeCss = getComputedStyle(probe);
            const result = {
                background: css.backgroundColor,
                color: css.color,
                expectedBackground: probeCss.backgroundColor,
                expectedColor: probeCss.color,
            };
            probe.remove();
            return result;
        });
        expect(closeHover.background).not.toBe(closeBaseline.background);
        expect(closeHover.background).toBe(closeHover.expectedBackground);
        expect(closeHover.color).toBe(closeHover.expectedColor);
        records.push({kind, width, closeBaseline, closeHover});
        await expect(modal.locator('.easyedu-entity-dialog__eyebrow')).toHaveCSS('font-size', '10px');
        await expect(modal.locator('.easyedu-entity-dialog__icon')).toHaveCSS('width', '32px');
        await expect(modal.locator('.easyedu-entity-dialog__icon')).toHaveCSS('color', 'rgb(15, 108, 191)');
        const fields = await modal.locator('.local-groupimport-easystud-detail__field:visible, ' +
            '.local-groupimport-easystud-settings-modal__field:visible').evaluateAll(nodes => nodes.map(node => {
                const box = node.getBoundingClientRect();
                const measure = child => {
                    if (!child) return null;
                    const css = getComputedStyle(child), rect = child.getBoundingClientRect();
                    return {font: css.fontFamily, size: css.fontSize, color: css.color, weight: css.fontWeight,
                        contained: rect.left >= box.left - 1 && rect.right <= box.right + 1};
                };
                return {caption: measure(node.querySelector(':scope > span')),
                    value: measure(node.querySelector(':scope > strong')),
                    control: measure(node.querySelector('.form-control'))};
            }));
        expect(fields.length, 'Native metadata/editing fields must remain present').toBeGreaterThan(0);
        for (const field of fields) {
            if (field.caption) {
                expect(field.caption.font).toContain('Inter');
                expect(field.caption.color).toBe('rgb(98, 120, 142)');
                expect(field.caption.weight).toBe('600');
                expect(field.caption.contained).toBe(true);
            }
            if (field.value) {
                expect(field.value.font).toContain('Inter');
                expect(field.value.size).toBe('14.08px');
                expect(field.value.weight).toBe('400');
                expect(field.value.contained).toBe(true);
            }
            if (field.control) {
                expect(field.control.size).toBe('13.76px');
                expect(field.control.contained).toBe(true);
            }
        }
        records.push({kind, width, bodyFieldRecipes: fields});
        await modal.locator('.easyedu-entity-dialog').screenshot({path: testInfo.outputPath(kind + '-' + width + '-entry.png')});
        const actions = modal.locator('.easyedu-entity-dialog__actions');
        if (await actions.count()) await actions.scrollIntoViewIfNeeded();
        await settle(modal);
        const geometry = await modal.evaluate(element => {
            const surface = element.querySelector('.easyedu-entity-dialog'), r = surface.getBoundingClientRect();
            const header = element.querySelector('.easyedu-entity-dialog__header');
            const heading = element.querySelector('.easyedu-modal-title'), h = heading.getBoundingClientRect();
            const hit = document.elementFromPoint(h.x + h.width / 2, h.y + h.height / 2);
            const actionRow = element.querySelector('.easyedu-entity-dialog__actions');
            const row = actionRow?.getBoundingClientRect();
            const buttons = [...(actionRow?.children || [])].map(button => {
                const b = button.getBoundingClientRect(), css = getComputedStyle(button);
                const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
                const icon = button.querySelector('.fa'), label = button.querySelector('span:not(.fa)');
                const i = icon?.getBoundingClientRect(), l = label?.getBoundingClientRect();
                return {text: button.textContent.trim(), type: button.getAttribute('type'),
                    href: button.getAttribute('href'), color: css.color, gap: css.gap,
                    x: b.x, right: b.right, y: b.y, height: b.height, fontSize: css.fontSize,
                    minHeight: css.minHeight, radius: css.borderTopLeftRadius,
                    unobscured: button.contains(hit), withinViewport: b.y >= 0 && b.bottom <= innerHeight,
                    iconLabelCenter: i && l ? Math.abs(i.y + i.height / 2 - l.y - l.height / 2) : null,
                    iconLabelGap: i && l ? l.x - i.right : null};
            });
            const last = buttons.length ? Math.max(...buttons.map(b => b.right)) : null;
            const rowPadding = actionRow ? parseFloat(getComputedStyle(actionRow).paddingRight) : 0;
            return {x: r.x, right: r.right, height: r.height, viewport: innerWidth,
                border: getComputedStyle(surface).borderTopColor,
                layer: getComputedStyle(element).zIndex,
                titleUnobscured: heading.contains(hit), headerHeight: header.getBoundingClientRect().height,
                buttons, actionRightDelta: row && last !== null ? Math.abs(last - row.right + rowPadding) : 0,
                formControls: [...element.querySelectorAll('input, textarea')].map(n => ({name: n.name, type: n.type})),
                listCount: element.querySelectorAll('details').length};
        });
        records.push({kind, width, ...geometry});
        expect(geometry.x).toBeGreaterThanOrEqual(-1);
        expect(geometry.right).toBeLessThanOrEqual(width + 1);
        expect(geometry.border).toBe('rgb(207, 224, 239)');
        expect(geometry.layer).toBe('1070');
        expect(geometry.titleUnobscured).toBe(true);
        expect(geometry.headerHeight).toBeGreaterThanOrEqual(64);
        expect(geometry.actionRightDelta).toBeLessThanOrEqual(1);
        for (const button of geometry.buttons) {
            expect(button.unobscured).toBe(true);
            expect(button.withinViewport).toBe(true);
            expect(button.fontSize).toBe('14.08px');
            expect(parseFloat(button.minHeight)).toBeGreaterThanOrEqual(37);
            if (button.iconLabelCenter !== null) {
                expect(button.iconLabelCenter).toBeLessThanOrEqual(1);
                expect(button.iconLabelGap).toBeGreaterThanOrEqual(9);
            }
        }
        const save = geometry.buttons.find(b => b.type === 'submit');
        const cancel = geometry.buttons.find(b => b.type === 'button' && !b.href);
        if (save && cancel) {
            expect(Math.abs(save.height - cancel.height)).toBeLessThanOrEqual(1);
            expect(save.radius).toBe(cancel.radius);
        }
        await modal.locator('.easyedu-entity-dialog').screenshot({path: testInfo.outputPath(kind + '-' + width + '.png')});
    };
    try {
        for (const width of [1600, 768, 390]) {
            await ready(width);
            if (width <= 1024) await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
            const opener = root.locator('[data-easystud-open-user]:visible').first();
            await opener.click();
            const participant = root.locator('[data-easystud-user-modal]');
            await expect(participant.locator('form, [type="submit"]')).toHaveCount(0);
            await expect(participant.locator('[data-easystud-detail-list]')).toHaveCount(3);
            await expect(participant.locator('.local-groupimport-easystud-detail__identity h4')).not.toBeEmpty();
            await inspect(participant, 'participant', width);
            await participant.locator('[data-easystud-close-user-modal]').click();
            await expect(participant).toBeHidden();
            await expect(opener).toBeFocused();

            for (const kind of ['group', 'grouping']) {
                // These existing full-card settings have a native desktop
                // entry, not the assumed responsive context-sheet command.
                // Resize an actually opened modal; this proves responsive
                // chrome/body geometry, not a mobile settings entry point.
                await ready(1600);
                await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
                const item = root.locator('[data-easystud-advanced-type="' + kind + '"]:visible').first();
                await expect(item, 'Existing course entity required; no manufactured fixtures').toBeVisible();
                const header = item.locator(':scope > .local-groupimport-easystud-group__header, ' +
                    ':scope > .local-groupimport-easystud-grouping__header');
                const direct = header.locator(':scope > [data-easystud-open-advanced-settings]:visible');
                await expect(direct).toBeVisible();
                await direct.click();
                const modal = root.locator('[data-easystud-advanced-settings-modal]');
                await expect(modal).toBeVisible();
                await page.setViewportSize({width, height: 1100});
                records.push({kind, width, entryWidth: 1600, proof: 'native desktop open then responsive resize; not mobile entry'});
                await expect(modal.locator('[name="action"]')).toHaveValue(kind === 'group' ? 'updategroupadvanced' : 'updategroupingadvanced');
                for (const name of ['name', 'idnumber', 'description']) await expect(modal.locator('[name="' + name + '"]')).toHaveCount(1);
                await expect(modal.locator('[data-easystud-settings-list-section]')).toHaveCount(kind === 'group' ? 2 : 1);
                await expect(modal.locator('[name="enrolmentkey"], [name="imagefile"], [name="deletepicture"]')).toHaveCount(kind === 'group' ? 3 : 0);
                await expect(modal.locator('.easyedu-entity-dialog__actions [type="submit"]')).toHaveCSS('color', 'rgb(255, 255, 255)');
                await inspect(modal, kind, width);
                await modal.locator('.local-groupimport-easystud-modal__close').click();
                await expect(modal).toHaveCount(0);
                await expect(direct).toBeFocused();
            }
        }
        expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('entity-dialog-chrome.json'), JSON.stringify({records, errors}, null, 2));
    }
});
