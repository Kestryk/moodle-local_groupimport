/* eslint-env node */
'use strict';
// GMI-C4: served Mass Import guided path "Check a file without importing anything" (cahier 1.15).
// Real page, real Guide engine, real Moodle file picker and preview; no route or render mocks.
// The six milestones, the reload resume, the two K18-07 warnings, and NO confirmimport=1 request.
// Usage: node test-mi-guide-path-browser.cjs <playwright dir> <secret file> <output dir> [base URL]
// Optional MI_CASES="1600:fr,390:en". Writes nothing but a preview session and a user draft file.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwrightDir, secretPath, outputPath, baseArg] = process.argv.slice(2);
assert.ok(playwrightDir && secretPath && outputPath, 'Usage: <playwright dir> <secret> <output dir> [base]');
const {chromium} = require(path.join(playwrightDir, 'playwright'));
const base = baseArg || 'http://localhost:8052';
assert.match(base, /^http:\/\/localhost:805[245]$/, 'Claude test copies only');
const cases = (process.env.MI_CASES || '1600:fr,390:en').split(',').map(item => {
    const [width, lang] = item.split(':');
    return {width: Number(width), lang};
});
const PATH = 'mi-review-without-importing';
const WARNING = {
    fr: 'Ce parcours utilise votre fichier et peut modifier le cours. Prévisualiser ne change rien. ' +
        'Arrêtez-vous sur Annuler\u00a0: cliquer sur Lancer l’import modifie réellement le cours.',
    en: 'This tour uses your file and may change the course. Previewing changes nothing. ' +
        'Stop at Cancel: clicking Run import really changes the course.',
};
const STEPS = ['download-example', 'add-file', 'preview-file', 'exclude-row', 'read-strategy', 'cancel-preview'];
fs.mkdirSync(outputPath, {recursive: true});
const results = [];
const save = () => fs.writeFileSync(path.join(outputPath, 'mi-guide-path.json'), JSON.stringify(results, null, 2));

// Page-side recorder installed before any script: every element that ever carries the Guide
// highlight class, and whether "Run import" ever did.
const recorder = () => {
    window.__miHighlights = [];
    window.__miRunHighlighted = false;
    window.__xhr = [];
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        window.__xhr.push('open ' + method + ' ' + String(url).slice(0, 80));
        this.addEventListener('loadend', () => window.__xhr.push('end ' + this.status + ' ' + String(url).slice(0, 60)));
        return open.apply(this, arguments);
    };
    const describe = node => node.getAttribute('data-easyedu-navigation-item-id') ||
        (node.hasAttribute('data-local-groupimport-preview-cancel') ? 'cancel' : '') ||
        (node.matches('input[name^="rowenabled["]') ? 'rowenabled' : '') || node.id || node.className.toString().split(' ')[0];
    new MutationObserver(records => records.forEach(record => {
        const node = record.target;
        if (node.classList && node.classList.contains('is-easyedu-guide-highlight-target')) {
            window.__miHighlights.push(describe(node));
            if (node.matches('[data-local-groupimport-preview-submit]') || node.closest('[data-local-groupimport-preview-submit]')) {
                window.__miRunHighlighted = true;
            }
        }
    })).observe(document, {attributes: true, attributeFilter: ['class'], subtree: true});
};

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
const stepState = page => page.evaluate(() => {
    const checklist = document.querySelector('[data-easyedu-guide-checklist]');
    return {
        visible: !!checklist && !checklist.hidden,
        path: checklist ? checklist.getAttribute('data-easyedu-guide-path') : null,
        complete: Array.from(document.querySelectorAll('[data-easyedu-guide-checklist] [data-easyedu-guide-step-id].is-complete'))
            .map(node => node.getAttribute('data-easyedu-guide-step-id')),
        active: (document.querySelector('[data-easyedu-guide-checklist] [data-easyedu-guide-step-id].is-active') || {})
            .getAttribute?.('data-easyedu-guide-step-id') || null,
        highlighted: Array.from(document.querySelectorAll('.is-easyedu-guide-highlight-target')).map(node =>
            node.getAttribute('data-easyedu-navigation-item-id') || node.id ||
            (node.hasAttribute('data-local-groupimport-preview-cancel') ? 'cancel' : '') ||
            (node.matches('input[name^="rowenabled["]') ? 'rowenabled' : '') || node.className.toString().split(' ')[0]),
    };
});
const waitComplete = (page, step) => page.waitForFunction(id =>
    !!document.querySelector('[data-easyedu-guide-checklist] [data-easyedu-guide-step-id="' + id + '"].is-complete'),
step, {timeout: 20000});
const waitHighlight = (page, selector) => page.waitForFunction(css => {
    const node = document.querySelector('.is-easyedu-guide-highlight-target');
    return !!node && node.matches(css);
}, selector, {timeout: 20000});
const expandChecklist = async page => {
    const restore = page.locator('[data-easyedu-guide-checklist].is-minimized [data-easyedu-guide-checklist-restore]');
    if (await restore.count() && await restore.first().isVisible()) {
        await restore.first().click();
    } else {
        const minimize = page.locator('[data-easyedu-guide-checklist].is-minimized [data-easyedu-guide-checklist-minimize]');
        if (await minimize.count() && await minimize.first().isVisible()) {
            await minimize.first().click();
        }
    }
};

(async() => {
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true});
    try {
        for (const {width, lang} of cases) {
            const compact = width <= 1024;
            const row = {width, lang, errors: [], confirmImportRequests: [], posts: 0, steps: {}};
            results.push(row);
            const context = await browser.newContext({viewport: {width, height: compact ? 844 : 1000},
                hasTouch: compact, acceptDownloads: true});
            await context.addInitScript(recorder);
            const page = await context.newPage();
            page.on('pageerror', error => row.errors.push(error.message));
            page.on('console', message => {
                if (message.type() === 'error') {
                    row.errors.push(message.text());
                }
            });
            page.on('response', response => {
                if (/repository_ajax|dndupload/.test(response.url())) {
                    row.uploads = (row.uploads || []).concat(response.status() + ' ' + response.url().split('?')[0]);
                }
            });
            page.on('request', request => {
                let body = '';
                try {
                    const buffer = request.postDataBuffer();
                    body = buffer ? buffer.toString('latin1') : '';
                } catch (error) {
                    body = '';
                }
                if (request.method() === 'POST') {
                    row.posts++;
                }
                if (/confirmimport=1/.test(request.url()) || /(^|&)confirmimport=1(&|$)/.test(body) ||
                        /name="confirmimport"\r\n\r\n1/.test(body)) {
                    row.confirmImportRequests.push(request.url());
                }
            });
            try {
                await page.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
                await page.locator('#username').fill('claude-sm-test');
                await page.locator('#password').fill(fs.readFileSync(secretPath, 'utf8').trim());
                await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'),
                    {timeout: 180000, waitUntil: 'domcontentloaded'}), page.locator('#loginbtn').click({noWaitAfter: true})]);
                const errorStart = row.errors.length;
                await page.goto(base + '/local/groupimport/index.php?id=71&lang=' + lang,
                    {waitUntil: 'domcontentloaded', timeout: 180000});
                await ready(page);
                assert.equal(await page.evaluate(() => document.documentElement.lang.slice(0, 2)), lang, 'document language');
                // A download link clicked while Moodle still loads its file picker (YUI) cancels that
                // loading in Chrome: like a teacher reading the page, start once the picker is ready.
                await page.locator('#local_groupimport-form [id^="filepicker-button-"]').waitFor({state: 'visible', timeout: 180000});

                // Open the Guide with the compass (drawer launcher in compact) and reach lesson 5.
                if (compact) {
                    await page.locator('#local-groupimport-import-navigation [data-easyedu-navigation-open]').click();
                    await page.locator('[data-easyedu-responsive-guide-launcher]').click();
                } else {
                    await page.locator('#local-groupimport-import-navigation [data-easyedu-guide-open]').click();
                }
                await page.waitForSelector('[data-easyedu-guide-modal].is-open', {timeout: 20000});
                await page.locator('[data-easyedu-guide-nav-item="4"]').click();
                const slide = page.locator('[data-easyedu-guide-slide].is-active');
                const startWarning = slide.locator('[data-easyedu-guide-path-warning] .easyedu-notice--warning');
                await startWarning.waitFor({state: 'visible', timeout: 10000});
                row.startWarning = (await startWarning.innerText()).trim();
                assert.equal(row.startWarning, WARNING[lang], 'warning at the start of the path (K18-07)');
                const start = slide.locator('[data-easyedu-guide-start-path="' + PATH + '"]');
                row.startWarningBeforeStart = await page.evaluate(([warning, button]) =>
                    // eslint-disable-next-line no-bitwise
                    !!(warning.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING),
                [await startWarning.elementHandle(), await start.elementHandle()]);
                assert.ok(row.startWarningBeforeStart, 'start warning precedes the start button');
                if (process.env.MI_SHOTS) {
                    await page.screenshot({path: path.join(outputPath, 'gmi-c4-path-card-' + width + '-' + lang + '.png')});
                }
                await start.click();

                // 1. Download the example (compact: inside the drawer opened by mi:open-navigation).
                await page.waitForFunction(id => {
                    const checklist = document.querySelector('[data-easyedu-guide-checklist]');
                    return checklist && !checklist.hidden && checklist.getAttribute('data-easyedu-guide-path') === id;
                }, PATH, {timeout: 20000});
                await waitHighlight(page, '[data-easyedu-navigation-item-id="mass-import-download-template"]');
                row.steps.s1 = await stepState(page);
                if (compact) {
                    row.steps.s1.drawerOpen = await page.locator('#local-groupimport-import-navigation-panel.is-open').count() === 1;
                    assert.ok(row.steps.s1.drawerOpen, 'compact: mi:open-navigation opened the drawer');
                }
                const link = page.locator('.is-easyedu-guide-highlight-target a');
                const [download] = await Promise.all([page.waitForEvent('download', {timeout: 60000}),
                    link.click({noWaitAfter: true})]);
                const examplePath = path.join(outputPath, 'example-' + width + '-' + lang + '.xlsx');
                await download.saveAs(examplePath);
                await waitComplete(page, 'download-example');

                // 2. Add the file: the milestone follows the completed picker callback.
                await waitHighlight(page, '.easyedu-file-deposit');
                row.steps.s2 = await stepState(page);
                if (compact) {
                    assert.equal(await page.locator('#local-groupimport-import-navigation-panel.is-open').count(), 0,
                        'compact: the drawer closes for the deposit step');
                }
                // Let the deposit highlight and its scroll settle before adding the file.
                await page.waitForTimeout(1000);
                await addFile(page, compact, 'td-guide-example.xlsx', fs.readFileSync(examplePath),
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                // Plain polling: the upload is a native XHR of the Moodle picker.
                for (let tries = 0; tries < 180; tries++) {
                    await page.waitForTimeout(500);
                    if (await page.evaluate(() => {
                        const name = document.querySelector('#local_groupimport-form .filepicker-filename a');
                        return !!name && name.textContent.trim() !== '';
                    })) {
                        break;
                    }
                }
                await waitComplete(page, 'add-file');

                // 3. Preview: the page reloads, the path is offered again, Resume completes the milestone.
                await waitHighlight(page, '#id_submitbutton');
                row.steps.s3before = await stepState(page);
                await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                    page.locator('#id_submitbutton').click({noWaitAfter: true})]);
                await ready(page);
                assert.ok(await page.locator('#local-groupimport-import.has-preview').count(), 'preview page after reload');
                const resume = page.locator('[data-easyedu-guide-resume]:not([hidden]) [data-easyedu-guide-resume-path]');
                await resume.waitFor({state: 'visible', timeout: 20000});
                row.resumeLabel = (await resume.innerText()).trim();
                assert.equal(await page.evaluate(() => document.querySelector('[data-easyedu-guide-checklist]').hidden), true,
                    'unfinished progress is offered, not imposed');
                await resume.click();
                await waitComplete(page, 'preview-file');
                row.uploadCollapsedAfterResume = await page.locator('#local-groupimport-import.is-upload-collapsed').count() === 1;

                // 4. Leave out a flagged row.
                await waitHighlight(page, 'input[name^="rowenabled["]');
                row.steps.s4 = await stepState(page);
                const pathWarning = page.locator('[data-local-groupimport-guide-path-warning]');
                assert.ok(await pathWarning.isVisible(), 'warning before Run import while the path runs');
                await page.locator('.is-easyedu-guide-highlight-target').uncheck();
                await waitComplete(page, 'exclude-row');

                // 5. Read the strategy (informative: click the checklist step).
                await waitHighlight(page, '.local-groupimport-import-preview__strategy');
                row.steps.s5 = await stepState(page);
                await expandChecklist(page);
                await page.locator('[data-easyedu-guide-checklist] [data-easyedu-guide-step-id="read-strategy"]').click();
                await waitComplete(page, 'read-strategy');

                // 6. Cancel without importing; the warning sits right before the only course-changing button.
                await waitHighlight(page, '[data-local-groupimport-preview-cancel]');
                row.steps.s6 = await stepState(page);
                row.runWarning = await pathWarning.evaluate(node => {
                    const actions = document.querySelector('.local-groupimport-import-preview__actions');
                    const box = node.getBoundingClientRect();
                    const next = actions.getBoundingClientRect();
                    return {text: node.innerText.trim(), visible: !node.hidden && box.height > 0,
                        nextIsActions: node.nextElementSibling === actions, above: box.bottom <= next.top + 0.5,
                        sameWidth: Math.abs(box.left - next.left) <= 0.5};
                });
                assert.equal(row.runWarning.text, WARNING[lang]);
                assert.ok(row.runWarning.visible && row.runWarning.nextIsActions && row.runWarning.above,
                    'warning immediately before Run import');
                if (process.env.MI_SHOTS) {
                    await page.screenshot({path: path.join(outputPath, 'gmi-c4-path-cancel-' + width + '-' + lang + '.png')});
                }
                row.runHighlighted = await page.evaluate(() => window.__miRunHighlighted);
                assert.equal(row.runHighlighted, false, 'Run import is never highlighted');
                await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 180000}),
                    page.locator('[data-local-groupimport-preview-cancel]').click({noWaitAfter: true})]);
                await ready(page);
                row.afterCancel = await page.evaluate(() => ({
                    preview: document.querySelector('#local-groupimport-import').classList.contains('has-preview'),
                    resumeOffered: !document.querySelector('[data-easyedu-guide-resume]').hidden,
                    checklistHidden: document.querySelector('[data-easyedu-guide-checklist]').hidden,
                }));
                assert.deepEqual(row.afterCancel, {preview: false, resumeOffered: false, checklistHidden: true},
                    'a completed path is never offered again');
                assert.deepEqual(row.confirmImportRequests, [], 'no confirmimport=1 request');
                assert.ok(row.posts >= 1, 'the preview POST was observed by the recorder');
                assert.deepEqual(row.errors.slice(errorStart), [], 'no console error');
                STEPS.forEach(step => assert.ok(row.steps.s6.complete.includes(step) || step === 'cancel-preview', step));
                row.passed = true;
            } catch (error) {
                row.passed = false;
                row.failure = error.message;
                row.xhr = await page.evaluate(() => (window.__xhr || []).slice(-12)).catch(() => null);
                await page.screenshot({path: path.join(outputPath, 'gmi-c4-path-fail-' + width + '-' + lang + '.png')})
                    .catch(() => {});
            } finally {
                save();
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
    const failed = results.filter(row => !row.passed);
    console.log(JSON.stringify({test: 'mi-guide-path-browser', passed: failed.length === 0,
        cases: results.map(row => ({width: row.width, lang: row.lang, passed: row.passed, failure: row.failure,
            confirmImportRequests: row.confirmImportRequests.length, errors: row.errors.length}))}));
    if (failed.length) {
        process.exitCode = 1;
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
