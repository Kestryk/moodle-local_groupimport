const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('K16 dense participant View all opens real deferred details', async({page}, info) => {
    test.setTimeout(600000);
    const base = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL || '');
    if (base.origin !== 'http://localhost' || base.searchParams.get('id') === '5') throw Error('Owned fixture required');
    const rows = [], errors = []; page.on('pageerror', e => errors.push(e.message));
    const save = () => fs.writeFileSync(info.outputPath('participant-deferred.json'), JSON.stringify({rows, errors}, null, 2));
    await page.goto(new URL('/login/index.php', base).href, {waitUntil: 'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
    }
    try {for (const [lang, width] of [['fr', 1600], ['en', 390]]) {
        await page.setViewportSize({width, height: 1000}); base.searchParams.set('lang', lang);
        await page.goto(base.href, {waitUntil: 'domcontentloaded', timeout: 180000});
        const root = page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 180000});
        await root.locator(width < 1024 ? '[data-easystud-mobile-view="participants"]' : '[data-easystud-layout-mode="participants"]:visible').click();
        const density = root.locator('[data-easystud-density-toggle]');
        if (await density.getAttribute('aria-pressed') === 'true') await density.evaluate(n => n.click());
        const card = root.locator('[data-easystud-user]').filter({has: page.locator('.local-groupimport-easystud-user__name', {hasText: 'Member 00'})}).first();
        const all = card.locator('[data-easystud-toggle-tags][data-easystud-open-user]');
        await expect(all).toHaveCount(1);
        let release, requested;
        const gate = new Promise(r => {release = r;}), seen = new Promise(r => {requested = r;});
        const hold = async route => {
            const calls = route.request().postDataJSON() || [];
            if (calls.some(c => c.methodname === 'local_groupimport_get_details')) {requested(); await gate;}
            if (calls.some(c => c.methodname.startsWith('local_groupimport_') && !/_(get|list)_/.test(c.methodname))) throw Error('Business write forbidden');
            await route.continue();
        };
        await page.route('**/lib/ajax/service.php*', hold);
        await all.click();
        const modal = root.locator('[data-easystud-user-modal]');
        try {await seen; await expect(modal).toBeVisible(); await expect(modal.locator('[aria-busy="true"]')).toHaveCount(1);}
        finally {release();}
        await expect(modal.locator('[aria-busy="true"]')).toHaveCount(0, {timeout: 90000});
        const groups = modal.locator('.local-groupimport-easystud-entity__relation--group');
        await expect(groups.locator('li.local-groupimport-easystud-entity__pill')).toHaveCount(37);
        const reveal = groups.locator('[data-easystud-entity-more]'); await reveal.click();
        await expect(groups.locator('li.local-groupimport-easystud-entity__pill:visible')).toHaveCount(37);
        const values = await groups.locator('li.local-groupimport-easystud-entity__pill').evaluateAll(ns => ns.map(n => ({text:n.textContent.trim(), height:n.offsetHeight, clipped:n.scrollWidth > n.clientWidth + .5})));
        values.forEach(v => {expect(v.text).not.toBe(''); expect(v.height).toBe(22); expect(v.clipped).toBe(false);});
        rows.push({lang, width, heldRealRequest:true, ready:true, visibleGroups:values.length, values}); save();
        await modal.locator('[data-easystud-close-user-modal]').first().click(); await expect(modal).toBeHidden();
        await expect(all).toBeFocused(); await page.unroute('**/lib/ajax/service.php*', hold);
    } expect(errors).toEqual([]);} finally {save();}
});
