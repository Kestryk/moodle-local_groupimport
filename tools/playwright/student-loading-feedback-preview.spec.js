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
            await expect.poll(() => cue.evaluate(node => getComputedStyle(node, '::after').backgroundPosition),
                {intervals: [100, 200], timeout: 1000}).not.toBe(proof.position);
            records.push({width, proof});
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
