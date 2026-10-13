const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// local-supervised: fictional illustrations, isolated reading key; no business commands.
test('Current Guide scenes preserve natural cursor drop and mobile action paint without course writes', async({page}, info) => {
    test.setTimeout(540000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 390, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}}))),
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const workspace = page.locator('#local-groupimport-easystud');
    try {
        await expect(workspace).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language + '(?:-|$)'));
        await page.emulateMedia({reducedMotion: 'no-preference'});
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
        await page.evaluate(async() => {
            const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root);
            root.scenePaintQaConfig = config;
            Guide.init(root, {...config, firstVisit: false, welcomeOffer: false, storageKey: 'guide-scene-paint-qa'});
        });
        for (const width of [1280, 390]) {
            await page.setViewportSize({width, height: 1000});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(modal).toBeVisible();
            for (const [name, mode] of [['membership', 'add'], ['membership', 'move'], ['actions', 'move']]) {
                const scene = modal.locator('[data-easyedu-guide-scene="' + name + '"]');
                const index = await scene.evaluate(node => node.closest('[data-easyedu-guide-slide]')
                    .getAttribute('data-easyedu-guide-slide'));
                await modal.locator('[data-easyedu-guide-nav-item="0"]').click();
                await modal.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
                await expect(scene).toBeVisible();
                const modeButton = scene.locator('[data-guide-scene-command="' + mode + '"]');
                if (await modeButton.count()) await modeButton.click();
                await scene.evaluate(node => {
                    window.scenePaintQaStop?.();
                    const record = {cursorFrames: 0, menuFrames: 0, ghostFrames: 0, dropFrames: 0,
                        outsideDropFrames: 0, outboundFrames: 0, maxCursorGhostDrift: 0, maxSelectedCheckboxes: 0,
                        phases: [], dropStyle: null, overflow: []};
                    let frameId, initialOffset = null, active = true;
                    window.scenePaintQaRecord = record;
                    window.scenePaintQaStop = () => {active = false; cancelAnimationFrame(frameId);};
                    const visible = n => n && !n.hidden && n.getClientRects().length &&
                        Number(getComputedStyle(n).opacity) > .5;
                    const frame = () => {
                        if (!active || !node.isConnected) return;
                        const cursor = node.querySelector('[data-guide-cursor]');
                        const menu = node.querySelector('[data-guide-menu]');
                        const ghost = node.querySelector('[data-guide-ghost]');
                        const drop = node.querySelector('[data-guide-destination]');
                        if (visible(cursor)) record.cursorFrames++;
                        if (visible(menu)) record.menuFrames++;
                        record.maxSelectedCheckboxes = Math.max(record.maxSelectedCheckboxes,
                            node.querySelectorAll('[data-guide-illustrated-checkbox]:checked').length);
                        const phase = node.dataset.guidePhase;
                        if (phase && record.phases.at(-1) !== phase) record.phases.push(phase);
                        if (visible(ghost)) {
                            record.ghostFrames++;
                            const a = ghost.getBoundingClientRect(), b = drop.getBoundingClientRect();
                            const overlaps = a.right >= b.left && a.left <= b.right &&
                                a.bottom >= b.top && a.top <= b.bottom;
                            if (drop.classList.contains('is-guide-drop-target')) {
                                record.dropFrames++;
                                if (!overlaps) record.outsideDropFrames++;
                                const paint = getComputedStyle(drop, '::after');
                                record.dropStyle = {style: paint.borderTopStyle, color: paint.borderTopColor,
                                    z: Number(paint.zIndex), ghostZ: Number(getComputedStyle(ghost).zIndex)};
                            }
                            const outbound = ghost.getAnimations().some(animation =>
                                animation.effect.getKeyframes()[0]?.transform === 'translate(0,0)');
                            if (outbound && visible(cursor)) {
                                record.outboundFrames++;
                                const c = cursor.getBoundingClientRect(), offset = [c.x - a.x, c.y - a.y];
                                if (!initialOffset) initialOffset = offset;
                                record.maxCursorGhostDrift = Math.max(record.maxCursorGhostDrift,
                                    Math.abs(offset[0] - initialOffset[0]), Math.abs(offset[1] - initialOffset[1]));
                            }
                        }
                        frameId = requestAnimationFrame(frame);
                    };
                    frameId = requestAnimationFrame(frame);
                });
                await scene.locator('[data-guide-scene-command="start"]').click();
                await expect(modal.locator('[data-easyedu-guide-slide="' + index + '"] [data-guide-live]')).toHaveAttribute('data-guide-playback-state',
                    'finished', {timeout: 90000});
                const record = await scene.evaluate(node => {
                    window.scenePaintQaStop();
                    const record = window.scenePaintQaRecord;
                    record.overflow = Array.from(node.querySelectorAll('p, [data-guide-recap] li'))
                        .filter(n => !n.hidden && n.getClientRects().length && n.scrollWidth > n.clientWidth + 1)
                        .map(n => n.className);
                    record.recapVisible = !node.querySelector('[data-guide-recap]').hidden;
                    record.cursorHiddenAtEnd = node.querySelector('[data-guide-cursor]').hidden;
                    record.ghostRemovedAtEnd = !node.querySelector('[data-guide-ghost]');
                    record.originRemoved = !!node.querySelector('[data-guide-membership-origin].is-removed');
                    return record;
                });
                expect(record.cursorFrames).toBeGreaterThan(0);
                expect(record.overflow).toEqual([]);
                expect(record.recapVisible).toBe(true);
                expect(record.cursorHiddenAtEnd).toBe(true);
                expect(record.ghostRemovedAtEnd).toBe(true);
                if (name === 'actions') expect(record.maxSelectedCheckboxes).toBe(2);
                if (name === 'membership') expect(record.originRemoved).toBe(mode === 'move');
                if (width === 1280 && mode === 'add') {
                    expect(record.ghostFrames).toBeGreaterThan(10);
                    expect(record.dropFrames).toBeGreaterThan(0);
                    expect(record.outboundFrames).toBeGreaterThan(10);
                    expect(record.outsideDropFrames).toBe(0);
                    expect(record.maxCursorGhostDrift).toBeLessThan(2);
                    expect(record.dropStyle.style).toBe('dashed');
                    expect(record.dropStyle.z).toBeLessThan(record.dropStyle.ghostZ);
                } else expect(record.menuFrames).toBeGreaterThan(0);
                if (width === 390) expect(record.ghostFrames).toBe(0);
                rows.push({width, language, name, mode, record});
            }
            await modal.locator('[data-easyedu-guide-close]').click();
            await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(async() => {
            window.scenePaintQaStop?.();
            const root = document.querySelector('[data-easyedu-guide-root]');
            if (!root?.scenePaintQaConfig) return;
            const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
            Guide.destroy(root);
            localStorage.removeItem('guide-scene-paint-qa.checklist');
            localStorage.removeItem('guide-scene-paint-qa.checklist.before-' + root.scenePaintQaConfig.presentationKey);
        }).catch(() => {});
        fs.writeFileSync(info.outputPath('guide-current-scene-paint-native.json'),
            JSON.stringify({rows, errors, blocked, businessWrites: false, realUserProgressWritten: false,
                completeArtworkAcceptance: false}, null, 2));
    }
});
