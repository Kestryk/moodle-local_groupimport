const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised paint/geometry, no creation/transfer/Send/Save or fixture.
test('Guide G9 invitation responsive reading layout', async({page}, info) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
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
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            await modal.locator('[data-easyedu-guide-nav-item="1"]').click();
            const card = modal.locator('[data-easyedu-guide-slide="1"] .easyedu-guide-guided-card');
            await expect(card).toBeVisible();
            await expect(modal.locator('[data-guide-names]')).toHaveAttribute('aria-busy', 'false');
            await card.scrollIntoViewIfNeeded();
            // Wait for the real reading scroll to settle, not for a hidden or
            // clipped card manufactured by disabling native sticky chrome.
            const measure = () => card.evaluate(node => {
                const rect = element => { const r = element.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; };
                const body = node.querySelector('.easyedu-guide-guided-card__body');
                const start = node.querySelector('[data-easyedu-guide-start-path]');
                return {card: rect(node), body: rect(body), start: rect(start), icon: rect(node.querySelector('.easyedu-guide-guided-card__icon')),
                    textOverflow: [...node.querySelectorAll('li, strong, small, span:not(.fa)')].some(child => child.scrollWidth > child.clientWidth + 1),
                    alignment: getComputedStyle(body).textAlign};
            });
            const geometry = await measure();
            expect(geometry.textOverflow).toBe(false);
            if (width === 390) {
                expect(geometry.icon.y).toBeLessThan(geometry.body.y);
                expect(geometry.start.y).toBeGreaterThanOrEqual(geometry.body.y + geometry.body.h - 1);
                expect(Math.abs(geometry.start.w - geometry.body.w)).toBeLessThan(1);
                expect(geometry.alignment).toBe('center');
            } else {
                expect(Math.abs(geometry.start.y + geometry.start.h / 2 - geometry.body.y - geometry.body.h / 2)).toBeLessThan(2);
            }
            records.push({width, geometry});
            await modal.screenshot({path: info.outputPath(`guide-g9-invitation-${width}.png`)});
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g9-invitation-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
