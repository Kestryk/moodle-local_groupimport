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
        for (const width of [1600, 1280, 768, 390]) {
            const page = await browser.newPage({viewport: {width, height: 900}});
            await page.setContent(`<main id="page-admin-setting-local_groupimport">
              <form id="adminsettings"><div class="settingsform">
                <h2 class="local-groupimport-import__title local-groupimport-admin-settings__page-title">Administration</h2>
                <p class="local-groupimport-import__intro local-groupimport-admin-settings__page-description">Configure EasyStud</p>
                <section class="local-groupimport-admin-section"><h3 class="main"><button class="local-groupimport-admin-section__toggle">Interface colours</button></h3><div class="formsettingheading">Section description</div>
                <div id="admin-themeprimarycolor"><div class="form-label"><label>Primary colour</label></div>
                  <div class="form-description">Used for primary actions.</div></div>
                  <div class="easyedu-ui"><div class="easyedu-color-picker">
                    <button class="easyedu-color-picker__trigger" type="button">Colour</button>
                    <input class="easyedu-color-picker__hex" value="#0f6cbf">
                    <button class="local-groupimport-admin-settings__restore" type="button">Restore</button>
                  </div></div></section>
                <div class="local-groupimport-admin-settings__loading-section">Skeleton section</div>
                <input type="checkbox" id="id_s_local_groupimport_enablesimplifiedview">
                <input type="checkbox" id="id_s_local_groupimport_showcompleteview">
              </div></form></main>`);
            await page.addStyleTag({content: fs.readFileSync(path.join(root, 'styles/administration.css'), 'utf8')});
            const roles = [
                ['.local-groupimport-admin-settings__page-title', 20],
                ['.local-groupimport-admin-settings__page-description', 14.4],
                ['.local-groupimport-admin-section__toggle', 20],
                ['.form-label label', 14.08],
                ['.form-description', 12.16],
            ];
            for (const [selector, expected] of roles) {
                const actual = await page.locator(selector).evaluate(n => parseFloat(getComputedStyle(n).fontSize));
                assert(Math.abs(actual - expected) < 0.02, `${width}: ${selector} ${actual} != ${expected}`);
            }
            const peers = await page.locator('.easyedu-color-picker > *').evaluateAll(ns => ns.map(n => {
                const r = n.getBoundingClientRect(); return {width: r.width, height: r.height};
            }));
            assert.equal(peers[0].width, 38, 'Colour tile is square');
            for (const p of peers) assert.equal(p.height, 38, 'Colour peers share the Regular field height');
            assert.equal(await page.locator('.local-groupimport-admin-settings__loading-section')
                .evaluate(n => getComputedStyle(n).borderRadius), '13.44px', 'Skeleton and settled frames share radius');
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
