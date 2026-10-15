const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

test('K16 long-list shared pills dense ordinary matrix and deferred details', async({page}, info) => {
    test.setTimeout(1700000);
    page.setDefaultTimeout(60000);
    const base = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL || '');
    if (base.origin !== 'http://localhost' || base.searchParams.get('id') === '5') {
        throw Error('Supervised disposable localhost fixture required');
    }
    const report = {rows: [], errors: [], writes: [], deferred: [], audit: null};
    const save = () => fs.writeFileSync(info.outputPath('long-pills-measures.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => {report.errors.push(e.message); save();});
    await page.route('**/local/groupimport/ajax.php*', r => {report.writes.push(r.request().url()); return r.abort();});
    await page.route('**/lib/ajax/service.php*', r => {
        const calls = r.request().postDataJSON() || [];
        const writes = calls.filter(c => c.methodname.startsWith('local_groupimport_') && !/_(get|list)_/.test(c.methodname));
        if (writes.length) {report.writes.push(writes.map(c => c.methodname)); return r.abort();}
        return r.continue();
    });
    await page.goto(new URL('/login/index.php', base).href, {waitUntil: 'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
    }
    const root = page.locator('#local-groupimport-easystud');
    const settle = async() => {
        await root.evaluate(async n => {
            await document.fonts.ready;
            await Promise.all(n.getAnimations({subtree: true}).filter(a =>
                Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));
        });
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    const measure = () => root.locator('[data-easystud-user]').evaluateAll(nodes => {
        const painted = e => {
            for (let p = e; p; p = p.parentElement) {
                const s = getComputedStyle(p);
                if (p.hidden || s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
            }
            return e.getClientRects().length > 0;
        };
        return nodes.filter(painted).slice(0, 3).map(n => {
            const name = n.querySelector('.local-groupimport-easystud-user__name').getBoundingClientRect();
            const cb = n.querySelector('input[type=checkbox]').getBoundingClientRect();
            return {name: n.querySelector('.local-groupimport-easystud-user__name').textContent.trim(),
                checkboxGap: name.left - cb.right, checkboxDy: cb.y + cb.height / 2 - name.y - name.height / 2,
                rows: [...n.querySelectorAll('.local-groupimport-easystud-user__meta-tags')].filter(painted).map(c => {
                    const payload = c.getAttribute('data-easystud-long-tags');
                    const total = payload ? JSON.parse(payload).filter(t => String(t).trim() && !['-', '−', '—'].includes(String(t).trim())).length : null;
                    return {total, tokens: [...c.querySelectorAll('.local-groupimport-easystud-token')].filter(painted).map(t => {
                        const b = t.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(t);
                        const text = r.getBoundingClientRect();
                        return {text: t.textContent.trim(), title: t.title, toggle: t.hasAttribute('data-easystud-toggle-tags'),
                            expanded: t.getAttribute('aria-expanded'), cssHeight: getComputedStyle(t).height, height: t.offsetHeight,
                            clipped: t.scrollWidth > t.clientWidth + .5 || text.width > t.clientWidth + .5,
                            dx: text.x + text.width / 2 - b.x - b.width / 2, dy: text.y + text.height / 2 - b.y - b.height / 2};
                    })};
                })};
        });
    });
    try {
        for (const lang of ['fr', 'en']) for (const width of [1600, 1280, 768, 390]) {
            await page.setViewportSize({width, height: 1000}); base.searchParams.set('lang', lang);
            await page.goto(base.href, {waitUntil: 'domcontentloaded', timeout: 180000});
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 180000});
            await root.locator(width <= 1024 ? '[data-easystud-mobile-view="participants"]' : '[data-easystud-layout-mode="participants"]:visible').click();
            for (const density of ['initial', 'toggled']) {
                if (density === 'toggled') await root.locator('[data-easystud-density-toggle]').evaluate(n => n.click());
                await settle();
                for (const button of await root.locator('[data-easystud-toggle-tags][data-expanded="1"]:visible').all()) {
                    await button.evaluate(n => n.click());
                }
                await settle();
                for (const expanded of [false, true]) {
                    if (expanded) {
                        for (const card of (await root.locator('[data-easystud-user]').all()).slice(0, 3)) {
                            for (const button of await card.locator('[data-easystud-toggle-tags]:visible:not([data-easystud-open-user])').all()) {
                                if (await button.getAttribute('aria-expanded') !== 'true') await button.evaluate(n => n.click());
                            }
                        }
                        await settle();
                    }
                    const cards = await measure(); report.rows.push({lang, width, density, expanded, cards}); save();
                    expect(cards).toHaveLength(3);
                    expect(cards.some(c => c.name.includes('Member 00'))).toBe(true);
                    expect(cards.some(c => c.name.includes('Member 02'))).toBe(true);
                    for (const c of cards) {
                        expect(c.checkboxGap).toBeGreaterThanOrEqual(8);
                        expect(Math.abs(c.checkboxDy)).toBeLessThanOrEqual(.5);
                        for (const row of c.rows) {
                            const real = row.tokens.filter(t => !t.toggle), toggle = row.tokens.find(t => t.toggle);
                            if (row.total > 0) expect(real.length).toBeGreaterThan(0);
                            for (const token of row.tokens) {
                                expect(token.text).not.toMatch(/^(?:|[-−—])$/);
                                expect(token.height).toBe(22); expect(token.cssHeight).toBe('22px');
                                expect(token.clipped).toBe(false);
                                expect(Math.abs(token.dx)).toBeLessThanOrEqual(.5);
                                expect(Math.abs(token.dy)).toBeLessThanOrEqual(.5);
                                expect(token.title).toBe(token.text);
                            }
                            if (toggle && toggle.expanded !== 'true') expect(toggle.text).toBe('+' + (row.total - real.length));
                        }
                    }
                }
            }
            // Exercise the actual asynchronous group sheet after reaching its ceiling.
            await root.locator(width <= 1024 ? '[data-easystud-mobile-view="groupings"]' : '[data-easystud-layout-mode="both"]:visible').click();
            await settle();
            const grouping = root.locator('[data-easystud-grouping-id]').filter({
                has: page.locator('.local-groupimport-easystud-grouping__name', {hasText: /^QA Long grouping$/})
            }).first();
            const collapse = grouping.locator('[data-easystud-collapse-toggle]').first();
            if (await collapse.getAttribute('aria-expanded') !== 'true') await collapse.click();
            const group = grouping.locator('[data-easystud-group-id]').filter({
                has: page.locator('.local-groupimport-easystud-group__name', {hasText: /^QA Group 00$/})
            }).first();
            await expect(group).toBeVisible();
            for (const count of [18, 28, 38, 48, 50]) {
                await group.locator('[data-easystud-long-list-action="more"]').click();
                await expect(group.locator('[data-easystud-member-id]')).toHaveCount(count); await settle();
            }
            let release;
            const held = new Promise(r => {release = r;});
            let signal;
            const requested = new Promise(r => {signal = r;});
            const holdDetails = async route => {
                if ((route.request().postDataJSON() || []).some(c => c.methodname === 'local_groupimport_get_details')) {
                    signal(); await held;
                }
                await route.fallback();
            };
            await page.route('**/lib/ajax/service.php*', holdDetails);
            const all = group.locator('[data-easystud-long-list-action="all"]');
            await all.click();
            const modal = root.locator('[data-easystud-advanced-settings-modal]');
            try {
                await requested; await expect(modal).toBeVisible();
                await expect(modal.locator('[aria-busy="true"]')).toHaveCount(1);
            } finally {release();}
            await expect(modal.locator('[aria-busy="true"]')).toHaveCount(0);
            await expect(modal).toContainText('Member 59');
            await expect(modal.locator('.local-groupimport-easystud-entity__relation--members')).toHaveAttribute('open', '');
            report.deferred.push({lang, width, heldRealRequest: true, ready: true}); save();
            await modal.locator('[data-easystud-close-advanced-settings]').first().click();
            await expect(modal).toBeHidden(); await expect(all).toBeFocused();
            await page.unroute('**/lib/ajax/service.php*', holdDetails);
        }
        expect(report.errors).toEqual([]); expect(report.writes).toEqual([]);
        const audit = 'C:/dev/tools/codex-relay/audit-preview.cjs';
        const secret = info.outputPath('audit-admin.secret');
        const logDir = path.join(path.dirname(audit), 'logs');
        const before = new Set(fs.readdirSync(logDir));
        try {
            fs.writeFileSync(secret, process.env.EASYEDU_MOODLE_PASSWORD, {mode: 0o600});
            const stdout = execFileSync(process.execPath, [audit, require.resolve('playwright'), secret, '5'], {encoding: 'utf8', timeout: 600000});
            fs.writeFileSync(info.outputPath('kevin-audit.log'), stdout);
        } finally {if (fs.existsSync(secret)) fs.unlinkSync(secret);}
        const file = fs.readdirSync(logDir).find(f => !before.has(f) && /^audit-.*\.json$/.test(f));
        report.audit = JSON.parse(fs.readFileSync(path.join(logDir, file), 'utf8')); save();
        const failures = report.audit.filter(r => r.status === 'FAIL');
        expect(failures.filter(r => !r.check.includes(' groupe '))).toEqual([]);
        expect(failures.length).toBeLessThanOrEqual(21);
    } finally {save();}
});
