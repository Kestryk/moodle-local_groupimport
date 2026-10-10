const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: actual configured palette, no settings Save or course writes.
test('Guide progression inherits native palette across compact portal', async({page}, info) => {
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
        const root = page.locator('[data-easyedu-guide-root]');
        await page.setViewportSize({width: 1280, height: 1000});
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        const modal = page.locator('[data-easyedu-guide-modal]:visible');
        await expect(modal).toHaveCount(1);
        for (const width of [1280, 768, 390, 1280]) {
            await page.setViewportSize({width, height: 1000});
            for (const index of [0, 5, 11]) {
                await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
                await expect(root).toHaveAttribute('data-easyedu-guide-current-slide', String(index));
                const paint = await root.evaluate(node => {
                    const track = node.querySelector('.easyedu-guide-modal__progress-track');
                    const bar = node.querySelector('[data-easyedu-guide-progress-bar]');
                    const probe = document.createElement('span');node.appendChild(probe);
                    const resolve = value => {probe.style.backgroundColor = value;return getComputedStyle(probe).backgroundColor;};
                    const result = {track: getComputedStyle(track).backgroundColor,
                        border: getComputedStyle(track).borderTopColor, bar: getComputedStyle(bar).backgroundColor,
                        barImage: getComputedStyle(bar).backgroundImage, height: track.getBoundingClientRect().height,
                        expectedTrack: resolve('var(--easyedu-accent-soft)'),
                        expectedBorder: resolve('color-mix(in srgb, var(--easyedu-accent) 22%, var(--easyedu-surface) 78%)'),
                        expectedBar: resolve('var(--easyedu-accent)'),
                        portal: node.getAttribute('data-easyedu-guide-portal-theme')};
                    probe.remove();return result;
                });
                rows.push({width, index, paint});
                expect(paint.track).toBe(paint.expectedTrack);
                expect(paint.border).toBe(paint.expectedBorder);
                expect(paint.bar).toBe(paint.expectedBar);
                expect(paint.barImage).toBe('none');expect(paint.height).toBe(4);
                if (width === 390) expect(paint.portal).toBe('1');
            }
        }
        await modal.locator('[data-easyedu-guide-close]').first().click();
        await expect(modal).toHaveCount(0);
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-progress-palette-result.json'), JSON.stringify({
            rows, errors, blocked, settingsWrites: false, businessWrites: false, customPalettePersistence: false
        }, null, 2));
    }
});
