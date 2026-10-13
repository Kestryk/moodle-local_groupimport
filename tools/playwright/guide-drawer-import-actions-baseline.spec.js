// Local-supervised T004/T005 diagnostic, no styles injected or business command.
const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');
test('T004 and T005 record Guide native drawer stacking and Import action centering', async({page}, info) => {
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
        for (const width of [1600, 1280, 390]) {
            await page.setViewportSize({width, height: 1000});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
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
            const importUrl = new URL(process.env.EASYEDU_MOODLE_URL);
            importUrl.pathname = importUrl.pathname.replace(/manage\\.php$/, 'index.php');
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
            records.push({width, before, during, after, guideLayer, actions,
                buttonOffset: actions.button.center - actions.host.center});
        }
        expect(records).toHaveLength(3); expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-drawer-import-actions-baseline.json'), JSON.stringify({
            records, errors, blocked, injectedStyles: false, fixtureRequested: false,
            scope: 'Native diagnostic only; no corrected alignment/stacking or human acceptance claim.'
        }, null, 2));
    }
});
