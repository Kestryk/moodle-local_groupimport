const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: native settings presentation only. Never save configuration.
test('Administration Kit read-only responsive controls', async({page}, testInfo) => {
    test.setTimeout(180000);
    const base = process.env.EASYEDU_MOODLE_URL || 'http://localhost';
    const url = new URL('/admin/settings.php?section=local_groupimport', base).toString();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME || 'Admin');
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD || '');
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
        await page.goto(url, {waitUntil: 'domcontentloaded'});
    }
    let submitted = false;
    const choiceMetrics = [];
    const restoreMetrics = [];
    await page.route('**/admin/settings.php*', route => {
        if (route.request().method() !== 'GET') {
            submitted = true;
            return route.abort();
        }
        return route.continue();
    });
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1000});
        const root = page.locator('#page-admin-setting-local_groupimport');
        const title = root.locator('.local-groupimport-admin-settings__page-title');
        await expect(title).toBeVisible();
        await expect(title).toHaveText(/^(EasyStud administration|Administration EasyStud)$/);
        await expect(title).toHaveCSS('font-size', '20px');
        await expect(root.locator('.local-groupimport-admin-settings__page-description'))
            .toHaveCSS('font-size', '14.4px');
        await expect(root.locator('#admin-themeprimarycolor .form-label label'))
            .toHaveCSS('font-size', '14.08px');
        await expect(root.locator('#admin-themeprimarycolor .form-setting > .form-text'))
            .toHaveCSS('font-size', '12.16px');
        await expect(root.locator('#admin-themeprimarycolor .form-setting > .form-defaultinfo'))
            .toHaveCSS('font-size', '12.16px');
        const choice = root.locator('#admin-defaultlayoutmode .easyedu-searchable-choice');
        await expect(choice).toBeVisible();
        const trigger = choice.locator('.easyedu-searchable-choice__trigger');
        const nativeChoices = root.locator('.easyedu-searchable-choice');
        await expect(nativeChoices).toHaveCount(5);
        const radii = new Set();
        for (const nativeChoice of await nativeChoices.all()) {
            const metric = await nativeChoice.evaluate(node => {
                const triggerNode = node.querySelector('.easyedu-searchable-choice__trigger');
                const rect = triggerNode.getBoundingClientRect();
                const style = getComputedStyle(triggerNode);
                return {
                    width: innerWidth,
                    setting: node.closest('.form-item')?.id || '',
                    kitScope: Boolean(node.closest('.easyedu-ui')),
                    height: rect.height,
                    fontSize: style.fontSize,
                    borderRadius: style.borderRadius,
                    borderColor: style.borderTopColor,
                };
            });
            choiceMetrics.push(metric);
            expect(metric.kitScope, `${metric.setting} must use the Kit scope`).toBe(true);
            expect(metric.height, `${metric.setting} trigger height`).toBe(width === 1600 ? 38 : 44);
            expect(metric.fontSize, `${metric.setting} trigger font`).toBe('14px');
            radii.add(metric.borderRadius);
        }
        expect(radii.size, 'All admin choices share the Kit radius').toBe(1);
        await trigger.click();
        await expect(choice.getByRole('searchbox')).toBeVisible();
        await choice.getByRole('searchbox').press('Escape');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        const pickers = root.locator('[data-easyedu-color-picker]');
        await expect(pickers).toHaveCount(7);
        await expect(root.locator('.easyedu-color-picker__trigger')).toHaveCount(7);
        // Saved custom colours may legitimately show contrast guidance. Test
        // the default exemption with a draft-only input, never a settings Save.
        const groupingPicker = root.locator('#admin-themegroupingcolor [data-easyedu-color-picker]');
        const groupingDefault = await groupingPicker.getAttribute('data-easyedu-color-default');
        expect(groupingDefault.toUpperCase()).toBe('#6A7F98');
        await groupingPicker.locator('.easyedu-color-picker__hex').fill(groupingDefault);
        await expect(root.locator('#admin-themegroupingcolor [data-easyedu-colour-contrast-note]')).toBeHidden();
        await groupingPicker.locator('.easyedu-color-picker__hex').blur();
        await page.mouse.move(0, 0);
        for (const picker of await pickers.all()) {
            // Draft fill scrolls controls under the pointer. Await the exact
            // unfocused/unhovered endpoint, not an interpolated border colour.
            await expect(picker).toHaveCSS('border-top-color', 'rgb(185, 198, 212)');
        }
        for (const picker of await pickers.all()) {
            const metrics = await picker.evaluate(n => {
                const r = n.getBoundingClientRect();
                const hex = n.querySelector('.easyedu-color-picker__hex');
                const swatch = n.querySelector('.easyedu-color-picker__trigger');
                const setting = n.closest('.form-setting');
                const defaultInfo = setting.querySelector('.form-defaultinfo');
                const defaultRect = defaultInfo.getBoundingClientRect();
                return {left: r.left, right: r.right, width: innerWidth,
                    display: getComputedStyle(n).display, controlWidth: r.width,
                    borderColor: getComputedStyle(n).borderTopColor,
                    hexFontSize: getComputedStyle(hex).fontSize,
                    hexHeight: hex.getBoundingClientRect().height,
                    hexRight: hex.getBoundingClientRect().right,
                    swatchWidth: swatch.getBoundingClientRect().width,
                    defaultLeft: defaultRect.left,
                    defaultCenterY: defaultRect.top + defaultRect.height / 2,
                    pickerCenterY: r.top + r.height / 2};
            });
            expect(metrics.left).toBeGreaterThanOrEqual(0);
            expect(metrics.right).toBeLessThanOrEqual(metrics.width + 1);
            expect(metrics.display).not.toBe('block');
            expect(metrics.controlWidth).toBeCloseTo(160, 1);
            expect(metrics.borderColor).toBe('rgb(185, 198, 212)');
            expect(metrics.hexFontSize).toBe('12.48px');
            expect(metrics.swatchWidth).toBeCloseTo(49.6, 1);
            expect(metrics.hexRight).toBeLessThanOrEqual(metrics.right - 7);
            expect(metrics.hexHeight).toBeGreaterThan(25);
            expect(metrics.defaultLeft - metrics.right).toBeCloseTo(width === 1600 ? 24 : 16, 1);
            expect(Math.abs(metrics.defaultCenterY - metrics.pickerCenterY)).toBeLessThanOrEqual(3);
        }
        const restore = root.locator('[data-easystud-restore-colours]');
        await expect(restore).toBeVisible();
        await expect(restore).toHaveText(/^(Restore EasyEdu colors|Rétablir les couleurs EasyEdu)$/);
        const restoreHelp = root.locator('#easystud-restore-colours-help');
        await expect(restoreHelp).toHaveClass(/\beasyedu-form-note\b/);
        const restoreMetric = await restoreHelp.evaluate(help => {
            const button = document.querySelector('[data-easystud-restore-colours]');
            const buttonRect = button.getBoundingClientRect();
            const helpRect = help.getBoundingClientRect();
            return {width: innerWidth, gap: helpRect.top - buttonRect.bottom,
                fontSize: getComputedStyle(help).fontSize,
                buttonText: button.textContent.trim(),
                buttonLeft: buttonRect.left, buttonRight: buttonRect.right};
        });
        restoreMetrics.push(restoreMetric);
        expect(restoreMetric.gap, 'Reuse the canonical form-note clearance').toBeCloseTo(20, 1);
        expect(restoreMetric.fontSize).toBe('12.16px');
        expect(restoreMetric.buttonLeft).toBeGreaterThanOrEqual(0);
        expect(restoreMetric.buttonRight).toBeLessThanOrEqual(width + 1);
        const palette = root.locator('#admin-themeprimarycolor');
        await palette.scrollIntoViewIfNeeded();
        await page.screenshot({path: testInfo.outputPath(`admin-palette-${width}.png`)});
        if (width === 1600) {
            const hex = palette.locator('.easyedu-color-picker__hex');
            const notice = palette.locator('[data-easyedu-colour-contrast-note]');
            await hex.fill('#FFF3A5');
            await expect(notice).toBeVisible();
            await expect(notice).toHaveCSS('background-color', 'rgb(255, 246, 216)');
            await expect(notice).toHaveCSS('border-top-color', 'rgb(216, 184, 76)');
            await expect(notice.locator('strong')).toHaveCSS('color', 'rgb(114, 91, 0)');
            await notice.screenshot({path: testInfo.outputPath('admin-light-colour-guidance.png')});
            await hex.fill('#4873AD');
            await expect(notice).toBeVisible();
            await hex.fill('#0F6CBF');
            await expect(notice).toBeHidden();
            const accent = root.locator('#admin-themeaccentcolor .easyedu-color-picker__hex');
            const accentDefault = await accent.locator('xpath=ancestor::*[@data-easyedu-color-default][1]')
                .getAttribute('data-easyedu-color-default');
            await hex.fill('#123456');
            await accent.fill('#234567');
            await root.locator('[data-easystud-restore-colours]').click();
            await expect(hex).toHaveValue('#0F6CBF');
            await expect(accent).toHaveValue(accentDefault);
            await expect(root.locator('[data-easystud-restore-colours-status]')).not.toBeEmpty();
            expect(submitted, 'Restore must not save settings automatically').toBe(false);
        }
        const sectionHeadings = root.locator('#adminsettings h3.main');
        expect(await sectionHeadings.count()).toBeGreaterThan(0);
        for (const heading of await sectionHeadings.all()) {
            await expect(heading).toHaveCSS('font-size', '16px');
        }
        await title.scrollIntoViewIfNeeded();
        await page.screenshot({path: testInfo.outputPath(`admin-${width}.png`), fullPage: true});
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    }
    expect(submitted).toBe(false);
    expect(errors).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('admin-choice-metrics.json'),
        JSON.stringify(choiceMetrics, null, 2));
    fs.writeFileSync(testInfo.outputPath('admin-restore-metrics.json'),
        JSON.stringify(restoreMetrics, null, 2));
});
