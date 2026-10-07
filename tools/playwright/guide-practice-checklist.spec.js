const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised G7 successor. No creation, transfer, message or settings Save.
// Preserve the failed G7 source/oracle and G6 scenarios as historical evidence.
// 0.4.137 corrects the reading inset; record geometry before the strict assertion.
test('Guide G7 Practice checklist native preview', async({page}, info) => {
    test.setTimeout(120000);
    const errors = [], blocked = [], records = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const allowed = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => allowed.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const guide = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
    const modal = guide.locator('[data-easyedu-guide-modal]');
    const open = async() => {
        if (await page.locator('[data-easyedu-guide-open]:visible').count()) {
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        } else {
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        }
        await expect(modal).toBeVisible();
    };
    try {
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            await open();
            await modal.locator('[data-easyedu-guide-nav-item="1"]').click();
            await modal.locator('[data-easyedu-guide-slide="1"] [data-easyedu-guide-start-path]').click();
            const checklist = guide.locator('[data-easyedu-guide-checklist]');
            await expect(checklist).toBeVisible();
            await expect(checklist).toHaveAttribute('data-easyedu-guide-path', 'practice-membership');
            const restore = checklist.locator('[data-easyedu-guide-checklist-restore]');
            if (await restore.isVisible()) await restore.click();
            const items = checklist.locator('[data-easyedu-guide-step-id]');
            await expect(items).toHaveCount(6);
            const rows = await items.evaluateAll(nodes => nodes.map(node => {
                const box = node.getBoundingClientRect();
                const copy = node.querySelector('span:last-child').getBoundingClientRect();
                return {height: box.height, copyHeight: copy.height,
                    contained: copy.top >= box.top && copy.bottom <= box.bottom + 1,
                    overlay: getComputedStyle(node, '::before').display,
                    title: node.querySelector('strong').textContent};
            }));
            const scroll = await checklist.locator('[data-easyedu-guide-checklist-items]').evaluate(node => ({
                client: node.clientHeight, content: node.scrollHeight
            }));
            records.push({width, rows, scroll});
            expect(rows.every(row => row.contained)).toBe(true);
            expect(rows.slice(1).every(row => row.overlay === 'none')).toBe(true);
            expect(scroll.content).toBeGreaterThan(scroll.client);
            await checklist.screenshot({path: info.outputPath(`practice-checklist-${width}.png`)});
            const minimize = checklist.locator('[data-easyedu-guide-checklist-minimize]');
            expect(await minimize.evaluate(node => node.getBoundingClientRect().height)).toBeCloseTo(30.4, 0);
            await minimize.click();
            await expect(restore).toBeVisible();
            await expect(checklist.locator('[data-easyedu-guide-checklist-title]')).toBeVisible();
            await checklist.screenshot({path: info.outputPath(`practice-reduced-${width}.png`)});
            await restore.click();
            await expect(checklist.locator('[data-easyedu-guide-checklist-items]')).toBeVisible();
            await checklist.locator('[data-easyedu-guide-checklist-close]').click();
            await expect(checklist).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-practice-native-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
