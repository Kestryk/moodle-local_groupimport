const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised, EasyStud/QA: native selection, message open and cancel only.
// Existing course participants; never Send, create fixtures or alter membership.
test('Student native message footer preserves paired geometry and responsive body', async({page}, testInfo) => {
    test.setTimeout(150000);
    const records = [], errors = [], root = page.locator('#local-groupimport-easystud');
    page.on('pageerror', error => errors.push(error.message));
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            await page.goto(process.env.EASYEDU_MOODLE_URL);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(url => !url.pathname.includes('/login/'));
                await page.goto(process.env.EASYEDU_MOODLE_URL);
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            if (width <= 1024) await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
            const selection = root.locator('[data-easystud-user]:visible').first().locator('[data-easystud-selector-input]');
            await selection.evaluate(input => input.click());
            const trigger = width > 1024 ? root.locator('[data-easystud-message-selected-participants]:visible').first() :
                root.locator('[data-easystud-mobile-action-trigger="[data-easystud-message-selected-participants]"]:visible').first();
            await expect(trigger).toBeEnabled();
            await trigger.click();
            const modal = page.locator('.local-groupimport-easystud-message-modal.show').last();
            await expect(modal.locator('#bulk-message')).toBeVisible({timeout: 30000});
            await expect(modal).not.toHaveClass(/is-loading/);
            await expect(modal).toHaveClass(/easyedu-message-dialog/);
            await modal.evaluate(async element => {
                await document.fonts.ready;
                await Promise.all(element.getAnimations({subtree: true})
                    .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
                    .map(a => a.finished.catch(() => undefined)));
            });
            await expect(modal.locator('.modal-title')).toHaveCSS('font-size', '16px');
            await expect(modal.locator('#bulk-message')).toHaveCSS('resize', 'none');
            const close = modal.locator('.modal-header [data-action="hide"], .modal-header .close, .modal-header .btn-close').first();
            await expect(close).toBeVisible();
            const closeGeometry = await close.evaluate(button => {
                const r = button.getBoundingClientRect(), s = getComputedStyle(button);
                return {width: r.width, height: r.height, display: s.display,
                    align: s.alignItems, justify: s.justifyContent, opacity: s.opacity};
            });
            expect(Math.abs(closeGeometry.width - 30.4)).toBeLessThanOrEqual(1);
            expect(Math.abs(closeGeometry.height - 30.4)).toBeLessThanOrEqual(1);
            expect(['flex', 'inline-flex']).toContain(closeGeometry.display);
            expect(closeGeometry.align).toBe('center');
            expect(closeGeometry.justify).toBe('center');
            expect(closeGeometry.opacity).toBe('1');
            const footer = modal.locator('.modal-footer');
            await expect(footer).toHaveCSS('justify-content', 'flex-end');
            const geometry = await modal.evaluate(element => {
                const surface = element.querySelector('.modal-content'), r = surface.getBoundingClientRect();
                const footer = element.querySelector('.modal-footer'), row = footer.getBoundingClientRect();
                const buttons = [...footer.querySelectorAll(':scope > .easyedu-button, :scope > .easyedu-button--secondary')]
                    .map(button => {
                        const b = button.getBoundingClientRect(), s = getComputedStyle(button);
                        const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
                        return {height: b.height, right: b.right, font: s.fontSize, weight: s.fontWeight,
                            radius: s.borderTopLeftRadius, padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft],
                            unobscured: button.contains(hit), contained: b.x >= r.x && b.right <= r.right};
                    });
                const height = selector => element.querySelector(selector).getBoundingClientRect().height;
                return {x: r.x, right: r.right, buttons, rightDelta: Math.abs(Math.max(...buttons.map(b => b.right)) -
                    row.right + parseFloat(getComputedStyle(footer).paddingRight)),
                anatomy: {content: r.height, field: height('#bulk-message'), header: height('.modal-header'), footer: row.height}};
            });
            records.push({width, close: closeGeometry, ...geometry});
            expect(geometry.x).toBeGreaterThanOrEqual(-1);
            expect(geometry.right).toBeLessThanOrEqual(width + 1);
            expect(geometry.buttons).toHaveLength(2);
            expect(geometry.rightDelta).toBeLessThanOrEqual(1);
            expect(Math.abs(geometry.buttons[0].height - geometry.buttons[1].height)).toBeLessThanOrEqual(1);
            for (const button of geometry.buttons) {
                expect(button.font).toBe('12px');
                expect(button.weight).toBe('700');
                expect(button.height).toBeGreaterThanOrEqual(26);
                expect(button.radius).toBe(geometry.buttons[0].radius);
                expect(button.padding).toEqual(geometry.buttons[0].padding);
                expect(button.unobscured).toBe(true);
                expect(button.contained).toBe(true);
            }
            if (width === 390) {
                const a = geometry.anatomy;
                expect(a.content - a.field - a.header - a.footer).toBeLessThan(40);
            }
            await modal.locator('.modal-content').screenshot({path: testInfo.outputPath('message-footer-' + width + '.png')});
            // core/modal_save_cancel owns the native Cancel action; "hide"
            // belongs to its header close button, not this paired footer.
            await footer.locator('.easyedu-button--secondary[data-action="cancel"]').click();
            await expect(modal).toBeHidden();
            await selection.evaluate(input => input.click());
        }
        expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('message-footer-geometry.json'), JSON.stringify({records, errors}, null, 2));
    }
});
