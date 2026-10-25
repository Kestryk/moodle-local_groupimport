const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Actual configured paint only. No admin Save, invented custom runtime or paths.
test('Guide header inherits native palette across compact portal', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write');return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json', body: JSON.stringify(methods.map(() => ({error: false, data: {}})))
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods);return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute(
            'data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.setViewportSize({width: 1280, height: 1000});
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal = page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toHaveCount(1);
        const root = page.locator('[data-easyedu-guide-root]');
        for (const width of [1280, 768, 390, 1280]) {
            await page.setViewportSize({width, height: 1000});
            await expect(modal.locator('.easyedu-guide-modal__header')).toHaveClass(/easyedu-dialog-header-palette--primary/);
            if (width === 390) await expect(root).toHaveAttribute('data-easyedu-guide-portal-theme', '1');
            const paint = await root.evaluate(node => {
                const header = node.querySelector('.easyedu-guide-modal__header');
                const title = node.querySelector('.easyedu-guide-modal__title-wrap h2');
                const icon = node.querySelector('.easyedu-guide-modal__hero-icon');
                const probe = document.createElement('span');node.appendChild(probe);
                const resolve = (property, value) => {probe.style[property] = value;return getComputedStyle(probe)[property];};
                const result = {header: getComputedStyle(header).backgroundImage,
                    expectedHeader: resolve('backgroundImage', 'var(--easyedu-dialog-palette-primary-header, var(--easyedu-modal-header-bg))'),
                    title: getComputedStyle(title).color, expectedTitle: resolve('color', 'var(--easyedu-card-identity-title-color)'),
                    icon: getComputedStyle(icon).color, expectedIcon: resolve('color', 'var(--easyedu-primary)'),
                    titleSize: getComputedStyle(title).fontSize,
                    portal: node.getAttribute('data-easyedu-guide-portal-theme')};
                probe.remove();return result;
            });
            rows.push({width, paint});
            expect(paint.header).toBe(paint.expectedHeader);
            expect(paint.title).toBe(paint.expectedTitle);
            expect(paint.icon).toBe(paint.expectedIcon);
            expect(paint.titleSize).toBe('16px');
        }
        await modal.locator('[data-easyedu-guide-close]').first().click();
        await expect(modal).toHaveCount(0);
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-header-palette-result.json'), JSON.stringify({
            rows, errors, blocked, settingsWrites: false, businessWrites: false,
            customPalettePersistence: false, humanAccepted: false
        }, null, 2));
    }
});
