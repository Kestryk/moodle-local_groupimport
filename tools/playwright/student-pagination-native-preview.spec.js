const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: existing paginated data, native keyboard navigation only.
// Keep the original global-controls candidate and its failed evidence intact.
test('Student native pagination remains bottom-owned and keyboard reachable', async ({page}, testInfo) => {
    test.setTimeout(150000);
    const records = [], blockedWrites = [], errors = [];
    const root = page.locator('#local-groupimport-easystud');
    const save = () => fs.writeFileSync(testInfo.outputPath('native-pagination.json'),
        JSON.stringify({records, blockedWrites, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 1600, height: 1100});
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
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() !== 'GET') {
            blockedWrites.push({method: route.request().method()});
            save();
            await route.abort('blockedbyclient');
        } else {
            await route.continue();
        }
    });

    const inspect = async (selector, family, width) => {
        const list = root.locator(selector + ':visible');
        await expect(list).toHaveCount(1);
        await expect(list.locator(':scope > [data-easystud-pagination]')).toHaveCount(2);
        const bottom = list.locator(':scope > [data-easystud-pagination="bottom"]');
        await expect(bottom).toBeVisible();
        const label = bottom.locator('[data-easystud-page-label]');
        const pageCount = Number((await label.textContent()).split('/')[1].trim());
        expect(pageCount, 'Use existing paginated data; never create a fixture').toBeGreaterThan(1);
        await expect(list).toHaveAttribute('data-easystud-page', '0');
        for (const edge of ['first', 'last']) {
            if (pageCount <= 2) {
                await expect(bottom.locator('[data-easystud-page-' + edge + ']')).toBeHidden();
            } else {
                await expect(bottom.locator('[data-easystud-page-' + edge + ']')).toBeVisible();
            }
        }
        const previous = bottom.locator('[data-easystud-page-prev]');
        const next = bottom.locator('[data-easystud-page-next]');
        await expect(previous).toBeDisabled();
        await expect(next).toBeEnabled();
        await next.focus();
        await expect(next).toBeFocused();
        await next.press('Enter');
        await expect(list).toHaveAttribute('data-easystud-page', '1');
        await expect(previous).toBeEnabled();
        await previous.focus();
        await expect(previous).toBeFocused();
        await previous.press('Enter');
        await expect(list).toHaveAttribute('data-easystud-page', '0');
        await bottom.scrollIntoViewIfNeeded();
        // Measure after native layout/Motion settles, without hiding sticky UI.
        await bottom.screenshot({path: testInfo.outputPath('pagination-' + family + '-' + width + '.png')});
        const geometry = await bottom.evaluate(node => {
            const rect = node.getBoundingClientRect(), parent = node.parentElement;
            const bounds = parent.getBoundingClientRect(), css = getComputedStyle(parent);
            const controls = [...node.querySelectorAll('button:not([hidden]), [data-easystud-page-label]')]
                .filter(child => child.getBoundingClientRect().width > 0)
                .map(child => {
                    const box = child.getBoundingClientRect();
                    return {left: box.left, right: box.right, top: box.top, bottom: box.bottom};
                });
            return {lastChild: parent.lastElementChild === node, position: getComputedStyle(node).position,
                bottomGap: bounds.bottom - parseFloat(css.paddingBottom) - parseFloat(css.borderBottomWidth) - rect.bottom,
                width: rect.width, parentWidth: bounds.width, left: rect.left, right: rect.right,
                viewportWidth: innerWidth, controls};
        });
        records.push({family, width, pageCount, keyboardNextPrevious: true, geometry});
        save();
        expect(geometry.lastChild).toBe(true);
        expect(['fixed', 'sticky']).not.toContain(geometry.position);
        expect(Math.abs(geometry.bottomGap), 'Bottom belongs to its stretched list, not the last card').toBeLessThanOrEqual(2);
        expect(geometry.width).toBeLessThanOrEqual(geometry.parentWidth + 1);
        expect(geometry.left).toBeGreaterThanOrEqual(-1);
        expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
        for (const control of geometry.controls) {
            expect(control.left).toBeGreaterThanOrEqual(geometry.left - 1);
            expect(control.right).toBeLessThanOrEqual(geometry.right + 1);
        }
    };
    try {
        await root.locator('[data-easystud-layout-mode="both"]:visible').click();
        await inspect('[data-easystud-participant-list]', 'participants', 1600);
        // This flat catalogue belongs to Participants & Groups, not Complete.
        await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
        await inspect('.local-groupimport-easystud-participant-groups__list', 'participant-groups', 1600);
        await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
        await inspect('.local-groupimport-easystud-structure-groups__list', 'catalog-groups', 1600);
        await inspect('.local-groupimport-easystud-tree__groupings', 'groupings', 1600);
        await page.setViewportSize({width: 390, height: 1100});
        for (const [view, selector] of [
            ['participants', '[data-easystud-participant-list]'],
            ['groups', '.local-groupimport-easystud-structure-groups__list'],
        ]) {
            await root.locator('[data-easystud-mobile-view="' + view + '"]').click();
            await expect(root).toHaveAttribute('data-easystud-mobile-view-active', view);
            await inspect(selector, view, 390);
        }
        await root.locator('[data-easystud-mobile-view="groupings"]').click();
        await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groupings');
        await expect(root.locator('[data-easystud-pagination]:visible')).toHaveCount(0);
        records.push({family: 'groupings', width: 390, pagination: 'absent-by-native-source-contract'});
        expect(blockedWrites).toEqual([]);
        expect(errors).toEqual([]);
    } finally {
        save();
    }
});
