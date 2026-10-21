/* eslint-env node */
// K20-10: actual group dialog, existing localized action label, no Save or image mutation.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [pw, base, secretFile, output] = process.argv.slice(2);
assert([pw, secretFile, output].every(value => value && path.isAbsolute(value)));
const target = new URL(base);
assert(['localhost', '127.0.0.1'].includes(target.hostname));
assert(['8052', '8054', '8055'].includes(target.port));
assert(!fs.existsSync(output), 'Use a fresh evidence directory');
fs.mkdirSync(output, {recursive: true});
const report = {rows: [], errors: [], blockedWrites: []};
const save = () => fs.writeFileSync(path.join(output, 'native.json'), JSON.stringify(report, null, 2));
const {chromium} = require(pw);
(async () => {
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
    const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
    const page = await context.newPage(); page.setDefaultTimeout(120000);
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('pageerror', error => report.errors.push(error.message));
    await page.route('**/local/groupimport/ajax.php*', async route => {
        const action = new URLSearchParams(route.request().postData() || '').get('action');
        if (action === 'movestatus') return route.continue();
        report.blockedWrites.push(action); return route.abort();
    });
    try {
        const login = await context.request.get(base + '/login/index.php');
        const token = (await login.text()).match(/name="logintoken" value="([^"]+)"/)[1];
        const response = await context.request.post(base + '/login/index.php', {form: {
            username: 'admin', password: fs.readFileSync(secretFile, 'utf8').trim(), logintoken: token,
        }, maxRedirects: 0});
        assert([302, 303].includes(response.status()));
        for (const lang of ['fr', 'en']) for (const width of [1600, 390]) {
            await page.setViewportSize({width, height: 1000});
            await page.goto(base + '/local/groupimport/manage.php?id=71&lang=' + lang,
                {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.waitForFunction(() => document.querySelector('#local-groupimport-easystud')?.getAttribute('data-easystud-sm-ready') === '1',
                null, {timeout: 180000});
            if (width === 390) await page.locator('[data-easystud-mobile-view="groups"]:visible').click();
            const card = page.locator('[data-easystud-group-id][data-easystud-advanced-type="group"]:visible').first();
            const direct = card.locator('[data-easystud-open-advanced-settings]:visible').first();
            if (await direct.count()) await direct.click();
            else {
                await card.locator('[data-easystud-group-actions-toggle]:visible').first().click();
                await page.locator('[data-easystud-context-action="group-open-advanced-settings"]:visible').click();
            }
            const modal = page.locator('[data-easystud-advanced-settings-modal]:visible');
            const input = modal.locator('[data-easystud-delete-picture-input]');
            await input.waitFor({state: 'attached'});
            await page.waitForFunction(() => {
                const control = document.querySelector('[data-easystud-advanced-settings-modal] [data-easystud-delete-picture-input]');
                return control && !control.matches(':disabled');
            });
            await page.evaluate(async () => {
                await document.fonts.ready;
                await Promise.allSettled(document.getAnimations().filter(animation =>
                    animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished));
            });
            const toggle = modal.locator('.local-groupimport-easystud-settings-modal__image-toggle');
            await toggle.scrollIntoViewIfNeeded();
            const states = [];
            for (const checked of [false, true]) {
                if (checked) await toggle.click();
                const state = await toggle.evaluate(node => {
                    const small = node.querySelector('[data-easystud-settings-toggle-state]');
                    const action = node.querySelector('strong');
                    const checkbox = node.querySelector('input');
                    const cs = getComputedStyle(small), as = getComputedStyle(action), rect = node.getBoundingClientRect();
                    const range = document.createRange(); range.selectNodeContents(action); const label = range.getBoundingClientRect();
                    return {checked: checkbox.checked, action: action.textContent.trim(), technical: small.textContent.trim(),
                        stateStyle: {clip: cs.clip, clipPath: cs.clipPath, width: cs.width, height: cs.height,
                            position: cs.position, overflow: cs.overflow, display: cs.display, visibility: cs.visibility},
                        actionStyle: {clip: as.clip, display: as.display, visibility: as.visibility},
                        frame: {width: rect.width, height: rect.height}, label: {left: label.left, right: label.right, top: label.top, bottom: label.bottom},
                        control: {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom},
                        nativeName: [...checkbox.labels].map(item => item.textContent.trim()).join(' '),
                        stateStillAccessible: !small.hidden && small.getAttribute('aria-hidden') !== 'true' && cs.display !== 'none' && cs.visibility !== 'hidden'};
                });
                assert.equal(state.checked, checked);
                assert(state.action.length > 0 && !/^(enable|disable|enabled|disabled)$/i.test(state.action));
                assert(state.stateStillAccessible);
                const clipped = state.stateStyle.clip === 'rect(0px, 0px, 0px, 0px)' || state.stateStyle.clipPath.includes('50%');
                assert(clipped, 'State caption must be visually clipped by the shared Kit recipe');
                assert(state.label.left >= state.control.left && state.label.right <= state.control.right);
                assert(state.label.top >= state.control.top && state.label.bottom <= state.control.bottom);
                states.push(state);
                if (width === 1600) await page.screenshot({path: path.join(output, lang + '-1600-' + (checked ? 'checked' : 'unchecked') + '.png')});
            }
            assert.equal(states[0].action, states[1].action);
            report.rows.push({lang, width, states}); save();
            await modal.locator('[data-easystud-close-advanced-settings]').first().click();
        }
        assert.equal(report.rows.length, 4); assert.deepEqual(report.errors, []); assert.deepEqual(report.blockedWrites, []);
        report.status = 'PASS'; save();
    } catch (error) { report.status = 'FAIL'; report.failure = error.stack; save(); throw error; }
    finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
