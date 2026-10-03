const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised. Only the separately leased CLI fixture may write data.
test('Many role filters stay searchable and contained at every width', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const url = process.env.EASYEDU_EASYSTUD_MANAGER_URL;
    expect(url, 'Only the supervised fixture may supply the manager URL').toBeTruthy();
    const root = page.locator('#local-groupimport-easystud');
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() !== 'GET') {
            blocked.push(route.request().method()); await route.abort('blockedbyclient');
        } else { await route.continue(); }
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        await page.goto(url);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(u => !u.pathname.includes('/login/'));
            await page.goto(url);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        if (width > 1024) { await root.locator('[data-easystud-layout-mode="participants"]:visible').click(); }
        else { await root.locator('[data-easystud-mobile-view="participants"]:visible').click(); }
        const toggle = root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first();
        await toggle.click();
        const panel = root.locator('[data-easystud-advanced-filters="participants"]');
        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
        const select = root.locator('[data-easystud-role-filter]');
        const options = await select.evaluate(n => [...n.options].filter(o => o.textContent.startsWith('QA: '))
            .map(o => ({value: o.value, label: o.textContent})));
        expect(options).toHaveLength(12);
        const host = select.locator('xpath=following-sibling::*[1]');
        const trigger = host.locator('.easyedu-searchable-choice__trigger');
        await expect(root.locator('[data-easystud-role-toggle]')).toBeHidden();
        await expect(host).toBeVisible();
        await trigger.click();
        const search = host.getByRole('searchbox');
        await search.fill('QA:');
        // Search keeps all native options in DOM and hides only nonmatching rows.
        await expect(host.locator('[aria-pressed]:visible')).toHaveCount(12);
        for (const option of options.slice(0, 2)) {
            await search.fill(option.label);
            await host.getByRole('button', {name: option.label, exact: true}).click();
        }
        const selected = options.slice(0, 2).map(o => o.value);
        expect(await select.evaluate(n => [...n.selectedOptions].map(o => o.value))).toEqual(selected);
        await search.fill('__no_role_match__');
        await expect(host.getByRole('status')).toBeVisible();
        expect(await select.evaluate(n => [...n.selectedOptions].map(o => o.value))).toEqual(selected);
        await search.fill('QA:');
        const geometry = await host.evaluate(n => {
            const trigger = n.querySelector('.easyedu-searchable-choice__trigger');
            const r = trigger.getBoundingClientRect(), p = n.querySelector('.easyedu-searchable-choice__panel').getBoundingClientRect();
            const labels = [...n.querySelectorAll('[aria-pressed]')].filter(n => n.getClientRects().length);
            return {font: getComputedStyle(trigger).fontSize, x: r.x, right: r.right, h: r.height,
                panel: {x: p.x, right: p.right}, viewport: innerWidth,
                containedLabels: labels.every(n => {const a = n.getBoundingClientRect(); return a.x >= p.x && a.right <= p.right;})};
        });
        expect(geometry.font).toBe('14px');
        expect(geometry.h).toBeGreaterThanOrEqual(width <= 768 ? 44 : 38);
        expect(geometry.x).toBeGreaterThanOrEqual(0); expect(geometry.right).toBeLessThanOrEqual(width);
        expect(geometry.panel.x).toBeGreaterThanOrEqual(0); expect(geometry.panel.right).toBeLessThanOrEqual(width);
        expect(geometry.containedLabels).toBe(true);
        await host.screenshot({path: testInfo.outputPath(`many-roles-${width}.png`)});
        await search.press('Escape'); await expect(trigger).toBeFocused();
        const users = root.locator('[data-easystud-user]');
        expect(await users.count(), 'Native participant predicate must not be vacuous').toBeGreaterThan(0);
        const parity = await users.evaluateAll((nodes, values) => nodes.every(n => {
            const matches = values.some(v => (n.getAttribute('data-role-text') || '').split('|').includes(v));
            return n.hasAttribute('data-easystud-filter-hidden') === !matches;
        }), selected);
        expect(parity, 'Original native OR role predicate remains authoritative').toBe(true);
        await root.locator('[data-easystud-reset-filters]:visible').first().click();
        expect(await select.evaluate(n => n.selectedOptions.length)).toBe(0);
        await expect(trigger).toContainText('Any');
        records.push({width, optionCount: options.length, geometry, selectionsPreserved: true, rolePredicate: true, reset: true});
    }
    expect(errors).toEqual([]); expect(blocked).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('many-roles-native.json'), JSON.stringify({records, errors, blocked}, null, 2));
});
