// Preserve the integrator's exact editor diagnostic; never reload or close it.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
assert.equal(process.argv.length,5,'Usage: node capture-autosave-report.cjs <playwright-modules> <local-cdp> <external-run-root>');
assert.match(process.argv[3],/^http:\/\/(?:localhost|127\.0\.0\.1):\d+\/?$/);
const folder = path.resolve(process.argv[4]);
const boundary = path.resolve(process.env.LOCALAPPDATA,'EasyEdu','artifacts','easystud','penpot');
assert.ok(folder.startsWith(boundary+path.sep));
const {chromium} = require(path.resolve(process.argv[2],'playwright'));
(async() => {
    const browser = await chromium.connectOverCDP(process.argv[3]);
    try {
        const pages = browser.contexts().flatMap(c=>c.pages()).filter(p=>p.url().includes('file-id=b564c72c-f31f-81ec-8008-ad9958b272bd'));
        assert.equal(pages.length,1);
        const link = pages[0].getByText(/(?:Download|Télécharger) report\.txt/);
        assert.equal(await link.count(),1,'Exact visible autosave report action');
        const destination = path.join(folder,'penpot-autosave-report.txt');
        assert.ok(!fs.existsSync(destination),'Never overwrite previous diagnostic');
        fs.mkdirSync(folder,{recursive:true});
        const download = pages[0].waitForEvent('download',{timeout:15000});
        await link.click();
        await (await download).saveAs(destination);
        console.log(JSON.stringify({diagnosticSaved:true,destination,editorReloaded:false,authExported:false}));
    } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
