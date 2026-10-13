// Local-supervised T004/T005 diagnostic, no styles injected or business command.
const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');
test('T004 and T005 preserve Guide drawer lifecycle and centered Import actions', async({page}, info) => {
    test.setTimeout(240000);
    const records = [], blocked = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}})))
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });

    const settle = async node => node.evaluate(async element => {
        await document.fonts.ready;
        await Promise.all(element.getAnimations({subtree: true})
            .filter(animation => Number.isFinite(animation.effect?.getComputedTiming().iterations))
            .map(animation => animation.finished.catch(() => {})));
    });
    const drawerPaint = () => page.locator('.drawer-toggler').evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node), box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return {visibility: style.visibility, display: style.display, zIndex: style.zIndex,
            width: box.width, height: box.height, x: box.x, y: box.y,
            paintHit: !!hit && node.contains(hit), guideOwnsDocument: document.documentElement.classList.contains('easyedu-guide-dialog-open')};
    }));
    try {
        for (const language of ['en', 'fr']) for (const width of [1600, 1280, 390]) {
            const manageUrl = new URL(process.env.EASYEDU_MOODLE_URL);
            manageUrl.searchParams.set('lang', language);
            await page.setViewportSize({width, height: 1000});
            await page.goto(manageUrl.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('html')).toHaveAttribute('lang', language);
            const root = page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            const before = await drawerPaint();
            let launcher = page.locator('[data-easyedu-guide-open]:visible').first();
            if (!await launcher.count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                launcher = page.locator('[data-easyedu-guide-open]:visible').first();
            }
            await launcher.click();
            const guide = page.locator('[data-easyedu-guide-modal]:visible');
            await expect(guide).toBeVisible(); await settle(guide);
            const during = await drawerPaint();
            const guideLayer = await guide.evaluate(node => getComputedStyle(node).zIndex);
            await guide.locator('[data-easyedu-guide-close]').click(); await expect(guide).toBeHidden();
            const after = await drawerPaint();
            records.push({language, width, before, during, after, guideLayer});
            const visibleDrawerCount = before.filter(item => item.display !== 'none' && item.width > 0 && item.height > 0).length;
            expect(visibleDrawerCount).toBeGreaterThan(0);
            during.forEach(item => {expect(item.visibility).toBe('hidden'); expect(item.paintHit).toBe(false);});
            expect(after.length).toBe(before.length);
            after.forEach((item, index) => {
                expect(item.visibility).toBe(before[index].visibility);
                expect(item.display).toBe(before[index].display);
                expect(item.zIndex).toBe(before[index].zIndex);
                expect(item.guideOwnsDocument).toBe(false);
                expect(Math.abs(item.width - before[index].width)).toBeLessThan(1);
                expect(Math.abs(item.height - before[index].height)).toBeLessThan(1);
            });
            const importUrl = new URL(manageUrl.href);
            importUrl.pathname = importUrl.pathname.slice(0, importUrl.pathname.lastIndexOf('/') + 1) + 'index.php';
            await page.goto(importUrl.href, {waitUntil: 'domcontentloaded'});
            const mass = page.locator('#local-groupimport-import');
            await expect(mass).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(mass.locator('[id^="filepicker-button-"]')).toBeVisible(); await settle(mass);
            const actions = await mass.locator('.easyedu-form-actions').evaluate(node => {
                const button = node.querySelector('[type="submit"]'), field = node.querySelector('.felement'),
                    label = node.querySelector('.col-form-label'), note = node.nextElementSibling;
                const rect = item => {const box = item.getBoundingClientRect();
                    return {x: box.x, width: box.width, height: box.height, center: box.x + box.width / 2};};
                return {host: rect(node), button: rect(button), field: rect(field),
                    fieldFlex: getComputedStyle(field).flexBasis, fieldMaxWidth: getComputedStyle(field).maxWidth,
                    label: label ? {textEmpty: !label.textContent.trim(), display: getComputedStyle(label).display, ...rect(label)} : null,
                    note: note ? {classes: note.className, align: getComputedStyle(note).textAlign, ...rect(note)} : null};
            });
            records[records.length - 1].actions = actions;
            records[records.length - 1].buttonOffset = actions.button.center - actions.host.center;
            expect(Math.abs(actions.button.center - actions.host.center)).toBeLessThanOrEqual(1);
            expect(Math.abs(actions.field.width - actions.host.width)).toBeLessThanOrEqual(1);
            expect(actions.label.textEmpty).toBe(true); expect(actions.label.display).toBe('none');
            expect(actions.note.align).toBe('center');
        }
        expect(records).toHaveLength(6); expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-drawer-import-actions-correction-native.json'), JSON.stringify({
            records, errors, blocked, injectedStyles: false, fixtureRequested: false,
            scope: 'Native EN/FR1600/1280/390 Guide drawer yield/restoration and empty Import action centering; no open drawer, import execution or human acceptance.'
        }, null, 2));
    }
});
