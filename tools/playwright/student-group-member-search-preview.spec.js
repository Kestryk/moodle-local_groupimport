const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing members only. Search and Cancel never mutate course data.
test('Group member search reuses the canonical field and filters only its owning card', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [];
    const blocked = [];
    const root = page.locator('#local-groupimport-easystud');
    const save = () => fs.writeFileSync(
        testInfo.outputPath('group-member-search-native.json'),
        JSON.stringify({records, blocked}, null, 2)
    );

    await page.emulateMedia({reducedMotion: 'no-preference'});
    for (const width of [1600, 768, 390]) {
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
        await page.route('**/local/groupimport/**', async route => {
            if (route.request().method() !== 'GET') {
                blocked.push({width, method: route.request().method(), url: route.request().url()});
                await route.abort('blockedbyclient');
            } else {
                await route.continue();
            }
        });

        const mode = width <= 1024 ?
            '[data-easystud-mobile-view="groups"]:visible' :
            '[data-easystud-layout-mode="structure"]:visible';
        await root.locator(mode).first().click();

        const groups = root.locator('[data-easystud-group-id]:visible');
        let group = null;
        for (let index = 0; index < await groups.count(); index++) {
            const candidate = groups.nth(index);
            if (await candidate.locator(':scope > [data-easystud-group-members] [data-easystud-member-id]').count() >= 2) {
                group = candidate;
                break;
            }
        }
        expect(group, 'An existing group with at least two members is required; do not create fixture data').not.toBeNull();

        const membersToggle = group.locator('[data-easystud-group-members-toggle]').first();
        if (await membersToggle.count() && await membersToggle.getAttribute('aria-expanded') !== 'true') {
            await membersToggle.click();
        }
        let searchToggle = group.locator(':scope > .local-groupimport-easystud-group__header ' +
            '> [data-easystud-group-member-search-toggle]:visible').first();
        if (!await searchToggle.count()) {
            const menuToggle = group.locator(':scope > .local-groupimport-easystud-group__header ' +
                '> [data-easystud-group-actions-toggle]:visible').first();
            await expect(menuToggle).toBeVisible();
            await menuToggle.click();
            searchToggle = root.locator('[data-easystud-context-menu] ' +
                '[data-easystud-context-action="group-search-members"]:visible').first();
            await expect(searchToggle.locator('.fa-search')).toHaveCount(1);
        }
        await expect(searchToggle).toBeVisible();
        await searchToggle.click();

        const panel = group.locator(':scope > [data-easystud-group-member-search-panel]');
        await expect(panel).toBeVisible();
        const field = panel.locator('.easyedu-search-field');
        const input = field.locator('[data-easystud-group-member-search]');
        const cancel = panel.locator('[data-easystud-group-member-search-cancel]');
        await expect(field).toHaveCount(1);
        await expect(cancel).toHaveClass(/easyedu-button--secondary/);
        await expect(input).toBeFocused();

        const members = group.locator(':scope > [data-easystud-group-members] [data-easystud-member-id]');
        const target = members.first();
        const targetText = (await target.textContent()).trim();
        const query = targetText.split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length)[0];
        await input.fill(query);
        await expect(target).toBeVisible();
        const visibleAfterMatch = await members.evaluateAll(nodes => nodes.filter(node => !node.hidden).length);
        expect(visibleAfterMatch).toBeGreaterThanOrEqual(1);
        expect(visibleAfterMatch).toBeLessThan(await members.count());

        await input.fill('__no_existing_member__');
        await expect(group.locator('[data-easystud-member-filter-empty]')).toBeVisible();
        const geometry = await panel.evaluate(node => {
            const label = node.querySelector('.easyedu-search-field');
            const inputNode = node.querySelector('[data-easystud-group-member-search]');
            const button = node.querySelector('[data-easystud-group-member-search-cancel]');
            const lr = label.getBoundingClientRect();
            const ir = inputNode.getBoundingClientRect();
            const br = button.getBoundingClientRect();
            const pr = node.getBoundingClientRect();
            return {
                labelHeight: lr.height,
                inputHeight: ir.height,
                cancelHeight: br.height,
                radius: getComputedStyle(label).borderRadius,
                inputRadius: getComputedStyle(inputNode).borderRadius,
                panelHeight: pr.height,
                panelPadding: getComputedStyle(node).paddingTop,
                panelBorder: getComputedStyle(node).borderTopStyle,
                panelRadius: getComputedStyle(node).borderRadius,
                fieldCancelGap: br.left - lr.right,
                buttonFontSize: getComputedStyle(button).fontSize,
                buttonColour: getComputedStyle(button).color,
                hasInventedHeading: !!node.querySelector('h1, h2, h3, h4'),
            };
        });
        expect(Math.abs(geometry.labelHeight - geometry.cancelHeight)).toBeLessThanOrEqual(1);
        expect(geometry.fieldCancelGap).toBeCloseTo(8, 1);
        expect(geometry.hasInventedHeading).toBe(false);

        await cancel.click();
        await expect(panel).toBeHidden();
        expect(await members.evaluateAll(nodes => nodes.filter(node => !node.hidden).length)).toBe(await members.count());
        records.push({width, query, visibleAfterMatch, geometry});
        save();
        await page.unroute('**/local/groupimport/**');
    }
    expect(blocked, 'Search and Cancel must not invoke a business command').toEqual([]);
    save();
});
