const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: hold only native AMD GETs briefly, release in finally.
// No synthetic loading-state reset, membership POST, fixture or auth state file.
test('Student Skeleton softly appears and keeps native loading lifecycle', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [], blocked = [];
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
    await page.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'none'});
    for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1100});
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const gateDeadline = setTimeout(release, 6000);
        const handler = async route => { await gate; await route.continue(); };
        await page.route('**/lib/requirejs.php/**', handler);
        const root = page.locator('#local-groupimport-easystud');
        try {
            await page.goto(url, {waitUntil: 'commit'});
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'loading', {timeout: 5000});
            const skeleton = root.locator('[data-easystud-loading-skeleton]');
            await expect(skeleton).toBeVisible({timeout: 3000});
            await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
            await expect.poll(() => skeleton.evaluate(n => getComputedStyle(n).animationName),
                {timeout: 3000}).toBe('easyedu-skeleton-appear');
            const proof = await skeleton.evaluate(node => {
                const cue = node.querySelector('.local-groupimport-easystud__loading-surface');
                const frame = node.querySelector('.local-groupimport-easystud__loading-panel');
                const card = node.querySelector('.local-groupimport-easystud__loading-participant-card');
                const pseudo = getComputedStyle(cue, '::after'), outer = getComputedStyle(frame);
                const loading = getComputedStyle(node), cardStyle = getComputedStyle(card);
                const rect = node.getBoundingClientRect();
                return {animation: loading.animationName, appearance: loading.animationDuration,
                    duration: pseudo.animationDuration, cueColor: getComputedStyle(cue).backgroundColor,
                    cueToken: loading.getPropertyValue('--easyedu-loading-surface').trim(),
                    softToken: loading.getPropertyValue('--easyedu-loading-surface-soft').trim(),
                    border: outer.borderTopColor, railWidth: outer.borderTopWidth, frameAnimation: outer.animationName,
                    cardRail: cardStyle.borderInlineStartColor, cardWidth: cardStyle.borderInlineStartWidth,
                    x: rect.x, right: rect.right, viewport: innerWidth,
                    focusable: node.querySelectorAll('button,input,select,textarea,a[href],[tabindex]').length};
            });
            expect(proof.animation).toBe('easyedu-skeleton-appear');
            expect(proof.appearance).toBe('0.32s'); expect(proof.duration).toBe('3.2s');
            // __loading-surface uses the primary cue, not the secondary soft role.
            // Assert both token roles as well as actual paint, never only a token link.
            expect(proof.cueToken.toLowerCase()).toBe('#e8eff5');
            expect(proof.softToken.toLowerCase()).toBe('#f3f6fa');
            expect(proof.cueColor).toBe('rgb(232, 239, 245)');
            expect(proof.frameAnimation).toBe('none'); expect(proof.railWidth).toBe('2px');
            expect(proof.cardWidth).toBe('2px'); expect(proof.cardRail).toBe('rgb(170, 203, 229)');
            expect(proof.x).toBeGreaterThanOrEqual(0); expect(proof.right).toBeLessThanOrEqual(width + 1);
            expect(proof.focusable).toBe(0);
            // Freeze only decorative cue time for a deterministic midpoint capture.
            await skeleton.evaluate(node => node.getAnimations({subtree: true}).forEach(a => {
                if (a.animationName === 'easyedu-skeleton-shimmer') { a.pause(); a.currentTime = 1600; }
                if (a.animationName === 'easyedu-skeleton-appear') { a.finish(); }
            }));
            await skeleton.screenshot({path: testInfo.outputPath(`student-soft-loading-${width}.png`)});
            await root.evaluate(node => {
                window.__softLoadingTransitions = [];
                const observer = new MutationObserver(() => {
                    if (node.classList.contains('is-easystud-loading-skeleton-exiting')) {
                        window.__softLoadingTransitions.push('exiting');
                    }
                    if (node.classList.contains('is-easystud-loading-content-entering')) {
                        window.__softLoadingTransitions.push('entering');
                    }
                    if (node.dataset.easystudLoadingState === 'ready') { observer.disconnect(); }
                });
                observer.observe(node, {attributes: true, attributeFilter: ['class', 'data-easystud-loading-state']});
            });
            records.push({width, proof});
        } finally { clearTimeout(gateDeadline); release(); await page.unroute('**/lib/requirejs.php/**', handler); }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 15000});
        await expect(root).toHaveAttribute('aria-busy', 'false');
        await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
        await expect(root.locator('[data-easystud-real-content]')).toBeVisible();
        expect(await root.locator('[data-easystud-real-content]').evaluate(n => n.inert)).toBe(false);
        const transitions = await page.evaluate(() => window.__softLoadingTransitions);
        expect(transitions).toContain('exiting'); expect(transitions).toContain('entering');
        records.at(-1).transitions = [...new Set(transitions)];
    }
    expect(errors).toEqual([]); expect(blocked).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('student-soft-loading-native.json'), JSON.stringify({records, errors, blocked}, null, 2));
});
