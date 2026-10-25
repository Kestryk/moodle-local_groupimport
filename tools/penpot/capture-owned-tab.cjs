// Capture only the owned design tab, after the agent fits the exact specimen.
// No reload, browser close, design mutation, credentials or Moodle request.
const path = require('node:path');
const fs = require('node:fs');
const {chromium} = require(process.argv[2]);
(async () => {
    const fileId = process.argv[3];
    const output = path.resolve(process.argv[4]);
    const approved = path.resolve(process.env.LOCALAPPDATA, 'EasyEdu', 'artifacts', 'penpot');
    if (!/^[0-9a-f-]{36}$/i.test(fileId) || !output.startsWith(approved + path.sep) ||
            path.extname(output) !== '.png' || fs.existsSync(output)) {
        throw new Error('Expected an exact owned file and new approved artifact path.');
    }
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', {timeout: 15000});
    const pages = browser.contexts().flatMap(context => context.pages()).filter(page =>
        page.url().startsWith('https://design.penpot.app/') && page.url().includes(fileId));
    if (pages.length !== 1) throw new Error('Expected one exact owned Penpot tab; no action taken.');
    const page = pages[0];
    await page.bringToFront();
    fs.mkdirSync(path.dirname(output), {recursive: true});
    await page.screenshot({path: output, fullPage: false});
    console.log(JSON.stringify({fileId, output, browserClosed: false, designWrite: false}));
})().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
