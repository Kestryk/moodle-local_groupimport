// Current producers replace the T055-predecessor's whole-file reconstruction.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = require('./lib/js-declarations.cjs')(root, 'amd/src/local/cm/group_cards.js',
    ['createMemberItem', 'createGroupElement', 'createGroupingElement']);
const staticInputs = [];
for (const file of ['templates/manage.mustache', 'templates/sm/participant_card.mustache', 'templates/sm/group_card.mustache']) {
    const tags = [...read(file).replace(/{{![\s\S]*?}}/g, '').matchAll(/<input\b[^>]*data-easystud-selector-input[^>]*>/g)];
    assert.ok(tags.length, 'Actual selection input producer: ' + file);
    for (const [tag] of tags) {
        assert.match(tag, /type="checkbox"/);
        assert.ok(!/tabindex="-1"/.test(tag), 'Native selection must remain keyboard reachable: ' + file);
        staticInputs.push(tag);
    }
}
(async () => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    try {
        const page = await browser.newPage();
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.setContent('<button id="start">Start</button><div id="fixture"></div>');
        const count = await page.evaluate(({source, staticInputs}) => {
            // Stub collaborators outside the actual three DOM producers, never the checkbox creation.
            const factory = new Function(`const normalise = value => String(value).toLowerCase();
                const getLabels = () => ({}), escapeHtml = value => String(value ?? ''), M = {cfg: {sesskey: 'fixture'}};
                const isResponsiveDragSuppressed = () => false, renameEditActions = () => "", groupSelectAllRowHtml = () => "";
                const setAdvancedAttributes = () => {}, renderGroupGroupingTags = () => {},
                    syncGroupMembersState = () => {}, ensureGroupMemberSearchControls = () => {}, updateGroupingBadge = () => {};
                ${source}
                return [createMemberItem(7, 9, 'Test member', 'Remove', 'Select'),
                    createGroupElement(document.body, {id: 7, name: 'Test group'}),
                    createGroupingElement(document.body, {id: 8, name: 'Test grouping'})];`);
            const host = document.querySelector('#fixture');
            for (const card of factory()) host.append(card);
            const inputs = [...host.querySelectorAll('[data-easystud-selector-input]')];
            if (inputs.length !== 3) throw new Error('All three dynamic producers must expose a checkbox');
            for (const card of [...host.children]) {
                const input = card.querySelector('[data-easystud-selector-input]');
                input.remove(); card.remove(); host.append(input);
            }
            for (const markup of staticInputs) host.insertAdjacentHTML('beforeend', markup);
            return host.querySelectorAll('[data-easystud-selector-input]').length;
        }, {source, staticInputs});
        assert.equal(count, staticInputs.length + 3);
        await page.locator('#start').focus();
        for (let index = 0; index < count; index++) {
            await page.keyboard.press('Tab');
            const state = await page.evaluate(() => {
                const e = document.activeElement;
                return {index: [...document.querySelectorAll('[data-easystud-selector-input]')].indexOf(e),
                    type: e.type, tabIndex: e.tabIndex, disabled: e.disabled, checked: e.checked};
            });
            assert.deepEqual(state, {index, type: 'checkbox', tabIndex: 0, disabled: false, checked: false});
            await page.keyboard.press('Space');
            assert.equal(await page.evaluate(() => document.activeElement.checked), true);
            await page.keyboard.press('Space');
            assert.equal(await page.evaluate(() => document.activeElement.checked), false);
        }
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({passed: true, staticInputs: staticInputs.length, dynamicProducers: 3,
            sequentialTabAndSpace: count, nativeMoodleVerified: false}));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });