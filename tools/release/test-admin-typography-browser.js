/* eslint-env node */
// Compiled consumer CSS with representative native markup, no Moodle writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(path.join(path.resolve(process.argv[2]), 'playwright'));
const root = path.resolve(__dirname, '../..');
(async() => {
    const browser = await chromium.launch({headless: true});
    try {
        for (const width of [1600, 768, 390]) {
            const page = await browser.newPage({viewport: {width, height: 900}});
            await page.setContent(`<main id="page-admin-setting-local_groupimport">
              <form id="adminsettings"><div class="settingsform">
                <h2 class="local-groupimport-import__title local-groupimport-admin-settings__page-title">Administration</h2>
                <p class="local-groupimport-import__intro local-groupimport-admin-settings__page-description">Configure EasyStud</p>
                <div class="formsettingheading"><h3>Interface colours</h3></div>
                <div id="admin-themeprimarycolor"><div class="form-label"><label>Primary colour</label></div>
                  <div class="form-description">Used for primary actions.</div></div>
                <input type="checkbox" id="id_s_local_groupimport_enablesimplifiedview">
                <input type="checkbox" id="id_s_local_groupimport_showcompleteview">
              </div></form></main>`);
            await page.addStyleTag({content: fs.readFileSync(path.join(root, 'styles.css'), 'utf8')});
            const roles = [
                ['.local-groupimport-admin-settings__page-title', 20],
                ['.local-groupimport-admin-settings__page-description', 14.4],
                ['.formsettingheading h3', 16],
                ['.form-label label', 14.08],
                ['.form-description', 12.16],
            ];
            for (const [selector, expected] of roles) {
                const actual = await page.locator(selector).evaluate(n => parseFloat(getComputedStyle(n).fontSize));
                assert(Math.abs(actual - expected) < 0.02, `${width}: ${selector} ${actual} != ${expected}`);
            }
            const focused = [];
            for (const id of ['enablesimplifiedview', 'showcompleteview']) {
                const field = page.locator('#id_s_local_groupimport_' + id);
                await field.focus();
                focused.push(await field.evaluate(n => {
                    const s = getComputedStyle(n);
                    return {border: s.borderColor, shadow: s.boxShadow};
                }));
            }
            assert.deepEqual(focused[0], focused[1], 'New view checkbox shares native focus adapter');
            await page.close();
            console.log(`PASS ${width}: compiled admin title/description/section/label/caption roles.`);
        }
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
