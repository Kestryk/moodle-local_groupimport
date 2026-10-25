// Native source-preserving transfer inside the one owned Foundations file.
// No browser auth export, source redraw, Moodle operation or remote navigation.
const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.argv.length, 6, 'Usage: <playwright-modules> <local-cdp> <copy|paste> <expected-page-id>');
const [modules, endpoint, command, pageId] = process.argv.slice(2);
assert.match(endpoint, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/);
assert.ok(['copy', 'paste'].includes(command));
assert.ok(['4ee6f77a-1dfb-809b-8008-c1eac9c2959e', '4ee6f77a-1dfb-809b-8008-c1eac9c6142e'].includes(pageId));
const fileId = '40e06342-8830-80d6-8008-96572effc11c';
const {chromium} = require(path.resolve(modules, 'playwright'));
(async() => {
    const browser = await chromium.connectOverCDP(endpoint, {timeout:10000});
    try {
        const pages = browser.contexts().flatMap(context=>context.pages()).filter(page=>{
            const url = new URL(page.url());
            return url.origin === 'https://design.penpot.app' && url.hash.includes(fileId) && url.hash.includes(pageId);
        });
        assert.equal(pages.length, 1, 'Exactly one owned file/page');
        await pages[0].bringToFront();
        await pages[0].keyboard.press(command === 'copy' ? 'Control+c' : 'Control+v');
        console.log(JSON.stringify({command, fileId, pageId, authExported:false, moodleWrites:0}));
    } finally { await browser.close(); }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
