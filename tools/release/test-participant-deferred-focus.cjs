// Execute the actual renderer and relation markup in Chromium. This bounded
// lifecycle fixture complements, rather than replaces, authenticated Moodle QA.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/local/cm/participant_modal.js'), 'utf8');
const a = source.indexOf('    const renderParticipantDetail =');
const b = source.indexOf('    let detailRequest =', a);
assert.ok(a >= 0 && b > a);
const entity = fs.readFileSync(path.join(root, 'amd/src/local/cm/entity_dialog.js'), 'utf8');
const c = entity.indexOf('export const entityRelationSection =');
const d = entity.indexOf('\n};', c) + 3;
assert.ok(c >= 0 && d > c);
(async() => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    try {
        const page = await browser.newPage();
        await page.setContent('<div id="modal"><button id="close">Close</button><div id="body"></div></div>');
        await page.addScriptTag({content: `
            const prefix = 'local-groupimport-easystud-entity';
            const escapeHtml = value => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;');
            const exportTable = () => '';
            ${entity.slice(c, d).replace('export const ', 'const ')}
            const body = document.querySelector('#body'), modal = document.querySelector('#modal'), dialog = modal;
            const labels = {}, profileLink = null;
            const entityReadonlyField = () => '', entitySkeletonField = () => '', entityErrorNotice = () => '';
            const entityIdentity = () => '', entitySection = (label, content) => '<section>' + content + '</section>';
            const bindAnimatedDetails = () => {}, setEntityFooterBusy = () => {};
            const renderRelation = (title, values, ids, tone, count, csv) => entityRelationSection({
                title: tone, type: tone, rows: (values || []).map(name => ({name})),
                columns: csv ? [{key: 'name'}] : null, content: '<p>Known relation</p>'
            });
            ${source.slice(a, b)}
            window.render = renderParticipantDetail;
        `});
        const results = await page.evaluate(() => {
            const data = {id: 1, fullname: 'Participant', roles: ['Teacher'], groups: ['Group'], groupings: ['Grouping']};
            const sections = () => [...document.querySelectorAll('[data-easystud-settings-list-section]')];
            window.render(data, 'loading');
            const summary = sections()[0].querySelector('summary');
            sections()[0].open = false;
            summary.focus();
            window.render(data);
            const summaryRetained = document.activeElement === sections()[0].querySelector('summary');
            const stateRetained = !sections()[0].open;
            sections()[1].querySelector('button').focus();
            window.render(data);
            const csvRetained = document.activeElement === sections()[1].querySelector('button');
            document.querySelector('#close').focus();
            window.render({...data, id: 2});
            return {summaryRetained, stateRetained, csvRetained,
                newParticipantReset: sections().every(section => section.open),
                headerUntouched: document.activeElement.id === 'close', oldSummaryDetached: !summary.isConnected};
        });
        for (const [name, passed] of Object.entries(results)) assert.equal(passed, true, name);
        console.log(JSON.stringify(results));
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
