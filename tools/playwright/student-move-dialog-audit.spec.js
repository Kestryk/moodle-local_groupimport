const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing course data only; selection, open and cancel.
// Never confirm a move, change memberships, manufacture empty data or submit.
test('Student move dialogs preserve native participant and group branches', async ({page}, testInfo) => {
    test.setTimeout(150000);
    const records = [], blockedWrites = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('move-native.json'), JSON.stringify(records, null, 2));
    const root = page.locator('#local-groupimport-easystud');
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() !== 'GET') {
            blockedWrites.push({method:route.request().method()});
            await route.abort('blockedbyclient');
        } else {
            await route.continue();
        }
    });
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
    for (const width of [1600, 768, 390]) {
        for (const branch of ['participants', 'groups', 'groups-in-grouping']) {
            const kind = branch === 'participants' ? branch : 'groups';
            await page.setViewportSize({width, height: 1100});
            await ready(); // Each context starts with native selection cleared.
            if (kind === 'groups') {
                const toggle = width <= 1024 ? '[data-easystud-mobile-view="groups"]:visible' :
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
            const trigger = width <= 1024 ? root.locator('[data-easystud-mobile-action-trigger="' + action + '"]:visible').first() :
                root.locator(action + ':visible').first();
            await expect(trigger).toBeEnabled();
            await trigger.click();
            const dialog = root.locator('[data-easystud-move-modal]');
            await expect(dialog).toBeVisible();
            await expect(dialog).toHaveCSS('z-index', '1070');
            const helpPaint = await dialog.locator('[data-easystud-move-modal-help]').evaluate(element => {
                const text = element.firstChild;
                if (!text || text.nodeType !== Node.TEXT_NODE) return false;
                const range = document.createRange();
                range.setStart(text, 0);
                range.setEnd(text, Math.min(text.length, 4));
                const r = range.getBoundingClientRect();
                return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
            });
            expect(helpPaint, 'Native navigation must not cover the beginning of modal help').toBe(true);
            // Measure the completed normal-motion shell, not an opening scale.
            await dialog.locator('.local-groupimport-easystud-modal__dialog').evaluate(node =>
                Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {}))));
            const select = dialog.locator('[data-easystud-move-destination]');
            const chooser = dialog.locator('.easyedu-searchable-choice');
            const choiceTrigger = chooser.locator('.easyedu-searchable-choice__trigger');
            await expect(select).toBeHidden();
            await expect(choiceTrigger).toBeFocused();
            await expect(select).toHaveClass(/easyedu-select/);
            await expect(dialog.locator('h3')).toHaveCSS('font-size', '16px');
            const footer = dialog.locator('.easyedu-dialog-actions');
            await expect(footer).toHaveCSS('justify-content', 'flex-end');
            const pair = await footer.evaluate(node => {
                const row = node.getBoundingClientRect(), css = getComputedStyle(node);
                const buttons = [...node.children].map(button => {
                    const r = button.getBoundingClientRect(), s = getComputedStyle(button);
                    return {right: r.right, height: r.height, font: s.fontSize, weight: s.fontWeight,
                        radius: s.borderTopLeftRadius, padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]};
                });
                return {buttons, rightDelta: Math.abs(Math.max(...buttons.map(b => b.right)) -
                    row.right + parseFloat(css.paddingRight))};
            });
            expect(pair.buttons).toHaveLength(2);
            expect(pair.rightDelta).toBeLessThanOrEqual(1);
            expect(Math.abs(pair.buttons[0].height - pair.buttons[1].height)).toBeLessThanOrEqual(1);
            for (const button of pair.buttons) {
                expect(button.height).toBeGreaterThanOrEqual(37);
                expect(button.font).toBe('14.08px');
                expect(button.weight).toBe('600');
                expect(button.radius).toBe(pair.buttons[0].radius);
                expect(button.padding).toEqual(pair.buttons[0].padding);
            }
            records.push({viewport: width, branch, footerPair: pair});
            const options = await select.locator('option').evaluateAll(nodes => nodes.map(n => ({value: n.value, label: n.textContent})));
            const origin = dialog.locator('[data-easystud-move-origin-wrap]');
            records.push({viewport: width, kind, branch, options, originVisible: await origin.isVisible(),
                originChecked: await dialog.locator('[data-easystud-move-remove-origin]').isChecked(),
                confirmLabel: await dialog.locator('[data-easystud-confirm-move]').textContent()});
            expect(options.length).toBeGreaterThan(0);
            expect(new Set(options.map(option => option.value)).size, 'responsive duplicates must not duplicate choices')
                .toBe(options.length);
            const selectedBeforeSearch = await select.inputValue();
            await choiceTrigger.click();
            const search = chooser.getByRole('searchbox');
            await expect(search).toBeFocused();
            await search.fill('__no_matching_destination__');
            await expect(chooser.getByRole('status')).toBeVisible();
            await expect(select).toHaveValue(selectedBeforeSearch);
            await search.press('Escape');
            await expect(dialog).toBeVisible();
            await expect(choiceTrigger).toBeFocused();
            await choiceTrigger.click();
            await search.fill(options[options.length - 1].label);
            const option = chooser.getByRole('button', {name:options[options.length - 1].label, exact:true});
            await expect(option).toHaveCount(1);
            await option.click();
            await expect(select).toHaveValue(options[options.length - 1].value);
            await expect(choiceTrigger).toBeFocused();
            await expect(dialog).toBeVisible();
            // Destination selection is local only; never confirm a membership command.
            await choiceTrigger.click();
            await page.evaluate(() => document.fonts.ready);
            await dialog.locator('.local-groupimport-easystud-modal__dialog').screenshot({path:
                testInfo.outputPath('move-choices-' + branch + '-' + width + '.png')});
            await search.press('Escape');
            if (kind === 'groups') { expect(options[0].value).toBe('0'); }
            else { await expect(origin).toBeHidden(); }
            if (branch === 'groups-in-grouping') { await expect(origin).toBeVisible(); }
            if (branch === 'groups-in-grouping') {
                await expect(origin).toHaveClass(/easyedu-toggle-check/);
                const originPaint = await origin.evaluate(label => {
                    const input = label.querySelector('input');
                    const text = label.querySelector('span');
                    const labelStyle = getComputedStyle(label);
                    const track = getComputedStyle(text, '::before');
                    return {
                        height: label.getBoundingClientRect().height,
                        gap: labelStyle.gap,
                        fontSize: labelStyle.fontSize,
                        inputType: input.type,
                        trackWidth: track.width,
                        trackHeight: track.height,
                    };
                });
                expect(originPaint.height).toBeGreaterThanOrEqual(width <= 576 ? 44 : 37.5);
                expect(originPaint.inputType).toBe('checkbox');
                expect(parseFloat(originPaint.trackWidth)).toBeCloseTo(27.52, 1);
                expect(parseFloat(originPaint.trackHeight)).toBeCloseTo(15.2, 1);
                await origin.locator('input').focus();
                await expect(origin.locator('input')).toBeFocused();
                expect(await origin.evaluate(label => getComputedStyle(label).boxShadow)).not.toBe('none');
                records.push({viewport: width, branch, originPaint, canonicalToggle: true});
            }
            for (const [role, selector] of Object.entries({shell: '.local-groupimport-easystud-modal__dialog',
                header: '.local-groupimport-easystud-modal__header', title: 'h3',
                body: '.local-groupimport-easystud-modal__body', help: '[data-easystud-move-modal-help]',
                label: '[data-easystud-move-modal-label]', select: '.easyedu-searchable-choice__trigger',
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
    expect(blockedWrites, 'Open/search/select/cancel must never submit a membership command').toEqual([]);
    save();
});
