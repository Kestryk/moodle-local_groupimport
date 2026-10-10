const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: open/Show/Return/Close only; no course or fixture writes.
test('Guide selection explanation matches native mouse and keyboard methods', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil:'commit', timeout:60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil:'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status:200, contentType:'application/json',
                body:JSON.stringify(methods.map(() => ({error:false, data:{}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });

    const root = page.locator('#local-groupimport-easystud');
    const cards = root.locator('[data-selectable-type="participant"]:visible');
    const selected = () => cards.evaluateAll(nodes => nodes.map((node, index) =>
        node.classList.contains('is-selected') ? index : null).filter(index => index !== null));
    try {
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout:60000});
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height:1000});
            const mobile = root.locator('[data-easystud-mobile-view="participants"]:visible');
            if (await mobile.count()) await mobile.click();
            await expect(cards.nth(2)).toBeVisible();
            const title = index => cards.nth(index).locator('.local-groupimport-easystud-user__name');
            await title(0).click(); await expect.poll(selected).toEqual([0]);
            await title(2).click({modifiers:['Control']}); await expect.poll(selected).toEqual([0,2]);
            await title(2).click({modifiers:['Control']}); await expect.poll(selected).toEqual([0]);
            await title(0).click();
            await title(2).click({modifiers:['Shift']}); await expect.poll(selected).toEqual([0,1,2]);
            rows.push({width, controlClickToggle:true, shiftClickRange:true});
            await page.locator('[data-easystud-clear-all-selection]:visible').first().click();
            await expect.poll(selected).toEqual([]);
            const first = cards.first();
            const followingFocused = await first.evaluate(node => {
                const input = node.querySelector(':scope > .local-groupimport-easystud-selector input');
                const following = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
                    .filter(el => el.tabIndex >= 0 && !el.disabled && !el.closest('[hidden],[inert]') &&
                        el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
                    .find(el => !!(input.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
                if (!following) return false;
                following.focus(); return document.activeElement === following;
            });
            expect(followingFocused).toBeTruthy();
            await page.keyboard.press('Shift+Tab');
            const checkbox = first.locator(':scope > .local-groupimport-easystud-selector input');
            await expect(checkbox).toBeFocused();
            await page.keyboard.press('Space');
            await expect(checkbox).toBeChecked(); await expect.poll(selected).toEqual([0]);
            await page.keyboard.press('Space');
            await expect(checkbox).not.toBeChecked(); await expect.poll(selected).toEqual([]);
            rows.push({width, actualLocalTabEntry:true, spaceSelectDeselect:true});
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-selection-methods-result.json'),
            JSON.stringify({rows, errors, blocked, fixtures:false, courseWrites:false}, null, 2));
    }
});

