const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised Guide preview: illustrations and open/cancel only.
async function prepareReadOnlyPage(page, errors, blocked) {
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
        blocked.push('plugin write');
        return route.abort('blockedbyclient');
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
        blocked.push(methods);
        return route.abort('blockedbyclient');
    });
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
}

async function openGuide(page) {
    const launchers = page.locator('[data-easyedu-guide-open]:visible');
    if (await launchers.count()) await launchers.first().click();
    else {
        await page.locator('[data-easyedu-navigation-open]:visible').first().click();
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
    }
}

test('Guide discovery first version native preview', async({page}, info) => {
    test.setTimeout(210000);
    const errors = [], blocked = [], records = [];
    await prepareReadOnlyPage(page, errors, blocked);
    const guide = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
    const modal = guide.locator('[data-easyedu-guide-modal]');
    try {
        for (const width of [1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            // Native launcher projection may live outside the portalled Guide root.
            await openGuide(page);
            await expect(modal).toBeVisible();
            for (let index = 0; index < 4; index++) {
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const slide = modal.locator(`[data-easyedu-guide-slide="${index}"]`);
                await expect(slide).toBeVisible();
                await expect(guide).not.toHaveAttribute('data-easyedu-guide-slide-transition', /.+/);
                const topic = modal.locator(`[data-easyedu-guide-nav-item="${index}"] .easyedu-guide-nav-copy > span`);
                expect(await topic.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
                const bodySize = await slide.locator('.easyedu-guide-slide__content p').evaluate(node => getComputedStyle(node).fontSize);
                expect(bodySize).toBe('14.08px');
                if (index === 1) {
                    const input = await slide.locator('[data-guide-pattern]').boundingBox();
                    const actions = await slide.locator('.easyedu-guide-scene__actions').boundingBox();
                    expect(actions.y).toBeGreaterThanOrEqual(input.y + input.height);
                    await expect(slide.locator('.easyedu-guide-scene__syntax b')).toHaveText(['#', '@', '*3']);
                    await slide.locator('[data-guide-scene-command="preview"]').first().click();
                    await expect(slide.locator('[data-guide-names] > span')).toHaveCount(3);
                    await expect(slide.locator('[data-guide-names] [data-guide-name]')).toHaveCount(3);
                    await expect(slide.locator('[data-guide-names]')).toHaveAttribute('aria-busy', 'false');
                    await expect(slide.locator('.easyedu-guide-guided-card__steps li')).toHaveCount(3);
                    await expect(slide.locator('.easyedu-guide-guided-card__body > small')).not.toBeEmpty();
                    const pattern = slide.locator('[data-guide-pattern]');
                    const validValue = await pattern.inputValue();
                    await pattern.fill('Test #*7');
                    await slide.locator('[data-guide-scene-command="preview"]').first().click();
                    await expect(slide.locator('[data-guide-warning-host] .easyedu-notice--warning')).toBeVisible();
                    await expect(pattern).toHaveAttribute('aria-invalid', 'true');
                    await expect(slide.locator('[data-guide-names] > span')).toHaveCount(0);
                    await modal.screenshot({path: info.outputPath(`guide-warning-${width}.png`)});
                    await pattern.fill(validValue);
                    await slide.locator('[data-guide-scene-command="preview"]').first().click();
                    await expect(slide.locator('[data-guide-warning-host]')).toBeHidden();
                    await expect(slide.locator('[data-guide-names] > span')).toHaveCount(3);
                    await expect(slide.locator('[data-guide-names]')).toHaveAttribute('aria-busy', 'false');
                }
                if (index === 3 && width === 1280) {
                    const scene = slide.locator('[data-easyedu-guide-scene]');
                    await expect(scene).toHaveAttribute('data-guide-phase', 'menu', {timeout: 20000});
                    await expect(slide.locator('[data-guide-menu]')).toBeVisible();
                    const menuPlacement = await slide.evaluate(node => {
                        const cursor = node.querySelector('[data-guide-cursor]');
                        const menu = node.querySelector('[data-guide-menu]');
                        const a = cursor.getBoundingClientRect(), b = menu.getBoundingClientRect();
                        return {dx: b.left - a.left, dy: b.top - a.top,
                            colour: getComputedStyle(cursor).color, halo: getComputedStyle(cursor).filter};
                    });
                    expect(Math.abs(menuPlacement.dx)).toBeLessThan(30);
                    expect(Math.abs(menuPlacement.dy)).toBeLessThan(30);
                    expect(menuPlacement.colour).not.toBe('rgb(15, 108, 191)');
                    expect(menuPlacement.halo).toContain('drop-shadow');
                    records.push({width, menuPlacement});
                    await modal.screenshot({path: info.outputPath('guide-menu-near-cursor.png')});
                    await expect(slide.locator('[data-easyedu-guide-scene]')).toHaveAttribute('data-guide-scene-finished', 'true', {timeout: 70000});
                    await expect(slide.locator('[data-guide-recap]')).toBeVisible();
                    await expect(slide.locator('[data-guide-source-empty]')).toBeVisible();
                    await expect(slide.locator('[data-guide-live]')).toHaveAttribute('data-guide-live-state', 'finished');
                    await expect(slide.locator('.easyedu-guide-scene__person.is-selected')).toHaveCount(0);
                    for (const copy of await slide.locator('[data-guide-recap] li').allTextContents()) {
                        expect(copy).not.toMatch(/^\s*\d+\s*[\u00b7.]/);
                    }
                    const sourceTitle = await slide.locator('.easyedu-guide-scene__source-title').boundingBox();
                    const sourceEmpty = await slide.locator('[data-guide-source-empty]').boundingBox();
                    expect(sourceEmpty.y).toBeGreaterThanOrEqual(sourceTitle.y + sourceTitle.height);
                }
                const geometry = await modal.locator('.easyedu-guide-modal__dialog').evaluate(node => {
                    const r = node.getBoundingClientRect();
                    const buttons = [...node.querySelectorAll('.easyedu-guide-modal__footer-actions button')].map(b => {
                        const box = b.getBoundingClientRect(); return {height: box.height, width: box.width};
                    });
                    const progress = node.querySelector('.easyedu-guide-modal__progress-track').getBoundingClientRect();
                    return {x: r.x, y: r.y, height: r.height, right: r.right, bottom: r.bottom, buttons,
                        progress: {x: progress.x, width: progress.width, height: progress.height}};
                });
                expect(geometry.x).toBeGreaterThanOrEqual(0);
                expect(geometry.right).toBeLessThanOrEqual(width + 1);
                expect(geometry.bottom).toBeLessThanOrEqual(1001);
                expect(geometry.buttons[0].height).toBeCloseTo(geometry.buttons[1].height, 0);
                expect(geometry.progress.width).toBeGreaterThan((geometry.right - geometry.x) * 0.8);
                expect(geometry.progress.height).toBeGreaterThanOrEqual(3.9);
                if (width === 390) {
                    expect(geometry.height).toBeCloseTo(966, 0);
                    expect(geometry.y).toBeCloseTo(17, 0);
                    const title = await slide.locator('h3').boundingBox();
                    const body = await modal.locator('.easyedu-guide-modal__body').boundingBox();
                    expect(title.x).toBeCloseTo(body.x + 16, 0);
                }
                records.push({width, index, geometry});
                await modal.screenshot({path: info.outputPath(`guide-${width}-${index}.png`)});
            }
            await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
            await modal.locator('[data-easyedu-guide-interface-cue-action] button').click();
            await expect(modal).toBeHidden();
            await expect(guide.locator('[data-easyedu-guide-interface-return]')).toBeVisible();
            const returnGeometry = await guide.locator('[data-easyedu-guide-interface-return]').evaluate(node => {
                const text = node.querySelector('.easyedu-guide-interface-return__text').getBoundingClientRect();
                const actions = node.querySelector('.easyedu-guide-interface-return__actions').getBoundingClientRect();
                const action = node.querySelector('[data-easyedu-guide-interface-return-button]');
                return {textRight: text.right, textBottom: text.bottom, actionsLeft: actions.left, actionsTop: actions.top,
                    background: getComputedStyle(action).backgroundColor};
            });
            expect(returnGeometry.textRight <= returnGeometry.actionsLeft + 1 ||
                returnGeometry.textBottom <= returnGeometry.actionsTop + 1).toBe(true);
            expect(returnGeometry.background).not.toBe('rgb(15, 108, 191)');
            await guide.locator('[data-easyedu-guide-interface-return]').screenshot({path: info.outputPath(`guide-return-${width}.png`)});
            records.push({width, returnGeometry});
            await guide.locator('[data-easyedu-guide-interface-return-button]').click();
            await expect(modal).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-discovery-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});

test('Guide discovery lifecycle native preview', async({page}, info) => {
    test.setTimeout(150000);
    const errors = [], blocked = [], records = [];
    await prepareReadOnlyPage(page, errors, blocked);
    const guide = page.locator('[data-easyedu-guide-root].easyedu-guide--discovery');
    const modal = guide.locator('[data-easyedu-guide-modal]');
    try {
        await page.setViewportSize({width: 1280, height: 1000});
        await openGuide(page);
        await expect(modal).toBeVisible();
        for (const key of ['Tab', 'Shift+Tab']) {
            for (let count = 0; count < 18; count++) {
                await page.keyboard.press(key);
                expect(await modal.evaluate(node => node.contains(document.activeElement))).toBe(true);
            }
        }
        records.push('keyboard focus remains inside modal in both directions');
        await modal.locator('[data-easyedu-guide-nav-item="1"]').click();
        await expect(guide).not.toHaveAttribute('data-easyedu-guide-slide-transition', /.+/);
        const invitation = modal.locator('[data-easyedu-guide-slide="1"] .easyedu-guide-guided-card');
        const footerBefore = await modal.locator('.easyedu-guide-modal__footer').boundingBox();
        await invitation.scrollIntoViewIfNeeded();
        await expect(invitation).toBeVisible();
        expect(await modal.locator('.easyedu-guide-modal__body').evaluate(node => node.scrollTop)).toBeGreaterThan(0);
        expect(await modal.locator('.easyedu-guide-modal__footer').boundingBox()).toEqual(footerBefore);
        await modal.screenshot({path: info.outputPath('guide-invitation-scrolled.png')});
        // Open the real existing path, but do not create a group or complete any business step.
        await invitation.locator('[data-easyedu-guide-start-path="first-structure"]').click();
        await expect(modal).toBeHidden();
        await expect(guide.locator('[data-easyedu-guide-checklist-close]')).toBeVisible();
        await guide.locator('[data-easyedu-guide-checklist-close]').click();
        await expect(guide.locator('[data-easyedu-guide-checklist-close]')).not.toBeVisible();
        records.push('full invitation scrolls above fixed footer; native path opens and closes without completion');
        await openGuide(page);
        await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
        await expect(guide).not.toHaveAttribute('data-easyedu-guide-slide-transition', /.+/);
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        const closingState = await guide.evaluate(node => ({
            sceneStopped: node.easyeduGuideSceneStop === null,
            animations: document.getAnimations().filter(animation =>
                animation.effect?.target && node.contains(animation.effect.target)).map(animation => ({
                kind: animation.constructor.name,
                state: animation.playState,
                target: animation.effect.target.className,
                transition: animation.transitionProperty || null,
                name: animation.animationName || null,
            })),
        }));
        records.push({closingState});
        expect(closingState.sceneStopped).toBe(true);
        // Native focus/hover CSS transitions are not owned teaching-scene WAAPI work.
        // Keep their diagnostics; assert the actual illustration controller's cleanup.
        expect(closingState.animations.filter(animation => animation.kind === 'Animation')).toEqual([]);
        records.push('closing an active scene cancels owned animation');
        await page.emulateMedia({reducedMotion: 'reduce'});
        await page.setViewportSize({width: 390, height: 1000});
        await openGuide(page);
        await modal.locator('[data-easyedu-guide-nav-item="3"]').click();
        const actions = modal.locator('[data-easyedu-guide-slide="3"] [data-easyedu-guide-scene]');
        await expect(actions).toHaveAttribute('data-guide-scene-finished', 'true');
        await expect(actions.locator('[data-guide-recap]')).toBeVisible();
        await expect(actions.locator('[data-guide-ghost]')).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        records.push('phone reduced motion retains final membership and recap without mouse gesture');
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-lifecycle-result.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
