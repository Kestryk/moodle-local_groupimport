const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised. Transient form editing only, never Create or Save.
test('Student creation and Rename consume Foundation native text fields', async({page}, testInfo) => {
    test.setTimeout(120000);
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
    const records = [];
    const settle = async node => node.evaluate(async element => {
        await document.fonts.ready;
        await Promise.all(element.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
    });
    const measure = async(input, label, width) => {
        await input.evaluate(n => n.scrollIntoView({block: 'center', behavior: 'instant'}));
        await settle(input);
        const record = await input.evaluate(n => {
            const s = getComputedStyle(n), p = getComputedStyle(n, '::placeholder');
            const r = n.getBoundingClientRect(), host = n.parentElement.getBoundingClientRect();
            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return {size: s.fontSize, weight: s.fontWeight, family: s.fontFamily, color: s.color,
                placeholder: p.color, placeholderText: n.getAttribute('placeholder'),
                radius: s.borderTopLeftRadius, border: s.borderTopColor,
                shadow: s.boxShadow, padding: [s.paddingLeft, s.paddingRight],
                height: r.height, width: r.width, unobscured: n.contains(hit),
                contained: r.x >= host.x - 1 && r.right <= host.right + 1,
                focusVisible: n.matches(':focus-visible'), value: n.value};
        });
        records.push({label, viewport: width, ...record});
        expect(record.size).toBe('14px');
        expect(record.weight).toBe('400');
        expect(record.family).toContain('Inter');
        expect(record.color).toBe('rgb(30, 52, 72)');
        // Rename has a native value but no placeholder attribute. Chromium's
        // synthetic pseudo-style is not painted placeholder evidence there.
        if (record.placeholderText !== null) expect(record.placeholder).toBe('rgb(92, 108, 125)');
        if (label.startsWith('create-')) expect(record.placeholderText).toBeTruthy();
        expect(parseFloat(record.radius)).toBeCloseTo(11.52, 2);
        expect(record.padding).toEqual(['13px', '13px']);
        expect(record.contained).toBe(true);
        expect(record.unobscured).toBe(true);
        expect(record.height).toBeGreaterThanOrEqual(38);
        return record;
    };
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            if (width <= 1024) await root.locator('[data-easystud-mobile-view="groups"]').click();
            const create = root.locator('.local-groupimport-easystud-create input[name="groupname"]:visible').first();
            await expect(create).toBeVisible();
            await create.fill('');
            await page.mouse.move(0, 0);
            await create.evaluate(n => n.blur());
            await measure(create, 'create-rest', width);
            await create.hover();
            await expect(create).toHaveCSS('border-top-color', 'rgb(119, 167, 211)');
            await page.keyboard.press('Tab');
            await create.focus();
            const focused = await measure(create, 'create-focus', width);
            expect(focused.focusVisible).toBe(true);
            expect(focused.border).toBe('rgb(138, 188, 227)');
            expect(focused.shadow).not.toBe('none');
            await create.fill('easyedu-qa-transient-name');
            const form = create.locator('..');
            await form.screenshot({path: testInfo.outputPath(`create-${width}.png`)});
            await create.fill('');
            await create.evaluate(n => n.blur());

            // Native groups can all be inside collapsed Groupings. Open the
            // populated grouping normally, as in the inline-feedback scenario;
            // never force hidden card actions or change the fixture.
            if (width > 1024 && await root.locator('[data-easystud-group-id]:visible').count() === 0) {
                const populated = root.locator('[data-easystud-grouping-id]:visible').filter({
                    has: page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]'),
                }).first();
                await expect(populated).toBeVisible({timeout: 15000});
                const toggle = populated.locator(':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
                if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
                await settle(populated);
            }
            const card = root.locator('[data-easystud-group-id]:visible').first();
            await expect(card).toBeVisible({timeout: 15000});
            await card.evaluate(n => n.scrollIntoView({block: 'center', behavior: 'instant'}));
            await settle(card);
            if (width <= 1024) {
                await card.locator(':scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]').click();
                await root.locator('[data-easystud-context-action="group-focus-rename"]:visible').click();
            } else {
                await card.locator('[data-easystud-rename-toggle]:visible').first().click();
            }
            const edit = card.locator('.local-groupimport-easystud-rename__edit:not([hidden])').first();
            const input = edit.locator('input[name="name"]');
            await expect(input).toBeFocused();
            const original = await input.inputValue();
            expect(original).toBeTruthy();
            await page.keyboard.press('Tab');
            await input.focus();
            const renamed = await measure(input, 'rename-focus', width);
            expect(renamed.border).toBe('rgb(138, 188, 227)');
            if (width <= 1024) expect(renamed.height).toBeGreaterThanOrEqual(44);
            await input.fill(`${original} transient`);
            await edit.screenshot({path: testInfo.outputPath(`rename-${width}.png`)});
            await input.fill(original);
            await edit.locator('[data-easystud-rename-cancel]').click();
            await expect(edit).toBeHidden();
            await expect(card.locator('.local-groupimport-easystud-group__name').first()).toHaveText(original);
        }
    } finally {
        // No form submission, fixture, membership or course data mutation.
        fs.writeFileSync(testInfo.outputPath('text-field-geometry.json'), JSON.stringify(records, null, 2));
    }
});
