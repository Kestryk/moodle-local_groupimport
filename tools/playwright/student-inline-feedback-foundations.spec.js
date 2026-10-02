const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: native tools and transient lookup previews only.
// Never submit Add/Save, remove membership, send messages or mutate fixtures.
test('Student inline lookup feedback and search Cancel use Foundation roles', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width: 1600, height: 1100});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const user = root.locator('[data-easystud-user][data-user-email]').first();
    const knownUser = await user.getAttribute('data-user-email');
    const knownName = (await user.locator('.local-groupimport-easystud-user__name').textContent()).trim();
    const knownGroup = (await root.locator('.local-groupimport-easystud-group__name').first().textContent()).trim();
    expect(knownUser).toBeTruthy();
    expect(knownGroup).toBeTruthy();
    const reports = [];
    const settle = async node => {
        await node.evaluate(async element => {
            await document.fonts.ready;
            const animations = element.getAnimations({subtree: true})
                .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations));
            await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
        });
    };
    const clearSelection = async() => {
        const checked = root.locator('.local-groupimport-easystud-selector:visible').filter({
            has: page.locator('input[data-easystud-selector-input]:checked'),
        });
        while (await checked.count()) await checked.first().click();
    };
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            for (const kind of ['group', 'grouping']) {
                const responsive = width <= 1024;
                if (responsive) await root.locator(`[data-easystud-mobile-view="${kind}s"]`).click();
                if (!responsive && kind === 'group') {
                    const populated = root.locator('[data-easystud-grouping-id]:visible').filter({
                        has: page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]'),
                    }).first();
                    const toggle = populated.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
                    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
                }
                const card = root.locator(`[data-easystud-${kind}-id]:visible`).first();
                await card.scrollIntoViewIfNeeded();
                await settle(card);
                if (responsive) {
                    await card.locator(`:scope > .local-groupimport-easystud-${kind}__header > [data-easystud-card-menu]`).click();
                    const action = kind === 'group' ? 'group-paste-emails' : 'grouping-paste-groups';
                    await root.locator(`[data-easystud-context-action="${action}"]:visible`).click();
                } else {
                    const trigger = kind === 'group' ? 'toggle-group-email' : 'toggle-grouping-groups';
                    await card.locator(`[data-easystud-${trigger}]:visible`).first().click();
                }
                const prefix = kind === 'group' ? 'group-email' : 'grouping-groups';
                const panel = card.locator(`[data-easystud-${prefix}-panel]:visible`).first();
                const input = panel.locator(`[data-easystud-${prefix}-box]`);
                await expect(input).toBeFocused();
                const unknown = 'easyedu-qa-unrecognised.invalid';
                await input.fill(`${kind === 'group' ? knownUser : knownGroup}\n${unknown}`);
                const result = panel.locator(`[data-easystud-${prefix}-result]`);
                await expect(result).toHaveAttribute('aria-live', 'polite');
                await expect(result.locator('.local-groupimport-easystud-token--valid')).toHaveText(
                    kind === 'group' ? knownName : knownGroup);
                await expect(result.locator('.local-groupimport-easystud-token--invalid')).toHaveText(unknown);
                await settle(card);
                const record = await result.evaluate(node => {
                    const box = element => {
                        const r = element.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height};
                    };
                    return {host: box(node), rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
                        tokens: [...node.children].map(token => {
                            const s = getComputedStyle(token);
                            return {box: box(token), text: token.textContent, color: s.color,
                                background: s.backgroundColor, border: s.borderTopColor, size: s.fontSize,
                                weight: s.fontWeight, paddingLeft: s.paddingLeft, paddingRight: s.paddingRight};
                        })};
                });
                reports.push({width, kind, ...record});
                for (const token of record.tokens) {
                    expect(parseFloat(token.size)).toBeCloseTo(.78 * record.rem, 2);
                    expect(token.weight).toBe('700');
                    expect(parseFloat(token.paddingLeft)).toBeCloseTo(.54 * record.rem, 2);
                    expect(token.paddingLeft).toBe(token.paddingRight);
                    expect(token.box.x).toBeGreaterThanOrEqual(record.host.x - 1);
                    expect(token.box.x + token.box.w).toBeLessThanOrEqual(record.host.x + record.host.w + 1);
                }
                expect(record.tokens[0].color).toBe('rgb(31, 122, 77)');
                expect(record.tokens[0].background).toBe('rgb(233, 247, 239)');
                expect(record.tokens[1].color).toBe('rgb(161, 43, 43)');
                expect(record.tokens[1].background).toBe('rgb(253, 236, 236)');
                await page.mouse.move(0, 0);
                await panel.screenshot({path: testInfo.outputPath(`inline-feedback-${kind}-${width}.png`)});
                await input.fill('');
                const cancel = panel.locator(kind === 'group' ? '[data-easystud-cancel-group-email]' :
                    '[data-easystud-cancel-grouping-groups]');
                await cancel.click();
                await expect(panel).toBeHidden();
                await clearSelection();
                if (kind === 'grouping') {
                    await card.locator('[data-easystud-container-search-toggle]').first().click();
                    const search = card.locator('[data-easystud-container-search-panel]:visible').first();
                    const searchCancel = search.locator('[data-easystud-container-search-cancel]');
                    await page.mouse.move(0, 0);
                    await expect(searchCancel).toHaveCSS('font-size', '12px');
                    await expect(searchCancel).toHaveCSS('font-weight', '700');
                    await expect(searchCancel).toHaveCSS('color', 'rgb(15, 108, 191)');
                    await expect(searchCancel).toHaveCSS('align-items', 'center');
                    await page.keyboard.press('Tab');
                    await searchCancel.focus();
                    expect(await searchCancel.evaluate(n => n.matches(':focus-visible'))).toBe(true);
                    await expect(searchCancel).toHaveCSS('border-top-color', 'rgb(138, 188, 227)');
                    await search.screenshot({path: testInfo.outputPath(`inline-search-${width}.png`)});
                    await searchCancel.click();
                    await expect(search).toBeHidden();
                }
            }
        }
    } finally {
        fs.writeFileSync(testInfo.outputPath('inline-feedback-geometry.json'), JSON.stringify(reports, null, 2));
    }
});
