// Local-supervised: native French labels, open/Escape only. No Save or fixtures.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('T042 French editor labels preserve accented ARIA help and modal copy', async({page}, info) => {
    test.setTimeout(240000);
    const records = [], blocked = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}})))
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    try {
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
            const root = page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            const labels = JSON.parse(await root.getAttribute('data-easystud-detail-labels'));
            expect(labels.advancedsettings).toBe('Paramètres avancés');
            expect(labels.advancedsettingsintro).toBe('Principaux paramètres Moodle qui ne sont pas modifiés directement dans EasyStud.');
            for (const kind of ['group', 'grouping']) {
                if (width < 1024) await root.locator('[data-easystud-mobile-view="' +
                    (kind === 'group' ? 'groups' : 'groupings') + '"]:visible').click();
                else await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
                const item = root.locator(kind === 'group' ?
                    '[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible' :
                    '[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible').first();
                const direct = item.locator(':scope > .local-groupimport-easystud-group__header > ' +
                    '[data-easystud-open-advanced-settings], :scope > .local-groupimport-easystud-grouping__header > ' +
                    '[data-easystud-open-advanced-settings]');
                await expect(direct).toHaveAttribute('aria-label', 'Paramètres avancés');
                await expect(direct).toHaveAttribute('data-easystud-hover-help', 'Paramètres avancés');
                if (await direct.isVisible()) await direct.click();
                else {
                    await item.locator(':scope > [data-easystud-card-menu]:visible, ' +
                        ':scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]:visible, ' +
                        ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first().click();
                    await root.locator('[data-easystud-context-menu]:visible ' +
                        '[data-easystud-context-action="' + kind + '-open-advanced-settings"]').click();
                }
                const modal = root.locator('[data-easystud-advanced-settings-modal]:visible');
                await expect(modal).toBeVisible();
                const record = {width, kind, aria: await direct.getAttribute('aria-label'),
                    hoverHelp: await direct.getAttribute('data-easystud-hover-help')};
                records.push(record);
                if (kind === 'group') {
                    await expect(modal.locator('[data-easystud-advanced-file-name]')).toHaveText('Aucun fichier sélectionné');
                    const placeholder = modal.locator('.local-groupimport-easystud-settings-modal__image-placeholder');
                    // A pre-existing real picture is not removed to manufacture a no-image specimen.
                    record.noImagePresent = await placeholder.count() > 0;
                    if (record.noImagePresent) await expect(placeholder).toContainText('Aucune image de groupe configurée.');
                } else {
                    await expect(modal.locator('.local-groupimport-easystud-settings-modal__field--readonly').filter({hasText: 'Données de configuration'})).toHaveCount(1);
                }
                await page.keyboard.press('Escape'); await expect(modal).toBeHidden();
                record.cancelled = true;
            }
        }
        expect(records).toHaveLength(6); expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('french-editor-accents-native.json'), JSON.stringify({records, errors, blocked,
            fixtureRequested: false, settingsSaved: false, sourceOnlyIntroductionVerified: true,
            scope: 'Native FR1280/768/390 original label/ARIA/help and group/grouping copy; no image mutation, Save or human acceptance.'}, null, 2));
    }
});
