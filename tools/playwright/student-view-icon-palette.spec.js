const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: real served controls, native local view clicks and transient
// palette/state paint probes. No Save, fixture, Send, transfer, import or Guide.
test('View switcher icons consume semantic palette with stable geometry', async({page}, info) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(15000);
    const records = [], errors = [], blocked = [];
    const root = page.locator('#local-groupimport-easystud');
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        let names = [];
        try { names = route.request().postDataJSON().map(c => c.methodname); } catch (_) {}
        if (names.length && names.every(n => n === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(names.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (names.length && names.every(n => reads.has(n))) return route.continue();
        blocked.push({scope: 'core', names}); return route.abort('blockedbyclient');
    });
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push({scope: 'plugin', method: route.request().method()}); return route.abort('blockedbyclient');
    });
    const settle = () => root.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const sample = (button, state) => button.evaluate((node, state) => {
        const icon = node.querySelector('.fa');
        const r = icon.getBoundingClientRect(), b = node.getBoundingClientRect();
        const s = getComputedStyle(icon), root = node.closest('.easyedu-ui');
        const probe = document.createElement('span'); root.append(probe);
        const context = document.createElement('canvas').getContext('2d');
        const rgb = value => {
            probe.style.color = value;
            context.fillStyle = getComputedStyle(probe).color;
            context.fillRect(0, 0, 1, 1);
            return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const background = state === 'disabled' ? 'var(--easyedu-field-disabled-surface)' :
            state === 'pressed' ? 'var(--easyedu-primary)' :
            state === 'hover' || state === 'focus' ?
                'color-mix(in srgb, var(--easyedu-primary-chosen, var(--easyedu-primary)) 16%, white 84%)' :
                'var(--easyedu-primary-soft)';
        const color = state === 'disabled' ? 'var(--easyedu-field-disabled-text)' :
            state === 'pressed' ? 'var(--easyedu-surface)' : 'var(--easyedu-primary)';
        const result = {state, actual: {background: rgb(s.backgroundColor), color: rgb(s.color)},
            expected: {background: rgb(background), color: rgb(color)},
            geometry: [r.width, r.height, s.fontSize, s.borderRadius, b.width, b.height],
            iconOffset: [r.x - b.x, r.y - b.y]};
        probe.remove(); return result;
    }, state);
    try {
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded', timeout: 60000});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter: true});
            await page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 60000});
            await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await page.setViewportSize({width: 1600, height: 1000});
        const switcher = root.locator('.easyedu-workspace-view-switcher--tiled');
        await expect(switcher).toBeVisible();
        const original = await root.getAttribute('style');
        const modes = switcher.locator('button');
        const modeCount = await modes.count();
        expect([2, 3]).toContain(modeCount);
        try {
            for (const palette of [
                {name: 'saved', style: original},
                {name: 'canonical', style: '--easyedu-primary:#0f6cbf;--easyedu-primary-chosen:#0f6cbf;--easyedu-primary-soft:#eaf3fb;'},
                {name: 'purple', style: '--easyedu-primary:#7b3f98;--easyedu-primary-chosen:#7b3f98;--easyedu-primary-soft:#f2ecf5;'},
                {name: 'light-chosen-readable-ink', style: '--easyedu-primary:#765300;--easyedu-primary-chosen:#ffae00;--easyedu-primary-soft:#fff7e6;'},
            ]) {
                await root.evaluate((node, style) => {node.style.cssText = style || '';}, palette.style);
                for (let index = 0; index < modeCount; index++) {
                    const button = modes.nth(index), other = modes.nth((index + 1) % modeCount);
                    await other.click(); await page.mouse.move(1, 1); await settle();
                    const baseline = await sample(button, 'rest');
                    for (const state of ['rest', 'hover', 'focus', 'pressed', 'disabled']) {
                        if (state === 'hover') await button.hover();
                        if (state === 'focus') {await page.mouse.move(1, 1); await button.focus();}
                        if (state === 'pressed') await button.click();
                        // Disabled is a transient shared-paint probe, not native availability proof.
                        if (state === 'disabled') await button.evaluate(n => {n.disabled = true;});
                        await settle();
                        const result = await sample(button, state);
                        records.push({palette: palette.name, modeCount, index, ...result});
                        for (const property of ['background', 'color']) {
                            result.actual[property].forEach((v, i) => expect(Math.abs(v - result.expected[property][i])).toBeLessThanOrEqual(1));
                        }
                        expect(result.geometry).toEqual(baseline.geometry);
                    }
                    await button.evaluate(n => {n.disabled = false; n.blur();});
                }
            }
        } finally {
            await modes.evaluateAll(nodes => nodes.forEach(n => {n.disabled = false;}));
            await root.evaluate((node, style) => {if (style === null) node.removeAttribute('style'); else node.setAttribute('style', style);}, original);
        }
        for (const width of [768, 390, 320]) {
            await page.setViewportSize({width, height: 1000}); await settle();
            const compact = root.locator('[data-easystud-mobile-view-switcher]');
            await expect(compact).toBeVisible();
            expect(await compact.getAttribute('class')).not.toContain('switcher--tiled');
            const compactButtons = compact.locator('button:visible');
            expect([2, 3]).toContain(await compactButtons.count());
            for (const button of await compactButtons.all()) {
                await button.click(); await settle();
                expect(await button.locator('.fa').evaluate(n => getComputedStyle(n).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
                records.push({width, compactPlainIcon: true});
            }
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('view-icon-palette.json'), JSON.stringify({records, errors, blocked}, null, 2));
    }
});
