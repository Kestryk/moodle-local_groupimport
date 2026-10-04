/* eslint-env node */
// Isolated behaviour only; no Moodle, credentials, network or configuration write.
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(path.join(path.resolve(process.argv[2]), 'playwright'));
(async() => {
    const browser = await chromium.launch({headless: true});
    try {
        const page = await browser.newPage();
        const controls = ['#0F6CBF', '#1B7F5A', '#4873AD', '#29724D', '#6A7F98', '#E8F4FF', '#0B4F8A'];
        await page.setContent(`<form id="adminsettings">${controls.map((value, index) =>
            `<div data-easyedu-color-picker="1" data-easyedu-color-default="${value}">
            <input type="color" class="easyedu-color-picker__swatch" value="#111111">
            <input class="easyedu-color-picker__hex" value="bad" ${index === 6 ? 'readonly' : ''}></div>`).join('')}
            <button type="button" hidden data-easystud-restore-colours>Restore</button>
            <span role="status" data-easystud-restore-colours-status="Save to apply"></span></form>`);
        await page.evaluate(() => {
            window.submits = 0;
            document.querySelector('form').addEventListener('submit', event => {
                event.preventDefault(); window.submits++;
            });
        });
        const script = path.resolve(__dirname, '../../js/admin_settings_loading.js');
        await page.addScriptTag({path: script});
        await page.addScriptTag({path: script});
        await page.getByRole('button', {name: 'Restore', exact: true}).click();
        const values = await page.locator('[data-easyedu-color-picker]').evaluateAll(nodes => nodes.map(n => ({
            hex: n.querySelector('.easyedu-color-picker__hex').value,
            swatch: n.querySelector('.easyedu-color-picker__swatch').value,
            invalid: n.getAttribute('aria-invalid'),
        })));
        for (let i = 0; i < 6; i++) {
            assert.equal(values[i].hex, controls[i]);
            assert.equal(values[i].swatch, controls[i].toLowerCase());
            assert.equal(values[i].invalid, 'false');
        }
        assert.equal(values[6].hex, 'bad', 'Readonly setting untouched');
        assert.equal(await page.getByRole('status').textContent(), 'Save to apply');
        assert.equal(await page.evaluate(() => window.submits), 0, 'Never auto-save');
        console.log('PASS: PHP-provided defaults synchronized, invalid reset, readonly preserved, status and no submit.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
