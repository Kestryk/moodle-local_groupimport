// Local-supervised raster fallback when Penpot's remote export service fails.
// Captures the real editor; never hides overlays or exports authentication state.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
assert.equal(process.argv.length, 7,
    'Usage: node capture-owned-editor.cjs <playwright-modules> <local-cdp-url> <file-id> <external-run-root> <capture-name>');
const [modules, endpoint, fileId, runRoot, name] = process.argv.slice(2);
assert.match(endpoint, /^http:\/\/(?:localhost|127\.0\.0\.1):\d+\/?$/);
assert.ok(['40e06342-8830-80d6-8008-96572effc11c',
    'b564c72c-f31f-81ec-8008-ad9958b272bd'].includes(fileId), 'Exact owned design file');
const approved = path.resolve(process.env.LOCALAPPDATA, 'EasyEdu', 'artifacts', 'easystud', 'penpot');
const destination = path.resolve(runRoot);
assert.ok(destination.startsWith(approved + path.sep), 'External namespaced artifact directory');
assert.match(name, /^[a-z0-9-]+\.png$/);
const {chromium} = require(path.resolve(modules, 'playwright'));
(async() => {
    const browser = await chromium.connectOverCDP(endpoint, {timeout: 15000});
    try {
        const pages = browser.contexts().flatMap(context => context.pages()).filter(page => {
            const url = new URL(page.url());
            return url.origin === 'https://design.penpot.app' && url.hash.includes(`file-id=${fileId}`);
        });
        assert.equal(pages.length, 1, 'Exactly one owned design tab');
        const page = pages[0];
        await page.bringToFront();
        await page.evaluate(async() => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        fs.mkdirSync(destination, {recursive: true});
        const filename = path.join(destination, name);
        assert.ok(!fs.existsSync(filename), 'Do not overwrite an earlier capture');
        await page.screenshot({path: filename, timeout: 20000});
        console.log(JSON.stringify({capture: filename, fileId, editorWrites: 0, moodleWrites: 0,
            overlaysHidden: false, authExported: false, helperDisconnected: true}));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
