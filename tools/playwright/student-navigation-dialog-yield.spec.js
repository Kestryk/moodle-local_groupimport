// SM-49 read-only diagnostic: actual native rows/fonts and Participant mobile
// details entry. Don't follow destinations, open Guide or save/message/move.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Mobile navigation audit records canonical type and dialog yield', async ({page}, testInfo) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], errors = [], blocked = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('navigation-dialog-yield.json'),
        JSON.stringify({records, errors, blocked}, null, 2));
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(name => name === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(name => reads.has(name))) return route.continue();
        blocked.push({scope: 'core', methods}); return route.abort('blockedbyclient');
    });
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()}); return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const opener = page.locator('[data-easyedu-navigation-open]');
    const panel = page.locator('[data-easyedu-navigation-panel]');
    const settle = async locator => locator.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    for (const width of [390, 768, 320]) {
        await page.setViewportSize({width, height: 844});
        await expect(opener).toBeVisible();
        await opener.click();
        await expect(panel).toHaveAttribute('aria-hidden', 'false');
        await expect.poll(() => panel.evaluate(n => getComputedStyle(n).opacity)).toBe('1');
        await settle(panel);
        const type = await panel.evaluate(node => {
            const title = getComputedStyle(node.querySelector('.easyedu-navigation__panel-title'));
            return {family: title.fontFamily, titleSize: title.fontSize, titleWeight: title.fontWeight,
                surface: getComputedStyle(node).backgroundColor,
                rows: [...node.querySelectorAll('.easyedu-navigation__item')]
                    .filter(n => n.getClientRects().length && getComputedStyle(n).display !== 'none')
                    .map(n => {const r = n.getBoundingClientRect(), s = getComputedStyle(n);
                        const label = n.querySelector('.easyedu-navigation__item-label') || n;
                        const l = label.getBoundingClientRect(), ls = getComputedStyle(label);
                        return {text: label.textContent.trim(), family: s.fontFamily, size: s.fontSize, weight: s.fontWeight,
                            labelFamily: ls.fontFamily, labelSize: ls.fontSize, labelWeight: ls.fontWeight,
                            h: r.height, contained: l.left >= r.left && l.right <= r.right && l.top >= r.top && l.bottom <= r.bottom};})};
        });
        records.push({width, state: 'drawer-type', type}); save();
        expect(type.family).toContain('Inter');
        expect(type.titleSize).toBe('16px'); expect(type.titleWeight).toBe('600');
        expect(type.surface).toBe('rgb(255, 255, 255)');
        expect(type.rows.length).toBeGreaterThanOrEqual(3);
        for (const row of type.rows) {
            expect(row.family).toBe(type.family); expect(row.labelFamily).toBe(type.family);
            expect(row.size).toBe('15px'); expect(row.labelSize).toBe(row.size);
            expect(row.weight).toBe('500'); expect(row.labelWeight).toBe(row.weight);
            expect(row.h).toBeGreaterThanOrEqual(44); expect(row.contained).toBe(true);
        }
        await panel.locator('[data-easyedu-navigation-close]').click();
        await expect(opener).toBeFocused();
        await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
        const eye = root.locator('[data-easystud-open-user]:visible').first();
        await eye.click();
        const modal = root.locator('[data-easystud-user-modal]');
        await expect(modal).toBeVisible(); await settle(modal);
        const yieldState = await opener.evaluate(node => {
            const s = getComputedStyle(node), r = node.getBoundingClientRect();
            return {display: s.display, visibility: s.visibility, opacity: s.opacity,
                layer: s.zIndex, width: r.width, height: r.height,
                markers: [...document.querySelectorAll('[aria-modal="true"]:not([hidden]):not([aria-hidden="true"])')]
                    .map(n => ({classes: n.className, visible: !!n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden'}))};
        });
        records.push({width, state: 'participant-native-mobile-entry', yieldState}); save();
        // Diagnostic retains actual visibility. A below-modal stacking order
        // can still paint the launcher through the semitransparent backdrop.
        await modal.locator('[data-easystud-close-user-modal]').click();
        await expect(modal).toBeHidden(); await expect(eye).toBeFocused();
        await expect(opener).toBeVisible();
    }
    expect(errors).toEqual([]); expect(blocked).toEqual([]); save();
});
