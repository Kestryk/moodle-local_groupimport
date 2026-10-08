const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised native keyboard successor; no course mutations or fixtures.
test('Guide typing Escape and nested-control keyboard priority', async({page}, info) => {
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
        const calls = route.request().postDataJSON();
        if (calls.every(call => call.methodname === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(calls.map(() => ({error: false, data: {}})))});
        }
        const allowed = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (calls.every(call => allowed.has(call.methodname))) return route.continue();
        blocked.push(calls.map(call => call.methodname)); return route.abort('blockedbyclient');
    });
    try {
        await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            for (const motion of ['no-preference', 'reduce']) {
                await page.emulateMedia({reducedMotion: motion});
                if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                    await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                }
                const opener = page.locator('[data-easyedu-guide-open]:visible').first();
                await opener.press('Enter');
                const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
                await expect(modal).toBeVisible();
                // Actual browser key presses at the live modal boundaries:
                // markers identify existing controls, never alter tabindex.
                const boundaries = await modal.evaluate(node => {
                    const controls = Array.from(node.querySelectorAll([
                        'a[href]', 'button:not([disabled])', 'input:not([disabled])',
                        'select:not([disabled])', 'textarea:not([disabled])',
                        '[tabindex]:not([tabindex="-1"])'
                    ].join(','))).filter(control => {
                        const style = getComputedStyle(control), rect = control.getBoundingClientRect();
                        return !control.closest('[hidden]') && style.display !== 'none' &&
                            !['hidden', 'collapse'].includes(style.visibility) &&
                            control.getClientRects().length > 0 && rect.width > 0 && rect.height > 0;
                    });
                    if (controls.length < 2) throw new Error('Expected real modal focus boundaries');
                    controls[0].setAttribute('data-guide-qa-boundary', 'first');
                    controls.at(-1).setAttribute('data-guide-qa-boundary', 'last');
                    return controls.length;
                });
                const first = modal.locator('[data-guide-qa-boundary="first"]');
                const last = modal.locator('[data-guide-qa-boundary="last"]');
                await last.focus(); await last.press('Tab');
                await expect(first).toBeFocused();
                await first.press('Shift+Tab');
                await expect(last).toBeFocused();
                await modal.locator('[data-guide-qa-boundary]').evaluateAll(nodes =>
                    nodes.forEach(node => node.removeAttribute('data-guide-qa-boundary')));
                const close = modal.locator('[data-easyedu-guide-close]').first();
                await close.focus(); await close.press('End');
                await expect(modal.locator('[data-easyedu-guide-slide="3"]')).toHaveClass(/is-active/);
                await close.press('Home');
                await expect(modal.locator('[data-easyedu-guide-slide="0"]')).toHaveClass(/is-active/);
                await modal.locator('[data-easyedu-guide-nav-item="1"]').click();
                const input = modal.locator('[data-guide-pattern]');
                await input.fill('Equipe #*3');
                await input.press('Home'); await input.press('ArrowRight');
                await expect(modal.locator('[data-easyedu-guide-slide="1"]')).toHaveClass(/is-active/);
                await input.press('Enter');
                await expect(modal.locator('[data-guide-names]')).toHaveAttribute('aria-busy', 'false');
                await expect(modal.locator('[data-guide-name]')).toHaveCount(3);
                await input.evaluate(node => node.addEventListener('keydown', event => {
                    if (event.key === 'Escape') event.preventDefault();
                }, {once: true}));
                await input.press('Escape');
                await expect(modal).toBeVisible();
                await expect(input).toBeFocused();
                await input.press('Escape');
                await expect(modal).toBeHidden();
                // Use actual surviving opener, not a :visible locator invalidated
                // by a compact drawer closing as Guide opens.
                await expect(page.locator('[data-easyedu-guide-open]:focus')).toHaveCount(1);
                records.push({width, motion, typingEscapeCloses: true, nestedEscapePriority: true,
                    enterPreviewsLocally: true, openerFocusRestored: true, focusableBoundaries: boundaries,
                    tabWrapsForward: true, tabWrapsBackward: true, homeEndSlideNavigation: true});
            }
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-keyboard-result.json'), JSON.stringify({records, errors, blocked,
            fixtureRequested: false, businessTransactionConfirmed: false}, null, 2));
    }
});
