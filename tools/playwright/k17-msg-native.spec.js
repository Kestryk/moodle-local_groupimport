const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Moodle owns recipients, sending, the focus trap and Cancel; this test never sends.
test('K17 MSG native Kit header and single Close FR EN desktop mobile', async({page}, testInfo) => {
    test.setTimeout(480000);
    const records = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    expect(base.origin).toBe('http://localhost:8051');
    try {
        for (const lang of ['fr', 'en']) {
            base.searchParams.set('lang', lang);
            await page.goto(base.href);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(url => !url.pathname.includes('/login/'));
                await page.goto(base.href);
            }
            for (const width of [1600, 390]) {
            await page.setViewportSize({width, height: 1000});
            const root = page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            if (width === 390) await root.locator('[data-easystud-mobile-view="participants"]:visible').click();
            const selection = root.locator('[data-easystud-user]:visible').first().locator('[data-easystud-selector-input]');
            await selection.evaluate(input => input.click());
            const trigger = width === 1600 ? root.locator('[data-easystud-message-selected-participants]:visible').first() :
                root.locator('[data-easystud-mobile-action-trigger="[data-easystud-message-selected-participants]"]:visible').first();
            await trigger.click();
            const modal = page.locator('.local-groupimport-easystud-message-modal.show').last();
            await expect(modal.locator('#bulk-message')).toBeVisible({timeout: 30000});
            await expect(modal).not.toHaveClass(/is-loading/);
            await modal.evaluate(async element => {
                await document.fonts.ready;
                await Promise.all(element.getAnimations({subtree: true})
                    .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
                    .map(a => a.finished.catch(() => undefined)));
            });
            await expect(modal.locator('.easyedu-entity-dialog__eyebrow')).toHaveText('EasyStud');
            await expect(modal.locator('.easyedu-entity-dialog__icon')).toBeVisible();
            const geometry = await modal.evaluate(element => {
                const box = el => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}; };
                const header = element.querySelector('.modal-header'), title = header.querySelector('.modal-title');
                const close = header.querySelector('[data-action="hide"]');
                const pseudo = which => { const s = getComputedStyle(close, which); return {content:s.content,w:s.width,h:s.height,transform:s.transform}; };
                const icon = header.querySelector('.easyedu-entity-dialog__icon');
                const footer = element.querySelector('.modal-footer');
                const buttons = [...footer.querySelectorAll('button')].map(el => ({...box(el),font:getComputedStyle(el).fontSize}));
                const r = box(close), hit = document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);
                return {surface:box(element.querySelector('.modal-content')),header:box(header),title:box(title),
                    titleId:title.id,labelledby:element.getAttribute('aria-labelledby'),titleText:title.textContent,
                    icon:box(icon),close:r,unobscured:close.contains(hit),backgroundImage:getComputedStyle(close).backgroundImage,
                    before:pseudo('::before'),after:pseudo('::after'),field:box(element.querySelector('#bulk-message')),
                    textareaCount:element.querySelectorAll('textarea').length,headingCount:header.querySelectorAll('.easyedu-entity-dialog__heading').length,
                    buttons,footerAlign:getComputedStyle(footer).justifyContent};
            });
            records.push({lang,width,...geometry});
            expect(geometry.headingCount).toBe(1);
            expect(geometry.textareaCount).toBe(1);
            expect(geometry.labelledby).toBe(geometry.titleId);
            expect(geometry.titleText.trim().length).toBeGreaterThan(0);
            expect(geometry.icon.w).toBe(32);
            expect(geometry.icon.h).toBe(32);
            expect(geometry.surface.x).toBeGreaterThanOrEqual(0);
            expect(geometry.surface.right).toBeLessThanOrEqual(width);
            expect(geometry.title.right).toBeLessThanOrEqual(geometry.close.x);
            expect(geometry.unobscured).toBe(true);
            expect(geometry.backgroundImage).toBe('none');
            for (const glyph of [geometry.before,geometry.after]) {
                expect(glyph.content).toBe('""');
                expect(glyph.w).toBe('12px');
                expect(glyph.h).toBe('1.5px');
            }
            expect(geometry.before.transform).not.toBe(geometry.after.transform);
            expect(geometry.footerAlign).toBe('flex-end');
            expect(geometry.buttons).toHaveLength(2);
            expect(Math.abs(geometry.buttons[0].h-geometry.buttons[1].h)).toBeLessThanOrEqual(0.5);
            expect(geometry.field.w).toBeGreaterThan(200);
            expect(geometry.field.h).toBeGreaterThan(150);
            if (lang === 'fr') await modal.locator('.modal-content').screenshot({path:testInfo.outputPath('message-'+width+'.png')});
            // The original native Close must still respond to keyboard activation.
            const close = modal.locator('.modal-header [data-action="hide"]');
            await close.focus();
            await page.keyboard.press('Enter');
            await expect(modal).toBeHidden();
            // Reopen to prove decoration is idempotent and Moodle Cancel still works.
            await trigger.click();
            const reopened = page.locator('.local-groupimport-easystud-message-modal.show').last();
            await expect(reopened.locator('#bulk-message')).toBeVisible();
            await expect(reopened.locator('.easyedu-entity-dialog__heading')).toHaveCount(1);
            await reopened.locator('.modal-footer [data-action="cancel"]').click();
            await expect(reopened).toBeHidden();
            await selection.evaluate(input => input.click());
            }
        }
        expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('k17-msg-measures.json'),JSON.stringify({records,errors},null,2));
    }
});
