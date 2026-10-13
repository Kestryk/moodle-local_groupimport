const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: selection/filter state only; no fixture or business POST.
test('Select results targets only the current filtered set after clearing a global selection', async({page}, testInfo) => {
    test.setTimeout(180000);
    const root = page.locator('#local-groupimport-easystud');
    const records = [];
    const blocked = [];
    const errors = [];
    const guard = async route => {
        if (route.request().method() !== 'GET') {
            blocked.push({method: route.request().method(), url: route.request().url()});
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    };
    const save = () => fs.writeFileSync(
        testInfo.outputPath('filtered-select-all-native.json'),
        JSON.stringify({records, blocked, errors}, null, 2)
    );
    page.on('pageerror', error => errors.push(error.message));

    for (const width of [1600, 768, 390]) {
        await page.unroute('**/local/groupimport/**', guard).catch(() => undefined);
        await page.setViewportSize({width, height: 1100});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.route('**/local/groupimport/**', guard);
        await root.locator(width > 1024 ?
            '[data-easystud-layout-mode="participants"]:visible' :
            '[data-easystud-mobile-view="participants"]:visible').click();

        // A renderer may retain past pages in its DOM. Selection assertions are
        // deliberately scoped to the visible first page, which is the only
        // page the on-demand renderer materialises.
        const users = root.locator('[data-easystud-participant-list] > [data-easystud-user]:visible');
        const pageTotal = await users.count();
        expect(pageTotal).toBeGreaterThan(1);
        const selectResults = root.locator(
            '[data-easystud-participant-list] [data-easystud-pagination="top"] ' +
            '[data-easystud-select-results]:visible'
        ).first();
        await expect(selectResults).toBeVisible();

        // Reproduce the prior global state before narrowing the result set.
        await selectResults.click();
        await expect.poll(() => users.evaluateAll(nodes => nodes.filter(node =>
            node.classList.contains('is-selected')).length)).toBe(pageTotal);

        const more = root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first();
        if (await more.getAttribute('aria-expanded') !== 'true') {
            await more.click();
        }
        const nativeGroups = root.locator('[data-easystud-group-filter]').first();
        const options = await nativeGroups.locator('option').evaluateAll(nodes => nodes.map(option => ({
            value: option.value,
            text: option.textContent.trim(),
        })));
        const candidate = await users.evaluateAll((nodes, groupOptions) => groupOptions.map(option => ({
            ...option,
            count: nodes.filter(user => (user.getAttribute('data-group-ids') || '')
                .split(',').includes(option.value)).length,
        })).find(option => option.value && option.count > 0 && option.count < nodes.length) || null, options);
        expect(candidate, 'Existing course needs one non-global group; no fixture is created').not.toBeNull();
        const choice = nativeGroups.locator('xpath=following-sibling::*[1]');
        await choice.locator('.easyedu-searchable-choice__trigger').click();
        await choice.getByRole('searchbox').fill(candidate.text);
        await choice.getByRole('button', {name: candidate.text, exact: true}).click();
        await choice.getByRole('searchbox').press('Escape');
        await expect(choice.locator('.easyedu-searchable-choice__trigger')).toHaveAttribute('aria-expanded', 'false');

        const expectedIds = await users.evaluateAll(nodes => nodes
            .filter(node => !node.hasAttribute('data-easystud-filter-hidden'))
            .map(node => node.getAttribute('data-user-id')));
        expect(expectedIds.length).toBe(candidate.count);
        expect(expectedIds.length).toBeLessThan(pageTotal);
        await expect(selectResults.locator('[data-easystud-select-results-label]')).toContainText(/result/i);

        // Deselect results after filtering must also clear the selected entities
        // hidden from the former unfiltered global selection.
        await expect(selectResults).toHaveAttribute('data-easystud-deselect-results', '1');
        await selectResults.click();
        await expect.poll(() => users.evaluateAll(nodes => nodes.filter(node =>
            node.classList.contains('is-selected')).length)).toBe(0);
        const beforeSelect = {
            action: await selectResults.getAttribute('data-easystud-deselect-results'),
            label: await selectResults.locator('[data-easystud-select-results-label]').innerText(),
        };
        records.push({width, phase: 'before-filtered-select', expected: expectedIds.length, beforeSelect});
        save();
        await expect(selectResults).toHaveAttribute('data-easystud-deselect-results', '0');

        await selectResults.click();
        const selectedIds = await users.evaluateAll(nodes => nodes
            .filter(node => node.classList.contains('is-selected'))
            .map(node => node.getAttribute('data-user-id')));
        expect([...selectedIds].sort()).toEqual([...expectedIds].sort());

        // Deselect and reselect the filtered result set without reviving the
        // former unfiltered selection.
        await selectResults.click();
        await expect.poll(() => users.evaluateAll(nodes => nodes.filter(node =>
            node.classList.contains('is-selected')).length)).toBe(0);
        await selectResults.click();
        const reselectedIds = await users.evaluateAll(nodes => nodes
            .filter(node => node.classList.contains('is-selected'))
            .map(node => node.getAttribute('data-user-id')));
        expect([...reselectedIds].sort()).toEqual([...expectedIds].sort());

        records.push({width, pageTotal, filtered: expectedIds.length, selectedIds: reselectedIds});
        save();
    }

    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
    save();
});
