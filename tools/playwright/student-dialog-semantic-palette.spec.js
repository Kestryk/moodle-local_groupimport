const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing modal open/Close only, transient paint probes.
// No Save, Move, Send, draft consumption, rollback, fixture or Guide writes.
test('Dialog headers consume independent semantic palettes without geometry drift', async({page}, info) => {
    test.setTimeout(240000);
    page.setDefaultTimeout(15000);
    const records = [], errors = [], blocked = [];
    const save = () => fs.writeFileSync(info.outputPath('dialog-semantic-palette.json'), JSON.stringify({records, errors, blocked}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(c => c.methodname); } catch (_) {}
        if (methods.length && methods.every(n => n === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(n => reads.has(n))) return route.continue();
        blocked.push({scope: 'core', methods}); return route.abort('blockedbyclient');
    });
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()}); return route.abort('blockedbyclient');
    });
    const settle = node => node.evaluate(async element => {
        await document.fonts.ready;
        await Promise.all(element.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const ready = async(url, selector) => {
        await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter: true});
            await page.waitForURL(u => !u.pathname.includes('/login/'), {timeout: 60000});
            await page.goto(url, {waitUntil: 'domcontentloaded'});
        }
        const root = page.locator(selector);
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await settle(root); return root;
    };
    const paint = async(header, role) => header.evaluate((n, role) => {
        const s = getComputedStyle(n), r = n.getBoundingClientRect();
        const probe = document.createElement('span'); n.append(probe);
        probe.style.background = `var(--easyedu-dialog-palette-${role}-header, var(--easyedu-dialog-palette-base, var(--easyedu-modal-header-bg)))`;
        const expected = getComputedStyle(probe).backgroundImage; probe.remove();
        const childMetrics = [...n.querySelectorAll('h3, button')].map(c => {
            const b = c.getBoundingClientRect(), css = getComputedStyle(c);
            return [b.width, b.height, b.x - r.x, b.y - r.y, css.fontSize, css.fontFamily, css.padding];
        });
        return {image: s.backgroundImage, expected, background: s.backgroundColor,
            geometry: [r.width, r.height, s.padding, s.borderRadius, s.animation, s.transition, childMetrics]};
    }, role);
    const palettes = [
        {name: 'official', flags: '', primary: '#0f6cbf', chosen: '#0f6cbf', accent: '#1b7f5a'},
        {name: 'primary-only', flags: 'primary', primary: '#7b3f98', chosen: '#7b3f98', accent: '#1b7f5a'},
        {name: 'accent-only', flags: 'success', primary: '#0f6cbf', chosen: '#0f6cbf', accent: '#984b27'},
        {name: 'both-light-primary', flags: 'primary success', primary: '#765300', chosen: '#ffae00', accent: '#713fa0'},
        {name: 'official-restored', flags: '', primary: '#0f6cbf', chosen: '#0f6cbf', accent: '#1b7f5a'},
    ];
    const audit = async(root, kind, header, role, width) => {
        await expect(header).toBeVisible(); await settle(header);
        const style = await root.getAttribute('style'), flags = await root.getAttribute('data-easyedu-dialog-palette');
        let baseline;
        try {
            for (const p of palettes) {
                await root.evaluate((n, {style, p}) => {
                    n.style.cssText = style || '';
                    n.style.setProperty('--easyedu-primary', p.primary); n.style.setProperty('--easyedu-primary-chosen', p.chosen);
                    n.style.setProperty('--easyedu-accent', p.accent); n.style.setProperty('--easyedu-accent-chosen', p.accent);
                    n.setAttribute('data-easyedu-dialog-palette', p.flags);
                }, {style, p});
                // Portal palette must be tested by native reopening, not by a
                // second test-only relay. Message uses the dedicated path below.
                const result = await paint(header, role);
                expect(result.image).toBe(result.expected);
                baseline ??= result;
                expect(result.geometry).toEqual(baseline.geometry);
                if (p.flags.includes(role)) expect(result.image).not.toBe(baseline.image);
                else expect(result.image).toBe(baseline.image);
                records.push({kind, width, palette: p.name, role, ...result}); save();
            }
        } finally {
            await root.evaluate((n, {style, flags}) => {
                if (style === null) n.removeAttribute('style'); else n.setAttribute('style', style);
                if (flags === null) n.removeAttribute('data-easyedu-dialog-palette'); else n.setAttribute('data-easyedu-dialog-palette', flags);
            }, {style, flags});
        }
    };
    try {
        for (const width of [1600, 390]) {
            await page.setViewportSize({width, height: 1100});
            const root = await ready(process.env.EASYEDU_MOODLE_URL, '#local-groupimport-easystud');
            if (width < 1024) await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
            else await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
            const eye = root.locator('[data-easystud-open-user]:visible').first(); await eye.click();
            const details = root.locator('[data-easystud-user-modal]');
            await audit(root, 'participant', details.locator('.easyedu-entity-dialog__header'), 'primary', width);
            await details.locator('[data-easystud-close-user-modal]').click(); await expect(details).toBeHidden();

            const selection = root.locator('[data-easystud-user]:visible').first().locator('[data-easystud-selector-input]');
            await selection.click();
            const move = width > 1024 ? root.locator('[data-easystud-move-selected-participants]:visible').first() :
                root.locator('[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]:visible').first();
            await move.click(); const destination = root.locator('[data-easystud-move-modal]');
            await audit(root, 'move', destination.locator('.local-groupimport-easystud-modal__header'), 'primary', width);
            await destination.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
            await expect(destination).toBeHidden(); await expect(move).toBeFocused();

            const message = width > 1024 ? root.locator('[data-easystud-message-selected-participants]:visible').first() :
                root.locator('[data-easystud-mobile-action-trigger="[data-easystud-message-selected-participants]"]:visible').first();
            const style = await root.getAttribute('style'), flags = await root.getAttribute('data-easyedu-dialog-palette');
            let messageBaseline;
            try {
                for (const p of palettes) {
                    await root.evaluate((n, {style, p}) => {
                        n.style.cssText = style || '';
                        n.style.setProperty('--easyedu-primary', p.primary); n.style.setProperty('--easyedu-primary-chosen', p.chosen);
                        n.style.setProperty('--easyedu-accent', p.accent); n.style.setProperty('--easyedu-accent-chosen', p.accent);
                        n.setAttribute('data-easyedu-dialog-palette', p.flags);
                    }, {style, p});
                    await message.click();
                    const portal = page.locator('.easyedu-message-dialog.show').last();
                    await expect(portal.locator('#bulk-message')).toBeVisible({timeout: 30000}); await settle(portal);
                    const result = await paint(portal.locator('.modal-header'), 'primary');
                    expect(result.image).toBe(result.expected);
                    messageBaseline ??= result; expect(result.geometry).toEqual(messageBaseline.geometry);
                    if (p.flags.includes('primary')) expect(result.image).not.toBe(messageBaseline.image);
                    else expect(result.image).toBe(messageBaseline.image);
                    records.push({kind: 'native-message-portal', width, palette: p.name, ...result}); save();
                    await portal.locator('.modal-footer [data-action="cancel"]').click(); await expect(portal).toBeHidden();
                    await expect(message).toBeFocused();
                }
            } finally {
                await root.evaluate((n, {style, flags}) => {n.style.cssText = style || ''; n.setAttribute('data-easyedu-dialog-palette', flags || '');}, {style, flags});
            }
            await selection.click();
            for (const kind of ['group', 'grouping']) {
                // Existing desktop entry, then responsive resize. Do not claim
                // a mobile settings entry that this scenario has not exercised.
                await page.setViewportSize({width: 1600, height: 1100});
                await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
                const item = root.locator(`[data-easystud-advanced-type="${kind}"]:visible`).first();
                await item.locator(':scope > .local-groupimport-easystud-group__header > [data-easystud-open-advanced-settings]:visible, ' +
                    ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-open-advanced-settings]:visible').click();
                const dialog = root.locator('[data-easystud-advanced-settings-modal]');
                await expect(dialog).toBeVisible(); await page.setViewportSize({width, height: 1100});
                await audit(root, kind + '-settings-desktop-entry', dialog.locator('.easyedu-entity-dialog__header'), 'success', width);
                await dialog.locator('.local-groupimport-easystud-modal__close').click(); await expect(dialog).toHaveCount(0);
            }
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.pathname = url.pathname.replace(/manage\.php$/, 'index.php');
            await page.setViewportSize({width, height: 1100}); const mass = await ready(url.toString(), '#local-groupimport-import');
            const nav = page.locator('#local-groupimport-import-navigation');
            let history = nav.locator('[data-easyedu-navigation-item-id="mass-import-history"] button:visible').first();
            if (await history.count() === 0) {await nav.locator('[data-easyedu-navigation-open]:visible').click();
                history = nav.locator('[data-easyedu-navigation-panel] [data-easyedu-navigation-item-id="mass-import-history"] button');}
            await history.click(); const historyDialog = mass.locator('[data-local-groupimport-history-modal]');
            await audit(mass, 'mass-history', historyDialog.locator('.easyedu-dialog-header'), 'primary', width);
            await historyDialog.locator('[data-local-groupimport-history-close]').click(); await expect(historyDialog).toBeHidden();
        }
        expect(records).toHaveLength(60); expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {save();}
});
