// local-supervised SM-55: existing native Administration controls, no settings Save.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Native Administration choices close without terminal layout jump', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = new URL('/admin/settings.php?section=local_groupimport', process.env.EASYEDU_MOODLE_URL).toString();
    const guard = async route => {
        if (route.request().method() === 'GET') { await route.continue(); }
        else { blocked.push(route.request().method()); await route.abort('blockedbyclient'); }
    };
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height:1100});
            await page.emulateMedia({reducedMotion:'no-preference'});
            await page.unroute('**/admin/settings.php*', guard);
            await page.goto(url);
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click();
                await page.waitForURL(u => !u.pathname.includes('/login/'));
                await page.goto(url);
            }
            await page.route('**/admin/settings.php*', guard);
            await expect(page.locator('body')).not.toHaveClass(/local-groupimport-admin-settings-page--loading/,
                {timeout:60000});
            await page.evaluate(() => document.fonts.ready);
            const choices = page.locator('.easyedu-searchable-choice--framed:visible');
            expect(await choices.count()).toBeGreaterThanOrEqual(5);
            for (let index = 0; index < await choices.count(); index++) {
                const host = choices.nth(index), trigger = host.locator('.easyedu-searchable-choice__trigger');
                await trigger.click();
                await host.evaluate(async node => {
                    const p = node.querySelector('.easyedu-searchable-choice__panel');
                    await Promise.all(p.getAnimations().map(a => a.finished.catch(() => {})));
                });
                await host.locator('input[type=search]').press('Escape');
                const geometry = await host.evaluate(async node => {
                    const p = node.querySelector('.easyedu-searchable-choice__panel');
                    const animation = p.getAnimations().find(a => a.effect && a.effect.target === p &&
                        a.effect.getKeyframes().some(k => k.height));
                    if (!animation) { throw Error('Native closing Motion is missing.'); }
                    animation.pause();
                    animation.currentTime = animation.effect.getTiming().duration;
                    const field = node.closest('.form-setting'), help = field?.querySelector('.form-defaultinfo');
                    const before = {bottom:node.getBoundingClientRect().bottom,
                        field:field?.getBoundingClientRect().height,help:help?.getBoundingClientRect().top};
                    const margin = getComputedStyle(p).marginBlockStart;
                    animation.finish();
                    await animation.finished;
                    await new Promise(requestAnimationFrame);
                    const after = {bottom:node.getBoundingClientRect().bottom,
                        field:field?.getBoundingClientRect().height,help:help?.getBoundingClientRect().top};
                    return {before,after,margin,hidden:p.hidden,inert:p.inert,
                        focused:document.activeElement === node.querySelector('.easyedu-searchable-choice__trigger'),
                        inline:p.getAttribute('style'),animations:p.getAnimations().length};
                });
                records.push({width,index,geometry});
                expect(Math.abs(geometry.before.bottom - geometry.after.bottom)).toBeLessThanOrEqual(1);
                if (geometry.before.field !== undefined) {
                    expect(Math.abs(geometry.before.field - geometry.after.field)).toBeLessThanOrEqual(1);
                }
                if (geometry.before.help !== undefined) {
                    expect(Math.abs(geometry.before.help - geometry.after.help)).toBeLessThanOrEqual(1);
                }
                expect(geometry.hidden).toBe(true);
                expect(geometry.inert).toBe(false);
                expect(geometry.focused).toBe(true);
                expect(geometry.inline || '').toBe('');
                expect(geometry.animations).toBe(0);
            }
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('choice-terminal-spacing-native.json'),
            JSON.stringify({records,errors,blocked}, null, 2));
    }
});
