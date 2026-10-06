const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised SM55 successor: native Search/select/clear/close only.
// No Move, Send, settings Save, fixture or Guide action.
test('Framed multiple filters preserve search selection nested closure and reduced Motion', async({page}, info) => {
    test.setTimeout(300000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], errors = [], blocked = [];
    const root = page.locator('#local-groupimport-easystud');
    const save = () => fs.writeFileSync(info.outputPath('filter-shared-motion-behavior.json'),
        JSON.stringify({records, errors, blocked}, null, 2));
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(name => name === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(name => reads.has(name))) return route.continue();
        blocked.push({scope: 'core', methods});
        return route.abort('blockedbyclient');
    });
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()});
        return route.abort('blockedbyclient');
    });
    const settle = async locator => locator.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(animation => Number.isFinite(animation.effect.getComputedTiming().iterations))
            .map(animation => animation.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const selected = select => select.evaluate(node => [...node.selectedOptions].map(option => option.value));
    const closed = async host => {
        await settle(host);
        const state = await host.evaluate(node => {
            const panel = node.querySelector('.easyedu-searchable-choice__panel');
            return {hidden: panel.hidden, inert: panel.inert, inline: panel.getAttribute('style') || '',
                effects: panel.getAnimations().length, phase: panel.classList.contains('is-easyedu-disclosing')};
        });
        expect(state).toEqual({hidden: true, inert: false, inline: '', effects: 0, phase: false});
        return state;
    };
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.emulateMedia({reducedMotion: 'no-preference'});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click({noWaitAfter: true});
                await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
                await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
            }
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await settle(root);
            const routes = width > 1024 ? [['participants', 'participants'], ['participants', 'participant-groups'],
                ['structure', 'structure-groups']] : [['participants', 'participants'], ['groups', 'structure-groups']];
            for (const [mode, key] of routes) {
                await root.locator(width > 1024 ? `[data-easystud-layout-mode="${mode}"]:visible` :
                    `[data-easystud-mobile-view="${mode}"]:visible`).click();
                await settle(root);
                const more = root.locator(`[data-easystud-advanced-filters-toggle="${key}"]:visible`);
                const parent = root.locator(`[data-easystud-advanced-filters="${key}"]`);
                if (await more.getAttribute('aria-expanded') !== 'true') await more.click();
                await settle(parent);
                const hosts = parent.locator('.easyedu-searchable-choice:visible');
                expect(await hosts.count()).toBeGreaterThan(0);
                for (let index = 0; index < await hosts.count(); index++) {
                    const host = hosts.nth(index), trigger = host.locator('.easyedu-searchable-choice__trigger');
                    const select = host.locator('xpath=preceding-sibling::select[1]');
                    await expect(host).toHaveClass(/easyedu-searchable-choice--framed/);
                    const initial = await selected(select);
                    await trigger.click();
                    await settle(host);
                    const search = host.getByRole('searchbox');
                    await expect(search).toBeFocused();
                    const rows = host.locator('.easyedu-searchable-choice__option:not(:disabled):visible');
                    expect(await rows.count()).toBeGreaterThanOrEqual(2);
                    const labels = [await rows.nth(0).innerText(), await rows.nth(1).innerText()];
                    await rows.nth(0).click();
                    await rows.nth(1).click();
                    expect(await selected(select)).toHaveLength(2);
                    await search.fill(labels[0]);
                    expect(await rows.count()).toBeGreaterThan(0);
                    expect(await rows.count()).toBeLessThan(await select.evaluate(node => node.options.length));
                    expect(await selected(select)).toHaveLength(2);
                    await search.fill('__no_matching_filter_option__');
                    await expect(host.getByRole('status')).toBeVisible();
                    expect(await selected(select)).toHaveLength(2);
                    await host.locator('.easyedu-searchable-choice__clear').click();
                    expect(await selected(select)).toEqual(initial);
                    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
                    await expect(search).toBeFocused();
                    await search.press('Escape');
                    await closed(host);
                    await expect(trigger).toBeFocused();
                    records.push({width, key, index, searchPreservesSelection: true, clearOpenAndFocused: true});
                    save();
                }
                const host = hosts.first(), trigger = host.locator('.easyedu-searchable-choice__trigger');
                for (let iteration = 0; iteration < 3; iteration++) {
                    await trigger.click();
                    await settle(host);
                    await more.click();
                    await expect(more).toHaveAttribute('aria-expanded', 'false');
                    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
                    await closed(host);
                    await settle(parent);
                    expect(await parent.evaluate(node => node.inert)).toBe(true);
                    await more.click();
                    await expect(more).toHaveAttribute('aria-expanded', 'true');
                    await settle(parent);
                    records.push({width, key, iteration, nestedClosedInOneClick: true, nextClickReopens: true});
                }
                await page.emulateMedia({reducedMotion: 'reduce'});
                await trigger.click();
                await expect(trigger).toHaveAttribute('aria-expanded', 'true');
                await expect(host.getByRole('searchbox')).toBeFocused();
                expect(await host.evaluate(node => node.getAnimations({subtree: true})
                    .filter(animation => animation.effect.getKeyframes().some(frame => frame.height)).length)).toBe(0);
                await host.getByRole('searchbox').press('Escape');
                await closed(host);
                await expect(trigger).toBeFocused();
                records.push({width, key, reducedChoiceStatic: true});
                await page.emulateMedia({reducedMotion: 'no-preference'});
                await more.click();
                await expect(more).toHaveAttribute('aria-expanded', 'false');
                await settle(parent);
                save();
            }
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally { save(); }
});
