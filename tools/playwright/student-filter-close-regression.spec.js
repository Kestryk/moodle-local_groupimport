const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised diagnostic: client-only opening/closing, no business action.
test('More filters preserves collapsed state after nested dropdown dismissal', async({page}, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 1600, height: 1100});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await page.route('**/local/groupimport/**', route => route.request().method() === 'GET' ?
        route.continue() : route.abort('blockedbyclient'));
    await root.locator('[data-easystud-layout-mode="participants"]:visible').click();
    const toggle = root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible');
    const panel = root.locator('[data-easystud-advanced-filters="participants"]');
    await root.evaluate(node => {
        window.filterTrace = [];
        const sample = (kind, target) => window.filterTrace.push({kind, time: performance.now(),
            target: target?.className,
            toggle: node.querySelector('[data-easystud-advanced-filters-toggle="participants"]').getAttribute('aria-expanded'),
            panel: node.querySelector('[data-easystud-advanced-filters="participants"]').outerHTML.slice(0, 650)});
        ['pointerdown', 'pointerup', 'click', 'focusout'].forEach(type =>
            node.addEventListener(type, event => sample(type, event.target), true));
        new MutationObserver(() => sample('state')).observe(
            node.querySelector('[data-easystud-advanced-filters="participants"]'),
            {attributes: true, attributeFilter: ['class', 'inert', 'aria-hidden']});
    });
    try {
        for (const nested of [false, true]) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'true');
            await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
            if (nested) {
                await panel.locator('.easyedu-searchable-choice__trigger').first().click();
            }
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await expect(panel).toHaveClass(/is-collapsed/);
            await expect.poll(() => panel.evaluate(node => node.inert)).toBe(true);
        }
        expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('filter-event-trace.json'),
            JSON.stringify({errors, events: await page.evaluate(() => window.filterTrace)}, null, 2));
    }
});
