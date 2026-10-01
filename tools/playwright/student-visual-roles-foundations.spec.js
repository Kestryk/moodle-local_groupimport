const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised, read-only visual audit. Open native disclosures/navigation
// and cancel only. Never submit an identifier, save, send, import or drop.
test('Student visual roles match Foundations typography and surfaces', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:1600, height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout:60000});
    const reports = [];
    const actionStates = async(panel, prefix) => {
        const primary = panel.locator('button').first();
        const secondary = panel.locator('button').last();
        const states = [];
        const palette = await panel.evaluate(n => {
            const style = getComputedStyle(n);
            const colour = name => {
                const value = style.getPropertyValue(`--easyedu-${name}`).trim();
                const hex = /^#([a-f0-9]{6})$/i.exec(value);
                return hex ? `rgb(${[0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)).join(', ')})` : value;
            };
            return {primary:colour('primary'), strong:colour('primary-strong'), soft:colour('primary-soft'),
                surface:colour('surface')};
        });
        for (const [name, button, hoverBackground, textColor] of [
            ['primary', primary, palette.strong, palette.surface],
            ['secondary', secondary, palette.soft, palette.primary],
        ]) {
            await button.hover();
            await expect(button).toHaveCSS('background-color', hoverBackground);
            states.push({name, state:'hover', ...(await measure(button))[0]});
            expect.soft(states.at(-1).color, `${prefix}/${name} hover text`).toBe(textColor);
            await page.mouse.move(0, 0);
            // Keyboard modality before focus: do not treat pointer focus as
            // proof of :focus-visible. No Add/Save command is activated.
            await page.keyboard.press('Tab');
            await button.focus();
            await expect(button).toBeFocused();
            await expect.soft(button).toHaveCSS('background-color', name === 'primary'
                ? palette.primary : palette.surface);
            states.push({name, state:'focus', ...(await measure(button))[0]});
            expect.soft(states.at(-1).color, `${prefix}/${name} keyboard text`).toBe(textColor);
            expect(await button.evaluate(n => n.matches(':focus-visible'))).toBe(true);
            expect(await button.evaluate(n => getComputedStyle(n).boxShadow)).not.toBe('none');
            await button.screenshot({path:testInfo.outputPath(`${prefix}-${name}-focus.png`)});
        }
        return states;
    };
    const measure = async(locator) => locator.evaluateAll(nodes => nodes.filter(n => n.getClientRects().length).map(n => {
        const style = getComputedStyle(n);
        const box = e => {
            const r = e.getBoundingClientRect();
            return {x:r.x, y:r.y, w:r.width, h:r.height};
        };
        const icon = n.querySelector('.fa');
        const label = [...n.children].find(e => !e.classList.contains('fa') && e.textContent.trim());
        const textNode = [...n.childNodes].find(e => e.nodeType === Node.TEXT_NODE && e.textContent.trim());
        let textBox = null;
        if (textNode) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            textBox = box(range);
        }
        return {text:n.textContent.trim().slice(0, 120), classes:n.className, box:box(n),
            family:style.fontFamily, size:style.fontSize, weight:style.fontWeight,
            color:style.color, background:style.backgroundColor, lineHeight:style.lineHeight,
            display:style.display, alignItems:style.alignItems, gap:style.gap,
            parent:box(n.parentElement),
            hovered:n.matches(':hover'), focused:n === document.activeElement,
            icon:icon ? box(icon) : null, label:label ? box(label) : textBox,
            drawerSurface:style.getPropertyValue('--easyedu-navigation-drawer-surface').trim()};
    }));
    const roles = {
        pageTitle:'.easyedu-workspace-title-control .dropdown-toggle',
        description:'.easyedu-workspace-description',
        panelTitle:'.easyedu-workspace-panel-title',
        participant:'.local-groupimport-easystud-user__name',
        participantEmail:'.local-groupimport-easystud-user__email',
        group:'.local-groupimport-easystud-group__name',
        grouping:'.local-groupimport-easystud-grouping__name',
        member:'.local-groupimport-easystud-member__name',
        toggle:'[data-easystud-layout-mode], [data-easystud-mobile-view]',
        direct:'.local-groupimport-easystud-user__detail-button, .local-groupimport-easystud-group__mail-button',
    };
    try {
        // Show an existing populated native Grouping; leave Motion untouched.
        const grouping = root.locator('[data-easystud-grouping-id]').filter({
            has:page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]'),
        }).first();
        const disclosure = grouping.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
        if (await disclosure.getAttribute('aria-expanded') === 'false') await disclosure.click();
        await expect(grouping.locator('.local-groupimport-easystud-member__name').first()).toBeVisible();
        const record = {width:1600, roles:{}, inline:{}};
        reports.push(record);
        for (const [name, selector] of Object.entries(roles)) record.roles[name] = (await measure(root.locator(selector))).slice(0, 4);
        for (const role of ['participant', 'group', 'grouping']) {
            expect(record.roles[role].length, role).toBeGreaterThan(0);
            for (const item of record.roles[role]) {
                expect(item.size, role).toBe('14px');
                expect(item.weight, role).toBe('700');
                expect(item.color, role).toBe('rgb(22, 50, 79)');
            }
        }
        for (const item of record.roles.member) {
            expect(item.size).toBe('13px');
            expect(item.weight).toBe('600');
            expect(item.color).toBe('rgb(22, 50, 79)');
        }
        for (const [kind, triggerSelector, panelSelector, cancelSelector] of [
            ['participants', '[data-easystud-toggle-group-email]', '[data-easystud-group-email-panel]', '[data-easystud-cancel-group-email]'],
            ['groups', '[data-easystud-toggle-grouping-groups]', '[data-easystud-grouping-groups-panel]', '[data-easystud-cancel-grouping-groups]'],
        ]) {
            const trigger = root.locator(`${triggerSelector}:visible`).first();
            await trigger.click();
            const panel = root.locator(`${panelSelector}:visible`).first();
            await expect(panel).toBeVisible();
            record.inline[kind] = await measure(panel.locator('button'));
            for (const item of record.inline[kind]) {
                expect(item.size).toBe('12px');
                expect(item.weight).toBe('700');
                expect(item.alignItems).toBe('center');
                if (item.icon) {
                    expect(Math.abs(item.icon.y + item.icon.h / 2 - item.box.y - item.box.h / 2)).toBeLessThan(1);
                    expect(item.label.x - item.icon.x - item.icon.w).toBeGreaterThanOrEqual(10);
                    expect(item.background).toBe('rgb(15, 108, 191)');
                    expect(item.color).toBe('rgb(255, 255, 255)');
                } else {
                    expect(item.color).toBe('rgb(15, 108, 191)');
                    expect(item.background).toBe('rgb(255, 255, 255)');
                }
                expect(Math.abs(item.label.y + item.label.h / 2 - item.box.y - item.box.h / 2)).toBeLessThan(2);
            }
            await panel.screenshot({path:testInfo.outputPath(`inline-${kind}-1600.png`)});
            record.inline[`${kind}States`] = await actionStates(panel, `inline-${kind}`);
            await panel.locator(cancelSelector).click();
        }
        await page.screenshot({path:testInfo.outputPath('visual-roles-1600.png')});
        // Inspect native Rename only, never submit the form.
        const rename = root.locator('[data-easystud-rename-toggle]:visible').first();
        await rename.click();
        const edit = root.locator('.local-groupimport-easystud-rename__edit:not([hidden])').first();
        await expect(edit).toBeVisible();
        // Opening Rename changes the header under the old pointer position.
        // Assert resting roles after that preserved hover transition settles.
        await page.mouse.move(0, 0);
        await expect(edit.locator('[data-easystud-rename-cancel]')).toHaveCSS('color', 'rgb(15, 108, 191)');
        record.rename = await measure(edit.locator('button'));
        for (const item of record.rename) {
            expect(item.size).toBe('12px');
            expect(item.weight).toBe('700');
            expect(item.alignItems).toBe('center');
            expect(Math.abs(item.label.y + item.label.h / 2 - item.box.y - item.box.h / 2)).toBeLessThan(2);
        }
        expect(record.rename[0].background).toBe('rgb(15, 108, 191)');
        expect(record.rename[0].color).toBe('rgb(255, 255, 255)');
        expect(record.rename[1].color).toBe('rgb(15, 108, 191)');
        await edit.screenshot({path:testInfo.outputPath('rename-1600.png')});
        record.renameStates = await actionStates(edit, 'rename');
        await edit.locator('[data-easystud-rename-cancel]').click();
        for (const width of [768, 390]) {
            await page.setViewportSize({width, height:1100});
            await root.locator('[data-easystud-mobile-view="groups"]').click();
            const record = {width, roles:{}};
            for (const [name, selector] of Object.entries(roles)) record.roles[name] = (await measure(root.locator(selector))).slice(0, 4);
            const trigger = page.locator('[data-easyedu-navigation-open]:visible').first();
            await trigger.click();
            const panel = page.locator('[data-easyedu-navigation-panel]');
            await expect(panel).toBeVisible();
            await expect(panel).toHaveAttribute('aria-hidden', 'false');
            // Measure settled geometry, not a frame during the native slide.
            await expect.poll(async() => (await panel.boundingBox()).x, {timeout:10000}).toBeGreaterThanOrEqual(-0.5);
            record.navigation = await measure(panel);
            expect(record.navigation[0].background).toBe('rgb(255, 255, 255)');
            expect(record.navigation[0].drawerSurface).not.toBe('');
            await page.screenshot({path:testInfo.outputPath(`navigation-${width}.png`)});
            await page.keyboard.press('Escape');
            await expect(panel).toHaveAttribute('aria-hidden', 'true');
            reports.push(record);
        }
    } finally {
        fs.writeFileSync(testInfo.outputPath('visual-roles.json'), JSON.stringify(reports, null, 2));
        await page.keyboard.press('Escape');
    }
});
