// SM-48 diagnostic, real existing cards only. No fixture or business command.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('Responsive Participant checkbox centers on persistent first header row', async ({page}, testInfo) => {
    test.setTimeout(300000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    const records = [], errors = [], blocked = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('mobile-selection-paint.json'),
        JSON.stringify({scope: 'keyboard-successor; vertical paint alignment remains OPEN', records, errors, blocked}, null, 2));
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/lib/ajax/service.php*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        let methods = [];
        try { methods = route.request().postDataJSON().map(call => call.methodname); } catch (_) {}
        if (methods.length && methods.every(n => n === 'core_message_get_unsent_message')) {
            return route.fulfill({status: 200, contentType: 'application/json',
                body: JSON.stringify(methods.map(() => ({error: false, data: {}})))});
        }
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.length && methods.every(n => reads.has(n))) return route.continue();
        blocked.push({scope: 'core', methods}); return route.abort('blockedbyclient');
    });
    const diagnosticUrl = new URL(process.env.EASYEDU_MOODLE_URL);
    diagnosticUrl.searchParams.set('easystudloadingdiagnostics', '1');
    const root = page.locator('#local-groupimport-easystud');
    const settle = async () => root.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => undefined)));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const inspect = async (card, titleSelector, width, kind, sample, state) => {
        await card.scrollIntoViewIfNeeded(); await settle();
        const geometry = await card.evaluate((node, selector) => {
            const b = node.getBoundingClientRect();
            const target = node.querySelector(':scope > .local-groupimport-easystud-selector');
            const square = target.querySelector('.local-groupimport-easystud-selector__ui');
            const title = node.querySelector(selector), input = target.querySelector('input');
            const rect = el => {const r = el.getBoundingClientRect();
                return {x: r.x - b.x, y: r.y - b.y, w: r.width, h: r.height};};
            const t = rect(target), s = rect(square), h = rect(title);
            const absolute = target.getBoundingClientRect();
            const hit = document.elementFromPoint(absolute.x + absolute.width / 2, absolute.y + absolute.height / 2);
            const paint = getComputedStyle(square), type = getComputedStyle(title);
            return {card: {w: b.width, h: b.height}, target: t, square: s, title: h,
                centreDelta: s.y + s.h / 2 - h.y - h.h / 2, gap: h.x - t.x - t.w,
                overlap: t.x < h.x + h.w && t.x + t.w > h.x && t.y < h.y + h.h && t.y + t.h > h.y,
                hit: !!hit && (hit === target || target.contains(hit)), overflow: b.x < -1 || b.right > innerWidth + 1,
                inputTabIndex: input.tabIndex, checked: input.checked,
                paint: {background: paint.backgroundColor, border: paint.borderColor, radius: paint.borderRadius, shadow: paint.boxShadow},
                type: {family: type.fontFamily, size: type.fontSize, weight: type.fontWeight}};
        }, titleSelector);
        records.push({width, kind, sample, state, geometry}); save();
        expect(geometry.overlap, JSON.stringify({width, kind, sample, state, geometry})).toBe(false);
        expect(geometry.overflow).toBe(false);
        expect(geometry.target.w).toBeGreaterThanOrEqual(44);
        expect(geometry.target.h).toBeGreaterThanOrEqual(44);
        expect(geometry.hit).toBe(true);
        expect(geometry.type.family).toContain('Inter');
        if (kind === 'participant') expect(Math.abs(geometry.centreDelta)).toBeLessThanOrEqual(1);
    };
    const keyboardProbe = async (card, width, kind) => {
        const next = await card.evaluate(node => {
            const input = node.querySelector(':scope > .local-groupimport-easystud-selector input');
            const candidates = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
                .filter(el => el.tabIndex >= 0 && !el.disabled && !el.closest('[hidden],[inert]') &&
                    el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
            const following = candidates.find(el => !!(input.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
            if (!following) return false;
            following.focus(); return document.activeElement === following;
        });
        expect(next).toBe(true);
        await page.keyboard.press('Shift+Tab'); await settle();
        const keyboard = await card.evaluate(node => {
            const input = node.querySelector(':scope > .local-groupimport-easystud-selector input');
            return {inputTabIndex: input.tabIndex, reachedCheckbox: document.activeElement === input,
                inputFocusVisible: input.matches(':focus-visible'), activeTag: document.activeElement?.tagName,
                activeInsideCard: node.contains(document.activeElement)};
        });
        records.push({width, kind, state: 'actual-local-tab-predecessor', keyboard}); save();
        expect(keyboard.inputTabIndex).toBe(0);
        expect(keyboard.reachedCheckbox).toBe(true);
        expect(keyboard.inputFocusVisible).toBe(true);
        const input = card.locator(':scope > .local-groupimport-easystud-selector input');
        const square = card.locator(':scope > .local-groupimport-easystud-selector .local-groupimport-easystud-selector__ui');
        const focus = await square.evaluate(node => ({
            shadow: getComputedStyle(node).boxShadow,
            token: getComputedStyle(node).getPropertyValue('--easyedu-focus-ring').trim()
        }));
        records.push({width, kind, state: 'native-checkbox-focus-paint', focus}); save();
        expect(focus.token).toBe('rgba(15, 108, 191, 0.22)');
        expect(focus.shadow).toBe('rgba(15, 108, 191, 0.22) 0px 0px 0px 2.88px');
        await expect(input).not.toBeChecked();
        await page.keyboard.press('Space'); await settle(); await expect(input).toBeChecked();
        await expect(card).toHaveClass(/is-selected/);
        await expect(input).toBeFocused();
        await page.keyboard.press('Space'); await settle(); await expect(input).not.toBeChecked();
        await expect(card).not.toHaveClass(/is-selected/);
        await expect(input).toBeFocused();
        records.push({width, kind, state: 'native-space-select-deselect', focusRetained: true}); save();
    };
    try {
        await page.setViewportSize({width: 390, height: 1100});
        await page.goto(diagnosticUrl.toString(), {waitUntil: 'domcontentloaded'});
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'});
            await page.goto(diagnosticUrl.toString(), {waitUntil: 'domcontentloaded'});
        }
        // Let authentication's first document finish before instrumenting a
        // separate owned navigation. No handler may sample a later document.
        await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
        let gate;
        let held = false;
        await page.route('**/lib/requirejs.php/**', async route => {
            if (!new URL(route.request().frame().url()).pathname.endsWith('/local/groupimport/manage.php')) {
                return route.continue();
            }
            if (!gate) {
                held = true;
                gate = (async () => {
                    // Every native AMD aggregate for this document waits on one
                    // gate; an alternate aggregate cannot initialize behind it.
                    await expect(root).toHaveAttribute('data-easystud-loading-state', 'degraded', {timeout: 20000});
                    const failOpen = await root.evaluate(node => ({
                        state: node.getAttribute('data-easystud-loading-state'),
                        busy: node.getAttribute('aria-busy'),
                        inert: node.querySelector('[data-easystud-real-content]').inert,
                        skeletonHidden: node.querySelector('[data-easystud-loading-skeleton]').hidden,
                        realHidden: node.querySelector('[data-easystud-real-content]').hidden,
                        initialised: node.getAttribute('data-easystud-manager-initialised')
                    }));
                    records.push({state: 'native-delayed-get-fail-open', failOpen}); save();
                    expect(failOpen.busy).toBe('false');
                    expect(failOpen.inert).toBe(false);
                    expect(failOpen.skeletonHidden).toBe(true);
                    expect(failOpen.realHidden).toBe(false);
                    expect(failOpen.initialised).not.toBe('1');
                })();
            }
            try { await gate; } finally { await route.continue(); }
        });
        await page.goto(diagnosticUrl.toString(), {waitUntil: 'domcontentloaded'});
        await page.route('**/local/groupimport/**', route => {
            if (route.request().method() === 'GET') return route.continue();
            blocked.push({scope: 'plugin', method: route.request().method()}); return route.abort('blockedbyclient');
        });
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        expect(held).toBe(true);
        const recovered = await root.evaluate(node => ({
            state: node.getAttribute('data-easystud-loading-state'),
            initialised: node.getAttribute('data-easystud-manager-initialised'),
            events: node.easystudLoadingDiagnostics.snapshot()
        }));
        records.push({state: 'native-late-initialization-recovered', recovered}); save();
        expect(recovered.initialised).toBe('1');
        expect(recovered.events.some(e => e.name === 'manager-degraded' && e.details.reason === 'amd-timeout')).toBe(true);
        expect(recovered.events.some(e => e.name === 'manager-ready' && e.details.recoveredFrom === 'degraded')).toBe(true);
        for (const width of [390, 768, 320, 1024]) {
            await page.setViewportSize({width, height: 1100});
            for (const [kind, mode, selector, title] of [
                ['participant', 'participants', '[data-easystud-participant-list] [data-easystud-user]', '.local-groupimport-easystud-user__name'],
                ['group', 'groups', '[data-easystud-group-id]', '.local-groupimport-easystud-group__name'],
                ['grouping', 'groupings', '[data-easystud-grouping-id]', '.local-groupimport-easystud-grouping__name'],
            ]) {
                await root.locator(`[data-easystud-mobile-view="${mode}"]:visible`).click(); await settle();
                const cards = root.locator(`${selector}:visible`).filter({has: page.locator(title)});
                expect(await cards.count()).toBeGreaterThan(0);
                const lengths = await cards.evaluateAll((nodes, name) => nodes.map(n => n.querySelector(name).textContent.trim().length), title);
                const longest = lengths.indexOf(Math.max(...lengths));
                for (const index of [...new Set([0, longest])]) {
                    const card = cards.nth(index), sample = index === 0 ? 'first' : 'longest-existing';
                    const label = card.locator(':scope > .local-groupimport-easystud-selector'), input = label.locator('input');
                    await expect(input).not.toBeChecked();
                    await inspect(card, title, width, kind, sample, 'unselected');
                    if (index === 0) await keyboardProbe(card, width, kind);
                    await label.click(); await expect(input).toBeChecked();
                    await inspect(card, title, width, kind, sample, 'selected');
                    await label.click(); await expect(input).not.toBeChecked();
                    await inspect(card, title, width, kind, sample, 'deselected');
                }
            }
        }
        await page.setViewportSize({width:1600,height:1100});
        await root.locator('[data-easystud-layout-mode="participants"]:visible').click(); await settle();
        const desktop = root.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();
        const anchor = () => desktop.evaluate(node => {
            const b=node.getBoundingClientRect();
            const r=node.querySelector(':scope > .local-groupimport-easystud-selector').getBoundingClientRect();
            return {y:r.y-b.y,w:r.width,h:r.height};
        });
        const before=await anchor();
        await desktop.locator(':scope > .local-groupimport-easystud-selector').click(); await settle();
        const after=await anchor();
        records.push({width:1600,state:'desktop-header-anchor-preserved',before,after}); save();
        expect(Math.abs(before.y-after.y)).toBeLessThanOrEqual(1);
        await desktop.locator(':scope > .local-groupimport-easystud-selector').click(); await settle();
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        const readiness = await root.evaluate(node => ({
            state: node.getAttribute('data-easystud-loading-state'),
            initialised: node.getAttribute('data-easystud-manager-initialised'),
            diagnostics: node.easystudLoadingDiagnostics?.snapshot() || [],
            assets: performance.getEntriesByType('resource')
                .filter(e => /requirejs|course_manager|motion|loading_state_bootstrap/.test(e.name))
                .map(e => ({path: new URL(e.name).pathname, start: e.startTime, duration: e.duration})),
            timing: performance.getEntriesByType('navigation').map(e => ({
                domContentLoaded: e.domContentLoadedEventEnd, load: e.loadEventEnd
            }))
        })).catch(() => ({state: 'unavailable'}));
        records.push({state: 'native-readiness-diagnostic', readiness}); save();
    }
});
