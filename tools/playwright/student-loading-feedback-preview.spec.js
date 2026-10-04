const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised, GET-only. Delay real initialization briefly; never fabricate
// a loading class or reset readiness. Retained QA roles are read, never removed.
test('Feedback Skeleton has a running subtle sweep and retained QA role catalogue', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const errors = [], blocked = [], records = [];
    const url = process.env.EASYEDU_MOODLE_URL;
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u => !u.pathname.includes('/login/'));
    }
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() !== 'GET') {
            blocked.push(route.request().method()); await route.abort('blockedbyclient');
        } else { await route.continue(); }
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const timer = setTimeout(release, 6000);
        const hold = async route => { await gate; await route.continue(); };
        await page.route('**/lib/requirejs.php/**', hold);
        const root = page.locator('#local-groupimport-easystud');
        try {
            await page.goto(url, {waitUntil: 'commit'});
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'loading');
            const cue = root.locator('.local-groupimport-easystud__loading-header-title');
            await expect(cue).toBeVisible();
            const proof = await cue.evaluate(node => {
                const style = getComputedStyle(node, '::after');
                const animations = node.getAnimations({subtree: true});
                return {animation: style.animationName, duration: style.animationDuration,
                    background: style.backgroundImage, position: style.backgroundPosition,
                    playStates: animations.map(a => a.playState), policy: node.closest('[data-easyedu-motion-policy]').dataset.easyeduMotionPolicy};
            });
            expect(proof.policy).toBe('enabled');
            expect(proof.animation).toBe('easyedu-skeleton-shimmer');
            expect(proof.playStates).toContain('running');
            expect(proof.background).toContain('0.6');
            await expect.poll(() => cue.evaluate(node => getComputedStyle(node, '::after').backgroundPosition),
                {intervals: [100, 200], timeout: 1000}).not.toBe(proof.position);
            records.push({width, proof});
            const layout = await root.locator('[data-easystud-loading-skeleton]').evaluate(node => {
                const header = node.querySelector('.local-groupimport-easystud__loading-header');
                const regions = [...node.querySelectorAll('.local-groupimport-easystud__loading-search-filter-region')];
                const origin = node.getBoundingClientRect();
                const visibleNodes = [...node.querySelectorAll('[class*="__loading-"]')].map(n => {
                    const r = n.getBoundingClientRect(), s = getComputedStyle(n);
                    return {className: n.className, tag: n.tagName, x: r.x - origin.x, y: r.y - origin.y,
                        w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 && s.display !== 'none',
                        background: s.backgroundColor, border: s.borderTopColor, radius: s.borderRadius};
                }).filter(n => n.visible);
                return {root: {w: origin.width, h: origin.height}, visibleNodes,
                    selectorColumns: getComputedStyle(node.querySelector('.local-groupimport-easystud__loading-view-toggle'))
                        .gridTemplateColumns.split(' ').length,
                    selectorItems: node.querySelectorAll('.local-groupimport-easystud__loading-view-toggle-item').length,
                    headerCues: header.children.length, headerHeight: header.getBoundingClientRect().height, filters: regions.map(n => {
                    const s = getComputedStyle(n), r = n.getBoundingClientRect();
                    return {height: r.height, padding: s.padding, border: s.borderInlineStartWidth,
                        grid: s.gridTemplateColumns, children: n.children.length};
                })};
            });
            expect(layout.headerCues).toBe(3);
            expect(layout.headerHeight).toBeLessThan(100);
            expect(layout.selectorColumns).toBe(layout.selectorItems);
            expect(layout.filters).toHaveLength(2);
            for (const filter of layout.filters) { expect(filter.children).toBe(2); }
            if (width === 1600) {
                expect(layout.filters[0].height).toBeCloseTo(layout.filters[1].height, 1);
                expect(layout.filters[0].padding).toBe(layout.filters[1].padding);
                expect(layout.filters[0].border).toBe(layout.filters[1].border);
            }
            records.at(-1).layout = layout;
            await root.locator('[data-easystud-loading-skeleton]').screenshot({path: testInfo.outputPath(`loading-${width}.png`)});
        } finally {
            clearTimeout(timer); release(); await page.unroute('**/lib/requirejs.php/**', hold);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 20000});
        await expect(root).toHaveAttribute('aria-busy', 'false');
        await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
        const roleOptions = root.locator('select[data-easystud-role-filter] option');
        const roles = await roleOptions.allTextContents();
        records.at(-1).roles = roles;
        expect(roles.filter(role => role.startsWith('QA:'))).toHaveLength(12);
    }
    fs.writeFileSync(testInfo.outputPath('feedback-loading.json'), JSON.stringify({records, errors, blocked}, null, 2));
    expect(errors).toEqual([]); expect(blocked).toEqual([]);
});
