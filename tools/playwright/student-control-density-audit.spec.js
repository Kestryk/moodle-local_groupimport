const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// SM-66/67/68/71 local-supervised diagnostic: actual native controls only.
// Open/close More Filters and toggle/Reset client filters; no selections,
// fixtures, Save or product POST. Exclude CSS-clipped/opacity-hidden columns.
test('Student control density audit records native Reset counts and header badges', async({page}, info) => {
    test.setTimeout(180000);
    const records = [], blocked = [], errors = [];
    const save = () => fs.writeFileSync(info.outputPath('control-density-audit.json'),
        JSON.stringify({records, blocked, errors}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 1600, height: 1100});
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
        blocked.push({scope: 'plugin', method: route.request().method()});
        return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(method => method === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(method => reads.has(method))) return route.continue();
        blocked.push({scope: 'core', methods});
        return route.abort('blockedbyclient');
    });
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const settle = async() => page.evaluate(async() => {
        await document.fonts.ready;
        for (let pass = 0; pass < 3; pass++) {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await Promise.all(document.getAnimations().filter(animation =>
                Number.isFinite(animation.effect.getComputedTiming().endTime))
                .map(animation => animation.finished.catch(() => {})));
        }
    });
    const measure = locator => locator.evaluateAll(nodes => nodes.filter(node => {
        const box = node.getBoundingClientRect();
        if (!box.width || !box.height) return false;
        for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
            const css = getComputedStyle(ancestor);
            if (ancestor.hidden || ancestor.inert || ancestor.getAttribute('aria-hidden') === 'true' ||
                css.display === 'none' || css.visibility === 'hidden' || Number(css.opacity) <= .01) return false;
            if ((css.overflowY === 'hidden' || css.overflowY === 'clip') &&
                ancestor.getBoundingClientRect().height === 0) return false;
        }
        return true;
    }).map(node => {
        const css = getComputedStyle(node), box = node.getBoundingClientRect();
        return {width: box.width, height: box.height, x: box.x, y: box.y,
            font: css.fontSize, fontFamily: css.fontFamily, weight: css.fontWeight,
            line: css.lineHeight, padding: css.padding, radius: css.borderRadius,
            minimum: css.minHeight, ink: css.color, background: css.backgroundColor,
            classes: node.className, text: node.textContent.trim()};
    }));
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            const modes = width > 1024 ? ['participants', 'structure'] : ['participants', 'groups', 'groupings'];
            for (const mode of modes) {
                const switcher = root.locator(width > 1024 ? `[data-easystud-layout-mode="${mode}"]:visible` :
                    `[data-easystud-mobile-view="${mode}"]:visible`);
                await switcher.click();
                await expect(switcher).toHaveAttribute('aria-pressed', 'true');
                if (width <= 1024) await expect(root).toHaveAttribute('data-easystud-mobile-view-active', mode);
                await settle();
                const bars = root.locator('[data-easystud-pagination="top"]:visible');
                const pagination = [];
                for (let index = 0; index < await bars.count(); index++) {
                    const bar = bars.nth(index);
                    pagination.push({select: await measure(bar.locator('[data-easystud-select-results]:visible')),
                        count: await measure(bar.locator('[data-easystud-list-count]:visible'))});
                }
                const headerBadges = [];
                for (const [family, selector] of [
                    ['group', '.local-groupimport-easystud-group__header:visible .badge:visible'],
                    ['grouping', '.local-groupimport-easystud-grouping__header:visible .badge:visible'],
                    ['tree', '.local-groupimport-easystud-tree__toggle:visible .badge:visible'],
                    ['panel', '.local-groupimport-easystud__panel-badge:visible'],
                ]) {
                    const badges = root.locator(selector).filter({hasText: /\d/});
                    for (let index = 0; index < Math.min(4, await badges.count()); index++) {
                        headerBadges.push({family, ...(await measure(badges.nth(index)))[0]});
                    }
                }
                // Bound the diagnostic; do not export full course/user DOM.
                const filters = [];
                const catalogues = width > 1024 ?
                    [[mode === 'participants' ? 'participant-groups' : 'structure-groups', mode]] :
                    mode === 'groups' ? [['structure-groups', 'structure']] : [];
                for (const [key, catalogue] of catalogues) {
                    const more = root.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
                    const panel = root.locator(`[data-easystud-advanced-filters="${key}"]`);
                    const wasOpen = await more.getAttribute('aria-expanded') === 'true';
                    const toggle = panel.locator(`[data-easystud-catalog-show-ungrouped="${catalogue}"]`);
                    const reset = panel.locator(`[data-easystud-reset-catalog-filters="${catalogue}"]`);
                    try {
                        if (!wasOpen) await more.click();
                        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                        await toggle.locator('..').click();
                        await expect(toggle).toBeChecked();
                        await expect(reset).toBeVisible();
                        await settle();
                        const search = root.locator(catalogue === 'structure' ?
                            '[data-easystud-structure-group-search]:visible' :
                            '[data-easystud-catalog-search="participants"]:visible').locator('..');
                        filters.push({catalogue,
                            search: await measure(search), reset: await measure(reset),
                            toggle: await measure(toggle.locator('..'))});
                    } finally {
                        if (await toggle.isChecked()) await reset.click();
                        await expect(toggle).not.toBeChecked();
                        if (!wasOpen && await more.getAttribute('aria-expanded') === 'true') await more.click();
                        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
                    }
                }
                records.push({width, mode, pagination, headerBadges, filters}); save();
            }
        }
        expect(records).toHaveLength(8);
        expect(blocked).toEqual([]);
        expect(errors).toEqual([]);
    } finally { save(); }
});
