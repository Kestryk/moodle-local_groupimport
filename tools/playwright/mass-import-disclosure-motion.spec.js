const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Mass Import column and chevron move together without jumps', async({page}, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({width: 1440, height: 1000});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const url = process.env.EASYEDU_MOODLE_URL;
    await page.goto(url);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url);
    }
    const root = page.locator('#local-groupimport-import');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await root.locator('.fp-btn-choose').click();
    // Selecting the repository rebuilds its form asynchronously. Wait for that
    // request before attaching a file to avoid filling the previous form.
    await Promise.all([
        page.waitForResponse(response => response.url().includes('/repository/repository_ajax.php?action=list'),
            {timeout: 15000}),
        page.getByText('Upload a file', {exact: true}).click(),
    ]);
    await expect(page.locator('.fp-upload-form input[type="file"]')).toHaveAttribute('name', 'repo_upload_file');
    await page.locator('.fp-upload-form input[type="file"]').setInputFiles({
        name: 'motion-preview.csv', mimeType: 'text/csv',
        buffer: Buffer.from('student;group;grouping\nunknown-animation-probe;Motion preview;Motion preview'),
    });
    await page.locator('.fp-upload-btn').click();
    await expect(root.locator('.filepicker-filename')).toContainText('motion-preview.csv', {timeout: 30000});
    await root.locator('.local-groupimport-import-card--upload [type="submit"]').click();
    await expect(root).toHaveClass(/has-preview/, {timeout: 60000});
    const toggle = root.locator('[data-local-groupimport-upload-toggle]');
    await toggle.scrollIntoViewIfNeeded();
    const samples = [];
    for (let cycle = 0; cycle < 4; cycle++) {
        const frames = await root.evaluate(async(node) => {
            const button = node.querySelector('[data-local-groupimport-upload-toggle]');
            const card = node.querySelector('.local-groupimport-import-card--upload');
            const grid = node.querySelector('.local-groupimport-import__grid');
            const copy = node.querySelector('.easyedu-panel__copy');
            const icon = button.querySelector('.fa');
            const csv = card.querySelector('.easyedu-icon-tile');
            const frames = [];
            const start = performance.now();
            const sample = () => {
                const b = button.getBoundingClientRect();
                const c = card.getBoundingClientRect();
                const identity = csv.getBoundingClientRect();
                frames.push({t: performance.now() - start, width: card.getBoundingClientRect().width,
                    x: b.x - c.x, y: b.y - c.y, csvX: identity.x - c.x,
                    csvY: identity.y - c.y, rotation: getComputedStyle(icon).transform,
                    opacity: Number(getComputedStyle(copy).opacity),
                    collapsed: node.classList.contains('is-upload-collapsed'),
                    animations: grid.getAnimations().map(a => ({property: a.transitionProperty,
                        duration: a.effect.getTiming().duration, progress: a.effect.getComputedTiming().progress})),
                    buttonAnimations: button.getAnimations().map(a => ({property: a.transitionProperty,
                        progress: a.effect.getComputedTiming().progress}))});
            };
            sample(); button.click();
            await new Promise(resolve => {
                const tick = () => { sample(); if (performance.now() - start < 1200) requestAnimationFrame(tick);
                    else resolve(); };
                requestAnimationFrame(tick);
            });
            return frames;
        });
        samples.push(frames);
        fs.writeFileSync(testInfo.outputPath('disclosure-frames.json'), JSON.stringify(samples, null, 2));
        const first = frames[0]; const last = frames.at(-1);
        expect(Math.abs(last.width - first.width)).toBeGreaterThan(150);
        const intermediate = frames.filter(f => f.width > Math.min(first.width, last.width) + 8 &&
            f.width < Math.max(first.width, last.width) - 8);
        expect(intermediate.length, 'Column must genuinely interpolate across several frames').toBeGreaterThan(8);
        // The minimum rail clamps the final part of the interpolated fr track.
        // Check visible movement separately from the full CSS timeline below.
        expect(intermediate.at(-1).t - intermediate[0].t).toBeGreaterThan(200);
        for (let i = 1; i < frames.length; i++) {
            if (frames[i].t - frames[i - 1].t > 45) continue;
            expect(Math.abs(frames[i].y - frames[i - 1].y), 'Chevron must not jump vertically').toBeLessThan(15);
            expect(Math.abs(frames[i].x - frames[i - 1].x), 'Chevron must follow the column smoothly').toBeLessThan(90);
            expect(Math.abs(frames[i].csvX - frames[i - 1].csvX), 'CSV must remain on the starting edge').toBeLessThan(3);
        }
        const moving = frames.filter(f => f.animations.some(a => a.property === 'grid-template-columns'));
        expect(moving.length).toBeGreaterThan(8);
        expect(moving.every(f => f.animations[0].duration === 560)).toBe(true);
        await root.locator('.local-groupimport-import__grid').screenshot({path: testInfo.outputPath(`cycle-${cycle}.png`)});
    }
    await page.emulateMedia({reducedMotion: 'reduce'});
    await toggle.click();
    await expect(toggle).not.toHaveAttribute('data-local-groupimport-upload-toggle-busy', '1');
    expect(await root.locator('.local-groupimport-import__grid').evaluate(n => n.getAnimations().length)).toBe(0);
});
