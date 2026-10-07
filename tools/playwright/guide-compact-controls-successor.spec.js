const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised G7 successor. No creation, transfer, message or settings Save.
// Preserve the failed G7 source/oracle and G6 scenarios as historical evidence.
// 0.4.137 corrects the reading inset; record geometry before the strict assertion.
test('Guide G7 compact controls successor native preview', async({page}, info) => {
    test.setTimeout(240000);
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
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const guide = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
    const modal = guide.locator('[data-easyedu-guide-modal]');
    const open = async() => {
        if (await page.locator('[data-easyedu-guide-open]:visible').count()) {
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        } else {
            await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
        }
        await expect(modal).toBeVisible();
    };
    try {
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            await open();
            await modal.locator('[data-easyedu-guide-nav-item="2"]').click();
            const scene = modal.locator('[data-easyedu-guide-slide="2"] [data-easyedu-guide-scene]');
            if (width === 1280) {
                await expect(scene.locator('[data-guide-ghost]')).toBeVisible({timeout: 20000});
                await page.waitForFunction(() => {
                    const ghost = document.querySelector('[data-guide-ghost]');
                    return ghost && document.getAnimations().some(a => a.effect?.target === ghost &&
                        a.playState === 'running' && a.effect.getTiming().duration === 1200);
                });
                // Sample the actual two retained animations at the same elapsed
                // time, then restore normal playback. This is synchronization
                // proof, not a substitute for visual/native fluency review.
                const samples = await scene.evaluate(async node => {
                    const ghost = node.querySelector('[data-guide-ghost]'), cursor = node.querySelector('[data-guide-cursor]');
                    const pair = [ghost, cursor].map(target => document.getAnimations().find(a =>
                        a.effect?.target === target && a.playState === 'running' && a.effect.getTiming().duration === 1200));
                    if (pair.some(a => !a)) throw new Error('Actual drag animation pair not running');
                    pair.forEach(a => a.pause());
                    const samples = [];
                    for (const fraction of [0.08, 0.5, 0.96]) {
                        pair.forEach(a => { a.currentTime = 1200 * fraction; });
                        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                        const a = ghost.getBoundingClientRect(), b = cursor.getBoundingClientRect();
                        const destination = node.querySelector('[data-guide-destination]');
                        const c = destination.getBoundingClientRect();
                        const overlaps = a.right >= c.left && a.left <= c.right && a.bottom >= c.top && a.top <= c.bottom;
                        samples.push({fraction, dx: b.left - a.left, dy: b.top - a.top, overlaps,
                            dashed: destination.classList.contains('is-guide-drop-target'),
                            borderStyle: getComputedStyle(destination, '::after').borderTopStyle});
                    }
                    pair.forEach(a => { a.currentTime = 200; a.play(); });
                    return samples;
                });
                for (const sample of samples) {
                    expect(sample.dx).toBeCloseTo(48, 0);
                    expect(sample.dy).toBeCloseTo(28, 0);
                    expect(sample.dashed).toBe(sample.overlaps);
                    if (sample.dashed) expect(sample.borderStyle).toBe('dashed');
                }
                records.push({width, samples});
            }
            await expect(scene).toHaveAttribute('data-guide-scene-finished', 'true', {timeout: 60000});
            await expect(scene.locator('[data-guide-scene-command="add"]')).toHaveAttribute('aria-pressed', 'true');
            await scene.locator('[data-guide-scene-command="move"]').click();
            await expect(scene.locator('[data-guide-scene-command="move"]')).toHaveAttribute('aria-pressed', 'true');
            await expect(scene.locator('[data-guide-scene-command="add"]')).toHaveAttribute('aria-pressed', 'false');
            const paint = await scene.locator('[data-guide-scene-command="move"]').evaluate(node => getComputedStyle(node).backgroundColor);
            expect(paint).not.toBe('rgb(255, 255, 255)');
            await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
            const actions = modal.locator('[data-easyedu-guide-slide="3"] [data-easyedu-guide-scene]');
            await expect(actions).toHaveAttribute('data-guide-phase', 'select', {timeout: 12000});
            await expect(actions.locator('[data-guide-illustrated-checkbox]:checked')).toHaveCount(2);
            await expect(actions).toHaveAttribute('data-guide-phase', 'confirm', {timeout: 20000});
            const reveal = await actions.locator('[data-guide-confirm]').evaluate(node => {
                const box = node.getBoundingClientRect(), body = node.closest('.easyedu-guide-modal__body').getBoundingClientRect();
                return {top: box.top, bottom: box.bottom, bodyTop: body.top, bodyBottom: body.bottom};
            });
            expect(reveal.top).toBeGreaterThanOrEqual(reveal.bodyTop);
            expect(reveal.bottom).toBeLessThanOrEqual(reveal.bodyBottom + 1);
            await expect(actions).toHaveAttribute('data-guide-scene-finished', 'true', {timeout: 60000});
            const banner = modal.locator('[data-easyedu-guide-slide="3"] [data-guide-live]');
            await expect(banner).toHaveAttribute('data-guide-live-state', 'finished');
            const frame = await banner.evaluate(node => {
                const style = getComputedStyle(node), body = node.closest('.easyedu-guide-modal__body');
                body.scrollTop = node.offsetTop + 70;
                return {display: style.display, align: style.alignItems, border: style.borderTopStyle,
                    background: style.backgroundColor, margin: style.marginTop};
            });
            expect(frame.display).toBe('flex'); expect(frame.align).toBe('center');
            expect(frame.border).toBe('solid'); expect(frame.margin).toBe('0px');
            expect(frame.background).not.toBe('rgba(0, 0, 0, 0)');
            const stickyGeometry = await banner.evaluate(node => {
                const body = node.closest('.easyedu-guide-modal__body');
                return {gap: node.getBoundingClientRect().top - body.getBoundingClientRect().top,
                    padding: getComputedStyle(body).paddingTop, inset: getComputedStyle(node).top,
                    scroll: body.scrollTop, max: body.scrollHeight - body.clientHeight};
            });
            records.push({width, frame, stickyGeometry});
            expect(Math.abs(stickyGeometry.gap)).toBeLessThan(1);
            const spacing = await actions.locator('[data-guide-recap] ol').evaluate(node => getComputedStyle(node).rowGap);
            expect(parseFloat(spacing)).toBeGreaterThanOrEqual(12);
            await modal.screenshot({path: info.outputPath(`guide-g7-${width}.png`)});
            records.push({width, paint, reveal, frame, stickyGeometry, spacing});
            await modal.locator('[data-easyedu-guide-nav-item="1"]').click();
            await modal.locator('[data-easyedu-guide-slide="1"] [data-easyedu-guide-start-path]').click();
            await expect(modal).toBeHidden();
            const checklist = guide.locator('[data-easyedu-guide-checklist]');
            await expect(checklist).toBeVisible();
            const minimize = checklist.locator('[data-easyedu-guide-checklist-minimize]');
            records.push({width, path: await checklist.getAttribute('data-easyedu-guide-path'),
                steps: await checklist.locator('[data-easyedu-guide-step-id]').count()});
            await expect(checklist).toHaveAttribute('data-easyedu-guide-path', 'practice-membership');
            await expect(checklist.locator('[data-easyedu-guide-step-id]')).toHaveCount(6);
            const restore = checklist.locator('[data-easyedu-guide-checklist-restore]');
            if (await minimize.isVisible()) await minimize.click();
            await expect(restore).toBeVisible(); await expect(restore).not.toBeEmpty();
            const restoreFont = await restore.locator('span.fa').evaluate(node => getComputedStyle(node).fontFamily);
            records.push({width, restoreFont});
            expect(restoreFont).toMatch(/Font Awesome/i);
            await expect(checklist.locator('[data-easyedu-guide-checklist-title]')).toBeVisible();
            await checklist.screenshot({path: info.outputPath(`checklist-g7-reduced-${width}.png`)});
            await restore.click();
            await expect(checklist.locator('[data-easyedu-guide-checklist-items]')).toBeVisible();
            await expect(restore).toBeHidden();
            const control = await minimize.evaluate(node => ({height: node.getBoundingClientRect().height,
                minHeight: getComputedStyle(node).minHeight, font: getComputedStyle(node).fontSize}));
            records.push({width, control});
            expect(control.height).toBeCloseTo(30.4, 0);
            await checklist.screenshot({path: info.outputPath(`checklist-g7-expanded-${width}.png`)});
            await checklist.locator('[data-easyedu-guide-checklist-close]').click();
            await expect(checklist).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g7-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
