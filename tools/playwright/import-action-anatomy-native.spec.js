// Immutable local-supervised T005 anatomy diagnosis, no injected CSS or submit.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('T005 measures actual Moodle outer action group anatomy without writes', async({page}, info) => {
    test.setTimeout(120000); const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 1600, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
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
        const root = page.locator('#local-groupimport-import');
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(root.locator('[id^="filepicker-button-"]')).toBeVisible();
        const record = await root.locator('.easyedu-form-actions').evaluate(host => {
            const read = node => {
                const style = getComputedStyle(node), rect = node.getBoundingClientRect();
                return {tag: node.tagName, classes: node.className, id: node.id,
                    x: rect.x, y: rect.y, w: rect.width, h: rect.height,
                    width: style.width, inlineSize: style.inlineSize, maxWidth: style.maxWidth,
                    padding: style.padding, margin: style.margin, display: style.display,
                    flex: style.flex, boxSizing: style.boxSizing, gap: style.gap,
                    transform: style.transform, grid: style.gridTemplateColumns};
            };
            const ancestors = []; let current = host.querySelector('[type="submit"]');
            while (current && current !== host) {ancestors.push(read(current)); current = current.parentElement;}
            ancestors.push(read(host));
            return {ancestors, items: [...host.querySelectorAll('.fitem,.col-form-label,.felement')].map(read),
                outerActionMarkup: host.outerHTML};
        });
        records.push(record);
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {fs.writeFileSync(info.outputPath('import-action-anatomy.json'), JSON.stringify({records, errors, blocked,
        injectedStyles: false, settingsSaved: false, importSubmitted: false}, null, 2));}
});
