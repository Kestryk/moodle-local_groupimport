/* eslint-env node */
// Isolated Kit/adapter interaction proof; no Moodle login, HTTP or settings write.
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(path.join(path.resolve(process.argv[2]), 'playwright'));
const root = path.resolve(__dirname, '../..');
(async() => {
    const browser = await chromium.launch({headless: true});
    try {
      for (const width of [1600, 768, 390]) {
       for (const motion of ['reduce', 'no-preference', 'disabled']) {
        const page = await browser.newPage();
        await page.setViewportSize({width, height: 1000});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.emulateMedia({reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference'});
        await page.setContent(`<main id="page-admin-setting-local_groupimport"><form id="adminsettings">
            <div><label for="mode">Default view</label><select id="mode" name="s_local_groupimport_defaultlayoutmode">
                <option value="both" selected>Complete</option><option value="groups">Groups</option></select></div>
            <div><label for="fields">Identifiers</label><select id="fields" name="s_local_groupimport_alloweduserfields[]" multiple>
                <option value="email" selected>Email</option><option value="username">Username</option></select></div>
            <label for="required">Required</label><select id="required" name="s_local_groupimport_required" required>
                <option value="a">Native fallback</option></select>
            <button type="reset">Reset</button></form></main>`);
        await page.evaluate(() => {
            window.modules = {};
            window.define = (name, deps, factory) => {
                // Moodle Babel modules publish through the AMD exports object;
                // handwritten controllers may instead return their public API.
                const exports = {};
                const result = factory(...deps.map(dep => dep === 'exports' ? exports : window.modules[dep]));
                window.modules[name] = result === undefined ? exports : result;
            };
        });
        for (const module of ['motion', 'searchable_choices', 'admin_choices']) {
            await page.addScriptTag({path: path.join(root, 'amd/build', `${module}.min.js`)});
        }
        await page.evaluate(animationsEnabled => {
            const labels = {search: 'Search', empty: 'No matches', none: 'None', count: '__count__ selected', clear: 'Clear'};
            window.modules['local_groupimport/admin_choices'].init(labels, animationsEnabled);
            window.modules['local_groupimport/admin_choices'].init(labels, animationsEnabled);
        }, motion !== 'disabled');
        assert.equal(await page.locator('.easyedu-searchable-choice').count(), 2, 'Idempotent adapter');
        assert.equal(await page.locator('.easyedu-searchable-choice--framed').count(), 2, 'Canonical framed Motion');
        assert.equal(await page.locator('#required').isVisible(), true, 'Required native fallback');
        const hosts = page.locator('.easyedu-searchable-choice');
        await hosts.nth(0).locator('button').first().click();
        if (motion === 'disabled' || motion === 'reduce') {
            assert.equal(await hosts.nth(0).locator('.easyedu-searchable-choice__panel')
                .evaluate(panel => panel.getAnimations().length), 0, 'Static policy keeps framed controls static');
        }
        await hosts.nth(0).locator('input[type=search]').fill('Groups');
        await hosts.nth(0).getByRole('button', {name: 'Groups', exact: true}).click();
        assert.equal(await page.locator('#mode').inputValue(), 'groups');
        await hosts.nth(1).locator('button').first().click();
        await hosts.nth(1).getByRole('button', {name: 'Username', exact: true}).click();
        assert.deepEqual(await page.locator('#fields').evaluate(s => [...s.selectedOptions].map(o => o.value)),
            ['email', 'username']);
        // This legacy regression starts from an OPEN list, not an unfinished
        // entry transition. The canonical framed engine now takes 360ms.
        await hosts.nth(1).locator('.easyedu-searchable-choice__panel').evaluate(async panel => {
            await Promise.all(panel.getAnimations().map(animation => animation.finished.catch(() => {})));
        });
        // Actual regression: Reset must work directly below the OPEN list.
        const reset = page.getByRole('button', {name: 'Reset', exact: true});
        const resetBefore = await reset.boundingBox();
        await page.mouse.move(resetBefore.x + resetBefore.width / 2, resetBefore.y + resetBefore.height / 2);
        await page.mouse.down();
        // Holding the mouse reproduces focusout without immediately releasing:
        // the target must not move before the physical click can be delivered.
        await page.waitForTimeout(150);
        assert.deepEqual(await reset.boundingBox(), resetBefore, 'No pointerdown reflow');
        await page.mouse.up();
        await page.waitForFunction(() => document.querySelector('.easyedu-searchable-choice__summary').textContent === 'Complete',
            null, {timeout: 5000}).catch(async error => {
            console.error({errors, resetState: await page.evaluate(() => ({
                native: document.querySelector('#mode').value,
                summaries: [...document.querySelectorAll('.easyedu-searchable-choice__summary')].map(s => s.textContent),
            }))});
            throw error;
        });
        assert.deepEqual(await page.locator('#fields').evaluate(s => [...s.selectedOptions].map(o => o.value)), ['email']);
        await page.locator('#mode').evaluate(s => { s.disabled = true; });
        await page.waitForFunction(() => document.querySelector('.easyedu-searchable-choice__trigger').disabled);
        assert.equal(await hosts.nth(0).evaluate(h => !!h.closest('.easyedu-ui')), true);
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}/${motion}: open-list Reset, stable held pointer, values, search, disabled and fallback.`);
        await page.close();
       }
      }
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
