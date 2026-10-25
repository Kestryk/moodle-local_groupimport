'use strict';
// Exercise the production overflow builder with real browser event bubbling.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/cm/group_cards.js'), 'utf8');
const start = source.indexOf('export const ensureNestedGroupActionMenus =');
const end = source.indexOf('\nconst syncGroupMemberSearchEmptyState', start);
assert.ok(start >= 0 && end > start, 'Production overflow builder must be found');
const builder = source.slice(start, end).replace('export const ', 'window.');

(async() => {
    const browser = await chromium.launch({headless: true, ...(process.env.CHROME_PATH ? {
        executablePath: process.env.CHROME_PATH,
    } : {})});
    try {
        const page = await browser.newPage();
        await page.setContent(`<style>
            .card {width:260px}.header {display:flex;width:260px;position:relative}
            .title {flex:0 0 150px}button {flex:0 0 40px;width:40px}
            .is-easystud-card-action-overflow {display:none}
            [data-easystud-group-actions-menu] {position:absolute;top:40px}
        </style><main id="root"><section class="card" data-easystud-group-id="1">
            <div class="header local-groupimport-easystud-group__header">
                <span class="title local-groupimport-easystud-group__name">Group</span>
                <button class="local-groupimport-easystud-group__mail-button" aria-label="Mail">@</button>
                <button class="local-groupimport-easystud-group__duplicate-button" aria-label="Duplicate">+</button>
                <button class="local-groupimport-easystud-container-search__toggle"
                    data-easystud-container-search-toggle="1" aria-label="Search">Search</button>
            </div><div id="panel" hidden>Search panel</div>
        </section></main>`);
        await page.evaluate(code => {
            window.isResponsiveWorkspace = () => false;
            window.getLabels = () => ({moreactions: 'More actions'});
            window.normaliseCardMenuButton = () => undefined;
            window.Motion = {hideMenu: menu => { menu.hidden = true; }, isMenuClosing: () => false};
            // eslint-disable-next-line no-eval
            (0, eval)(code);
            const host = document.querySelector('#root');
            window.commands = 0;
            host.addEventListener('click', event => {
                if (event.target.closest('[data-easystud-container-search-toggle]')) {
                    window.commands++;
                    const panel = document.querySelector('#panel');
                    panel.hidden = !panel.hidden;
                }
            });
            window.ensureNestedGroupActionMenus(host);
            host.querySelector('[data-easystud-group-actions-menu]').hidden = false;
        }, builder);
        await page.locator('[data-easystud-group-actions-menu] [data-easystud-container-search-toggle]').click();
        const result = await page.evaluate(() => ({
            commands: window.commands,
            panelHidden: document.querySelector('#panel').hidden,
            menuHidden: document.querySelector('[data-easystud-group-actions-menu]').hidden,
        }));
        assert.deepEqual(result, {commands: 1, panelHidden: false, menuHidden: true});
        console.log('PASS: one native overflow click dispatches exactly one delegated command; panel stays open.');

        // G1 (K23-07/K23-12/K23-34): a header width change rebuilds the menu while it is open.
        // It must come back open with its trigger and card state, or close completely.
        const rebuilt = await page.evaluate(() => {
            const host = document.querySelector('#root');
            const card = host.querySelector('[data-easystud-group-id]');
            const menu = host.querySelector('[data-easystud-group-actions-menu]');
            const toggle = host.querySelector('[data-easystud-group-actions-toggle]');
            const read = () => ({menuHidden: menu.hidden, aria: toggle.getAttribute('aria-expanded'),
                raised: card.classList.contains('is-actions-menu-open'), items: menu.children.length});
            menu.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
            card.classList.add('is-actions-menu-open');
            window.ensureNestedGroupActionMenus(host);
            const stillOverflowing = read();
            // Wide enough for every action: the menu has nothing left and closes completely.
            host.querySelector('.header').style.width = '600px';
            card.style.width = '600px';
            window.ensureNestedGroupActionMenus(host);
            return {stillOverflowing, fits: read()};
        });
        assert.deepEqual(rebuilt.stillOverflowing, {menuHidden: false, aria: 'true', raised: true, items: 2});
        assert.deepEqual(rebuilt.fits, {menuHidden: true, aria: 'false', raised: false, items: 0});
        console.log('PASS: an open overflow menu survives its rebuild, or closes with its trigger and card state.');
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
