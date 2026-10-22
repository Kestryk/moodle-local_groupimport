const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Source-only candidate CSS is substituted in the same real Moodle DOM. No
// course command, product controller or server response is mocked.
test('I12 shared source native visual comparison', async ({page}, info) => {
    test.setTimeout(1800000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    if (base.origin !== 'http://localhost:8051') {
        throw Error('Only the assigned port8051 runtime is allowed');
    }
    const candidate = process.env.I12_CANDIDATE_CSS;
    if (!candidate || !path.isAbsolute(candidate)) {
        throw Error('Pass the external candidate CSS directory');
    }
    const baseline = process.env.I12_BASELINE_CSS;
    if (baseline && !path.isAbsolute(baseline)) throw Error('The baseline CSS directory must be absolute');
    const fragmentRows = process.env.I12_FRAGMENT_ROWS === '1';
    const report = {sourceHash: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'), baseline, candidate, rows: [], errors: [], consoleErrors: [], writes: [], readonlyPosts: [], stylesheets: []};
    const save = () => fs.writeFileSync(info.outputPath('i12-native.json'), JSON.stringify(report, null, 2));
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', e => { report.errors.push({message: e.message, stack: e.stack}); save(); });
    page.on('console', e => { if (e.type() === 'error') { report.consoleErrors.push(e.text()); save(); } });
    page.on('request', r => {
        if (/\/local\/groupimport\/ajax\.php/.test(r.url()) && r.method() === 'POST') {
            const fields = new URLSearchParams(r.postData());
            const safe = {action: fields.get('action'), fields: [...fields.keys()].filter(k => k !== 'sesskey')};
            (safe.action === 'movestatus' ? report.readonlyPosts : report.writes).push(safe);
        }
    });
    await page.route('**/local/groupimport/styles/*.css*', async route => {
        const url = new URL(route.request().url());
        const dir = url.searchParams.get('i12-native-candidate') === '1' ? candidate : baseline;
        if (!dir) return route.continue();
        if (url.origin !== base.origin) throw Error('CSS route escaped assigned runtime');
        await route.fulfill({path: path.join(dir, url.pathname.split('/').pop()), contentType: 'text/css'});
    });
    await page.goto(base.origin + '/login/index.php?lang=en', {waitUntil: 'domcontentloaded'});
    await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
    await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
    await Promise.all([
        page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit'}),
        page.locator('#loginbtn').click({noWaitAfter: true})
    ]);

    // Preserve normal-motion policy; freeze only already painted decorative
    // clocks for an exact same-DOM screenshot pair, after finite entry settles.
    const settle = async () => {
        await page.evaluate(async () => {
            await document.fonts.ready;
            const finite = document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().iterations));
            await Promise.race([Promise.all(finite.map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 2000))]);
            document.getAnimations().filter(a => !Number.isFinite(a.effect?.getComputedTiming().iterations)).forEach(a => {
                const duration = a.effect.getComputedTiming().duration;
                a.pause();
                if (Number.isFinite(duration)) a.currentTime = duration / 2;
            });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        });
    };
    const measure = () => page.evaluate(() => {
        const round = n => Math.round(n * 1000) / 1000;
        const props = ['display', 'visibility', 'opacity', 'color', 'backgroundColor', 'backgroundImage', 'backgroundPosition', 'backgroundSize', 'filter', 'fill', 'stroke',
            'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderColor',
            'borderRadius', 'boxShadow', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'padding',
            'margin', 'gap', 'overflowX', 'overflowY', 'transform', 'outline', 'textAlign', 'textDecoration', 'textDecorationLine'];
        return {
            viewport: {width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth},
            scroll: [...document.querySelectorAll('html, body, main, .easyedu-guide-modal__body')].map(e => ({tag: e.tagName, classes: e.className, top: e.scrollTop, left: e.scrollLeft, width: e.clientWidth, height: e.clientHeight, scrollHeight: e.scrollHeight})),
            nodes: [...document.querySelectorAll('main *, [role="main"] *, #local-groupimport-easystud *, .local-groupimport-import *, #adminsettings *, .easyedu-navigation *, [data-easyedu-guide-modal], [data-easyedu-guide-modal] *, [role="dialog"], [role="dialog"] *, .local-groupimport-easystud-hover-popover, .local-groupimport-easystud-hover-popover *, [data-easystud-selection-actions] *')]
                .filter(e => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; })
                .map((e, index) => {
                    const b = e.getBoundingClientRect(), s = getComputedStyle(e);
                    return {index, tag: e.tagName, id: e.id, classes: e.getAttribute('class'), text: e.children.length ? null : e.textContent.slice(0, 100),
                        rect: [b.x, b.y, b.width, b.height].map(round), paint: Object.fromEntries(props.map(p => [p, s[p]]))};
                }),
            dormantCcb: document.querySelectorAll('.local-coursebannerbuilder, .ccb-drawer, [data-ccb-drawer]').length,
            tokens: Object.fromEntries([...getComputedStyle(document.documentElement)].filter(p => p.includes('checkerboard') || p.includes('guide-launcher')).map(p => [p, getComputedStyle(document.documentElement).getPropertyValue(p)]))
        };
    });
    const diff = (a, b) => {
        const differences = [];
        if (a.nodes.length !== b.nodes.length) differences.push({type: 'node-count', before: a.nodes.length, after: b.nodes.length});
        for (let i = 0; i < Math.min(a.nodes.length, b.nodes.length); i++) {
            const x = a.nodes[i], y = b.nodes[i];
            const geometryDelta = Math.max(...x.rect.map((v, k) => Math.abs(v - y.rect[k])));
            const paint = Object.keys(x.paint).filter(k => x.paint[k] !== y.paint[k]).map(k => ({property: k, before: x.paint[k], after: y.paint[k]}));
            if (geometryDelta > 0.5 || paint.length || x.text !== y.text || x.classes !== y.classes) differences.push({index: i, tag: x.tag, id: x.id, classes: x.classes, geometryDelta, beforeRect: x.rect, afterRect: y.rect, paint, textChanged: x.text !== y.text, classesChanged: x.classes !== y.classes});
        }
        return differences;
    };
    const compare = async row => {
        if (row.interaction === 'hover') await page.locator(row.target).first().hover();
        else if (row.interaction === 'focus') {
            await page.mouse.move(0, 0);
            if (row.surface === 'help-focus') {
                await expect(page.locator('.local-groupimport-easystud-hover-popover.show:visible')).toBeHidden();
            }
            const target = page.locator(row.target).first();
            await target.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
            await expect(target).toBeFocused();
        } else await page.mouse.move(0, 0);
        if (row.surface === 'help-hover' || row.surface === 'help-focus') {
            // The shared controller deliberately waits 400 ms on pointer hover.
            // Capture the actual visible bubble in both CSS states; geometry
            // settlement alone can finish before the timer opens the bubble.
            await expect(page.locator('.local-groupimport-easystud-hover-popover.show:visible'))
                .toBeVisible({timeout: 20000});
        }
        await settle();
        await page.waitForFunction(() => {
            const targets = document.querySelectorAll('#local-groupimport-easystud, .local-groupimport-easystud__panel, [data-easyedu-guide-nav], [data-easystud-clear-selection-frame], .local-groupimport-easystud-hover-popover, [role="tooltip"]');
            const value = JSON.stringify([...targets].map(e => {
                const r = e.getBoundingClientRect();
                const s = getComputedStyle(e);
                return [r.x, r.y, r.width, r.height, e.scrollLeft, e.scrollTop, s.opacity, s.transform];
            }));
            const state = window.__i12GeometrySettle || {value: null, frames: 0};
            state.frames = state.value === value ? state.frames + 1 : 0;
            state.value = value; window.__i12GeometrySettle = state;
            return state.frames >= 15;
        }, null, {polling: 'raf', timeout: 8000});
        row.before = await measure();
        row.beforeCapture = info.outputPath(row.key + '-before.png');
        row.afterCapture = info.outputPath(row.key + '-after.png');
        await page.screenshot({path: row.beforeCapture, caret: 'hide'});
        const links = await page.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(n => n.href).filter(u => u.includes('/local/groupimport/styles/')));
        row.cssLinks = links;
        expect(links.length, 'Real page CSS must be located').toBeGreaterThan(0);
        // Preload while the original remains active. Changing an existing href
        // briefly removes its CSS and resets a scroller; that is a harness FOUC,
        // not evidence of a candidate layout change. Swap loaded sheets atomically.
        await page.evaluate(async urls => {
            await Promise.all(urls.map(url => new Promise((resolve, reject) => {
                const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find(e => e.href === url);
                const replacement = link.cloneNode();
                replacement.dataset.i12Replaces = url;
                replacement.dataset.i12Media = link.media;
                replacement.media = 'not all';
                replacement.onload = resolve; replacement.onerror = () => reject(Error('Candidate stylesheet failed'));
                const next = new URL(url); next.searchParams.set('i12-native-candidate', '1');
                replacement.href = next.href; link.before(replacement);
            })));
        }, links);
        await page.evaluate(() => {
            for (const replacement of document.querySelectorAll('link[data-i12-replaces]')) {
                const original = [...document.querySelectorAll('link[rel="stylesheet"]')].find(e => e.href === replacement.dataset.i12Replaces);
                replacement.media = replacement.dataset.i12Media;
                original.remove();
            }
        });
        if (row.surface === 'help-hover' || row.surface === 'help-focus') {
            // A live stylesheet exchange can scroll the Moodle document and
            // intentionally dismiss its transient bubble. Re-enter the same
            // native interaction after both sheets are settled; this checks
            // painted component states, not CSS hot-reload persistence.
            const target = page.locator(row.target).first();
            await page.mouse.move(0, 0);
            if (row.interaction === 'focus') {
                await target.focus();
                await page.keyboard.press('Tab');
                await page.keyboard.press('Shift+Tab');
                await expect(target).toBeFocused();
            } else {
                await expect(page.locator('.local-groupimport-easystud-hover-popover.show:visible')).toBeHidden();
                await target.hover();
            }
            await expect(page.locator('.local-groupimport-easystud-hover-popover.show:visible')).toBeVisible();
        }
        if (row.surface.startsWith('guide-start')) {
            // Apply the same native visibility/interaction preparation used
            // before the stylesheet pair. Chromium's scroll anchoring during
            // a CSS exchange also occurs with byte-identical sheets (see
            // retained control runs); it must not move the hover target out
            // from under a stationary pointer in a component-state comparison.
            const target = page.locator(row.target).first();
            await target.scrollIntoViewIfNeeded();
            if (row.interaction === 'hover') await target.hover();
            else if (row.interaction === 'focus') {
                await target.focus();
                await page.keyboard.press('Tab');
                await page.keyboard.press('Shift+Tab');
                await expect(target).toBeFocused();
            } else await page.mouse.move(0, 0);
        }
        await settle();
        row.after = await measure();
        row.differences = diff(row.before, row.after);
        await page.screenshot({path: row.afterCapture, caret: 'hide'});
        const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
        row.pixelIdentical = hash(row.beforeCapture) === hash(row.afterCapture);
        row.pass = row.differences.length === 0 && row.after.viewport.overflow <= Math.max(0, row.before.viewport.overflow);
        row.nodeCount = row.before.nodes.length;
        if (fragmentRows) {
            row.rawPath = info.outputPath(row.key + '.json');
            fs.writeFileSync(row.rawPath, JSON.stringify(row, null, 2));
            delete row.before; delete row.after;
        }
        save();
    };
    const pilot = process.env.I12_NATIVE_PILOT === '1';
    const scope = process.env.I12_NATIVE_SCOPE || 'matrix';
    const langs = process.env.I12_NATIVE_LANG ? [process.env.I12_NATIVE_LANG] : pilot ? ['fr'] : ['fr', 'en'];
    const widths = process.env.I12_NATIVE_WIDTH ? [Number(process.env.I12_NATIVE_WIDTH)] : pilot ? [1600] : [1600, 768, 390];
    for (const lang of langs) for (const width of widths) {
        await page.setViewportSize({width, height: 1000});
        const cleanupSurfaces = ['sm', 'mass', 'admin', 'guide', 'filters', 'groups', 'grouping', 'help', 'help-hover', 'help-focus', 'guide-start', 'guide-start-hover', 'guide-start-focus'];
        const surfaces = process.env.I13_NATIVE_SURFACES ? process.env.I13_NATIVE_SURFACES.split(',') : scope === 'cleanup' ? cleanupSurfaces : scope === 'x5-pilot' ? ['groups', 'grouping', 'help', 'guide-start-hover', 'guide-start-focus'] : scope === 'critical' ? ['sm', 'guide'] : scope === 'guide' ? ['guide'] : scope === 'selection' ? ['sm'] : pilot ? ['sm'] : ['sm', 'mass', 'admin', 'guide'];
        for (const surface of surfaces) {
            const row = {lang, width, surface, key: `${lang}-${width}-${surface}`};
            report.rows.push(row); save();
            const url = surface === 'mass' ? `/local/groupimport/index.php?id=5&lang=${lang}`
                : surface === 'admin' ? `/admin/settings.php?section=local_groupimport&lang=${lang}`
                    : `/local/groupimport/manage.php?id=5&lang=${lang}`;
            await page.goto(base.origin + url, {waitUntil: 'domcontentloaded'});
            if (!['mass', 'admin'].includes(surface)) await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 180000});
            await page.waitForLoadState('networkidle', {timeout: 60000});
            await page.evaluate(() => (document.querySelector('#local-groupimport-easystud, #local-groupimport-import, #adminsettings') || document.querySelector('main'))?.scrollIntoView({block: 'start', behavior: 'instant'}));
            if (surface.startsWith('guide')) {
                if (!await page.locator('[data-easyedu-guide-open]:visible').count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
                await expect(page.locator('[data-easyedu-guide-modal]:visible')).toBeVisible();
                await page.locator(`[data-easyedu-guide-nav-item="${surface.startsWith('guide-start') ? 2 : 1}"]:visible`).click();
                // Native smooth-scroll is separate from CSS entry animations.
                await page.waitForFunction(() => {
                    const nav = document.querySelector('[data-easyedu-guide-nav]');
                    const value = [nav?.scrollLeft, nav?.scrollTop].join(':');
                    const state = window.__i12ScrollSettle || {value: null, frames: 0};
                    state.frames = state.value === value ? state.frames + 1 : 0;
                    state.value = value; window.__i12ScrollSettle = state;
                    return state.frames >= 12;
                }, null, {polling: 'raf', timeout: 6000});
                if (surface.startsWith('guide-start')) {
                    row.target = '.easyedu-guide-slide__start:not(:disabled):visible';
                    await expect(page.locator(row.target).first()).toBeVisible();
                    await page.locator(row.target).first().scrollIntoViewIfNeeded();
                }
            }
            if (surface === 'filters') {
                await page.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').click();
                await expect(page.locator('[data-easystud-advanced-filters="participants"]')).toBeVisible();
            }
            if (['groups','grouping'].includes(surface) || surface.startsWith('help')) {
                const grouping = surface === 'grouping';
                if (width <= 1024) await page.locator(`[data-easystud-mobile-view="${grouping ? 'groupings' : 'groups'}"]:visible`).click();
                else await page.getByRole('button', {name: grouping ? /^(Groups.*groupings|Groupes.*groupements)$/i : /^Participants.*(groupes|groups)$/i}).first().click();
                const card = page.locator(`[data-selectable-type="${grouping ? 'grouping' : 'group'}"]:visible`).first();
                await expect(card).toBeVisible();
                if (surface.startsWith('help')) {
                    await card.hover();
                    const direct = card.locator('[data-easystud-open-advanced-settings]:visible').first();
                    if (await direct.count()) await direct.click();
                    else {
                        await card.locator('.local-groupimport-easystud-group__header').click({button: 'right'});
                        await page.locator('[data-easystud-context-action="group-open-advanced-settings"]:visible').click();
                    }
                    row.target = '.local-groupimport-easystud-settings-modal__help:visible';
                    await expect(page.locator(row.target).first()).toBeVisible();
                    await expect(page.locator('.local-groupimport-easystud-entity__body:visible'))
                        .not.toHaveClass(/is-entity-loading|is-entity-skeleton-visible/, {timeout: 60000});
                } else {
                    await card.locator('input[data-easystud-selector-input]').first().check();
                    await expect(card).toHaveClass(/is-selected/);
                    const more = card.locator(':scope > [data-easystud-group-members-toggle]:visible');
                    if (!grouping && await more.count() && await more.getAttribute('aria-expanded') !== 'true') await more.click();
                    row.visibleMembers = await card.locator('[data-selectable-type="member"]:visible').count();
                }
            }
            row.interaction = surface.endsWith('-hover') ? 'hover' : surface.endsWith('-focus') ? 'focus' : undefined;
            if (scope === 'selection' || (scope === 'critical' && surface === 'sm')) {
                row.surface = 'selection'; row.key += '-selection';
                await page.locator('[data-selectable-type="participant"] input[data-easystud-selector-input]').first().check();
                // The canonical compact counterpart deliberately hides this
                // desktop floating frame (_desktop.scss); assert both variants.
                const frame = page.locator('[data-easystud-clear-selection-frame]');
                if (width > 1024) await expect(frame).toBeVisible();
                else await expect(frame).toHaveCSS('display', 'none');
                row.stickyFrameVisible = await frame.isVisible();
                row.nativeDrawerOpen = await page.locator('#theme_boost-drawers-courseindex.show').count() > 0;
                row.selectionCentre = await page.locator('[data-easystud-clear-selection-frame]').evaluate(e => ({rect: e.getBoundingClientRect().toJSON(), variable: getComputedStyle(e).getPropertyValue('--easyedu-sticky-selection-center')}));
            }
            await compare(row);
            console.log(JSON.stringify({key: row.key, pass: row.pass, nodes: row.nodeCount, changes: row.differences.length, pixelIdentical: row.pixelIdentical}));
            if (!pilot && scope === 'matrix' && (surface === 'sm' || surface === 'mass')) {
                await page.goto(base.origin + url, {waitUntil: 'domcontentloaded'});
                if (surface === 'sm') await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 180000});
                await page.waitForLoadState('networkidle', {timeout: 60000});
                const opener = page.locator('[data-easyedu-navigation-open]:visible').first();
                if (await opener.count()) {
                    await opener.click();
                    const navRow = {lang, width, surface: surface + '-drawer', key: `${lang}-${width}-${surface}-drawer`};
                    report.rows.push(navRow);
                    await compare(navRow);
                    console.log(JSON.stringify({key: navRow.key, pass: navRow.pass, changes: navRow.differences.length, pixelIdentical: navRow.pixelIdentical}));
                }
            }
        }
    }
    save();
    expect(report.errors).toEqual([]);
    expect(report.consoleErrors).toEqual([]);
    expect(report.writes).toEqual([]);
    expect(report.rows.filter(r => !r.pass).map(r => r.key)).toEqual([]);
});
