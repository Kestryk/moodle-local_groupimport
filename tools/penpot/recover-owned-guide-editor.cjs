// Explicit G10-E recovery only, after owned unsaved edits have been recorded.
// No profile teardown, other tab navigation or authentication export.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length,4,'Usage: node recover-owned-guide-editor.cjs <playwright-modules> <local-cdp>');
assert.match(process.argv[3],/^http:\/\/(?:localhost|127\.0\.0\.1):\d+\/?$/);
const record = require('../../docs/testing/guide-g10-e-product-links-2026-10-08.json');
assert.equal(record.editorAutosaveErrorObserved,true);
assert.ok(record.autosaveDiagnostic && record.components.length===1);
const {chromium} = require(path.resolve(process.argv[2],'playwright'));
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[3]);
    try {
        const pages = browser.contexts().flatMap(c=>c.pages()).filter(p=>{
            const url = new URL(p.url());
            return url.origin==='https://design.penpot.app' && url.hash.includes('file-id='+record.fileId);
        });
        assert.equal(pages.length,1,'Exactly one owned Guide tab');
        assert.equal(await pages[0].getByText(/Autosave is not working due to an error/).count(),1,
            'Do not reload a healthy editor');
        await pages[0].reload({waitUntil:'domcontentloaded',timeout:45000});
        console.log(JSON.stringify({onlyOwnedGuideReloaded:true,otherTabsUntouched:true,
            reconstructionRecord:'guide-g10-e-product-links-2026-10-08.json',authExported:false}));
    } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
