/* eslint-env node */
'use strict';
// Owned :8055 fixture. Actual modal controllers and data; no render or network mocks.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwrightPath, secretPath, fixturePath, outputPath] = process.argv.slice(2);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const base = 'http://localhost:8055';
const results = [];
const prefix = '.local-groupimport-easystud-entity';
const requestedCases = process.env.EASYSTUD_FICHES_CASES ?
    JSON.parse(process.env.EASYSTUD_FICHES_CASES) : null;
const save = () => fs.writeFileSync(path.join(outputPath, 'results.json'), JSON.stringify({results}, null, 2));
async function settle(page, modal) {
    await modal.waitFor({state: 'visible', timeout: 60000});
    await page.waitForFunction(selector => {
        const modal = document.querySelector(selector);
        return modal && !modal.querySelector('[data-easystud-entity-retry]') &&
            !modal.querySelector('.local-groupimport-easystud-entity__skeleton') &&
            !modal.querySelector('[data-easystud-save-advanced-settings][disabled]');
    }, await modal.getAttribute('data-easystud-user-modal') !== null ?
        '[data-easystud-user-modal]' : '[data-easystud-advanced-settings-modal]', {timeout: 90000});
    await modal.evaluate(async node => {
        const finite = node.getAnimations({subtree: true}).filter(animation =>
            Number.isFinite(animation.effect.getComputedTiming().endTime));
        await Promise.all(finite.map(animation => animation.finished.catch(() => {})));
    });
}
async function measures(modal) {
    return modal.evaluate(node => {
        const box = element => {
            const rect = element.getBoundingClientRect();
            return {x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2};
        };
        const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
        const relationRows = [...node.querySelectorAll('.easyedu-related-person-row--group, ' +
            '.easyedu-related-person-row--grouping')].filter(visible).map(row => ({
            ...box(row), background: getComputedStyle(row).backgroundColor,
            type: row.classList.contains('easyedu-related-person-row--group') ? 'group' : 'grouping',
            border: getComputedStyle(row).borderInlineStartWidth,
            hasTitle: !!row.querySelector('[title]'),
        }));
        const removers = [...node.querySelectorAll('.easyedu-related-person-row__remove')].filter(visible).map(button => {
            const range = document.createRange();
            range.selectNodeContents(button.querySelector('span') || button);
            const glyph = range.getBoundingClientRect();
            const rect = box(button);
            return {...rect, opacity: getComputedStyle(button).opacity,
                dx: Math.abs(rect.cx - glyph.x - glyph.width / 2),
                dy: Math.abs(rect.cy - glyph.y - glyph.height / 2)};
        });
        const picker = node.querySelector('.easyedu-filepicker--compact');
        const pickerBox = picker ? box(picker) : null;
        const pickerItems = picker ? [...picker.querySelectorAll(':scope > .easyedu-filepicker__icon, :scope > button')].map(element => ({
            ...box(element), dx: Math.abs(box(element).cx - pickerBox.cx),
        })) : [];
        return {
            counters: node.querySelectorAll('summary .local-groupimport-easystud-entity__relation-count').length,
            rolePills: node.querySelectorAll('.local-groupimport-easystud-entity__pill--role').length,
            context: !!node.querySelector('.local-groupimport-easystud-entity__context')?.textContent.trim(),
            relationRows, removers, picker: pickerBox, pickerItems,
            nativeInput: !!picker?.querySelector('input[type="file"][accept="image/*"]'),
            overflow: node.scrollWidth > node.clientWidth + 1,
            coarse: matchMedia('(pointer: coarse)').matches,
        };
    });
}
(async () => {
    fs.mkdirSync(outputPath, {recursive: true});
    const browser = await require(playwrightPath).chromium.launch({
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    });
    try {
        for (const width of [1600, 768, 390]) {
            if (requestedCases && !requestedCases.some(item => item.width === width)) { continue; }
            const context = await browser.newContext({viewport: {width, height: width === 1600 ? 1000 : 1024},
                hasTouch: width < 1024});
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); } });
            await page.route('**/*', route => new URL(route.request().url()).origin === base ||
                !route.request().url().startsWith('http') ? route.continue() : route.abort());
            await page.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.locator('#username').fill('claude-sm-test');
            await page.locator('#password').fill(fs.readFileSync(secretPath, 'utf8').trim());
            await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'),
                {timeout: 180000, waitUntil: 'domcontentloaded'}), page.locator('#loginbtn').click({noWaitAfter: true})]);
            for (const lang of ['fr', 'en']) {
                if (requestedCases && !requestedCases.some(item => item.width === width && item.lang === lang)) { continue; }
                const row = {width, lang, errors: [], modals: {}};
                results.push(row);
                const errorStart = errors.length;
                try {
                    await page.goto(base + '/local/groupimport/manage.php?id=71&lang=' + lang,
                        {waitUntil: 'domcontentloaded', timeout: 180000});
                    await page.waitForSelector('[data-easystud-loading-state="ready"]', {timeout: 180000});
                    if (width < 1024) {
                        await page.locator('[data-easystud-mobile-view="participants"]').click();
                    }
                    await page.waitForSelector('[data-easystud-open-user="' + fixture.userId + '"]', {state: 'attached'});
                    // Native participant trigger. Group/grouping use their actual exported opener on real cards,
                    // so the test isolates the sheet contract from catalogue/tab/menu layout.
                    await page.locator('[data-easystud-open-user="' + fixture.userId + '"]').first().evaluate(button => button.click());
                    let modal = page.locator('[data-easystud-user-modal]');
                    await settle(page, modal);
                    row.modals.participant = await measures(modal);
                    if (lang === 'fr' && width === 390) {
                        await modal.screenshot({path: path.join(outputPath, 'participant-fr-390.png')});
                    }
                    assert.equal(row.modals.participant.counters, 0);
                    assert.ok(row.modals.participant.relationRows.some(item => item.type === 'group'));
                    assert.ok(row.modals.participant.relationRows.some(item => item.type === 'grouping'));
                    await page.keyboard.press('Escape');
                    await modal.waitFor({state: 'hidden'});
                    for (const type of ['group', 'grouping']) {
                        if (width < 1024) {
                            await page.locator('[data-easystud-mobile-view="' + type + 's"]').click();
                        }
                        await page.waitForSelector('[data-easystud-' + type + '-id="' +
                            (type === 'group' ? fixture.groups[0] : fixture.groupings[0]) + '"]',
                        {state: 'attached', timeout: 60000});
                        await page.evaluate(({type, id}) => new Promise((resolve, reject) => {
                            require(['local_groupimport/local/cm/advanced_settings'], module => {
                                try {
                                    const root = document.querySelector('#local-groupimport-easystud');
                                    const item = root.querySelector('[data-easystud-' + type + '-id="' + id + '"]');
                                    if (!item) { throw new Error('Real fixture card absent: ' + type); }
                                    module.openAdvancedSettingsModal(root, item);
                                    resolve();
                                } catch (error) { reject(error); }
                            }, reject);
                        }), {type, id: type === 'group' ? fixture.groups[0] : fixture.groupings[0]});
                        modal = page.locator('[data-easystud-advanced-settings-modal]');
                        await settle(page, modal);
                        row.modals[type] = await measures(modal);
                        if (lang === 'fr' && (type === 'group' || width === 1600)) {
                            await modal.screenshot({path: path.join(outputPath, type + '-fr-' + width + '.png')});
                        }
                        assert.equal(row.modals[type].counters, 0);
                        assert.ok(row.modals[type].context, 'Identity context retained');
                        assert.ok(row.modals[type].relationRows.length > 0, 'Real relationship rows');
                        if (type === 'group') {
                            assert.ok(row.modals[type].nativeInput, 'Compact Kit file input');
                            for (const item of row.modals[type].pickerItems) { assert.ok(item.dx <= 0.5); }
                            for (const button of row.modals[type].removers) {
                                assert.equal(button.height, button.width);
                                assert.ok(Math.abs(button.height - 23.2) < 0.02, 'Kit remove dimension');
                                assert.ok(button.dx <= 0.5 && button.dy <= 0.5, 'Remove glyph centred');
                                if (width < 1024) { assert.equal(button.opacity, '1', 'Touch remove always visible'); }
                            }
                            assert.ok(row.modals[type].removers.length > 0);
                        }
                        await page.keyboard.press('Escape');
                        await modal.waitFor({state: 'hidden'});
                    }
                    row.errors = errors.slice(errorStart);
                    assert.deepEqual(row.errors, []);
                    row.passed = true;
                } catch (error) {
                    row.passed = false;
                    row.failure = error.message;
                    row.errors = errors.slice(errorStart);
                }
                save();
            }
            await context.close();
        }
    } finally { await browser.close(); save(); }
    assert.equal(results.length, requestedCases ? requestedCases.length : 6);
    assert.ok(results.every(result => result.passed), 'Every native locale/width sheet case must pass');
    console.log(JSON.stringify({passed: true, cases: results.length, outputPath}));
})().catch(error => { save(); console.error(error.message); process.exitCode = 1; });
