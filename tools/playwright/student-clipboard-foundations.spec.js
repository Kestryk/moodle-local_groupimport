const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised. Lookup previews and close only; no enrollment, Add, Save,
// message, fixture or other business mutation. Keep this spec immutable in-run.
test('Student Clipboard consumes Foundation multiline and lookup results', async({page}, testInfo) => {
    test.setTimeout(120000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width: 1600, height: 1100});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    const user = root.locator('[data-easystud-user][data-user-email]').first();
    const identifier = await user.getAttribute('data-user-email');
    const name = (await user.locator('.local-groupimport-easystud-user__name').textContent()).trim();
    expect(identifier).toBeTruthy();
    const records = [];
    const settle = async locator => locator.evaluate(async node => {
        await document.fonts.ready;
        const finite = node.getAnimations({subtree: true})
            .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations));
        await Promise.all(finite.map(animation => animation.finished.catch(() => undefined)));
    });
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            const mobile = width <= 1024;
            const navigationTrigger = root.locator('[data-easyedu-navigation-open]:visible').first();
            if (mobile) {
                await navigationTrigger.click();
                await expect(root.locator('[data-easyedu-navigation-panel]')).toHaveAttribute('aria-hidden', 'false');
            }
            const opener = root.locator('[data-easyedu-navigation-action="open-clipboard"]:visible').first();
            await opener.click();
            const modal = root.locator('[data-easystud-clipboard-modal]');
            await expect(modal).toBeVisible();
            await settle(modal);
            // Inspect actual paint, including line fragments near the floating
            // mobile navigation. A textarea-centre hit alone misses this defect.
            const layering = await modal.evaluate(node => {
                const describe = element => {
                    const css = getComputedStyle(element);
                    return {tag: element.tagName, classes: element.className,
                        position: css.position, zIndex: css.zIndex, transform: css.transform,
                        opacity: css.opacity, isolation: css.isolation, contain: css.contain};
                };
                const ancestors = element => {
                    const result = [];
                    for (; element; element = element.parentElement) result.push(describe(element));
                    return result;
                };
                const help = node.querySelector('.local-groupimport-easystud-modal__body > p');
                const walker = document.createTreeWalker(help, NodeFilter.SHOW_TEXT);
                const fragments = [];
                for (let text; (text = walker.nextNode());) {
                    for (let i = 0; i < text.length; i++) {
                        if (!text.textContent[i].trim()) continue;
                        const range = document.createRange();
                        range.setStart(text, i);
                        range.setEnd(text, i + 1);
                        for (const rect of range.getClientRects()) {
                            const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
                            fragments.push({x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                                unobscured: help.contains(hit), hit: hit ? describe(hit) : null});
                        }
                    }
                }
                const trigger = document.querySelector('[data-easyedu-navigation-open]');
                const dialog = node.querySelector('.local-groupimport-easystud-modal__dialog');
                const header = node.querySelector('.local-groupimport-easystud-modal__header');
                return {modalAncestors: ancestors(node), triggerAncestors: ancestors(trigger),
                    helpFragments: fragments, dialogBorder: getComputedStyle(dialog).borderTopColor,
                    headerBackground: getComputedStyle(header).backgroundImage};
            });
            records.push({viewportWidth: width, layering});
            expect(layering.helpFragments.length).toBeGreaterThan(0);
            expect(layering.helpFragments.every(fragment => fragment.unobscured)).toBe(true);
            expect(Number(layering.modalAncestors[0].zIndex)).toBeGreaterThan(Number(layering.triggerAncestors[0].zIndex));
            expect(layering.dialogBorder).toBe('rgb(207, 224, 239)');
            expect(layering.headerBackground).toBe('none');
            await expect(modal.locator('h3')).toHaveCSS('font-size', '16px');
            await expect(modal.locator('h3')).toHaveCSS('color', 'rgb(38, 72, 97)');
            await expect(modal.locator('.easyedu-lookup-dialog__description')).toHaveCSS('font-size', '13px');
            const input = modal.locator('[data-easystud-paste-box]');
            await expect(input).toBeFocused();
            const measure = async state => {
                const value = await input.evaluate(node => {
                    const css = getComputedStyle(node), placeholder = getComputedStyle(node, '::placeholder');
                    const r = node.getBoundingClientRect(), host = node.parentElement.getBoundingClientRect();
                    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
                    const dialog = node.closest('.local-groupimport-easystud-modal__dialog').getBoundingClientRect();
                    return {rows: node.rows, fontSize: css.fontSize, fontWeight: css.fontWeight,
                        fontFamily: css.fontFamily, color: css.color, placeholder: placeholder.color,
                        lineHeight: css.lineHeight, radius: css.borderTopLeftRadius, border: css.borderTopColor,
                        shadow: css.boxShadow, resize: css.resize, padding: [css.paddingTop, css.paddingLeft, css.paddingRight],
                        height: r.height, width: r.width, contained: r.x >= host.x - 1 && r.right <= host.right + 1,
                        unobscured: node.contains(hit), focusVisible: node.matches(':focus-visible'),
                        dialogContained: dialog.x >= -1 && dialog.right <= innerWidth + 1};
                });
                records.push({viewportWidth: width, state, field: value});
                expect(value.rows).toBe(6);
                expect(value.fontSize).toBe('14px');
                expect(value.fontWeight).toBe('400');
                expect(value.fontFamily).toContain('Inter');
                expect(value.color).toBe('rgb(30, 52, 72)');
                expect(value.placeholder).toBe('rgb(92, 108, 125)');
                expect(parseFloat(value.radius)).toBeCloseTo(11.52, 2);
                expect(value.padding).toEqual(['11px', '13px', '13px']);
                expect(value.resize).toBe('vertical');
                expect(value.height).toBeGreaterThanOrEqual(112);
                expect(value.width).toBeGreaterThanOrEqual(128);
                expect(value.contained).toBe(true);
                expect(value.unobscured).toBe(true);
                expect(value.dialogContained).toBe(true);
                return value;
            };
            await input.evaluate(node => node.blur());
            await page.mouse.move(0, 0);
            // Normal-motion field paint transitions after blur. Assert the
            // terminal state before measuring; do not disable its animation.
            await expect(input).toHaveCSS('border-top-color', 'rgb(200, 214, 227)');
            const rest = await measure('rest');
            expect(rest.border).toBe('rgb(200, 214, 227)');
            await input.hover();
            await expect(input).toHaveCSS('border-top-color', 'rgb(119, 167, 211)');
            await page.keyboard.press('Tab');
            await input.focus();
            await expect(input).toHaveCSS('border-top-color', 'rgb(138, 188, 227)');
            const focus = await measure('keyboard-focus-under-pointer');
            expect(focus.focusVisible).toBe(true);
            expect(focus.border).toBe('rgb(138, 188, 227)');
            expect(focus.shadow).not.toBe('none');
            const unknown = 'clipboard-qa-unmatched.invalid';
            await input.fill(`${identifier}\n${unknown}`);
            const results = modal.locator('[data-easystud-paste-results]');
            await expect(results).toHaveAttribute('aria-live', 'polite');
            await expect(results.locator('.local-groupimport-easystud-token--valid')).toHaveText(name);
            await expect(results.locator('.local-groupimport-easystud-token--invalid')).toHaveText(unknown);
            const tokens = await results.evaluate(host => {
                const r = host.getBoundingClientRect();
                return [...host.children].map(node => {
                    const css = getComputedStyle(node), box = node.getBoundingClientRect();
                    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
                    return {color: css.color, size: css.fontSize, weight: css.fontWeight, background: css.backgroundColor,
                        paddingLeft: css.paddingLeft, paddingRight: css.paddingRight, unobscured: node.contains(hit),
                        contained: box.x >= r.x - 1 && box.right <= r.right + 1};
                });
            });
            records.push({viewportWidth: width, tokens});
            expect(tokens).toHaveLength(2);
            for (const token of tokens) {
                expect(parseFloat(token.size)).toBeCloseTo(12.48, 2);
                expect(token.weight).toBe('700');
                expect(parseFloat(token.paddingLeft)).toBeCloseTo(8.64, 2);
                expect(token.paddingLeft).toBe(token.paddingRight);
                expect(token.unobscured).toBe(true);
                expect(token.contained).toBe(true);
            }
            expect(tokens[0].color).toBe('rgb(31, 122, 77)');
            expect(tokens[0].background).toBe('rgb(233, 247, 239)');
            expect(tokens[1].color).toBe('rgb(161, 43, 43)');
            expect(tokens[1].background).toBe('rgb(253, 236, 236)');
            await page.mouse.move(0, 0);
            await modal.locator('.local-groupimport-easystud-modal__dialog')
                .screenshot({path: testInfo.outputPath(`clipboard-${width}.png`)});
            await input.fill('');
            await expect(results).toBeEmpty();
            await modal.locator('[data-easystud-close-clipboard]').click();
            await expect(modal).toBeHidden();
            await expect(mobile ? navigationTrigger : opener).toBeFocused();
        }
    } finally {
        fs.writeFileSync(testInfo.outputPath('clipboard-geometry.json'), JSON.stringify(records, null, 2));
    }
});
