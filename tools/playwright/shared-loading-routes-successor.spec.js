// SM-40 route successor: actual GET initialization, never fabricated readiness.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Shared Skeleton runs and releases on Mass Import and Administration', async ({page}, testInfo) => {
    test.setTimeout(240000);
    const records = [], errors = [], blocked = [];
    const base = process.env.EASYEDU_MOODLE_URL;
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u => !u.pathname.includes('/login/'));
    }
    const guard = async route => {
        if (route.request().method() === 'GET') await route.continue();
        else { blocked.push(route.request().method()); await route.abort('blockedbyclient'); }
    };
    await page.route('**/local/groupimport/**', guard);
    await page.route('**/admin/settings.php*', guard);
    const routes = [
        {name: 'mass', path: '/local/groupimport/index.php?id=5', root: '#local-groupimport-import',
            cue: '.local-groupimport-import__loading-title', header: '.local-groupimport-import__loading-header'},
        {name: 'admin', path: '/admin/settings.php?section=local_groupimport', root: '#page-admin-setting-local_groupimport',
            cue: '.local-groupimport-admin-settings__loading-title', header: '.local-groupimport-admin-settings__loading-header'},
    ];
    try {
        for (const width of [1600, 768, 390]) for (const routeInfo of routes) {
            await page.setViewportSize({width, height: 1100});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            const deadline = setTimeout(release, 8000);
            const hold = async route => { await gate; await route.continue(); };
            await page.route('**/lib/requirejs.php/**', hold);
            const root = page.locator(routeInfo.root);
            const skeleton = root.locator('[data-easystud-loading-skeleton]');
            const record = {width, route: routeInfo.name}; records.push(record);
            try {
                await page.goto(new URL(routeInfo.path, base).toString(), {waitUntil: 'commit'});
                await expect(skeleton).toBeVisible({timeout: 5000});
                await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
                const cue = root.locator(routeInfo.cue);
                const measure = async node => {
                    const s = getComputedStyle(node, '::after');
                    return {animation: s.animationName, duration: s.animationDuration,
                        position: s.backgroundPosition, background: s.backgroundImage,
                        states: node.getAnimations({subtree: true}).map(a => a.playState)};
                };
                record.normal = await cue.evaluate(measure);
                record.layout = await skeleton.evaluate((node, headerSelector) => {
                    const origin = node.getBoundingClientRect(), header = node.querySelector(headerSelector);
                    return {w: origin.width, h: origin.height, headerCues: header.children.length,
                        headerHeight: header.getBoundingClientRect().height,
                        focusable: node.querySelectorAll('button,input,select,textarea,a[href],[tabindex]').length,
                        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                        visibleNodes: [...node.querySelectorAll('[class*="__loading-"]')].map(n => {
                            const r = n.getBoundingClientRect(), s = getComputedStyle(n);
                            return {className: n.className, x: r.x - origin.x, y: r.y - origin.y,
                                w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden',
                                background: s.backgroundColor, border: s.borderTopColor, radius: s.borderRadius};
                        }).filter(n => n.visible)};
                }, routeInfo.header);
                expect(record.normal.animation).toBe('easyedu-skeleton-shimmer');
                expect(record.normal.duration).toBe('3.2s');
                expect(record.normal.states).toContain('running');
                expect(record.normal.background).toContain('0.6');
                await expect.poll(() => cue.evaluate(n => getComputedStyle(n, '::after').backgroundPosition),
                    {intervals: [100, 200], timeout: 1000}).not.toBe(record.normal.position);
                expect(record.layout.focusable).toBe(0);
                expect(record.layout.overflow).toBeLessThanOrEqual(1);
                await page.screenshot({path: testInfo.outputPath(`shared-loading-${routeInfo.name}-${width}.png`)});
                await page.emulateMedia({reducedMotion: 'reduce'});
                record.reduced = await cue.evaluate(measure);
                expect(record.reduced.animation).toBe('none');
                await page.emulateMedia({reducedMotion: 'no-preference'});
            } finally {
                clearTimeout(deadline); release(); await page.unroute('**/lib/requirejs.php/**', hold);
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 20000});
            await expect(root).toHaveAttribute('aria-busy', 'false');
            await expect(skeleton).toBeHidden();
            record.ready = true;
            if (routeInfo.name === 'admin') await expect(root.locator('[data-easyedu-color-picker]')).toHaveCount(7);
            else await expect(root.locator('.easyedu-file-deposit')).toBeVisible();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('shared-loading-routes.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
