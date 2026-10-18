/* eslint-env node */
'use strict';
// GMI-C4: served Mass Import Guide compass and "Show in the interface" (cahier 1.14).
// Compact (390 by default): the compass is reachable from the navigation drawer without the Student
// Management bundle; every lesson 2-9 cue reaches its target on an empty page and on a preview page
// (preview-only targets fall back to the results card). Real page and engine, no mocks.
// Usage: node test-mi-guide-compass-390-browser.cjs <playwright dir> <secret file> <output dir> [base URL]
// Optional MI_WIDTHS="390,768,1600", MI_LANGS="fr,en", MI_PREVIEW="0" (empty page only).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwrightDir, secretPath, outputPath, baseArg] = process.argv.slice(2);
assert.ok(playwrightDir && secretPath && outputPath, 'Usage: <playwright dir> <secret> <output dir> [base]');
const {chromium} = require(path.join(playwrightDir, 'playwright'));
const base = baseArg || 'http://localhost:8052';
assert.match(base, /^http:\/\/localhost:805[245]$/, 'Claude test copies only');
const widths = (process.env.MI_WIDTHS || '390').split(',').map(Number);
const langs = (process.env.MI_LANGS || 'fr,en').split(',');
const withPreview = process.env.MI_PREVIEW !== '0';
const TEMPLATE = '[data-easyedu-navigation-item-id="mass-import-download-template"]';
const RESULTS = '#local_groupimport-results';
// Lesson index (0-based) => expected highlighted element, empty page then preview page.
const EXPECTED = {
    empty: {1: '.local-groupimport-import-card--upload', 2: TEMPLATE, 3: '#local_groupimport-form .easyedu-file-deposit',
        4: RESULTS, 5: RESULTS, 6: RESULTS, 7: RESULTS, 8: '[data-local-groupimport-history-list]'},
    preview: {3: '#local_groupimport-form .easyedu-file-deposit', 4: '.local-groupimport-import-preview__table-wrap',
        5: '.local-groupimport-import-preview__strategy', 6: '[data-local-groupimport-preview-submit]', 7: RESULTS},
};
fs.mkdirSync(outputPath, {recursive: true});
const results = [];
const save = () => fs.writeFileSync(path.join(outputPath, 'mi-guide-compass.json'), JSON.stringify(results, null, 2));

// Desktop: drop on the deposit zone (Moodle's own drop target). Touch (compact): browse the device
// through the native file picker, as the cahier teaches (no drag on phones).
const addFile = async(page, compact, name, buffer, mimeType) => {
    // Moodle initialises its file picker asynchronously (YUI): wait for its Choose button first.
    await page.locator('#local_groupimport-form [id^="filepicker-button-"]').waitFor({state: 'visible', timeout: 180000});
    if (compact) {
        await page.locator('#local_groupimport-form [id^="filepicker-button-"]').click();
        const tab = page.getByRole('tab', {name: /Déposer un fichier|Upload a file/});
        await tab.first().click({timeout: 60000});
        const upload = page.locator('input[type="file"][name="repo_upload_file"]');
        await upload.waitFor({state: 'attached', timeout: 60000});
        await upload.setInputFiles({name, mimeType, buffer});
        await page.locator('.fp-upload-btn').filter({visible: true}).first().click();
        return;
    }
    await page.locator('#local-groupimport-import').evaluate((node, [data, fileName, type]) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File([new Uint8Array(data)], fileName, {type}));
        const target = node.querySelector('#local_groupimport-form .filepicker-filelist') || node;
        ['dragenter', 'dragover', 'drop'].forEach(eventType => target.dispatchEvent(new DragEvent(eventType,
            {bubbles: true, cancelable: true, dataTransfer: transfer})));
    }, [Array.from(buffer), name, mimeType]);
};

const ready = async page => {
    await page.waitForSelector('#local-groupimport-import[data-easystud-loading-state="ready"]', {timeout: 180000});
    await page.waitForSelector('[data-easyedu-guide-root][data-easyedu-guide-bound]', {state: 'attached', timeout: 60000});
};

const openGuide = async(page, compact) => {
    const back = page.locator('[data-easyedu-guide-interface-return-button]');
    if (await back.count() && await back.first().isVisible()) {
        await back.first().click();
    } else if (compact) {
        const panel = page.locator('#local-groupimport-import-navigation-panel');
        if (!(await panel.evaluate(node => node.classList.contains('is-open')))) {
            await page.locator('#local-groupimport-import-navigation [data-easyedu-navigation-open]').click();
        }
        await page.locator('[data-easyedu-responsive-guide-launcher]').click();
    } else {
        await page.locator('#local-groupimport-import-navigation [data-easyedu-guide-open]').click();
    }
    await page.waitForSelector('[data-easyedu-guide-modal].is-open', {timeout: 20000});
};

const showTarget = async(page, compact, index, expected) => {
    await openGuide(page, compact);
    await page.locator('[data-easyedu-guide-nav-item="' + index + '"]').click();
    await page.waitForFunction(i => {
        const slide = document.querySelector('[data-easyedu-guide-slide].is-active');
        return slide && Number(slide.getAttribute('data-easyedu-guide-slide')) === i;
    }, index, {timeout: 10000}).catch(() => {});
    const show = page.locator('[data-easyedu-guide-modal] [data-easyedu-guide-show-target]').filter({visible: true}).first();
    await show.click();
    await page.waitForFunction(css => {
        const node = document.querySelector('.is-easyedu-guide-highlight-target');
        return !!node && node.matches(css);
    }, expected, {timeout: 20000});
    // Let the scroll settle before measuring.
    await page.waitForTimeout(700);
    return page.evaluate(css => {
        const node = document.querySelector('.is-easyedu-guide-highlight-target');
        const box = node.getBoundingClientRect();
        const panel = document.querySelector('#local-groupimport-import-navigation-panel');
        const modal = document.querySelector('[data-local-groupimport-history-modal]');
        return {matches: node.matches(css), width: Math.round(box.width), height: Math.round(box.height),
            inViewport: box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth,
            inDrawer: !!node.closest('[data-easyedu-navigation-panel]'), drawerOpen: panel.classList.contains('is-open'),
            historyOpen: !!modal && !modal.hidden};
    }, expected);
};

const closeOverlays = async page => {
    const dismiss = page.locator('[data-local-groupimport-history-modal]:not([hidden]) [data-local-groupimport-history-dismiss]');
    if (await dismiss.count()) {
        await dismiss.click();
        await page.waitForSelector('[data-local-groupimport-history-modal][hidden]', {state: 'attached', timeout: 10000});
    }
    const close = page.locator('#local-groupimport-import-navigation-panel.is-open [data-easyedu-navigation-close]');
    if (await close.count()) {
        await close.click();
    }
};

(async() => {
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true});
    try {
        for (const width of widths) {
            const compact = width <= 1024;
            const context = await browser.newContext({viewport: {width, height: compact ? 844 : 1000}, hasTouch: compact});
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => {
                if (message.type() === 'error') {
                    errors.push(message.text());
                }
            });
            const confirmImports = [];
            page.on('request', request => {
                let body = '';
                try {
                    const buffer = request.postDataBuffer();
                    body = buffer ? buffer.toString('latin1') : '';
                } catch (error) {
                    body = '';
                }
                if (/confirmimport/.test(request.url()) || /name="confirmimport"|confirmimport=1/.test(body)) {
                    confirmImports.push(request.url());
                }
            });
            await page.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.locator('#username').fill('claude-sm-test');
            await page.locator('#password').fill(fs.readFileSync(secretPath, 'utf8').trim());
            await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'),
                {timeout: 180000, waitUntil: 'domcontentloaded'}), page.locator('#loginbtn').click({noWaitAfter: true})]);
            for (const lang of langs) {
                const row = {width, lang, compass: null, empty: {}, preview: {}};
                results.push(row);
                const errorStart = errors.length;
                try {
                    await page.goto(base + '/local/groupimport/index.php?id=71&lang=' + lang,
                        {waitUntil: 'domcontentloaded', timeout: 180000});
                    await ready(page);
                    // Compass: compact = portalled Guide + launcher in the drawer; desktop = navigation launcher.
                    row.compass = await page.evaluate(() => {
                        const root = document.querySelector('[data-easyedu-guide-root]');
                        const source = document.querySelector('[data-easyedu-navigation-guide-source] [data-easyedu-guide-open]');
                        return {portalled: root.parentElement === document.body,
                            sourceLauncherHidden: !source || source.hidden || source.getClientRects().length === 0,
                            smBundleLoaded: !!(window.require && window.require.defined &&
                                window.require.defined('local_groupimport/course_manager'))};
                    });
                    if (compact) {
                        await page.locator('#local-groupimport-import-navigation [data-easyedu-navigation-open]').click();
                        const launcher = page.locator('[data-easyedu-responsive-guide-launcher]');
                        await launcher.waitFor({state: 'visible', timeout: 10000});
                        await page.locator('#local-groupimport-import-navigation-panel').evaluate(async node => {
                            const finite = node.getAnimations({subtree: true}).filter(animation =>
                                Number.isFinite(animation.effect.getComputedTiming().endTime));
                            await Promise.all(finite.map(animation => animation.finished.catch(() => {})));
                            await new Promise(resolve => setTimeout(resolve, 400));
                        });
                        Object.assign(row.compass, await launcher.evaluate(node => {
                            const box = node.getBoundingClientRect();
                            return {inDrawer: !!node.closest('[data-easyedu-navigation-panel]'), height: Math.round(box.height * 10) / 10,
                                label: node.innerText.trim(), left: Math.round(box.left), right: Math.round(box.right),
                                inViewport: box.right <= window.innerWidth + 0.5 && box.left >= -0.5};
                        }));
                        assert.ok(row.compass.portalled && row.compass.inDrawer && row.compass.inViewport,
                            'compact compass reachable in the drawer');
                        assert.ok(row.compass.height >= 44, 'compact compass is a 44 px target');
                        if (process.env.MI_SHOTS) {
                            await page.screenshot({path: path.join(outputPath, 'gmi-c4-compass-' + width + '-' + lang + '.png')});
                        }
                        await launcher.click();
                    } else {
                        const launcher = page.locator('#local-groupimport-import-navigation [data-easyedu-guide-open]');
                        assert.ok(await launcher.isVisible(), 'desktop compass visible in the navigation');
                        assert.equal(row.compass.portalled, false);
                        await launcher.click();
                    }
                    assert.equal(row.compass.smBundleLoaded, false, 'Student Management bundle is not loaded');
                    await page.waitForSelector('[data-easyedu-guide-modal].is-open', {timeout: 20000});
                    row.compass.modal = await page.evaluate(() => {
                        const box = document.querySelector('[data-easyedu-guide-modal] .easyedu-guide-modal__dialog, ' +
                            '[data-easyedu-guide-modal]').getBoundingClientRect();
                        return {left: Math.round(box.left), right: Math.round(box.right), fits: box.left >= -0.5 &&
                            box.right <= window.innerWidth + 0.5};
                    });
                    assert.ok(row.compass.modal.fits, 'Guide window fits the viewport');
                    await page.locator('[data-easyedu-guide-close]').filter({visible: true}).first().click();
                    await closeOverlays(page);

                    for (const [index, expected] of Object.entries(EXPECTED.empty)) {
                        const result = await showTarget(page, compact, Number(index), expected);
                        row.empty[Number(index) + 1] = result;
                        assert.ok(result.matches && result.inViewport && result.width > 0, 'empty page lesson ' + (Number(index) + 1));
                        if (expected === TEMPLATE && compact) {
                            assert.ok(result.inDrawer && result.drawerOpen, 'template link shown inside the opened drawer');
                        }
                        if (Number(index) === 8) {
                            assert.ok(result.historyOpen, 'mi:open-history opened the history window');
                        }
                        await closeOverlays(page);
                    }

                    if (withPreview) {
                        await addFile(page, compact, 'qa-gmi-c4.csv',
                            Buffer.from('username;group\nqa_gmi_c4_unknown_1;QA GMI C4\n'), 'text/csv');
                        await page.waitForFunction(() => {
                            const name = document.querySelector('#local_groupimport-form .filepicker-filename a');
                            return name && name.textContent.trim() !== '';
                        }, null, {timeout: 60000});
                        await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                            page.locator('#id_submitbutton').click({noWaitAfter: true})]);
                        await ready(page);
                        assert.ok(await page.locator('#local-groupimport-import.has-preview').count(), 'preview page');
                        // Run import / table / strategy first: lesson 4 unfolds the file column last.
                        for (const index of [4, 5, 6, 7, 3]) {
                            const result = await showTarget(page, compact, index, EXPECTED.preview[index]);
                            row.preview[index + 1] = result;
                            assert.ok(result.matches && result.inViewport && result.width > 0, 'preview page lesson ' + (index + 1));
                            await closeOverlays(page);
                        }
                        // Leave the preview without importing (clean test data).
                        await page.locator('[data-easyedu-guide-interface-return-dismiss]').filter({visible: true}).first()
                            .click().catch(() => {});
                        await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                            page.locator('[data-local-groupimport-preview-cancel]').click({noWaitAfter: true})]);
                        await ready(page);
                    }
                    row.errors = errors.slice(errorStart);
                    assert.deepEqual(row.errors, [], 'no console error');
                    assert.deepEqual(confirmImports, [], 'no confirmimport request');
                    row.passed = true;
                } catch (error) {
                    row.passed = false;
                    row.failure = error.message;
                    row.errors = errors.slice(errorStart);
                    await page.screenshot({path: path.join(outputPath, 'gmi-c4-compass-fail-' + width + '-' + lang + '.png')})
                        .catch(() => {});
                } finally {
                    save();
                }
            }
            await context.close();
        }
    } finally {
        await browser.close();
    }
    const failed = results.filter(row => !row.passed);
    console.log(JSON.stringify({test: 'mi-guide-compass-390-browser', passed: failed.length === 0,
        cases: results.map(row => ({width: row.width, lang: row.lang, passed: row.passed, failure: row.failure}))}));
    if (failed.length) {
        process.exitCode = 1;
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
