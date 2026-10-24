const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const acorn = require(process.env.K2362_ACORN || 'acorn');

test.use({launchOptions: {executablePath: process.env.EASYSTUD_CHROME_PATH,
    ignoreDefaultArgs: ['--hide-scrollbars'], args: ['--disable-features=OverlayScrollbar,OverlayScrollbars']}, ignoreHTTPSErrors: true});
test('Guide scrollbar lock preserves host width', async({page, context}, info) => {
    test.setTimeout(900000);
    page.setDefaultTimeout(30000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    const label = process.env.K2362_LABEL || 'candidate';
    const baseline = process.env.K2362_REGRESSION_BASELINE ? JSON.parse(fs.readFileSync(process.env.K2362_REGRESSION_BASELINE, 'utf8')) : null;
    const report = {label, cases: [], errors: [], replacements: 0, fullscreen: [], stable: [], regressions: [], stages: []};
    const save = () => fs.writeFileSync(info.outputPath('scrollbar-lock.json'), JSON.stringify(report, null, 2));
    const stage = name => {report.stages.push(name); save();};
    page.on('pageerror', e => {report.errors.push({message: e.message, stack: e.stack}); save();});
    await context.route('**/lib/requirejs.php/**', async route => {
        const response = await route.fetch();
        let body = await response.text();
        if (body.includes('define("local_groupimport/easyedu_guide",')) {
            const ast = acorn.parse(body, {ecmaVersion: 'latest'});
            const node = ast.body.find(n => n.expression?.callee?.name === 'define' &&
                n.expression.arguments[0]?.value === 'local_groupimport/easyedu_guide');
            if (!node) throw Error('Cannot isolate the real Guide AMD');
            body = body.slice(0, node.start) + fs.readFileSync(process.env.K2362_AMD, 'utf8') + body.slice(node.end);
            report.replacements++;
        }
        await route.fulfill({response, body});
    });
    await context.route('**/api/rest/v2/user/current/preferences/**', r => r.request().method() === 'POST' ?
        r.fulfill({contentType: 'application/json', body: '{}'}) : r.continue());
    await context.route('**/lib/ajax/service.php?*', r => {
        let calls; try { calls = r.request().postDataJSON(); } catch {}
        if (Array.isArray(calls) && calls.every(c => /^core_user_(set|update)_user_preferences?$/.test(c.methodname))) {
            return r.fulfill({contentType: 'application/json', body: JSON.stringify(calls.map(() => ({error: false, data: {}})))});
        }
        return r.continue();
    });
    const snap = () => page.evaluate(() => {
        const html = document.documentElement;
        const rect = selector => {
            const r = document.querySelector(selector)?.getBoundingClientRect();
            return r ? {x: r.x, y: r.y, w: r.width, h: r.height} : null;
        };
        return {region: rect('#region-main'), card: rect('[data-easystud-user]'),
            scrollbar: innerWidth - html.clientWidth, viewport: innerWidth,
            padding: getComputedStyle(html).paddingRight, inlinePadding: html.style.getPropertyValue('padding-right'),
            gutter: getComputedStyle(html).scrollbarGutter, overflow: getComputedStyle(html).overflowY,
            priority: html.style.getPropertyPriority('padding-right'), scrollY,
            scrollHeight: document.scrollingElement.scrollHeight, clientHeight: html.clientHeight,
            locked: html.classList.contains('easyedu-guide-dialog-open'),
            parked: document.querySelectorAll('[data-easyedu-guide-parked]').length};
    });
    const settle = async() => {
        await page.evaluate(() => Promise.all(document.getAnimations().filter(a =>
            Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a => a.finished.catch(() => {}))));
        await page.waitForTimeout(100);
    };
    const open = async() => {
        const launcher = page.locator('[data-easyedu-guide-open]:visible').first();
        if (!await launcher.count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
        await page.locator('[data-easyedu-guide-open]:visible').first().click();
        await expect(page.locator('[data-easyedu-guide-modal]')).toBeVisible();
        await settle();
    };
    const close = async() => {
        await page.locator('[data-easyedu-guide-close]:visible').first().click();
        await expect(page.locator('[data-easyedu-guide-modal]')).toBeHidden();
        await settle();
    };
    try {
        stage('authenticate');
        const login = await context.request.get(base.origin + '/login/index.php');
        const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)?.[1];
        expect(token).toBeTruthy();
        const response = await context.request.post(base.origin + '/login/index.php', {maxRedirects: 0, form: {
            username: process.env.EASYEDU_MOODLE_USERNAME, password: process.env.EASYEDU_MOODLE_PASSWORD, logintoken: token}});
        expect([302, 303]).toContain(response.status());
        for (const lang of ['fr', 'en']) {
            base.searchParams.set('lang', lang);
            await page.setViewportSize({width: 1600, height: 1000});
            stage(lang + '-load');
            await page.goto(base.href, {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.waitForSelector('#local-groupimport-easystud[data-easystud-loading-state="ready"]', {timeout: 180000});
            await page.evaluate(() => document.fonts.ready);
            // Moodle uses an inner scroller: let only the disposable spacer overflow
            // the body's clipping boundary so a real document scrollbar is exercised.
            await page.addStyleTag({content: 'body { overflow: visible !important; } html { scrollbar-gutter: auto !important; } html:not(.easyedu-guide-dialog-open) { overflow-y: auto !important; }'});
            for (let i = 0; i < 2; i++) {
                const closeDrawer = page.locator('.drawer.show [data-action="closedrawer"]:visible').first();
                if (!await closeDrawer.count()) break;
                await closeDrawer.click(); await settle();
            }
            for (const width of [1600, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                for (const scroll of ['with', 'without']) {
                    stage(`${lang}-${width}-${scroll}`);
                    await page.evaluate(withScroll => {
                        const html = document.documentElement;
                        document.querySelector('[data-k2362-spacer]')?.remove();
                        if (withScroll) {
                            const spacer = document.createElement('div');
                            spacer.dataset.k2362Spacer = '';
                            spacer.style.cssText = 'position:absolute;top:100vh;left:0;width:1px;height:3000px;pointer-events:none';
                            spacer.setAttribute('aria-hidden', 'true'); document.body.append(spacer);
                        }
                        window.scrollTo(0, 0);
                    }, scroll === 'with');
                    await settle();
                    for (let cycle = 0; cycle < 10; cycle++) {
                        const before = await snap();
                        report.preflight = before; save();
                        if (scroll === 'with') {
                            expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
                            expect(before.scrollbar).toBeGreaterThan(0);
                        } else expect(before.scrollbar).toBe(0);
                        await open(); const during = await snap();
                        if (cycle === 0) await page.screenshot({path: info.outputPath(`${lang}-${width}-${scroll}-open.png`)});
                        await close(); const after = await snap();
                        const row = {lang, width, scroll, cycle, before, during, after,
                            openDelta: during.region.w - before.region.w, closeDelta: after.region.w - before.region.w};
                        report.cases.push(row); save();
                        expect(during.locked).toBe(true); expect(after.locked).toBe(false);
                        expect(after.inlinePadding).toBe(before.inlinePadding);
                        expect(after.priority).toBe(before.priority);
                        if (label !== 'baseline') {
                            expect(Math.abs(row.openDelta)).toBeLessThanOrEqual(0.5);
                            expect(Math.abs(row.closeDelta)).toBeLessThanOrEqual(0.5);
                            expect(Math.abs(during.region.x - before.region.x)).toBeLessThanOrEqual(0.5);
                            expect(Math.abs(during.card.w - before.card.w)).toBeLessThanOrEqual(0.5);
                            expect(Math.abs(during.card.x - before.card.x)).toBeLessThanOrEqual(0.5);
                            if (scroll === 'without') expect(during.inlinePadding).toBe(before.inlinePadding);
                        }
                        if (label === 'baseline') break;
                    }
                }
                {
                    stage(`${lang}-${width}-stable-gutter`);
                    await page.evaluate(() => {
                        document.documentElement.style.setProperty('scrollbar-gutter', 'stable', 'important');
                        const spacer = document.createElement('div'); spacer.dataset.k2362Spacer = '';
                        spacer.style.cssText = 'position:absolute;top:100vh;left:0;width:1px;height:3000px;pointer-events:none';
                        document.body.append(spacer);
                    });
                    await settle(); const before = await snap();
                    expect(before.scrollbar).toBeGreaterThan(0);
                    await open(); const during = await snap(); await close(); const after = await snap();
                    report.stable.push({lang, width, before, during, after}); save();
                    expect(during.inlinePadding).toBe(before.inlinePadding);
                    expect(Math.abs(during.region.w - before.region.w)).toBeLessThanOrEqual(0.5);
                    expect(Math.abs(after.region.w - before.region.w)).toBeLessThanOrEqual(0.5);
                    await page.evaluate(() => document.documentElement.style.removeProperty('scrollbar-gutter'));
                    stage(`${lang}-${width}-guide-regressions`);
                    await open();
                    for (const index of [1, 4, 9, 7, 8]) {
                        const nav = page.locator(`[data-easyedu-guide-modal] [data-easyedu-guide-nav-item="${index}"]`).first();
                        await nav.focus(); await nav.click(); await settle();
                        const probe = await page.locator('[data-easyedu-guide-slide].is-active').evaluate((root, index) => {
                            const b = e => e.getBoundingClientRect();
                            const text = e => {const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()];};
                            const failures = [], measurements = {};
                            if (index === 1) {
                                const captions = [...root.querySelectorAll('.easyedu-guide-scene__concepts > div > p,.easyedu-guide-scene__example p')];
                                measurements.captions = captions.length;
                                measurements.overflow = Math.max(0, ...captions.flatMap(e => text(e).map(r => Math.max(r.right - b(e).right, b(e).left - r.left))));
                                if (!captions.length || measurements.overflow > .5) failures.push('concept caption overflow');
                            }
                            if (index === 4) {
                                const emails = [...root.querySelectorAll('.easyedu-person-card__email')];
                                measurements.emails = emails.map(e => b(e).width);
                                if (!emails.length || measurements.emails.some(w => w < 64)) failures.push('unreadable email');
                            }
                            if (index === 9) {
                                const headers = [...root.querySelectorAll('.easyedu-guide-spec__surface .local-groupimport-easystud-group__header,.easyedu-guide-spec__surface .local-groupimport-easystud-grouping__header')];
                                measurements.headers = headers.length; let intersections = 0;
                                for (const h of headers) {
                                    const children = [...h.children].map(b).filter(r => r.width > .5 && r.height > .5);
                                    for (let i = 0; i < children.length; i++) for (let j = i + 1; j < children.length; j++) {
                                        const a = children[i], z = children[j];
                                        if (Math.min(a.right, z.right) - Math.max(a.left, z.left) > .5 &&
                                            Math.min(a.bottom, z.bottom) - Math.max(a.top, z.top) > .5) intersections++;
                                    }
                                }
                                measurements.intersections = intersections;
                                if (!headers.length || intersections) failures.push('identifier header intersection');
                            }
                            if (index === 7) {
                                const start = b(root.querySelector('[data-guide-scene-command="start"]'));
                                const compare = b(root.querySelector('[data-guide-modes]'));
                                measurements.startGap = compare.top - start.bottom;
                                if (measurements.startGap < -.5) failures.push('Start below Compare');
                                const warning = root.querySelector('[data-easyedu-guide-path-prerequisite]');
                                measurements.warningPresent = !!warning;
                                if (warning) {
                                    const wasHidden = warning.hidden; warning.hidden = false;
                                    measurements.warningOverflow = Math.max(0, ...text(warning.querySelector('p')).map(r => r.right - b(warning).right));
                                    warning.hidden = wasHidden;
                                    if (measurements.warningOverflow > .5) failures.push('prerequisite warning overflow');
                                }
                            }
                            if (index === 8) {
                                const searches = [...root.querySelectorAll('.easyedu-search-field')].filter(e => b(e).width > .5);
                                measurements.searches = searches.length;
                                for (const e of searches) {
                                    const r = b(e), icon = b(e.querySelector('.fa')), input = b(e.querySelector('input'));
                                    if (icon.left < r.left - .5 || icon.right > r.right + .5 || icon.top < r.top - .5 ||
                                        icon.bottom > r.bottom + .5 || Math.abs((icon.top + icon.bottom - input.top - input.bottom) / 2) > .5) failures.push('filter search icon outside field');
                                }
                                if (!searches.length) failures.push('filter search missing');
                            }
                            return {failures, measurements};
                        }, index);
                        report.regressions.push({lang, width, index, ...probe}); save();
                        if (label !== 'baseline') {
                            const old = baseline?.regressions.find(r => r.lang === lang && r.width === width && r.index === index);
                            expect(probe.failures).toEqual(old?.failures || []);
                            if (old) expect(probe.measurements).toEqual(old.measurements);
                        }
                    }
                    await close();
                    await page.evaluate(() => document.querySelector('[data-k2362-spacer]')?.remove());
                }
            }
            if (label !== 'baseline') {
                stage(lang + '-fullscreen');
                await page.setViewportSize({width: 1600, height: 1000}); await settle();
                await page.evaluate(() => {
                    const spacer = document.createElement('div'); spacer.dataset.k2362Spacer = '';
                    spacer.style.cssText = 'position:absolute;top:100vh;left:0;width:1px;height:3000px;pointer-events:none';
                    document.body.append(spacer);
                });
                await settle(); const before = await snap();
                expect(before.scrollbar).toBeGreaterThan(0); await open();
                await page.locator('[data-easyedu-guide-fullscreen]:visible').click();
                await page.waitForFunction(() => !!document.fullscreenElement);
                await settle();
                await page.evaluate(() => {
                    window.k2362Frames = []; const start = performance.now();
                    const frame = () => {
                        const modal = document.querySelector('[data-easyedu-guide-modal]');
                        window.k2362Frames.push({t: performance.now(), hidden: modal.hidden,
                            parked: document.querySelectorAll('[data-easyedu-guide-parked]').length});
                        if (performance.now() - start < 1800) requestAnimationFrame(frame);
                    }; frame();
                    return document.exitFullscreen();
                });
                await close(); await page.waitForTimeout(1000);
                const after = await snap(), frames = await page.evaluate(() => window.k2362Frames);
                report.fullscreen.push({lang, before, after, frames}); save();
                expect(frames.filter(f => f.hidden && f.parked)).toEqual([]);
                expect(Math.abs(after.region.w - before.region.w)).toBeLessThanOrEqual(0.5);
                expect(after.parked).toBe(0);
            }
        }
        expect(report.replacements).toBeGreaterThan(0);
        expect(report.errors).toEqual([]);
    } catch (e) {
        report.failure = {message: e.message, stack: e.stack}; save();
        await page.screenshot({path: info.outputPath('failure.png')}).catch(() => {}); throw e;
    } finally {save();}
});
